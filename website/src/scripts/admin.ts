// Gruntz admin: review reported posts and comments, hide or remove them.
//
// The page itself holds no secrets and decides nothing. Sign-in is Google only, and
// every list and action below is a database function that checks, on the server, that
// the caller is a listed admin in a Google-started session. A visitor who is not gets
// "not an admin" and nothing else.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://khskhjplkresilgrozhg.supabase.co';
// The publishable key: public by design, it only identifies the project.
const SUPABASE_KEY = 'sb_publishable_oKfZD5VrKoyBbtXwa75C5w_QLbiOuSc';
const GOOGLE_CLIENT_ID = '267383737442-kkm9m239eqqtv6nvuk2t49sgss6ri6b0.apps.googleusercontent.com';
const PHOTO_BUCKET = 'feed-photos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'gruntz-admin-session' },
});

type Report = {
  report_id: string; reported_at: string; reason: string; author_id: string | null; author_name: string; snapshot: string;
  post_id: string | null; comment_id: string | null; post_exists: boolean; post_hidden: boolean; comment_exists: boolean;
  photo_path: string | null; reports_on_post: number;
};
type Post = {
  id: string; user_id: string; display_name: string; kind: string; body: string; audience: string; workout_title: string | null;
  photo_path: string | null; hidden: boolean; created_at: string; comments: number; reactions: number; reports: number;
};
type GoogleCredential = { credential?: string };
declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize(options: { client_id: string; callback: (response: GoogleCredential) => void; auto_select?: boolean }): void;
      renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
      disableAutoSelect(): void;
    } } };
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const gate = $('admin-gate');
const board = $('admin-board');
const status = $('admin-status');
const who = $('admin-who');

