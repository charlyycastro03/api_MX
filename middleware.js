import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-for-jwt-signing-which-should-be-long';

export async function middleware(request) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api/');
  const isApiAuthRoute = pathname.startsWith('/api/auth');

  // Skip static files, Next.js assets, and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  let payload = null;

  if (token) {
    try {
      const verified = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET_KEY)
      );
      payload = verified.payload;
    } catch (err) {
      // Token is invalid/expired
      payload = null;
    }
  }

  if (isAuthRoute) {
    if (payload) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!payload && !isApiAuthRoute) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login.css|globals.css).*)'],
};
