import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/setup'];
const authPaths = ['/login', '/setup'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (set on frontend domain by AuthContext)
  // Note: httpOnly auth cookies are on the API domain and not visible here
  const session = request.cookies.get('session')?.value;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // If logged in, redirect away from login/setup to dashboard
    if (session && authPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!session) {
    // Redirect to login if no session
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