/** Elements are built node by node and filled with textContent: nothing from the database is ever parsed as HTML. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
function say(message: string, bad = false) {
  status.textContent = message;
  status.dataset.tone = bad ? 'bad' : 'ok';
}

function button(label: string, run: () => Promise<void>, danger = false): HTMLButtonElement {
  const node = el('button', danger ? 'admin-button admin-danger' : 'admin-button', label);
  node.type = 'button';
  node.addEventListener('click', () => {
    if (danger && !window.confirm(`${label}? This cannot be undone.`)) return;
    node.disabled = true;
    void run().catch(() => say('That did not go through. Reload and try again.', true)).finally(() => { node.disabled = false; });
  });
  return node;
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

async function photo(path: string | null): Promise<HTMLElement | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 600);
  if (!data?.signedUrl) return el('p', 'admin-meta', 'Photo could not be loaded.');
  const image = el('img', 'admin-photo');
  image.src = data.signedUrl;
  image.alt = 'Photo attached to the post';
  image.loading = 'lazy';
  return image;
}

async function removePost(postId: string) {
  const path = await rpc<string | null>('admin_delete_post', { p_post_id: postId });
  if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  say('Post removed.');
  await load();
}

async function load() {
  const [reports, posts] = await Promise.all([rpc<Report[]>('admin_feed_reports'), rpc<Post[]>('admin_recent_posts')]);

  const reportList = $('admin-reports');
  reportList.replaceChildren();
  $('admin-report-count').textContent = String(reports.length);
  if (!reports.length) reportList.append(el('p', 'admin-empty', 'No reports. Nothing is waiting for you.'));
  for (const report of reports) {
    const card = el('article', 'admin-card');
    const kind = report.comment_id ? 'Comment' : 'Post';
    card.append(el('p', 'admin-meta', `${kind} by ${report.author_name} · reported ${when(report.reported_at)}${report.reports_on_post > 1 ? ` · ${report.reports_on_post} reporters` : ''}`));
    card.append(el('p', 'admin-text', report.snapshot || '(no text)'));
    card.append(el('p', 'admin-meta', `Reason: ${report.reason}`));
    const image = await photo(report.comment_id ? null : report.photo_path);
    if (image) card.append(image);
    const state = report.comment_id
      ? (report.comment_exists ? 'Comment is still up.' : 'Comment is already gone.')
      : !report.post_exists ? 'Post is already gone.' : report.post_hidden ? 'Post is hidden.' : 'Post is visible.';
    card.append(el('p', 'admin-state', state));
    const actions = el('div', 'admin-actions');
    if (report.comment_id && report.comment_exists) {
      actions.append(button('Delete comment', async () => { await rpc('admin_delete_comment', { p_comment_id: report.comment_id }); say('Comment removed.'); await load(); }, true));
    }
    if (!report.comment_id && report.post_exists && report.post_id) {
      const postId = report.post_id;
      actions.append(button(report.post_hidden ? 'Show post again' : 'Hide post', async () => { await rpc('admin_set_post_hidden', { p_post_id: postId, p_hidden: !report.post_hidden }); say(report.post_hidden ? 'Post is visible again.' : 'Post hidden.'); await load(); }));
      actions.append(button('Delete post', () => removePost(postId), true));
    }
    actions.append(button('Dismiss report', async () => { await rpc('admin_dismiss_report', { p_report_id: report.report_id }); say('Report dismissed.'); await load(); }));
    card.append(actions);
    reportList.append(card);
  }

  const postList = $('admin-posts');
  postList.replaceChildren();
  if (!posts.length) postList.append(el('p', 'admin-empty', 'No posts yet.'));
  for (const post of posts) {
    const card = el('article', 'admin-card');
    card.append(el('p', 'admin-meta', `${post.display_name} · ${when(post.created_at)} · ${post.kind} · ${post.audience === 'followers' ? 'followers only' : 'everyone'}`));
    if (post.workout_title) card.append(el('p', 'admin-text', `Workout: ${post.workout_title}`));
    if (post.body) card.append(el('p', 'admin-text', post.body));
    const image = await photo(post.photo_path);
    if (image) card.append(image);
    card.append(el('p', 'admin-state', `${post.hidden ? 'Hidden' : 'Visible'} · ${post.reactions} reactions · ${post.comments} comments · ${post.reports} reports`));
    const actions = el('div', 'admin-actions');
    actions.append(button(post.hidden ? 'Show post again' : 'Hide post', async () => { await rpc('admin_set_post_hidden', { p_post_id: post.id, p_hidden: !post.hidden }); say(post.hidden ? 'Post is visible again.' : 'Post hidden.'); await load(); }));
    actions.append(button('Delete post', () => removePost(post.id), true));
    card.append(actions);
    postList.append(card);
  }
}

async function enter() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) { gate.hidden = false; board.hidden = true; return; }
  let admin = false;
  try { admin = (await rpc<boolean>('is_admin')) === true; } catch { admin = false; }
  if (!admin) {
    await supabase.auth.signOut();
    window.google?.accounts.id.disableAutoSelect();
    gate.hidden = false;
    board.hidden = true;
    say('That Google account is not an admin for Gruntz.', true);
    return;
  }
  who.textContent = data.session.user.email ?? '';
  gate.hidden = true;
  board.hidden = false;
  say('');
  try { await load(); } catch { say('Could not load. Check your connection and reload.', true); }
}

function startGoogle() {
  const google = window.google;
  if (!google) { say('Google sign-in did not load. Check your connection or content blocker, then reload.', true); return; }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      if (!response.credential) { say('Google did not return a sign-in. Try again.', true); return; }
      say('Signing in…');
      void supabase.auth.signInWithIdToken({ provider: 'google', token: response.credential })
        .then(({ error }) => (error ? say('Sign-in was refused. Try again.', true) : enter()));
    },
  });
  google.accounts.id.renderButton($('admin-google'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 280 });
}

$('admin-signout').addEventListener('click', () => {
  void supabase.auth.signOut().then(() => { window.google?.accounts.id.disableAutoSelect(); return enter(); });
});
$('admin-reload').addEventListener('click', () => { void load().then(() => say('Up to date.')).catch(() => say('Could not load.', true)); });

if (document.readyState === 'complete') startGoogle(); else window.addEventListener('load', startGoogle);
void enter();
