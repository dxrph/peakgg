'use server';

import {redirect} from 'next/navigation';
import {createClient} from '../supabase/server';
import {supabaseConfigured} from '../supabase/config';
import {safeInternalPath} from './redirects.mjs';
import {getSiteUrl} from './site-url';

function requireConfiguration(destination: string) {
  if (!supabaseConfigured) redirect(`${destination}?error=Account%20services%20are%20temporarily%20unavailable.`);
}

function validatePassword(password: string, confirmation: string, destination: string) {
  if (password.length < 8) redirect(`${destination}?error=Use%20at%20least%208%20characters.`);
  if (password !== confirmation) redirect(`${destination}?error=Passwords%20do%20not%20match.`);
}

export async function signIn(form: FormData) {
  requireConfiguration('/login');
  const next = safeInternalPath(form.get('next'));
  const supabase = await createClient();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function register(form: FormData) {
  requireConfiguration('/register');
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  validatePassword(password, String(form.get('confirmation') || ''), '/register');
  const supabase = await createClient();
  const {data, error} = await supabase.auth.signUp({
    email,
    password,
    options: {emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/onboarding`},
  });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  // Projects requiring email verification do not return a session yet.
  if (!data.session) redirect('/register?sent=1');
  redirect('/onboarding');
}

export async function requestPasswordReset(form: FormData) {
  requireConfiguration('/forgot-password');
  const supabase = await createClient();
  const email = String(form.get('email') || '').trim();
  const callback = new URL('/auth/callback', getSiteUrl());
  callback.searchParams.set('next', '/forgot-password?reset=1');
  const {error} = await supabase.auth.resetPasswordForEmail(email, {redirectTo: callback.toString()});
  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  redirect('/forgot-password?sent=1');
}

export async function updatePassword(form: FormData) {
  requireConfiguration('/forgot-password');
  const password = String(form.get('password') || '');
  const confirmation = String(form.get('confirmation') || '');
  if (password.length < 8 || password !== confirmation) {
    redirect('/forgot-password?reset=1&error=Enter%20matching%20passwords%20of%20at%20least%208%20characters.');
  }
  const supabase = await createClient();
  const {data: {user}, error: sessionError} = await supabase.auth.getUser();
  if (sessionError || !user) redirect('/forgot-password?error=Please%20request%20a%20new%20password%20reset%20link.');
  const {error} = await supabase.auth.updateUser({password});
  if (error) redirect(`/forgot-password?reset=1&error=${encodeURIComponent(error.message)}`);
  redirect('/dashboard');
}

export async function signOut() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/');
}
