import {redirect} from 'next/navigation';
import {createClient} from '../supabase/server';
import {supabaseConfigured} from '../supabase/config';

export async function getSessionUser(){if(!supabaseConfigured)return null;const supabase=await createClient();const {data}=await supabase.auth.getUser();return data.user}
export async function requireUser(next='/dashboard'){const user=await getSessionUser();if(!user)redirect(`/login?next=${encodeURIComponent(next)}`);return user}
export async function requireStaff(){const user=await requireUser('/admin');const supabase=await createClient();const {data}=await supabase.from('user_roles').select('role').eq('user_id',user.id).maybeSingle();const role=(data as {role?:string}|null)?.role;if(!role||!['MODERATOR','ADMIN','SUPER_ADMIN'].includes(role))redirect('/access-denied');return{user,role}}
