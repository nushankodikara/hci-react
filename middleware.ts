import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Using jose for JWT verification edge compatibility

const COOKIE_NAME = 'session_token';
const JWT_SECRET_RAW = process.env.JWT_SECRET || 'your-very-secret-key-change-me';

// Convert the raw secret string to a Uint8Array for jose
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow requests for API routes, static files, login page, SIGNUP page, etc.
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') || 
    pathname.startsWith('/models') || // Allow access to public models
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get the token from the cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    console.log('Middleware: No token found, redirecting to login.');
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token
  try {
    // Verify the JWT using jose
    await jwtVerify(token, JWT_SECRET, {
        // Specify expected algorithms if necessary, though defaults are usually fine
        // algorithms: ['HS256'], 
    });
    
    // console.log('Middleware: Token verified successfully.');
    // Token is valid, allow the request to proceed
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware: Token verification failed:', error);
    // Token is invalid or expired, redirect to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    const response = NextResponse.redirect(loginUrl);
    // Clear the invalid cookie
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' }); 
    return response;
  }
}

// Specify the paths the middleware should run on
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - login (the login page itself)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico|login).*)', // Optional: More specific matching
//   ],
// }; 