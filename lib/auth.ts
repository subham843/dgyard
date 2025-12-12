import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // If password is provided, verify it
        if (credentials.password && user.password) {
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValidPassword) {
            return null;
          }
        } else if (credentials.password && !user.password) {
          // Password provided but user doesn't have one - reject
          return null;
        } else if (!credentials.password && !user.password) {
          // No password provided and user doesn't have one - allow (for OTP/OAuth users)
          console.log(`[Auth Credentials] Allowing login without password for user: ${user.email}`);
        } else if (!credentials.password && user.password) {
          // No password provided but user has one - reject
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // When user first logs in, set token properties
        console.log(`[Auth JWT] ${new Date().toISOString()} - User logging in: ID=${user.id}, Email=${user.email}, Role=${user.role}`);
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        console.log(`[Auth JWT] Token set - ID=${token.id}, Role=${token.role}, Email=${token.email}`);
      } else if (token.id) {
        console.log(`[Auth JWT] ${new Date().toISOString()} - Existing token - ID=${token.id}, Role=${token.role}`);
        // On subsequent requests, only refresh role if needed (cache for 5 minutes)
        const now = Date.now();
        const lastRefresh = (token.lastRoleRefresh as number) || 0;
        const refreshInterval = 5 * 60 * 1000; // 5 minutes
        
        if (now - lastRefresh > refreshInterval) {
          console.log(`[Auth JWT] Refreshing role from database...`);
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, email: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            if (!token.email) {
              token.email = dbUser.email;
            }
            token.lastRoleRefresh = now;
            console.log(`[Auth JWT] Role refreshed - Role=${token.role}`);
          } else {
            // User not found in database, invalidate token
            console.log(`[Auth JWT] ⚠️ User not found in database, invalidating token`);
            token.id = undefined;
            token.role = undefined;
          }
        } else {
          console.log(`[Auth JWT] Using cached role (last refresh: ${Math.round((now - lastRefresh) / 1000)}s ago)`);
        }
      } else {
        console.log(`[Auth JWT] ⚠️ No user and no token.id - returning empty token`);
      }
      // Always return token (even if empty, so middleware can handle it)
      return token;
    },
    async session({ session, token }) {
      console.log(`[Auth Session] ${new Date().toISOString()} - Creating session - Token ID: ${token?.id}, Token Role: ${token?.role}`);
      
      if (session.user && token) {
        // Always set user.id from token
        if (token.id) {
          session.user.id = token.id as string;
        }
        // Set role if available
        if (token.role) {
          session.user.role = token.role as string;
        }
        // Ensure email is set if not present
        if (!session.user.email && token.email) {
          session.user.email = token.email as string;
        }
        console.log(`[Auth Session] Session created - User ID: ${session.user.id}, Email: ${session.user.email}, Role: ${session.user.role}`);
      } else {
        console.log(`[Auth Session] ⚠️ No session.user or token - Session: ${!!session.user}, Token: ${!!token}`);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If callbackUrl is provided, use it
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If callbackUrl is an absolute URL, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default redirect to baseUrl
      return baseUrl;
    },
  },
};

