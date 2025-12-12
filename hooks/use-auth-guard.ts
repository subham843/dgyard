"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface AuthCheckState {
  checking: boolean;
  authenticated: boolean;
  profileComplete: boolean;
  phoneVerified: boolean;
  userProfile: any;
}

/**
 * Hook to check authentication and profile completion on client side
 */
export function useAuthGuard(required: boolean = true) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthCheckState>({
    checking: true,
    authenticated: false,
    profileComplete: false,
    phoneVerified: false,
    userProfile: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (status === "loading") {
        return;
      }

      if (status === "unauthenticated") {
        if (required) {
          // Redirect to login with callback
          router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
        }
        setState({
          checking: false,
          authenticated: false,
          profileComplete: false,
          phoneVerified: false,
          userProfile: null,
        });
        return;
      }

      if (session?.user?.id) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            const user = data.user;

            const profileComplete = !!(user?.name && user?.email && user?.phone);
            const phoneVerified = user?.phoneVerified === true;

            setState({
              checking: false,
              authenticated: true,
              profileComplete,
              phoneVerified,
              userProfile: user,
            });

            if (required) {
              // Redirect if profile incomplete
              if (!profileComplete) {
                router.push(
                  `/dashboard/profile?callbackUrl=${encodeURIComponent(pathname)}&action=complete`
                );
                return;
              }

              // Redirect if phone not verified
              if (!phoneVerified) {
                router.push(
                  `/dashboard/profile?callbackUrl=${encodeURIComponent(pathname)}&action=verify-phone`
                );
                return;
              }
            }
          } else {
            throw new Error("Failed to fetch profile");
          }
        } catch (error) {
          console.error("Error checking auth:", error);
          if (required) {
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
          }
          setState({
            checking: false,
            authenticated: false,
            profileComplete: false,
            phoneVerified: false,
            userProfile: null,
          });
        }
      }
    };

    checkAuth();
  }, [session, status, required, router, pathname]);

  return state;
}











