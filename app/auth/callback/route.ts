import {NextResponse, type NextRequest} from 'next/server';
import {createClient} from '../../../lib/supabase/server';
import {supabaseConfigured} from '../../../lib/supabase/config';
import {safeInternalPath} from '../../../lib/auth/redirects.mjs';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = safeInternalPath(request.nextUrl.searchParams.get('next'));
  if (code && supabaseConfigured) {
    const supabase = await createClient();
    const {error} = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL('/login?error=This%20email%20link%20is%20invalid%20or%20expired.%20Please%20request%20a%20new%20one.', request.url));
}
