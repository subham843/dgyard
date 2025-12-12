import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    console.log(`[Middleware] ${new Date().toISOString()} - Path: ${req.nextUrl.pathname}`);
    console.log(`[Middleware] Token exists: ${!!token}, Token ID: ${token?.id}, Token role: ${token?.role}`);
    
    // Admin routes protection
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!token || token.role !== "ADMIN") {
        // Redirect to login if no token, or home if token exists but not admin
        if (!token) {
          console.log(`[Middleware] No token for admin route, redirecting to signin`);
          return NextResponse.redirect(
            new URL(`/auth/signin?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
          );
        }
        console.log(`[Middleware] Token exists but not admin, redirecting to home`);
        return NextResponse.redirect(new URL("/?error=admin-access-denied", req.url));
      }
    }
    
    // For dashboard and other protected routes, allow through
    // The authorized callback already verified token exists
    console.log(`[Middleware] Allowing access to ${req.nextUrl.pathname}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const hasToken = !!token;
        console.log(`[Middleware Auth Check] ${new Date().toISOString()} - Path: ${req.nextUrl.pathname}, Has Token: ${hasToken}, Token ID: ${token?.id}`);
        
        // For admin routes, check if token exists
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return hasToken;
        }
        
        // For dashboard and other protected routes, check if token exists
        // If token exists, allow access
        // If no token, withAuth will redirect to signIn page
        if (!hasToken) {
          console.log(`[Middleware Auth Check] No token found, will redirect to signin`);
        }
        return hasToken;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/orders/:path*", "/bookings/:path*", "/cart", "/checkout"],
};




















