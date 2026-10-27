'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createReviewTransaction } = require('../scripts/app-store-review.cjs');
const target = { appId: '6761699137', versionId: '7e4597be-03f3-4ae4-893a-bce701382150', versionString: '1.13', buildId: 'uploaded-build', platform: 'IOS' };
const copy = (value) => JSON.parse(JSON.stringify(value));
const item = (id, versionId = target.versionId, extra = {}) => ({ type: 'reviewSubmissionItems', id, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } }, ...extra } });

function fixture(initial = []) {
  const state = {
    reviews: initial.map((review) => ({ platform: 'IOS', state: 'READY_FOR_REVIEW', items: [], ...review })),
    versionState: 'PREPARE_FOR_SUBMISSION', attachedBuild: target.buildId, version: target.versionString,
    buildVersion: target.versionString, buildPlatform: 'IOS', processing: 'VALID',
    calls: [], durable: null, journalWrites: 0, failJournalAt: null, lose: null, noEffect: null,
  };
  function reviewResource(review) { return { type: 'reviewSubmissions', id: review.id, attributes: { state: review.state, platform: review.platform } }; }
  async function api(method, path, body) {
    state.calls.push({ method, path, body: copy(body ?? null) });
    if (method !== 'GET') {
      assert.ok(state.durable?.pending, 'a durable mutation intent must precede every write');
      assert.equal(state.durable.pending.kind, method === 'PATCH' ? 'submit' : path === '/v1/reviewSubmissions' ? 'create' : 'add');
    }
    if (method === 'GET' && path.startsWith(`/v1/apps/${target.appId}/appStoreVersions?`)) {
      return { data: [{ type: 'appStoreVersions', id: target.versionId, attributes: { versionString: state.version, platform: 'IOS', appVersionState: state.versionState } }] };
    }
    if (method === 'GET' && path === `/v1/appStoreVersions/${target.versionId}/relationships/build`) return { data: { type: 'builds', id: state.attachedBuild } };
    if (method === 'GET' && path.startsWith('/v1/builds?')) {
      const query = new URL(path, 'https://api.appstoreconnect.apple.com').searchParams;
      assert.equal(query.get('filter[app]'), target.appId, 'the build collection must be filtered to the exact app');
      assert.equal(query.get('include'), 'preReleaseVersion');
      return {
      data: [{ type: 'builds', id: target.buildId, attributes: { processingState: state.processing }, relationships: { preReleaseVersion: { data: { type: 'preReleaseVersions', id: 'pre-release' } } } }],
      included: [{ type: 'preReleaseVersions', id: 'pre-release', attributes: { version: state.buildVersion, platform: state.buildPlatform } }],
      };
    }
    if (method === 'GET' && path.startsWith(`/v1/apps/${target.appId}/reviewSubmissions?`)) return { data: state.reviews.map(reviewResource) };
    const match = path.match(/^\/v1\/reviewSubmissions\/([^/]+)\/items\?/);
    if (method === 'GET' && match) return { data: copy(state.reviews.find((review) => review.id === match[1]).items) };
    if (method === 'POST' && path === '/v1/reviewSubmissions') {
      assert.deepEqual(body.data.relationships.app.data, { type: 'apps', id: target.appId });
      if (state.noEffect !== 'create') state.reviews.push({ id: `draft-${state.reviews.length + 1}`, platform: 'IOS', state: 'READY_FOR_REVIEW', items: [] });
      if (state.lose === 'create' || state.noEffect === 'create') throw new Error('Connection lost after create');
      return { data: reviewResource(state.reviews.at(-1)) };
    }
    if (method === 'POST' && path === '/v1/reviewSubmissionItems') {
      const id = body.data.relationships.reviewSubmission.data.id;
      assert.equal(body.data.relationships.appStoreVersion.data.id, target.versionId);
      const added = item(`item-${id}`);
      if (state.noEffect !== 'add') { state.reviews.find((review) => review.id === id).items.push(added); if (!state.deferReady) state.versionState = 'READY_FOR_REVIEW'; }
      if (state.lose === 'add' || state.noEffect === 'add') throw new Error('Connection lost after add');
      return { data: added };
    }
    if (method === 'PATCH' && path.startsWith('/v1/reviewSubmissions/')) {
      assert.deepEqual(body.data.attributes, { submitted: true });
      const review = state.reviews.find((entry) => entry.id === body.data.id);
      if (state.noEffect !== 'submit') { review.state = 'WAITING_FOR_REVIEW'; state.versionState = 'WAITING_FOR_REVIEW'; }
      if (state.lose === 'submit' || state.noEffect === 'submit') throw new Error('Connection lost after submit');
      return { data: reviewResource(review) };
    }
    throw new Error(`Unexpected mock request ${method} ${path}`);
  }
  const saveJournal = async (value) => {
    state.journalWrites += 1;
    if (state.failJournalAt === state.journalWrites) throw new Error('Journal disk write failed');
    state.durable = copy(value);
  };
  const start = (journal = state.durable ?? {}) => createReviewTransaction({ api, target, journal: copy(journal), saveJournal });
  const writes = () => state.calls.filter((call) => call.method !== 'GET');
  return { state, api, start, writes, saveJournal };
}

