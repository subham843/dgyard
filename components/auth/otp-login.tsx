"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function OTPLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.startsWith("+91") ? phone : `+91${phone}` }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("OTP sent to your phone!");
        setSessionInfo(data.sessionInfo);
        setStep("otp");
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.startsWith("+91") ? phone : `+91${phone}`,
          code: otp,
          sessionInfo,
        }),
      });

      const data = await response.json();
      if (response.ok && data.user?.email) {
        // Sign in with NextAuth using credentials provider
        // Use the email from OTP verification to sign in
        console.log(`[OTP Login] ${new Date().toISOString()} - OTP verified, signing in with NextAuth...`);
        
        const result = await signIn("credentials", {
          email: data.user.email,
          password: "", // OTP users don't have password, but we need to handle this
          redirect: false,
        });
        
        if (result?.ok) {
          toast.success("Login successful!");
          console.log(`[OTP Login] NextAuth sign in successful, redirecting...`);
          
          // Wait a bit for session to be established, then get user role for redirect
          setTimeout(async () => {
            try {
              const response = await fetch("/api/auth/session");
              const session = await response.json();
              const userRole = session?.user?.role;
              
              // Role-based redirect
              let redirectUrl = "/dashboard";
              if (userRole === "ADMIN") {
                redirectUrl = "/admin";
              } else if (userRole === "TECHNICIAN") {
                redirectUrl = "/technician/dashboard";
              } else if (userRole === "DEALER") {
                redirectUrl = "/dealer/dashboard";
              }
              
              console.log(`[OTP Login] Redirecting to: ${redirectUrl} (Role: ${userRole})`);
              window.location.href = redirectUrl;
            } catch (error) {
              console.error("Error getting session:", error);
              window.location.href = "/dashboard";
            }
          }, 200);
        } else {
          console.log(`[OTP Login] ⚠️ NextAuth sign in failed:`, result?.error);
          toast.error("Failed to create session. Please try again.");
        }
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your phone number with country code (+91)
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            style={{ backgroundColor: '#3A59FF' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Send OTP
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
            <p className="text-xs text-gray-500 mt-1">
              OTP sent to {phone}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              className="flex-1"
            >
              Change Number
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || otp.length !== 6}
              style={{ backgroundColor: '#3A59FF' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

