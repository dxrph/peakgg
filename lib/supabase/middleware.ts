import {createServerClient} from '@supabase/ssr';
import {NextResponse, type NextRequest} from 'next/server';
import type {Database} from './database.types';
import {supabaseConfigured, getSupabaseConfig} from './config';

const authenticated = ['/profile','/teams/create','/dashboard','/settings','/matches'];

export async function updateSession(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next({request});
  let response = NextResponse.next({request});
  const {url, anonKey} = getSupabaseConfig();
  const supabase = createServerClient<Database>(url, anonKey, {cookies:{getAll:()=>request.cookies.getAll(),setAll:values=>{values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
  const {data:{user}} = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const needsUser = authenticated.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  if (needsUser && !user) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  if (path.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
    const {data} = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (!data || !['MODERATOR','ADMIN','SUPER_ADMIN'].includes(data.role)) return NextResponse.redirect(new URL('/access-denied', request.url));
  }
  return response;
}