test('fresh release prepares exactly one item, and only explicit submit sends submitted=true', async () => {
  const f = fixture([{ id: 'old-review', state: 'COMPLETE', items: [item('old-item', 'old-version')] }]);
  const tx = f.start();
  const prepared = await tx.prepareDraft();
  assert.equal(prepared.status, 'preparedDraft');
  assert.equal(prepared.readyToSubmit, true);
  assert.deepEqual(f.writes().map((call) => call.method), ['POST', 'POST']);
  assert.equal(f.state.reviews[0].state, 'COMPLETE');
  const submitted = await tx.submitPreparedDraft(prepared);
  assert.equal(submitted.status, 'alreadySubmitted');
  assert.equal(submitted.submissionState, 'WAITING_FOR_REVIEW');
  assert.equal(f.writes().filter((call) => call.method === 'PATCH').length, 1);
});

test('reruns reuse the exact draft and already-waiting/in-review submissions without duplicate writes', async () => {
  const f = fixture();
  const draft = await f.start().prepareDraft();
  assert.equal((await f.start().prepareDraft()).submissionId, draft.submissionId);
  assert.equal(f.writes().length, 2);
  await f.start().submitPreparedDraft(draft);
  f.state.reviews[0].state = 'IN_REVIEW';
  const tx = f.start();
  const existing = await tx.prepareDraft();
  assert.equal(existing.status, 'alreadySubmitted');
  await tx.submitPreparedDraft(existing);
  assert.equal(f.writes().length, 3);
});

test('an exact live review is idempotent while unrelated drafts and old reviews remain untouched', async () => {
  const f = fixture([
    { id: 'unrelated-draft', items: [item('foreign', 'older-version')] },
    { id: 'live', state: 'IN_REVIEW', items: [item('our-item')] },
    { id: 'completed', state: 'COMPLETE', items: [item('old-item', 'old-version')] },
  ]);
  f.state.versionState = 'IN_REVIEW';
  const tx = f.start(); const existing = await tx.prepareDraft();
  assert.equal(existing.status, 'alreadySubmitted');
  assert.equal(existing.submissionId, 'live');
  await tx.submitPreparedDraft(existing);
  assert.equal(f.writes().length, 0);
  assert.equal(f.state.reviews[0].items[0].id, 'foreign');
});

test('a pending submit recovered after Apple finishes review is acknowledged without another PATCH', async () => {
  for (const remoteState of ['COMPLETING', 'COMPLETE']) {
    const f = fixture(); const tx = f.start(); const prepared = await tx.prepareDraft();
    // Model a process dying after the submit write, before it records the readback.
    const interrupted = { ...tx.snapshotJournal(), pending: { kind: 'submit', submissionId: prepared.submissionId } };
    f.state.reviews[0].state = remoteState;
    f.state.versionState = 'READY_FOR_DISTRIBUTION';
    const resumed = f.start(interrupted);
    const observed = await resumed.prepareDraft();
    assert.equal(observed.status, 'alreadySubmitted');
    assert.equal(observed.submissionState, remoteState);
    assert.equal(f.state.durable.pending, null);
    await resumed.submitPreparedDraft(observed);
    assert.equal(f.writes().length, 2);
  }
});

for (const operation of ['create', 'add', 'submit']) {
  test(`lost ${operation} response is reconciled without repeating the mutation`, async () => {
    const f = fixture(); f.state.lose = operation;
    const tx = f.start();
    const draft = await tx.prepareDraft();
    const result = operation === 'submit' ? await tx.submitPreparedDraft(draft) : draft;
    assert.equal(result.status, operation === 'submit' ? 'alreadySubmitted' : 'preparedDraft');
    await f.start().prepareDraft();
    const path = operation === 'add' ? '/v1/reviewSubmissionItems' : operation === 'create' ? '/v1/reviewSubmissions' : `/v1/reviewSubmissions/${draft.submissionId}`;
    assert.equal(f.writes().filter((call) => call.path === path).length, 1);
    assert.equal(f.state.durable.pending, null);
  });
}

