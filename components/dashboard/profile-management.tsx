"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Navigation,
  Loader2,
  Sparkles,
  Shield,
  Map,
  Building2,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export function ProfileManagement() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
  });
  const [addressData, setAddressData] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Log session status changes
  useEffect(() => {
    console.log(`[ProfileManagement] ${new Date().toISOString()} - Session Status: ${status}`);
    console.log(`[ProfileManagement] Session exists: ${!!session}, User ID: ${session?.user?.id}, Email: ${session?.user?.email}`);
    
    if (status === "unauthenticated") {
      console.log(`[ProfileManagement] ⚠️ UNAUTHENTICATED - Will redirect to signin`);
      const currentPath = window.location.pathname;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }
  }, [status, session, router]);

  // Only fetch profile when session is loaded (not loading)
  useEffect(() => {
    console.log(`[ProfileManagement useEffect] ${new Date().toISOString()} - Status: ${status}, Session: ${!!session}, User ID: ${session?.user?.id}`);
    
    // Wait for session to be determined (not loading)
    if (status === "loading") {
      console.log(`[ProfileManagement useEffect] Session is loading, waiting...`);
      return; // Don't fetch while session is loading
    }
    
    // Only fetch if session exists (middleware already protects route)
    // Add a small delay to ensure session is fully established after login
    if (status === "authenticated" && session?.user?.id) {
      console.log(`[ProfileManagement useEffect] ✅ Authenticated, fetching profile in 100ms...`);
      // Small delay to ensure session cookie is set
      const timer = setTimeout(() => {
        console.log(`[ProfileManagement useEffect] Fetching profile now...`);
        fetchProfile();
        fetchDefaultAddress();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log(`[ProfileManagement useEffect] ⚠️ Not authenticated - Status: ${status}, Session: ${!!session}, User ID: ${session?.user?.id}`);
    }
  }, [session, status]);

  const fetchProfile = async () => {
    console.log(`[ProfileManagement fetchProfile] ${new Date().toISOString()} - Starting profile fetch...`);
    try {
      const response = await fetch("/api/user/profile");
      console.log(`[ProfileManagement fetchProfile] Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[ProfileManagement fetchProfile] ✅ Profile fetched successfully, User: ${data.user?.name || data.user?.email}`);
        setFormData({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
        });
        setPhoneVerified(data.user?.phoneVerified === true);
      } else if (response.status === 401) {
        console.log(`[ProfileManagement fetchProfile] ⚠️ 401 Unauthorized - Session may have expired`);
        // Unauthorized - but middleware should have protected this
        // Don't redirect, just handle silently (middleware handles auth)
      } else {
        console.log(`[ProfileManagement fetchProfile] ⚠️ Error response: ${response.status}`);
      }
    } catch (error) {
      console.log(`[ProfileManagement fetchProfile] ❌ Error fetching profile:`, error);
      // Don't redirect on error - let middleware handle it
    }
  };

  const fetchDefaultAddress = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (response.ok) {
        const data = await response.json();
        const defaultAddress = data.addresses?.find((addr: any) => addr.isDefault) || data.addresses?.[0];
        if (defaultAddress) {
          setAddressData({
            addressLine1: defaultAddress.addressLine1 || "",
            addressLine2: defaultAddress.addressLine2 || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            pincode: defaultAddress.pincode || "",
            country: defaultAddress.country || "India",
          });
        }
      }
    } catch (error) {
      // Silently handle address fetch errors
    }
  };

  const handlePincodeChange = async (pincode: string) => {
    setAddressData({ ...addressData, pincode });
    
    // Auto-fill city, state, country when pincode is 6 digits
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      setFetchingPincode(true);
      try {
        const response = await fetch(`/api/pincode/lookup?pincode=${pincode}`);
        if (response.ok) {
          const data = await response.json();
          setAddressData({
            ...addressData,
            pincode,
            city: data.city || addressData.city,
            state: data.state || addressData.state,
            country: data.country || "India",
          });
          toast.success("Address details auto-filled!");
        } else {
          const error = await response.json();
          toast.error(error.error || "Could not find pincode details");
        }
      } catch (error) {
        toast.error("Failed to fetch pincode details");
      } finally {
        setFetchingPincode(false);
      }
    }
  };

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding API to get address from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            
            setAddressData({
              addressLine1: `${address.house_number || ""} ${address.road || address.neighbourhood || ""}`.trim() || addressData.addressLine1,
              addressLine2: addressData.addressLine2,
              city: address.city || address.town || address.village || addressData.city,
              state: address.state || addressData.state,
              pincode: address.postcode || addressData.pincode,
              country: address.country || "India",
            });
            
            toast.success("Location fetched successfully!");
            
            // If pincode is available, fetch detailed info
            if (address.postcode) {
              await handlePincodeChange(address.postcode);
            }
          } else {
            toast.error("Could not fetch address from location");
          }
        } catch (error) {
          toast.error("Failed to fetch address from location");
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        toast.error("Could not get your location. Please allow location access.");
        setFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update user profile
      const profileResponse = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!profileResponse.ok) {
        toast.error("Failed to update profile");
        setLoading(false);
        return;
      }

      const profileData = await profileResponse.json();
      setPhoneVerified(profileData.user?.phoneVerified === true);

      // Save address if address fields are filled
      if (addressData.addressLine1 || addressData.city || addressData.pincode) {
        try {
          // Check if default address exists
          const addressesResponse = await fetch("/api/addresses");
          const addressesData = await addressesResponse.json();
          const defaultAddress = addressesData.addresses?.find((addr: any) => addr.isDefault);

          const addressPayload = {
            name: formData.name || "Home",
            phone: formData.phone || "",
            ...addressData,
            isDefault: true,
          };

          if (defaultAddress) {
            // Update existing default address
            await fetch(`/api/addresses/${defaultAddress.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(addressPayload),
            });
          } else {
            // Create new default address
            await fetch("/api/addresses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(addressPayload),
            });
          }
        } catch (error) {
          // Don't fail the whole operation if address save fails
        }
      }

      toast.success("Profile updated successfully!");
      await update();
      
      // Check if there's a callback URL and redirect
      const callbackUrl = searchParams?.get("callbackUrl");
      if (callbackUrl) {
        // Check if profile is now complete and phone is verified
        const profileComplete = !!(profileData.user?.name && profileData.user?.email && profileData.user?.phone);
        if (profileComplete && profileData.user?.phoneVerified) {
          toast.success("Profile complete! Redirecting...");
          setTimeout(() => {
            router.push(callbackUrl);
          }, 1000);
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!formData.phone) {
      toast.error("Please enter a phone number first");
      return;
    }

    setVerifying(true);
    try {
      // In production, integrate with OTP service
      // For now, simulate verification
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, phoneVerified: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneVerified(true);
        toast.success("Phone number verified!");
        await update();
        
        // Check callback URL
        const callbackUrl = searchParams?.get("callbackUrl");
        if (callbackUrl) {
          setTimeout(() => {
            router.push(callbackUrl);
            // If callbackUrl contains #calculator, scroll to calculator section after redirect
            if (callbackUrl.includes("#calculator")) {
              setTimeout(() => {
                const calculatorSection = document.getElementById("calculator");
                if (calculatorSection) {
                  calculatorSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }, 500);
            }
          }, 1000);
        }
      } else {
        toast.error("Failed to verify phone number");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setVerifying(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  // Show loading state while session is being determined
  if (status === "loading") {
    console.log(`[ProfileManagement Render] ${new Date().toISOString()} - Showing loading state`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    console.log(`[ProfileManagement Render] ${new Date().toISOString()} - ⚠️ UNAUTHENTICATED - Should redirect`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6 shadow-lg shadow-blue-500/25"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Profile Settings
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your personal information and address details
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Personal Information Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-500/10 border border-white/20 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                <p className="text-sm text-gray-500">Update your basic profile details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="space-y-2"
              >
                <Label htmlFor="name" className="flex items-center gap-2 text-gray-700 font-semibold">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </motion.div>

              {/* Email Field */}
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Email cannot be changed
                </p>
              </motion.div>
            </div>

            {/* Phone Field */}
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="mt-6 space-y-2"
            >
              <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700 font-semibold">
                <Phone className="w-4 h-4 text-blue-600" />
                Phone Number
                {phoneVerified && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 text-green-600 text-sm font-normal"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </motion.span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 pr-12"
                  placeholder="+91 98765 43210"
                />
                {phoneVerified && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
              </div>

              <AnimatePresence>
                {!phoneVerified && formData.phone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          Phone Verification Required
                        </p>
                        <p className="text-xs text-amber-800 mb-3">
                          Please verify your phone number to access all features and services.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleVerifyPhone}
                          disabled={verifying}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30"
                        >
                          {verifying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Verify Phone Number
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Address Information Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-purple-500/10 border border-white/20 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Address Information</h2>
                  <p className="text-sm text-gray-500">Manage your delivery address</p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetLiveLocation}
                  disabled={fetchingLocation}
                  className="border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold shadow-md"
                >
                  {fetchingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Use Live Location
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            <div className="space-y-6">
              {/* Address Line 1 */}
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="space-y-2"
              >
                <Label htmlFor="addressLine1" className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Address Line 1
                </Label>
                <Input
                  id="addressLine1"
                  value={addressData.addressLine1}
                  onChange={(e) => setAddressData({ ...addressData, addressLine1: e.target.value })}
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  placeholder="House/Flat No., Building Name"
                />
              </motion.div>

              {/* Address Line 2 */}
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="space-y-2"
              >
                <Label htmlFor="addressLine2" className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Map className="w-4 h-4 text-purple-600" />
                  Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="addressLine2"
                  value={addressData.addressLine2}
                  onChange={(e) => setAddressData({ ...addressData, addressLine2: e.target.value })}
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  placeholder="Street, Area, Landmark"
                />
              </motion.div>

              {/* Pincode, City, State Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="space-y-2"
                >
                  <Label htmlFor="pincode" className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Pincode
                  </Label>
                  <div className="relative">
                    <Input
                      id="pincode"
                      value={addressData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className="h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                      placeholder="6-digit pincode"
                      maxLength={6}
                      disabled={fetchingPincode}
                    />
                    {fetchingPincode && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      </motion.div>
                    )}
                  </div>
                  {fetchingPincode && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-purple-600 flex items-center gap-1"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Fetching details...
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="space-y-2"
                >
                  <Label htmlFor="city" className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    City
                  </Label>
                  <Input
                    id="city"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="City"
                  />
                </motion.div>

                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="space-y-2"
                >
                  <Label htmlFor="state" className="flex items-center gap-2 text-gray-700 font-semibold">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    State
                  </Label>
                  <Input
                    id="state"
                    value={addressData.state}
                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="State"
                  />
                </motion.div>
              </div>

              {/* Country */}
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="space-y-2"
              >
                <Label htmlFor="country" className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Globe className="w-4 h-4 text-purple-600" />
                  Country
                </Label>
                <Input
                  id="country"
                  value={addressData.country}
                  onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  placeholder="Country"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 pt-6"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 text-lg transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </motion.div>
            
            <AnimatePresence>
              {phoneVerified && searchParams?.get("callbackUrl") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => router.push(searchParams.get("callbackUrl")!)}
                    className="h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 text-lg px-8 transition-all duration-200"
                  >
                    Continue
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
