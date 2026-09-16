import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {safeInternalPath} from '../lib/auth/redirects.mjs';

// Execute the actual server modules with isolated external services. These tests
// never create accounts or send email, and need no production credentials.
function loadModule(path, dependencies) {
  const {outputText} = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  });
  const exports = {};
  vm.runInNewContext(outputText, {exports, URL, process, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }});
  return exports;
}

function actions(auth, configured = true) {
  return loadModule('lib/auth/actions.ts', {
    'next/navigation': {redirect: location => {throw Object.assign(new Error('REDIRECT'), {location});}},
    '../supabase/server': {createClient: async () => ({auth})},
    '../supabase/config': {supabaseConfigured: configured},
    './redirects.mjs': {safeInternalPath},
    './site-url': {getSiteUrl: () => 'https://peakgg.net'},
  });
}
const form = values => {const result = new FormData(); for (const [key, value] of Object.entries(values)) result.set(key, value); return result;};
const redirectsTo = (promise, location) => assert.rejects(promise, error => error.location === location);

test('registration requiring email confirmation sends the user to an email notice', async () => {
  let request;
  const api = actions({signUp: async input => {request = input; return {data: {session: null}, error: null};}});
  await redirectsTo(api.register(form({email:'player@example.com',password:'long-password',confirmation:'long-password'})), '/register?sent=1');
  assert.equal(request.options.emailRedirectTo, 'https://peakgg.net/auth/callback?next=/onboarding');
});

test('registration with an immediate session proceeds to onboarding', async () => {
  const api = actions({signUp: async () => ({data: {session: {user: {id: 'player'}}}, error: null})});
  await redirectsTo(api.register(form({email:'player@example.com',password:'long-password',confirmation:'long-password'})), '/onboarding');
});

test('password reset sends a PKCE callback preserving the recovery destination', async () => {
  let destination;
  const api = actions({resetPasswordForEmail: async (_, options) => {destination = new URL(options.redirectTo); return {error: null};}});
  await redirectsTo(api.requestPasswordReset(form({email:'player@example.com'})), '/forgot-password?sent=1');
  assert.equal(destination.pathname, '/auth/callback');
  assert.equal(destination.searchParams.get('next'), '/forgot-password?reset=1');
});

test('password updates require a server-verified session', async () => {
  let updated = false;
  const api = actions({getUser: async () => ({data: {user: null}, error: null}), updateUser: async () => {updated = true;}});
  await redirectsTo(api.updatePassword(form({password:'long-password',confirmation:'long-password'})), '/forgot-password?error=Please%20request%20a%20new%20password%20reset%20link.');
  assert.equal(updated, false);
});

test('server rejects weak or mismatched passwords without an auth mutation', async () => {
  const api = actions({signUp: () => {throw new Error('Must not call signUp');}});
  await redirectsTo(api.register(form({password:'short',confirmation:'short'})), '/register?error=Use%20at%20least%208%20characters.');
  await redirectsTo(api.register(form({password:'long-password',confirmation:'different'})), '/register?error=Passwords%20do%20not%20match.');
});

test('sign-in rejects backslash redirect normalization', async () => {
  const api = actions({signInWithPassword: async () => ({error: null})});
  await redirectsTo(api.signIn(form({email:'player@example.com',password:'long-password',next:'/\\example.com'})), '/dashboard');
});

test('unconfigured auth presents an availability message rather than throwing', async () => {
  await redirectsTo(actions({}, false).signIn(form({})), '/login?error=Account%20services%20are%20temporarily%20unavailable.');
});

function callback(auth) {
  return loadModule('app/auth/callback/route.ts', {
    'next/server': {NextResponse: {redirect: url => ({location: url.toString()})}},
    '../../../lib/supabase/server': {createClient: async () => ({auth})},
    '../../../lib/supabase/config': {supabaseConfigured: true},
    '../../../lib/auth/redirects.mjs': {safeInternalPath},
  }).GET;
}

test('callback exchanges the code before entering the reset form', async () => {
  let exchanged;
  const GET = callback({exchangeCodeForSession: async code => {exchanged = code; return {error: null};}});
  const url = 'https://peakgg.net/auth/callback?code=test-code&next=%2Fforgot-password%3Freset%3D1';
  const response = await GET({url, nextUrl: new URL(url)});
  assert.equal(exchanged, 'test-code');
  assert.equal(response.location, 'https://peakgg.net/forgot-password?reset=1');
});

test('expired callback stays on login and does not reflect provider secrets', async () => {
  const GET = callback({exchangeCodeForSession: async () => ({error: {message: 'private-provider-detail'}})});
  const url = 'https://peakgg.net/auth/callback?code=expired&next=https://example.com';
  const response = await GET({url, nextUrl: new URL(url)});
  assert.equal(new URL(response.location).pathname, '/login');
  assert.ok(!response.location.includes('private-provider-detail'));
});
