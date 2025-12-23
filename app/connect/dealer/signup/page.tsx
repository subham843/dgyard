"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Lock,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

type Step = "phone" | "email" | "details" | "complete";

export default function DealerSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  
  // Phone verification
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneIdToken, setPhoneIdToken] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  // Email verification
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailIdToken, setEmailIdToken] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    dealerType: "",
    addressLine: "",
    addressLine2: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    yearsOfExperience: "",
    servicesOffered: [] as string[],
    operatingAreas: [] as Array<{
      id: string;
      latitude: number;
      longitude: number;
      placeName: string;
      serviceRadiusKm: number;
    }>,
    hasInHouseTechnicians: false,
    monthlyOrderCapacityRange: "",
    preferredBrands: [] as string[],
    termsAccepted: false,
    privacyAccepted: false,
  });

  // Pincode lookup function
  const handlePincodeLookup = async (pincode: string) => {
    if (pincode.length !== 6) return;

    setLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setFormData((prev) => ({
          ...prev,
          city: postOffice.Name || prev.city,
          district: postOffice.District || prev.district,
          state: postOffice.State || prev.state,
          country: "India",
        }));

        toast.success("Address details filled automatically!");
      } else {
        toast.error("Pincode not found. Please enter details manually.");
      }
    } catch (error) {
      console.error("Error fetching pincode details:", error);
      toast.error("Failed to fetch pincode details. Please enter manually.");
    } finally {
      setLoading(false);
    }
  };

  // Check existing Firebase auth state and route accordingly
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Reload user to get latest verification status
          await user.reload();
          
          const phoneNumber = user.phoneNumber;
          const email = user.email;
          const emailVerified = user.emailVerified;

          // If phone is verified, set phoneVerified and get token
          if (phoneNumber) {
            try {
              const idToken = await user.getIdToken();
              setPhoneIdToken(idToken);
              setPhoneVerified(true);
              if (phoneNumber) {
                // Extract 10-digit number from +91XXXXXXXXXX
                const phoneNum = phoneNumber.replace(/\+91/, "");
                setPhone(phoneNum);
              }
              
              // If email is also verified, move to details step
              if (email && emailVerified) {
                setEmail(email);
                setEmailIdToken(idToken);
                setEmailVerified(true);
                setStep("details");
                toast.success("Mobile and email already verified! Please complete your details.");
              } else if (email) {
                // Phone verified but email not verified, move to email step
                setEmail(email);
                setStep("email");
                toast.success("Mobile already verified! Please verify your email.");
              } else {
                // Phone verified but no email, stay on email step
                setStep("email");
                toast.success("Mobile already verified! Please add your email.");
              }
            } catch (error) {
              console.error("Error getting ID token:", error);
            }
          }
        } catch (error) {
          console.error("Error checking auth state:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (typeof window !== "undefined" && auth) {
      try {
        // Clear any existing verifier
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }

        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved
          },
          "expired-callback": () => {
            toast.error("reCAPTCHA expired. Please try again.");
          },
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error("Error initializing reCAPTCHA:", error);
      }
    }
  }, []);

  // Step 1: Phone OTP Verification
  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    const phoneNumber = `+91${phone}`;
    setLoading(true);

    try {
      if (!recaptchaVerifier || !auth) {
        toast.error("reCAPTCHA not initialized. Please refresh the page.");
        return;
      }

      // Check if user is already signed in with this phone number
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.phoneNumber === phoneNumber) {
        // Phone already verified, get token and move to email step
        try {
          await currentUser.reload();
          const idToken = await currentUser.getIdToken();
          setPhoneIdToken(idToken);
          setPhoneVerified(true);
          toast.success("Phone number already verified!");
          setTimeout(() => setStep("email"), 1000);
          return;
        } catch (error) {
          console.error("Error getting ID token:", error);
        }
      }

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
      toast.success("OTP sent to your phone!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      // Check if phone number is already in use
      if (error.code === "auth/phone-number-already-exists" || error.code === "auth/account-exists-with-different-credential") {
        toast.error("This phone number is already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!confirmationResult) {
      toast.error("Please send OTP first");
      return;
    }

    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      setPhoneIdToken(idToken);
      setPhoneVerified(true);
      toast.success("Phone verified successfully!");
      
      // Move to email step
      setTimeout(() => setStep("email"), 1000);
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Email Verification
  const handleSendEmailVerification = async () => {
    if (!email || !emailPassword) {
      toast.error("Please enter email and password");
      return;
    }

    if (emailPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      if (!auth) {
        toast.error("Firebase auth not initialized");
        return;
      }

      // First, try to sign in with existing account
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, emailPassword);
        const user = userCredential.user;
        await user.reload();

        // Check if email is already verified
        if (user.emailVerified) {
          const idToken = await user.getIdToken();
          setEmailIdToken(idToken);
          setEmailVerified(true);
          toast.success("Email already verified!");
          setTimeout(() => setStep("details"), 1000);
          return;
        } else {
          // Email not verified, send verification email
          await sendEmailVerification(user);
          setEmailVerificationSent(true);
          toast.success("Verification email sent! Please check your inbox.");
        }
      } catch (signInError: any) {
        // If sign in fails, try to create new user
        if (signInError.code === "auth/user-not-found" || signInError.code === "auth/wrong-password") {
          try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, emailPassword);
            const user = userCredential.user;

            // Send email verification
            await sendEmailVerification(user);
            setEmailVerificationSent(true);
            toast.success("Verification email sent! Please check your inbox.");
          } catch (createError: any) {
            console.error("Error creating user:", createError);
            if (createError.code === "auth/email-already-in-use") {
              toast.error("Email already registered. Please use the correct password or sign in instead.");
            } else {
              toast.error(createError.message || "Failed to send verification email");
            }
          }
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to process email verification");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    if (!email || !emailPassword) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      if (!auth) {
        toast.error("Firebase auth not initialized");
        return;
      }

      // Sign in to get current user
      const userCredential = await signInWithEmailAndPassword(auth, email, emailPassword);
      const user = userCredential.user;

      // Reload user to get latest email verification status
      await user.reload();

      if (user.emailVerified) {
        const idToken = await user.getIdToken();
        setEmailIdToken(idToken);
        setEmailVerified(true);
        toast.success("Email verified successfully!");
        
        // Move to details step
        setTimeout(() => setStep("details"), 1000);
      } else {
        toast.error("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (error: any) {
      console.error("Error checking email verification:", error);
      toast.error(error.message || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneVerified || !emailVerified || !phoneIdToken || !emailIdToken) {
      toast.error("Please complete phone and email verification first");
      return;
    }

    if (!formData.termsAccepted || !formData.privacyAccepted) {
      toast.error("Please accept Terms & Conditions and Privacy Policy");
      return;
    }

    if (!formData.fullName || !formData.businessName) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.operatingAreas.length === 0) {
      toast.error("Please add at least one operating area");
      return;
    }

    setLoading(true);

    try {
      // Combine addressLine and addressLine2
      const combinedAddressLine = [
        formData.addressLine,
        formData.addressLine2
      ].filter(Boolean).join(", ");

      const response = await fetch("/api/auth/dealer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneIdToken,
          emailIdToken,
          password: emailPassword,
          fullName: formData.fullName,
          businessName: formData.businessName,
          dealerType: formData.dealerType || null,
          addressLine: combinedAddressLine || null,
          city: formData.city || null,
          district: formData.district || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          yearsOfExperience: formData.yearsOfExperience || null,
          servicesOffered: formData.servicesOffered,
          operatingAreas: formData.operatingAreas,
          hasInHouseTechnicians: formData.hasInHouseTechnicians,
          monthlyOrderCapacityRange: formData.monthlyOrderCapacityRange || null,
          preferredBrands: formData.preferredBrands,
        }),
      });

      console.log("[Frontend] Response status:", response.status);
      console.log("[Frontend] Response ok:", response.ok);
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      console.log("[Frontend] Content-Type:", contentType);
      
      let data;
      let responseText = "";
      
      try {
        // First, get the text to see what we're actually receiving
        responseText = await response.text();
        console.log("[Frontend] Response text (first 500 chars):", responseText.substring(0, 500));
        
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[Frontend] Non-JSON response received");
          console.error("[Frontend] Full response text:", responseText);
          toast.error("Server error. Please try again later.");
          return;
        }

        // Try to parse as JSON
        data = JSON.parse(responseText);
        console.log("[Frontend] Parsed JSON data:", data);
      } catch (parseError: any) {
        console.error("[Frontend] Failed to parse JSON response:", parseError);
        console.error("[Frontend] Response text was:", responseText);
        toast.error("Server error. Please check console for details.");
        return;
      }

      if (response.ok) {
        console.log("[Frontend] Registration successful!");
        toast.success("Registration successful! Your account is pending approval.");
        setStep("complete");
        
        // Auto sign in after a delay
        setTimeout(async () => {
          try {
            const signInResult = await signIn("credentials", {
              email,
              password: emailPassword,
              redirect: false,
            });

            if (signInResult?.ok) {
              router.push("/dashboard");
              router.refresh();
            } else {
              // If auto sign-in fails, still redirect to sign in page with message
              router.push("/auth/signin?message=registration-success");
            }
          } catch (signInError) {
            console.error("Auto sign-in error:", signInError);
            router.push("/auth/signin?message=registration-success");
          }
        }, 3000); // Increased delay to show success message
      } else {
        console.error("[Frontend] Registration failed with error:", data?.error);
        
        // Handle specific error cases
        if (data?.existingDealer) {
          toast.error(data?.error || "You have already registered. Please sign in.");
          setTimeout(() => {
            router.push("/auth/signin");
          }, 2000);
        } else {
          toast.error(data?.error || "Registration failed. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("[Frontend] Registration error:", error);
      console.error("[Frontend] Error stack:", error?.stack);
      toast.error(error.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Join as a Dealer
            </h1>
            <p className="text-xl text-gray-700">
              Complete registration in 3 simple steps
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4">
              {[
                { id: "phone", label: "Phone", icon: Phone },
                { id: "email", label: "Email", icon: Mail },
                { id: "details", label: "Details", icon: Briefcase },
              ].map((s, index) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isCompleted = 
                  (s.id === "phone" && phoneVerified) ||
                  (s.id === "email" && emailVerified) ||
                  (step === "complete");
                const isAccessible = 
                  s.id === "phone" ||
                  (s.id === "email" && phoneVerified) ||
                  (s.id === "details" && phoneVerified && emailVerified);

                return (
                  <div key={s.id} className="flex items-center">
                    <div
                      className={`flex flex-col items-center ${
                        isAccessible ? "cursor-pointer" : "opacity-50"
                      }`}
                      onClick={() => isAccessible && setStep(s.id as Step)}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : isActive
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <span className="text-xs mt-2 font-medium">{s.label}</span>
                    </div>
                    {index < 2 && (
                      <div
                        className={`w-12 h-0.5 mx-2 ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* reCAPTCHA container (hidden) */}
          <div id="recaptcha-container"></div>

          {/* Step 1: Phone Verification */}
          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="border-2 border-blue-200 shadow-lg">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Phone className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        Step 1: Verify Mobile Number
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone">Mobile Number (+91)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            disabled={phoneVerified}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={loading || phoneVerified || phone.length !== 10}
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                          </Button>
                        </div>
                        {phoneVerified && (
                          <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Phone verified: +91{phone}
                          </p>
                        )}
                      </div>

                      {confirmationResult && !phoneVerified && (
                        <div>
                          <Label htmlFor="otp">Enter OTP</Label>
                          <div className="flex gap-2">
                            <Input
                              id="otp"
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="6-digit OTP"
                              maxLength={6}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyOTP}
                              disabled={loading || otp.length !== 6}
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {phoneVerified && (
                        <Button
                          type="button"
                          onClick={() => setStep("email")}
                          className="w-full"
                          size="lg"
                        >
                          Continue to Email Verification
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Email Verification */}
            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="border-2 border-blue-200 shadow-lg">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Mail className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        Step 2: Verify Email Address
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@email.com"
                          disabled={emailVerified}
                        />
                      </div>

                      <div>
                        <Label htmlFor="emailPassword">Password</Label>
                        <Input
                          id="emailPassword"
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          disabled={emailVerified}
                        />
                      </div>

                      {!emailVerificationSent && !emailVerified && (
                        <Button
                          type="button"
                          onClick={handleSendEmailVerification}
                          disabled={loading || !email || !emailPassword}
                          className="w-full"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Verification Email
                            </>
                          )}
                        </Button>
                      )}

                      {emailVerificationSent && !emailVerified && (
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-900">
                              <strong>Verification email sent!</strong> Please check your inbox and click the verification link.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={handleCheckEmailVerification}
                            disabled={loading}
                            className="w-full"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                I've Verified My Email
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {emailVerified && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-900 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Email verified: {email}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep("phone")}
                          className="flex-1"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        {emailVerified && (
                          <Button
                            type="button"
                            onClick={() => setStep("details")}
                            className="flex-1"
                          >
                            Continue to Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Business Details */}
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="border-2 border-blue-200 shadow-lg">
                  <CardContent className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Info */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Basic Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Your full name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="businessName">Business Name *</Label>
                            <Input
                              id="businessName"
                              value={formData.businessName}
                              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                              placeholder="Your business/shop name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="dealerType">Dealer Type</Label>
                            <Select
                              value={formData.dealerType}
                              onValueChange={(value) => setFormData({ ...formData, dealerType: value })}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select dealer type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="Retailer">Retailer</SelectItem>
                                <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                                <SelectItem value="Service Provider">Service Provider</SelectItem>
                                <SelectItem value="Installation Partner">Installation Partner</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Business Address</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="addressLine">Address Line 1</Label>
                            <Input
                              id="addressLine"
                              value={formData.addressLine}
                              onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                              placeholder="Street address"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="addressLine2">Address Line 2</Label>
                            <Input
                              id="addressLine2"
                              value={formData.addressLine2}
                              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                              placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pincode">Pincode *</Label>
                            <Input
                              id="pincode"
                              value={formData.pincode}
                              onChange={(e) => {
                                const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setFormData({ ...formData, pincode });
                                // Auto-fill when 6 digits are entered
                                if (pincode.length === 6) {
                                  handlePincodeLookup(pincode);
                                }
                              }}
                              placeholder="6-digit pincode"
                              maxLength={6}
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">Area</Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="Area"
                            />
                          </div>
                          <div>
                            <Label htmlFor="district">District</Label>
                            <Input
                              id="district"
                              value={formData.district}
                              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                              placeholder="District"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              placeholder="State"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Operating Area Map */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">Operating Areas (Map Selection)</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newArea = {
                                id: Date.now().toString(),
                                latitude: 0,
                                longitude: 0,
                                placeName: "",
                                serviceRadiusKm: 10,
                              };
                              setFormData({
                                ...formData,
                                operatingAreas: [...formData.operatingAreas, newArea],
                              });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Area
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {formData.operatingAreas.length === 0 ? (
                            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                              <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                              <p className="text-gray-600 mb-4">No operating areas added yet</p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const newArea = {
                                    id: Date.now().toString(),
                                    latitude: 0,
                                    longitude: 0,
                                    placeName: "",
                                    serviceRadiusKm: 10,
                                  };
                                  setFormData({
                                    ...formData,
                                    operatingAreas: [...formData.operatingAreas, newArea],
                                  });
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Operating Area
                              </Button>
                            </div>
                          ) : (
                            formData.operatingAreas.map((area, index) => (
                              <div key={area.id} className="border-2 border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-900">
                                    Operating Area {index + 1}
                                    {area.placeName && ` - ${area.placeName}`}
                                  </h4>
                                  {formData.operatingAreas.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          operatingAreas: formData.operatingAreas.filter((a) => a.id !== area.id),
                                        });
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                                <LocationMapPicker
                                  onLocationSelect={(location) => {
                                    const updatedAreas = formData.operatingAreas.map((a) =>
                                      a.id === area.id
                                        ? {
                                            ...a,
                                            latitude: location.lat,
                                            longitude: location.lng,
                                            placeName: location.placeName || location.address,
                                          }
                                        : a
                                    );
                                    setFormData({ ...formData, operatingAreas: updatedAreas });
                                  }}
                                  onRadiusChange={(radius) => {
                                    const updatedAreas = formData.operatingAreas.map((a) =>
                                      a.id === area.id ? { ...a, serviceRadiusKm: radius } : a
                                    );
                                    setFormData({ ...formData, operatingAreas: updatedAreas });
                                  }}
                                  initialRadius={area.serviceRadiusKm}
                                  initialLocation={
                                    area.latitude && area.longitude
                                      ? {
                                          lat: area.latitude,
                                          lng: area.longitude,
                                          address: area.placeName || "",
                                          placeName: area.placeName,
                                        }
                                      : undefined
                                  }
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Additional Details</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                            <Input
                              id="yearsOfExperience"
                              type="number"
                              value={formData.yearsOfExperience}
                              onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                              placeholder="e.g., 5"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="monthlyOrderCapacityRange">Monthly Order Capacity</Label>
                            <Select
                              value={formData.monthlyOrderCapacityRange}
                              onValueChange={(value) => setFormData({ ...formData, monthlyOrderCapacityRange: value })}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select capacity range" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="1-10">1-10 orders</SelectItem>
                                <SelectItem value="11-50">11-50 orders</SelectItem>
                                <SelectItem value="51-100">51-100 orders</SelectItem>
                                <SelectItem value="100+">100+ orders</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="hasInHouseTechnicians"
                                checked={formData.hasInHouseTechnicians}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, hasInHouseTechnicians: checked === true })
                                }
                              />
                              <Label htmlFor="hasInHouseTechnicians" className="cursor-pointer">
                                I have in-house technicians
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="terms"
                            checked={formData.termsAccepted}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, termsAccepted: checked === true })
                            }
                            required
                          />
                          <Label htmlFor="terms" className="cursor-pointer">
                            I agree to the Terms & Conditions *
                          </Label>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="privacy"
                            checked={formData.privacyAccepted}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, privacyAccepted: checked === true })
                            }
                            required
                          />
                          <Label htmlFor="privacy" className="cursor-pointer">
                            I agree to the Privacy Policy *
                          </Label>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep("email")}
                          className="flex-1"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1"
                          size="lg"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Complete Registration
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-2 border-green-200 shadow-lg">
                  <CardContent className="p-6 md:p-8">
                    <div className="text-center mb-6">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Registration Successful!
                      </h2>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                            Account Pending Approval
                          </h3>
                          <p className="text-sm text-yellow-700 leading-relaxed">
                            Your mobile number and email have been successfully verified. Your account is currently pending admin approval. Our admin team will review your registration details and approve your account within 24 hours.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>Notifications:</strong> You will receive notifications via email and WhatsApp once your account is approved. You can also check your account status by logging into your dashboard.
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Redirecting to dashboard...
                      </p>
                      <div className="flex justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    </div>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}

