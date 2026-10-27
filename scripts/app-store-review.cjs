'use strict';

// Credentials, HTTP transport and durable/atomic journal storage belong to the caller.
// Use one release operator/journal writer. A failed mutation is never blindly replayed.
const READY = 'READY_FOR_REVIEW';
const LIVE = new Set(['WAITING_FOR_REVIEW', 'IN_REVIEW']);
const SUBMITTED = new Set([...LIVE, 'COMPLETING', 'COMPLETE']);
const clone = (value) => JSON.parse(JSON.stringify(value));
const relation = (resource, name) => resource?.relationships?.[name]?.data;
const stateOf = (resource) => resource?.attributes?.state;

class ReviewSafetyError extends Error {
  constructor(code, message) { super(message); this.name = 'ReviewSafetyError'; this.code = code; }
}
function refuse(code, message) { throw new ReviewSafetyError(code, message); }
function sameTarget(a, b) { return ['appId', 'versionId', 'versionString', 'buildId', 'platform'].every((key) => a?.[key] === b?.[key]); }

function createReviewTransaction({ api, target: input, journal = {}, saveJournal }) {
  if (typeof api !== 'function' || typeof saveJournal !== 'function') throw new TypeError('api and saveJournal callbacks are required');
  const target = { ...input, platform: input?.platform ?? 'IOS' };
  if (target.platform !== 'IOS' || ['appId', 'versionId', 'versionString', 'buildId'].some((key) => typeof target[key] !== 'string' || !/^[a-zA-Z0-9.-]+$/.test(target[key]))) {
    refuse('INVALID_TARGET', 'An exact iOS app, version and uploaded build are required');
  }
  if (Object.keys(journal).length && (journal.schema !== 1 || !sameTarget(journal.target, target))) refuse('JOURNAL_TARGET_MISMATCH', 'The journal belongs to another release');
  let current = Object.keys(journal).length ? clone(journal) : { schema: 1, target, submissionId: null, itemId: null, pending: null };
  let busy = false;
  async function persist(changes) {
    const next = { ...current, ...changes };
    await saveJournal(clone(next)); // Must finish durably BEFORE the corresponding mutation.
    current = next;
    Object.assign(journal, clone(next));
  }
  async function exclusive(action) {
    if (busy) refuse('CONCURRENT_OPERATION', 'A review operation is already running');
    busy = true;
    try { return await action(); } finally { busy = false; }
  }
  async function collection(initialPath) {
    const data = [], included = [], seen = new Set(), ids = new Set();
    let next = initialPath;
    while (next) {
      const url = new URL(next, 'https://api.appstoreconnect.apple.com');
      if (url.origin !== 'https://api.appstoreconnect.apple.com' || !url.pathname.startsWith('/v1/')) refuse('UNSAFE_PAGINATION', 'Unexpected API pagination destination');
      next = url.pathname + url.search;
      if (seen.has(next)) refuse('INVALID_RESPONSE', 'Repeated pagination page');
      seen.add(next);
      const response = await api('GET', next);
      if (!Array.isArray(response?.data)) refuse('INVALID_RESPONSE', 'Expected a JSON:API collection');
      for (const resource of response.data) {
        if (!resource?.id || ids.has(resource.id)) refuse('INVALID_RESPONSE', 'Missing or duplicate resource identity');
        ids.add(resource.id); data.push(resource);
      }
      included.push(...(response.included ?? []));
      next = response.links?.next || null;
    }
    return { data, included };
  }
  async function verifyTarget() {
    // Scoped collections prove ownership even when Apple's default resource omits app.data.
    const versions = await collection(`/v1/apps/${target.appId}/appStoreVersions?limit=200`);
    const version = versions.data.find((item) => item.id === target.versionId);
    if (version?.type !== 'appStoreVersions' || version.attributes?.versionString !== target.versionString || version.attributes?.platform !== target.platform) refuse('WRONG_VERSION', 'The exact iOS version does not belong to this app');
    const attached = await api('GET', `/v1/appStoreVersions/${target.versionId}/relationships/build`);
    if (attached?.data?.type !== 'builds' || attached.data.id !== target.buildId) refuse('WRONG_BUILD', 'The intended uploaded build is not attached to this version');
    const builds = await collection(`/v1/apps/${target.appId}/builds?limit=200&include=preReleaseVersion`);
    const build = builds.data.find((item) => item.id === target.buildId);
    const preRelease = builds.included.find((item) => item.type === 'preReleaseVersions' && item.id === relation(build, 'preReleaseVersion')?.id);
    if (build?.type !== 'builds' || build.attributes?.processingState !== 'VALID' || preRelease?.attributes?.version !== target.versionString || preRelease.attributes?.platform !== target.platform) refuse('WRONG_BUILD', 'The build must be processed and belong to this app, version and iOS platform');
    return version.attributes.appVersionState ?? version.attributes.appStoreState ?? null;
  }
  const reviews = () => collection(`/v1/apps/${target.appId}/reviewSubmissions?limit=200`);
  function editableVersion(versionState) {
    if (!['PREPARE_FOR_SUBMISSION', READY].includes(versionState)) refuse('VERSION_NOT_PREPARABLE', 'The app version is not in an editable review-preparation state');
  }
  async function inspect(submission) {
    if (submission?.type !== 'reviewSubmissions' || submission.attributes?.platform !== target.platform) refuse('WRONG_SUBMISSION', 'The selected submission is not for this iOS app');
    const app = relation(submission, 'app');
    if (app && app.id !== target.appId) refuse('WRONG_SUBMISSION', 'The selected submission belongs to another app');
    const { data, included } = await collection(`/v1/reviewSubmissions/${submission.id}/items?include=appStoreVersion&limit=200`);
    const exact = data.length === 1 && data[0].type === 'reviewSubmissionItems' && relation(data[0], 'appStoreVersion')?.type === 'appStoreVersions' && relation(data[0], 'appStoreVersion')?.id === target.versionId
      && Object.entries(data[0].relationships ?? {}).every(([key, value]) => key === 'appStoreVersion' || key === 'reviewSubmission' || value?.data == null)
      && (!relation(data[0], 'reviewSubmission') || relation(data[0], 'reviewSubmission').id === submission.id);
    const embedded = included.find((item) => item.type === 'appStoreVersions' && item.id === target.versionId);
    if (embedded && (embedded.attributes?.versionString !== target.versionString || embedded.attributes?.platform !== target.platform)) refuse('WRONG_VERSION', 'The review item does not describe the intended iOS version');
    return { submission, items: data, empty: data.length === 0, exact, itemId: exact ? data[0].id : null };
  }
  function result(info, versionState) {
    return { status: SUBMITTED.has(stateOf(info.submission)) ? 'alreadySubmitted' : 'preparedDraft', target: clone(target), submissionId: info.submission.id, itemId: info.itemId, submissionState: stateOf(info.submission), versionState, readyToSubmit: stateOf(info.submission) === READY && versionState === READY };
  }
  async function reconcilePending(list) {
    const pending = current.pending;
    if (!pending) return;
    if (pending.kind === 'create') {
      if (!Array.isArray(pending.beforeSubmissionIds)) refuse('INVALID_JOURNAL', 'Create intent is missing its pre-request baseline');
      const candidates = list.filter((item) => item.attributes?.platform === target.platform && !pending.beforeSubmissionIds.includes(item.id));
      if (candidates.length !== 1) refuse('OUTCOME_UNKNOWN', 'Create outcome is unresolved; do not issue another create request');
      const info = await inspect(candidates[0]);
      if (stateOf(info.submission) !== READY || (!info.empty && !info.exact)) refuse('FOREIGN_ITEMS', 'The newly observed draft cannot safely be adopted');
      await persist({ submissionId: info.submission.id, itemId: info.itemId, pending: null });
      return;
    }
    if (!['add', 'submit'].includes(pending.kind) || pending.submissionId !== current.submissionId) refuse('INVALID_JOURNAL', 'Unrecognized review mutation intent');
    const submission = list.find((item) => item.id === pending.submissionId);
    if (!submission) refuse('OUTCOME_UNKNOWN', 'The journaled submission is not visible in this app');
    const info = await inspect(submission);
    if (!info.exact) refuse(info.empty ? 'OUTCOME_UNKNOWN' : 'FOREIGN_ITEMS', 'The mutation outcome is not the exact intended review item; do not replay it');
    if (pending.kind === 'submit' && !SUBMITTED.has(stateOf(submission))) refuse('OUTCOME_UNKNOWN', 'Submission has not been confirmed; do not repeat PATCH submitted');
    await persist({ itemId: info.itemId, pending: null });
  }
  async function choose(list) {
    const candidates = [];
    let foreignDraft = false;
    for (const submission of list) {
      if (submission.attributes?.platform !== target.platform) continue;
      if (![READY, ...LIVE, 'COMPLETING', 'UNRESOLVED_ISSUES'].includes(stateOf(submission)) && !(stateOf(submission) === 'COMPLETE' && submission.id === current.submissionId)) continue;
      const info = await inspect(submission);
      if (info.exact && SUBMITTED.has(stateOf(submission))) candidates.push(info);
      else if (stateOf(submission) === READY) {
        if (!info.empty && !info.exact) foreignDraft = true;
        else candidates.push(info);
      } else if (info.exact || info.items.some((item) => relation(item, 'appStoreVersion')?.id === target.versionId)) refuse('UNRESOLVED_REVIEW', 'The intended version has an unresolved or mixed review submission');
    }
    const submitted = candidates.filter((info) => SUBMITTED.has(stateOf(info.submission)));
    if (submitted.length === 1) return submitted[0];
    if (foreignDraft) refuse('FOREIGN_ITEMS', 'An existing iOS draft contains other review items; it will not be changed');
    if (submitted.length > 1 || candidates.length > 1) refuse('AMBIGUOUS_DRAFTS', 'More than one possible review submission exists');
    if (current.submissionId && candidates[0]?.submission.id !== current.submissionId) refuse('OUTCOME_UNKNOWN', 'The journaled submission is no longer a usable draft; no replacement will be created');
    return candidates[0] ?? null;
  }
  async function prepare() {
    let versionState = await verifyTarget();
    let list = (await reviews()).data;
    await reconcilePending(list);
    let info = await choose(list);
    if (info && SUBMITTED.has(stateOf(info.submission))) {
      await persist({ submissionId: info.submission.id, itemId: info.itemId });
      return result(info, versionState);
    }
    if (!info) {
      editableVersion(versionState);
      await persist({ pending: { kind: 'create', beforeSubmissionIds: list.map((item) => item.id) } });
      try {
        await api('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: target.platform }, relationships: { app: { data: { type: 'apps', id: target.appId } } } } });
      } catch (error) {
        // A timeout may follow a successful write. Read back before deciding anything.
        list = (await reviews()).data;
        await reconcilePending(list);
        info = await choose(list);
        if (!info) throw error;
      }
      if (!info) {
        list = (await reviews()).data;
        await reconcilePending(list);
        info = await choose(list);
      }
    }
    if (!info) refuse('OUTCOME_UNKNOWN', 'The created draft is not visible yet');
    await persist({ submissionId: info.submission.id, itemId: info.itemId });
    if (info.empty) {
      versionState = await verifyTarget();
      editableVersion(versionState);
      // Refresh ownership, state and every item immediately before adding.
      const selected = (await reviews()).data.find((item) => item.id === info.submission.id);
      info = await inspect(selected);
      if (stateOf(selected) !== READY || !info.empty) refuse('DRAFT_CHANGED', 'The draft changed before adding the version');
      await persist({ pending: { kind: 'add', submissionId: selected.id } });
      try {
        await api('POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: selected.id } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: target.versionId } },
        } } });
      } catch { /* Reconcile without replaying a possibly successful POST. */ }
      list = (await reviews()).data;
      await reconcilePending(list);
      info = await inspect(list.find((item) => item.id === selected.id));
      versionState = await verifyTarget();
    }
    if (!info.exact) refuse('FOREIGN_ITEMS', 'A prepared draft must contain only the intended version');
    return result(info, versionState);
  }
  async function submit(prepared) {
    if (!sameTarget(prepared?.target, target) || prepared?.submissionId !== current.submissionId || !['preparedDraft', 'alreadySubmitted'].includes(prepared?.status)) refuse('INVALID_PREPARED_DRAFT', 'Submit requires this transaction’s prepared draft');
    const versionState = await verifyTarget();
    let list = (await reviews()).data;
    await reconcilePending(list);
    const submission = list.find((item) => item.id === prepared.submissionId);
    const info = await inspect(submission);
    if (!info.exact) refuse('FOREIGN_ITEMS', 'Refusing to submit a mixed or changed review');
    if (SUBMITTED.has(stateOf(submission))) return result(info, versionState);
    if (stateOf(submission) !== READY || versionState !== READY) refuse('VERSION_NOT_READY', 'Both the exact draft and app version must be ready for review');
    await persist({ pending: { kind: 'submit', submissionId: submission.id } });
    try {
      await api('PATCH', `/v1/reviewSubmissions/${submission.id}`, { data: { type: 'reviewSubmissions', id: submission.id, attributes: { submitted: true } } });
    } catch { /* The subsequent read is authoritative, never a second PATCH. */ }
    list = (await reviews()).data;
    await reconcilePending(list);
    const confirmed = await inspect(list.find((item) => item.id === submission.id));
    return result(confirmed, await verifyTarget());
  }
  return { prepareDraft: () => exclusive(prepare), submitPreparedDraft: (prepared) => exclusive(() => submit(prepared)), snapshotJournal: () => clone(current) };
}

module.exports = { createReviewTransaction, ReviewSafetyError };
