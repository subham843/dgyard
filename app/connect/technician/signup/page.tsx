"use client";

import { useState, useEffect, useRef } from "react";
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
  Loader2,
  Wrench,
  ChevronRight,
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
} from "firebase/auth";

type Step = "phone" | "email" | "details" | "complete";

interface Skill {
  id: string;
  title: string;
  shortDescription?: string;
  serviceDomain?: {
    id: string;
    title: string;
  };
}

// Radius options
const RADIUS_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
  { value: 30, label: "30 km" },
  { value: 50, label: "50 km" },
  { value: 0, label: "Custom" },
];

export default function TechnicianSignupPage() {
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
  const [lastEmailVerificationAttempt, setLastEmailVerificationAttempt] = useState<number | null>(null);
  const [emailVerificationCooldown, setEmailVerificationCooldown] = useState(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Skills data
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<Array<{skillId: string; skillTitle: string; level: string}>>([]);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    displayName: "",
    technicianType: "",
    yearsOfExperience: "",
    primarySkills: [] as string[],
    secondarySkills: [] as string[],
    serviceCategories: [] as string[], // Keep for backward compatibility, but will use primarySkills
    // Operating Area
    latitude: 0,
    longitude: 0,
    placeName: "",
    serviceRadiusKm: 10,
    customRadius: "",
    // Availability
    availableForInstallation: false,
    availableForMaintenance: false,
    availableForEmergencyCalls: false,
    workingDays: "",
    dailyAvailability: "",
    // Tools & Transport
    ownToolsAvailable: false,
    ownVehicle: "NONE",
    // Experience Proof
    previousWorkDescription: "",
  });

  // Check existing Firebase auth state and route accordingly
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.reload();
          
          const phoneNumber = user.phoneNumber;
          const email = user.email;
          const emailVerified = user.emailVerified;

          if (phoneNumber) {
            try {
              const idToken = await user.getIdToken();
              setPhoneIdToken(idToken);
              setPhoneVerified(true);
              if (phoneNumber) {
                const phoneNum = phoneNumber.replace(/\+91/, "");
                setPhone(phoneNum);
              }
              
              if (email && emailVerified) {
                setEmail(email);
                setEmailIdToken(idToken);
                setEmailVerified(true);
                setStep("details");
                toast.success("Mobile and email already verified! Please complete your details.");
              } else if (email) {
                setEmail(email);
                setStep("email");
                toast.success("Mobile already verified! Please verify your email.");
              } else {
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

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setSkillsLoading(true);
        const response = await fetch("/api/skills");
        const data = await response.json();
        if (response.ok && data.skills) {
          setSkills(data.skills);
        } else {
          console.error("Failed to fetch skills:", data.error);
          toast.error("Failed to load skills. Please refresh the page.");
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
        toast.error("Failed to load skills. Please refresh the page.");
      } finally {
        setSkillsLoading(false);
      }
    };

    fetchSkills();
  }, []);

  // Initialize reCAPTCHA
  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && auth) {
      try {
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }

        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
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

      const currentUser = auth.currentUser;
      if (currentUser && currentUser.phoneNumber === phoneNumber) {
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

    // Check cooldown period (60 seconds between attempts, 10 seconds in development)
    const now = Date.now();
    const isDevelopment = process.env.NODE_ENV === "development";
    const cooldownPeriod = isDevelopment ? 10 : 60; // 10 seconds in dev, 60 in production
    
    if (lastEmailVerificationAttempt) {
      const timeSinceLastAttempt = (now - lastEmailVerificationAttempt) / 1000; // in seconds
      
      if (timeSinceLastAttempt < cooldownPeriod) {
        const remainingTime = Math.ceil(cooldownPeriod - timeSinceLastAttempt);
        toast.error(`Please wait ${remainingTime} seconds before requesting another verification email.`);
        setEmailVerificationCooldown(remainingTime);
        return;
      }
    }

    setLoading(true);

    try {
      if (!auth) {
        toast.error("Firebase auth not initialized");
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, emailPassword);
        const user = userCredential.user;
        await user.reload();

        if (user.emailVerified) {
          const idToken = await user.getIdToken();
          setEmailIdToken(idToken);
          setEmailVerified(true);
          toast.success("Email already verified!");
          setTimeout(() => setStep("details"), 1000);
          return;
        } else {
          // Check if we can send verification email
          try {
            await sendEmailVerification(user);
            setEmailVerificationSent(true);
            setLastEmailVerificationAttempt(now);
            toast.success("Verification email sent! Please check your inbox.");
            
            // Start cooldown timer (10 seconds in dev, 60 in production)
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
            }
            const cooldownTime = isDevelopment ? 10 : 60;
            setEmailVerificationCooldown(cooldownTime);
            cooldownIntervalRef.current = setInterval(() => {
              setEmailVerificationCooldown((prev) => {
                if (prev <= 1) {
                  if (cooldownIntervalRef.current) {
                    clearInterval(cooldownIntervalRef.current);
                    cooldownIntervalRef.current = null;
                  }
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } catch (verificationError: any) {
            console.error("Error sending email verification:", verificationError);
            
            if (verificationError.code === "auth/too-many-requests") {
              // In development, use shorter cooldown (30 seconds), in production use 5 minutes
              const extendedCooldown = isDevelopment ? 30 : 300;
              toast.error(
                isDevelopment 
                  ? `Too many requests. Please wait ${extendedCooldown} seconds (Dev mode - reduced cooldown).`
                  : "Too many verification requests. Please wait a few minutes and try again, or check your email inbox for the verification link."
              );
              setLastEmailVerificationAttempt(now);
              setEmailVerificationCooldown(extendedCooldown);
              
              // Start extended cooldown timer
              if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
              }
              cooldownIntervalRef.current = setInterval(() => {
                setEmailVerificationCooldown((prev) => {
                  if (prev <= 1) {
                    if (cooldownIntervalRef.current) {
                      clearInterval(cooldownIntervalRef.current);
                      cooldownIntervalRef.current = null;
                    }
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            } else {
              throw verificationError;
            }
          }
        }
      } catch (signInError: any) {
        if (signInError.code === "auth/user-not-found" || signInError.code === "auth/wrong-password") {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, emailPassword);
            const user = userCredential.user;

              try {
              await sendEmailVerification(user);
              setEmailVerificationSent(true);
              setLastEmailVerificationAttempt(now);
              toast.success("Verification email sent! Please check your inbox.");
              
              // Start cooldown timer
              if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
              }
              setEmailVerificationCooldown(60);
              cooldownIntervalRef.current = setInterval(() => {
                setEmailVerificationCooldown((prev) => {
                  if (prev <= 1) {
                    if (cooldownIntervalRef.current) {
                      clearInterval(cooldownIntervalRef.current);
                      cooldownIntervalRef.current = null;
                    }
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            } catch (verificationError: any) {
              console.error("Error sending email verification:", verificationError);
              
              if (verificationError.code === "auth/too-many-requests") {
                // In development, use shorter cooldown (30 seconds), in production use 5 minutes
                const extendedCooldown = isDevelopment ? 30 : 300;
                toast.error(
                  isDevelopment 
                    ? `Too many requests. Please wait ${extendedCooldown} seconds (Dev mode - reduced cooldown).`
                    : "Too many verification requests. Please wait a few minutes and try again, or check your email inbox for the verification link."
                );
                setLastEmailVerificationAttempt(now);
                setEmailVerificationCooldown(extendedCooldown);
                
                // Start extended cooldown timer
                if (cooldownIntervalRef.current) {
                  clearInterval(cooldownIntervalRef.current);
                }
                cooldownIntervalRef.current = setInterval(() => {
                  setEmailVerificationCooldown((prev) => {
                    if (prev <= 1) {
                      if (cooldownIntervalRef.current) {
                        clearInterval(cooldownIntervalRef.current);
                        cooldownIntervalRef.current = null;
                      }
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
              } else {
                throw verificationError;
              }
            }
          } catch (createError: any) {
            console.error("Error creating user:", createError);
            if (createError.code === "auth/email-already-in-use") {
              toast.error("Email already registered. Please use the correct password or sign in instead.");
            } else if (createError.code === "auth/too-many-requests") {
              const extendedCooldown = isDevelopment ? 30 : 300;
              toast.error(
                isDevelopment 
                  ? `Too many requests. Please wait ${extendedCooldown} seconds (Dev mode - reduced cooldown).`
                  : "Too many requests. Please wait a few minutes and try again."
              );
              setLastEmailVerificationAttempt(now);
              setEmailVerificationCooldown(extendedCooldown);
              
              // Start extended cooldown timer
              if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
              }
              cooldownIntervalRef.current = setInterval(() => {
                setEmailVerificationCooldown((prev) => {
                  if (prev <= 1) {
                    if (cooldownIntervalRef.current) {
                      clearInterval(cooldownIntervalRef.current);
                      cooldownIntervalRef.current = null;
                    }
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
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
      if (error.code === "auth/too-many-requests") {
        const extendedCooldown = isDevelopment ? 30 : 300;
        toast.error(
          isDevelopment 
            ? `Too many requests. Please wait ${extendedCooldown} seconds (Dev mode - reduced cooldown).`
            : "Too many requests. Please wait a few minutes and try again."
        );
        setLastEmailVerificationAttempt(now);
        setEmailVerificationCooldown(extendedCooldown);
        
        // Start extended cooldown timer
        if (cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current);
        }
        cooldownIntervalRef.current = setInterval(() => {
          setEmailVerificationCooldown((prev) => {
            if (prev <= 1) {
              if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
                cooldownIntervalRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(error.message || "Failed to process email verification");
      }
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

      const userCredential = await signInWithEmailAndPassword(auth, email, emailPassword);
      const user = userCredential.user;

      await user.reload();

      if (user.emailVerified) {
        const idToken = await user.getIdToken();
        setEmailIdToken(idToken);
        setEmailVerified(true);
        toast.success("Email verified successfully!");
        
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

    if (!formData.fullName || !formData.technicianType) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!formData.latitude || !formData.longitude || !formData.placeName) {
      toast.error("Please select your operating area on the map");
      return;
    }

    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    // Check if all selected skills have levels
    const skillsWithoutLevel = selectedSkills.filter(s => !s.level);
    if (skillsWithoutLevel.length > 0) {
      toast.error("Please select skill level for all selected skills");
      return;
    }

    // Determine final radius
    let finalRadius = formData.serviceRadiusKm;
    if (formData.serviceRadiusKm === 0 && formData.customRadius) {
      finalRadius = parseFloat(formData.customRadius);
      if (isNaN(finalRadius) || finalRadius <= 0) {
        toast.error("Please enter a valid custom radius");
        return;
      }
    }

    setLoading(true);

    try {
      // Convert selected skills to format: [{skill: "Skill Name", level: "BEGINNER"}]
      const primarySkillsWithLevels = selectedSkills.map((selected) => ({
        skill: selected.skillTitle,
        level: selected.level,
      }));

      const response = await fetch("/api/auth/technician/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneIdToken,
          emailIdToken,
          password: emailPassword,
          fullName: formData.fullName,
          displayName: formData.displayName || null,
          technicianType: formData.technicianType,
          yearsOfExperience: formData.yearsOfExperience || null,
          primarySkills: primarySkillsWithLevels, // Save skills with levels as JSON
          secondarySkills: formData.secondarySkills,
          serviceCategories: [], // Keep empty for backward compatibility
          latitude: formData.latitude,
          longitude: formData.longitude,
          placeName: formData.placeName,
          serviceRadiusKm: finalRadius,
          workingDays: formData.workingDays || null,
          dailyAvailability: formData.dailyAvailability || null,
          ownToolsAvailable: formData.ownToolsAvailable,
          ownVehicle: formData.ownVehicle,
          previousWorkDescription: formData.previousWorkDescription || null,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data;
      let responseText = "";
      
      try {
        responseText = await response.text();
        
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[Frontend] Non-JSON response received");
          toast.error("Server error. Please try again later.");
          return;
        }

        data = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error("[Frontend] Failed to parse JSON response:", parseError);
        toast.error("Server error. Please check console for details.");
        return;
      }

      if (response.ok) {
        console.log("[Frontend] Registration successful!");
        toast.success("Registration successful! Your account is pending approval.");
        setStep("complete");
        
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
              router.push("/auth/signin?message=registration-success");
            }
          } catch (signInError) {
            console.error("Auto sign-in error:", signInError);
            router.push("/auth/signin?message=registration-success");
          }
        }, 3000);
      } else {
        console.error("[Frontend] Registration failed with error:", data?.error);
        
        if (data?.existingTechnician) {
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
              Join as a Technician
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              Complete registration in 3 simple steps
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4 text-left max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
                <strong>No KYC required at signup.</strong> KYC required before payouts.
              </p>
            </div>
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
                        <div className="space-y-2">
                          <Button
                            type="button"
                            onClick={handleSendEmailVerification}
                            disabled={loading || !email || !emailPassword || emailVerificationCooldown > 0}
                            className="w-full"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : emailVerificationCooldown > 0 ? (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Wait {emailVerificationCooldown}s
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Verification Email
                              </>
                            )}
                          </Button>
                          {emailVerificationCooldown > 0 && (
                            <p className="text-xs text-center text-gray-500">
                              Please wait {emailVerificationCooldown} seconds before requesting another email
                            </p>
                          )}
                        </div>
                      )}

                      {emailVerificationSent && !emailVerified && (
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-900">
                              <strong>Verification email sent!</strong> Please check your inbox and click the verification link.
                            </p>
                            {emailVerificationCooldown > 0 && (
                              <p className="text-xs text-yellow-700 mt-2">
                                You can request another email in {emailVerificationCooldown} seconds
                              </p>
                            )}
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
                          {emailVerificationCooldown === 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleSendEmailVerification}
                              disabled={loading}
                              className="w-full"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Resend Verification Email
                            </Button>
                          )}
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

            {/* Step 3: Technician Details */}
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
                            <Label htmlFor="displayName">Display Name (Optional)</Label>
                            <Input
                              id="displayName"
                              value={formData.displayName}
                              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                              placeholder="How you want to be displayed"
                            />
                          </div>
                          <div>
                            <Label htmlFor="technicianType">Technician Type *</Label>
                            <Select
                              value={formData.technicianType}
                              onValueChange={(value) => setFormData({ ...formData, technicianType: value })}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                <SelectItem value="FREELANCE">Freelance</SelectItem>
                                <SelectItem value="COMPANY_TECHNICIAN">Company Technician</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Skills *</h3>
                        <p className="text-sm text-gray-600 mb-4">Select service domains to view skills, then select your skills and proficiency level</p>
                        {skillsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-600">Loading skills...</span>
                          </div>
                        ) : skills.length === 0 ? (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              No skills available. Please contact support.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Group skills by service domain - Collapsible */}
                            {Array.from(
                              new Set(skills.map((skill) => skill.serviceDomain?.title).filter(Boolean))
                            ).map((domainTitle) => {
                              const domainSkills = skills.filter((skill) => skill.serviceDomain?.title === domainTitle);
                              const isExpanded = expandedDomains.has(domainTitle || "");
                              
                              return (
                                <div key={domainTitle} className="border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Domain Header - Clickable to expand/collapse */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newExpanded = new Set(expandedDomains);
                                      if (isExpanded) {
                                        newExpanded.delete(domainTitle || "");
                                      } else {
                                        newExpanded.add(domainTitle || "");
                                      }
                                      setExpandedDomains(newExpanded);
                                    }}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    <h4 className="font-semibold text-gray-900">{domainTitle}</h4>
                                    <ChevronRight
                                      className={`w-5 h-5 text-gray-600 transition-transform ${
                                        isExpanded ? "rotate-90" : ""
                                      }`}
                                    />
                                  </button>
                                  
                                  {/* Skills - Hidden by default, shown when expanded */}
                                  {isExpanded && (
                                    <div className="p-4 bg-white">
                                      <div className="grid md:grid-cols-2 gap-4">
                                        {domainSkills.map((skill) => {
                                          const isSelected = selectedSkills.some((s) => s.skillId === skill.id);
                                          const selectedSkill = selectedSkills.find((s) => s.skillId === skill.id);
                                          
                                          return (
                                            <div key={skill.id} className="border border-gray-200 rounded-lg p-3">
                                              <div className="flex items-start space-x-2 mb-2">
                                                <Checkbox
                                                  id={skill.id}
                                                  checked={isSelected}
                                                  onCheckedChange={(checked) => {
                                                    if (checked) {
                                                      setSelectedSkills([
                                                        ...selectedSkills,
                                                        { skillId: skill.id, skillTitle: skill.title, level: "" },
                                                      ]);
                                                    } else {
                                                      setSelectedSkills(
                                                        selectedSkills.filter((s) => s.skillId !== skill.id)
                                                      );
                                                    }
                                                  }}
                                                />
                                                <Label htmlFor={skill.id} className="cursor-pointer flex-1">
                                                  <div className="font-medium">{skill.title}</div>
                                                  {skill.shortDescription && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                      {skill.shortDescription}
                                                    </div>
                                                  )}
                                                </Label>
                                              </div>
                                              
                                              {/* Skill Level Selector - Show when skill is selected */}
                                              {isSelected && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                  <Label className="text-xs text-gray-600 mb-2 block">
                                                    Select your proficiency level:
                                                  </Label>
                                                  <div className="flex gap-2">
                                                    {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((level) => (
                                                      <Button
                                                        key={level}
                                                        type="button"
                                                        variant={selectedSkill?.level === level ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                          setSelectedSkills(
                                                            selectedSkills.map((s) =>
                                                              s.skillId === skill.id
                                                                ? { ...s, level }
                                                                : s
                                                            )
                                                          );
                                                        }}
                                                        className="text-xs"
                                                      >
                                                        {level === "BEGINNER" && "Beginner"}
                                                        {level === "INTERMEDIATE" && "Intermediate"}
                                                        {level === "ADVANCED" && "Advanced"}
                                                      </Button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Skills without domain */}
                            {skills.filter((skill) => !skill.serviceDomain).length > 0 && (
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedDomains);
                                    const domainKey = "OTHER_SKILLS";
                                    if (newExpanded.has(domainKey)) {
                                      newExpanded.delete(domainKey);
                                    } else {
                                      newExpanded.add(domainKey);
                                    }
                                    setExpandedDomains(newExpanded);
                                  }}
                                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                  <h4 className="font-semibold text-gray-900">Other Skills</h4>
                                  <ArrowRight
                                    className={`w-5 h-5 text-gray-600 transition-transform ${
                                      expandedDomains.has("OTHER_SKILLS") ? "rotate-90" : ""
                                    }`}
                                  />
                                </button>
                                
                                {expandedDomains.has("OTHER_SKILLS") && (
                                  <div className="p-4 bg-white">
                                    <div className="grid md:grid-cols-2 gap-4">
                                      {skills
                                        .filter((skill) => !skill.serviceDomain)
                                        .map((skill) => {
                                          const isSelected = selectedSkills.some((s) => s.skillId === skill.id);
                                          const selectedSkill = selectedSkills.find((s) => s.skillId === skill.id);
                                          
                                          return (
                                            <div key={skill.id} className="border border-gray-200 rounded-lg p-3">
                                              <div className="flex items-start space-x-2 mb-2">
                                                <Checkbox
                                                  id={skill.id}
                                                  checked={isSelected}
                                                  onCheckedChange={(checked) => {
                                                    if (checked) {
                                                      setSelectedSkills([
                                                        ...selectedSkills,
                                                        { skillId: skill.id, skillTitle: skill.title, level: "" },
                                                      ]);
                                                    } else {
                                                      setSelectedSkills(
                                                        selectedSkills.filter((s) => s.skillId !== skill.id)
                                                      );
                                                    }
                                                  }}
                                                />
                                                <Label htmlFor={skill.id} className="cursor-pointer flex-1">
                                                  <div className="font-medium">{skill.title}</div>
                                                  {skill.shortDescription && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                      {skill.shortDescription}
                                                    </div>
                                                  )}
                                                </Label>
                                              </div>
                                              
                                              {isSelected && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                  <Label className="text-xs text-gray-600 mb-2 block">
                                                    Select your proficiency level:
                                                  </Label>
                                                  <div className="flex gap-2">
                                                    {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((level) => (
                                                      <Button
                                                        key={level}
                                                        type="button"
                                                        variant={selectedSkill?.level === level ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                          setSelectedSkills(
                                                            selectedSkills.map((s) =>
                                                              s.skillId === skill.id
                                                                ? { ...s, level }
                                                                : s
                                                            )
                                                          );
                                                        }}
                                                        className="text-xs"
                                                      >
                                                        {level === "BEGINNER" && "Beginner"}
                                                        {level === "INTERMEDIATE" && "Intermediate"}
                                                        {level === "ADVANCED" && "Advanced"}
                                                      </Button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Selected Skills Summary */}
                            {selectedSkills.length > 0 && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 mb-2">
                                  <strong>{selectedSkills.length}</strong> skill{selectedSkills.length !== 1 ? "s" : ""} selected
                                </p>
                                {selectedSkills.filter((s) => !s.level).length > 0 && (
                                  <p className="text-xs text-yellow-700">
                                    ⚠️ Please select proficiency level for all selected skills
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Operating Area Map */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Operating Area (Map Selection) *</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Select your service location and radius. You will receive service jobs within the selected radius.
                        </p>
                        <LocationMapPicker
                          key={`${formData.latitude}-${formData.longitude}-${formData.serviceRadiusKm}`}
                          onLocationSelect={(location) => {
                            setFormData({
                              ...formData,
                              latitude: location.lat,
                              longitude: location.lng,
                              placeName: location.placeName || location.address,
                            });
                          }}
                          onRadiusChange={(radius) => {
                            setFormData({ ...formData, serviceRadiusKm: radius });
                          }}
                          initialRadius={formData.serviceRadiusKm === 0 && formData.customRadius ? parseFloat(formData.customRadius) : formData.serviceRadiusKm}
                          showRadiusControl={false}
                          initialLocation={
                            formData.latitude && formData.longitude
                              ? {
                                  lat: formData.latitude,
                                  lng: formData.longitude,
                                  address: formData.placeName || "",
                                  placeName: formData.placeName,
                                }
                              : undefined
                          }
                        />
                        
                        {/* Radius Selector */}
                        <div className="mt-4">
                          <Label>Service Radius *</Label>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                            {RADIUS_OPTIONS.map((option) => (
                              <Button
                                key={option.value}
                                type="button"
                                variant={formData.serviceRadiusKm === option.value ? "default" : "outline"}
                                onClick={() => {
                                  if (option.value === 0) {
                                    setFormData({ ...formData, serviceRadiusKm: 0, customRadius: "" });
                                  } else {
                                    setFormData({ ...formData, serviceRadiusKm: option.value, customRadius: "" });
                                  }
                                }}
                                className="text-sm"
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                          {formData.serviceRadiusKm === 0 && (
                            <div className="mt-2">
                              <Input
                                type="number"
                                placeholder="Enter custom radius in km"
                                value={formData.customRadius}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData({ ...formData, customRadius: value });
                                  if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
                                    // Update map circle when custom radius is entered
                                    setTimeout(() => {
                                      // Force re-render of map with new radius
                                    }, 100);
                                  }
                                }}
                                min="1"
                              />
                            </div>
                          )}
                          {formData.placeName && (
                            <p className="text-sm text-blue-600 mt-2">
                              You will receive service jobs within {formData.serviceRadiusKm === 0 && formData.customRadius ? formData.customRadius : formData.serviceRadiusKm} km radius of {formData.placeName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Availability & Work Preferences */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Availability & Work Preferences</h3>
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="workingDays">Working Days</Label>
                              <Select
                                value={formData.workingDays}
                                onValueChange={(value) => setFormData({ ...formData, workingDays: value })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select working days" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="WEEKDAYS">Weekdays</SelectItem>
                                  <SelectItem value="WEEKENDS">Weekends</SelectItem>
                                  <SelectItem value="BOTH">Both</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="dailyAvailability">Daily Availability</Label>
                              <Select
                                value={formData.dailyAvailability}
                                onValueChange={(value) => setFormData({ ...formData, dailyAvailability: value })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select availability" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="FULL_DAY">Full Day</SelectItem>
                                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                                  <SelectItem value="ON_CALL">On-Call</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tools & Transport */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Tools & Transport</h3>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="ownTools"
                              checked={formData.ownToolsAvailable}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, ownToolsAvailable: checked === true })
                              }
                            />
                            <Label htmlFor="ownTools" className="cursor-pointer">
                              Own tools available
                            </Label>
                          </div>
                          <div>
                            <Label htmlFor="ownVehicle">Own Vehicle</Label>
                            <Select
                              value={formData.ownVehicle}
                              onValueChange={(value) => setFormData({ ...formData, ownVehicle: value })}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="NONE">None</SelectItem>
                                <SelectItem value="BIKE">Bike</SelectItem>
                                <SelectItem value="CAR">Car</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Experience Proof (Optional) */}
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Experience Proof (Optional)</h3>
                        <div>
                          <Label htmlFor="previousWork">Previous Work Description</Label>
                          <textarea
                            id="previousWork"
                            value={formData.previousWorkDescription}
                            onChange={(e) => setFormData({ ...formData, previousWorkDescription: e.target.value })}
                            placeholder="Describe your previous work experience..."
                            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
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