test('Apple HTTP 400 item detail survives failed reconciliation while pending add still blocks replay', async () => {
  const f = fixture(); f.state.noEffect = 'add';
  const original = Object.assign(new Error('HTTP 400: The app version cannot be added for review'), {
    status: 400, body: { errors: [{ status: '400', code: 'ENTITY_ERROR', detail: 'App version review metadata is incomplete.' }] },
  });
  const api = async (method, path, body) => {
    try { return await f.api(method, path, body); }
    catch (error) {
      if (method === 'POST' && path === '/v1/reviewSubmissionItems') throw original;
      throw error;
    }
  };
  const start = () => createReviewTransaction({ api, target, journal: copy(f.state.durable ?? {}), saveJournal: f.saveJournal });
  await assert.rejects(start().prepareDraft(), (error) => {
    assert.equal(error.code, 'OUTCOME_UNKNOWN');
    assert.equal(error.cause, original);
    assert.equal(error.cause.status, 400);
    assert.equal(error.cause.body.errors[0].detail, 'App version review metadata is incomplete.');
    assert.equal(error.readbackError.code, 'OUTCOME_UNKNOWN');
    return true;
  });
  assert.equal(f.state.durable.pending.kind, 'add');
  assert.equal(f.state.reviews[0].items.length, 0);
  const count = f.writes().length;
  await assert.rejects(start().prepareDraft(), { code: 'OUTCOME_UNKNOWN' });
  assert.equal(f.writes().length, count, 'diagnostic preservation must not retry the rejected item write');
  assert.equal(f.state.durable.pending.kind, 'add');
});

for (const operation of ['create', 'add', 'submit']) {
  test(`unresolved ${operation} outcome leaves durable intent and refuses a blind replay`, async () => {
    const f = fixture();
    if (operation !== 'create') f.state.reviews.push({ id: 'existing', platform: 'IOS', state: 'READY_FOR_REVIEW', items: operation === 'submit' ? [item('existing-item')] : [] });
    if (operation === 'submit') f.state.versionState = 'READY_FOR_REVIEW';
    f.state.noEffect = operation;
    const tx = f.start();
    const draft = operation === 'submit' ? await tx.prepareDraft() : null;
    await assert.rejects(operation === 'submit' ? tx.submitPreparedDraft(draft) : tx.prepareDraft(), { code: 'OUTCOME_UNKNOWN' });
    const count = f.writes().length;
    await assert.rejects(f.start().prepareDraft(), { code: 'OUTCOME_UNKNOWN' });
    assert.equal(f.writes().length, count);
    assert.equal(f.state.durable.pending.kind, operation);
  });
}

test('ambiguous empty drafts, foreign items and mixed review items are never changed', async () => {
  for (const initial of [
    [{ id: 'one' }, { id: 'two' }],
    [{ id: 'foreign', items: [item('other', 'other-version')] }],
    [{ id: 'mixed', items: [item('ours'), item('theirs', 'other-version')] }],
    [{ id: 'extra-kind', items: [item('ours', target.versionId, { appEvent: { data: { type: 'appEvents', id: 'event' } } })] }],
  ]) {
    const f = fixture(initial);
    await assert.rejects(f.start().prepareDraft(), (error) => ['AMBIGUOUS_DRAFTS', 'FOREIGN_ITEMS'].includes(error.code));
    assert.equal(f.writes().length, 0);
  }
});

test('wrong attached build, version ownership, pre-release platform/version or processing state stops all mutations', async () => {
  for (const invalid of [{ attachedBuild: 'previous-build' }, { version: '1.12' }, { buildVersion: '1.12' }, { buildPlatform: 'MAC_OS' }, { processing: 'PROCESSING' }]) {
    const f = fixture(); Object.assign(f.state, invalid);
    await assert.rejects(f.start().prepareDraft(), (error) => ['WRONG_BUILD', 'WRONG_VERSION'].includes(error.code));
    assert.equal(f.writes().length, 0);
  }
});

test('live build-query contract uses the app-filtered collection because scoped builds rejects include', async () => {
  const f = fixture();
  const api = async (method, path, body) => {
    if (path.startsWith(`/v1/apps/${target.appId}/builds?`) && new URL(path, 'https://api.appstoreconnect.apple.com').searchParams.has('include')) {
      throw new Error('Apple HTTP 400: include is illegal on the app builds relationship');
    }
    return f.api(method, path, body);
  };
  const tx = createReviewTransaction({ api, target, journal: {}, saveJournal: f.saveJournal });
  assert.equal((await tx.prepareDraft()).status, 'preparedDraft');
  const queries = f.state.calls.filter((call) => call.method === 'GET' && call.path.startsWith('/v1/builds?'));
  assert.ok(queries.length > 0);
  for (const call of queries) {
    const query = new URL(call.path, 'https://api.appstoreconnect.apple.com').searchParams;
    assert.equal(query.get('filter[app]'), target.appId);
    assert.equal(query.get('include'), 'preReleaseVersion');
  }
  assert.equal(f.state.calls.some((call) => call.path.startsWith(`/v1/apps/${target.appId}/builds?`)), false);
});

