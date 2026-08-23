import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import type {Database} from './database.types';
import {getSupabaseConfig} from './config';

export async function createClient() {
  const cookieStore = await cookies();
  const {url, anonKey} = getSupabaseConfig();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: values => {
        try { values.forEach(({name, value, options}) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot write cookies. */ }
      },
    },
  });
}
