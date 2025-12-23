import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    
    // Remove console.logs in production for performance
    if (process.env.NODE_ENV === "development") {
      console.log(`[Proxy] Path: ${req.nextUrl.pathname}, Token: ${!!token}, Role: ${token?.role}`);
    }
    
    // Redirect logged-in users away from registration pages
    if (token && (req.nextUrl.pathname === "/auth/signup" || req.nextUrl.pathname === "/technician/register")) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Proxy] Logged-in user trying to access registration page, redirecting to dashboard`);
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Admin routes protection
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(
          new URL(`/auth/signin?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
        );
      }

      // Check token role (will be refreshed by JWT callback if needed)
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(
          new URL("/?error=admin-access-denied&reason=role-mismatch&tokenRole=" + (token.role || "none"), req.url)
        );
      }
    }
    
    // For dashboard and other protected routes, allow through
    // The authorized callback already verified token exists
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const hasToken = !!token;
        
        // Remove console.logs in production for performance
        if (process.env.NODE_ENV === "development") {
          console.log(`[Proxy Auth] Path: ${req.nextUrl.pathname}, Has Token: ${hasToken}`);
        }
        
        // Allow registration pages to be accessed (we'll handle redirect in proxy function)
        if (req.nextUrl.pathname === "/auth/signup" || req.nextUrl.pathname === "/technician/register") {
          return true; // Always allow, proxy will redirect logged-in users
        }
        
        // For admin routes, check if token exists
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return hasToken;
        }
        
        // For dashboard and other protected routes, check if token exists
        // If token exists, allow access
        // If no token, withAuth will redirect to signIn page
        if (!hasToken) {
          console.log(`[Proxy Auth Check] No token found, will redirect to signin`);
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
  matcher: ["/admin/:path*", "/dashboard/:path*", "/technician/:path*", "/orders/:path*", "/bookings/:path*", "/cart", "/checkout", "/auth/signup"],
};