test('an already distributed version without a matching active journal cannot create a replacement review', async () => {
  const f = fixture([{ id: 'old', state: 'COMPLETE', items: [item('old-item', 'older-version')] }]);
  f.state.versionState = 'READY_FOR_DISTRIBUTION';
  await assert.rejects(f.start().prepareDraft(), { code: 'VERSION_NOT_PREPARABLE' });
  assert.equal(f.writes().length, 0);
});

test('journal persistence failures stop the corresponding write and recover acknowledged earlier writes', async () => {
  for (const failure of [1, 2, 4]) {
    const f = fixture(); f.state.failJournalAt = failure;
    await assert.rejects(f.start().prepareDraft(), /Journal disk write failed/);
    assert.equal(f.writes().length, failure === 1 ? 0 : 1);
    f.state.failJournalAt = null;
    const draft = await f.start().prepareDraft();
    assert.equal(draft.status, 'preparedDraft');
    assert.equal(f.writes().length, 2, 'recovery must reuse the earlier created draft');
  }
  const f = fixture(); const tx = f.start(); const draft = await tx.prepareDraft();
  f.state.failJournalAt = f.state.journalWrites + 1;
  await assert.rejects(tx.submitPreparedDraft(draft), /Journal disk write failed/);
  assert.equal(f.writes().length, 2);
});

test('submission rechecks build attachment and exact items after preparation', async () => {
  for (const change of ['build', 'items']) {
    const f = fixture(); const tx = f.start(); const draft = await tx.prepareDraft();
    if (change === 'build') f.state.attachedBuild = 'changed-build';
    else f.state.reviews[0].items.push(item('unexpected', 'foreign-version'));
    await assert.rejects(tx.submitPreparedDraft(draft), { code: change === 'build' ? 'WRONG_BUILD' : 'FOREIGN_ITEMS' });
    assert.equal(f.writes().length, 2);
  }
});

test('a journal for a different release and fabricated prepared draft are refused', async () => {
  const f = fixture();
  assert.throws(() => f.start({ schema: 1, target: { ...target, buildId: 'wrong' } }), { code: 'JOURNAL_TARGET_MISMATCH' });
  await assert.rejects(f.start().submitPreparedDraft({ target, status: 'preparedDraft', submissionId: 'invented' }), { code: 'INVALID_PREPARED_DRAFT' });
  assert.equal(f.writes().length, 0);
});

test('asynchronous version readiness returns a prepared draft and blocks premature submission', async () => {
  const f = fixture(); f.state.deferReady = true;
  const tx = f.start(); const prepared = await tx.prepareDraft();
  assert.equal(prepared.status, 'preparedDraft');
  assert.equal(prepared.readyToSubmit, false);
  await assert.rejects(tx.submitPreparedDraft(prepared), { code: 'VERSION_NOT_READY' });
  assert.equal(f.writes().length, 2);
  f.state.versionState = 'READY_FOR_REVIEW';
  assert.equal((await tx.submitPreparedDraft(prepared)).status, 'alreadySubmitted');
});

test('pagination is followed before choosing a draft, including a conflicting later-page item', async () => {
  const f = fixture([{ id: 'empty' }, { id: 'later-foreign', items: [item('foreign', 'other-version')] }]);
  const api = async (method, path, body) => {
    const response = await f.api(method, path, body);
    if (method === 'GET' && path.startsWith(`/v1/apps/${target.appId}/reviewSubmissions?`)) {
      if (!path.includes('cursor=')) return { data: response.data.slice(0, 1), links: { next: `https://api.appstoreconnect.apple.com/v1/apps/${target.appId}/reviewSubmissions?cursor=next` } };
      return { data: response.data.slice(1) };
    }
    return response;
  };
  const tx = createReviewTransaction({ api, target, journal: {}, saveJournal: f.saveJournal });
  await assert.rejects(tx.prepareDraft(), { code: 'FOREIGN_ITEMS' });
  assert.equal(f.writes().length, 0);
  assert.ok(f.state.calls.some((call) => call.path.includes('cursor=next')));
});
