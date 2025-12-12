"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator as CalcIcon, Camera, HardDrive, ArrowRight, CheckCircle2, Star, Tag, Loader2, Info, X, Monitor, Users, Zap, Save, Eye, Phone, Mail, Download, Sparkles, Calendar, FileText, Share2, MessageCircle, Send } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";
import { generateQuotationPDF, generateQuotationPDFBlob } from "@/lib/pdf-generator";
import { useSettings } from "@/lib/hooks/use-settings";
import { DownloadTimer, ThankYouMessage } from "@/components/ui/download-timer";

interface Brand {
  id: string;
  name: string;
  logo?: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface TerritoryCategory {
  id: string;
  name: string;
}

interface HDDTerritoryCategory {
  id: string;
  name: string;
}

export function Calculator() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings } = useSettings();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [formData, setFormData] = useState({
    brandId: "",
    cameraTypeId: "",
    resolutionId: "",
    hddId: "",
    recordingDays: "",
    indoorCameraCount: "",
    outdoorCameraCount: "",
    wiringMeters: "",
  });

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [calculatedQuotation, setCalculatedQuotation] = useState<any>(null);
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);
  const [quotationSaved, setQuotationSaved] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQuoteSummary, setShowQuoteSummary] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showShareDropdownInSummary, setShowShareDropdownInSummary] = useState(false);
  const [currentQuotationNumber, setCurrentQuotationNumber] = useState<string>("");
  const [downloadTimer, setDownloadTimer] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  // Get step information with icon, color, and message
  const getStepInfo = () => {
    const steps = [
      {
        step: 1,
        message: "Please select a brand to continue",
        icon: Star,
        color: "blue",
        bgColor: "bg-blue-50/90",
        borderColor: "border-blue-200/60",
        iconBg: "bg-blue-100/60",
        iconColor: "text-blue-700",
        textColor: "text-blue-800",
        hoverColor: "hover:bg-blue-200/60",
        closeColor: "text-blue-700",
      },
      {
        step: 2,
        message: "Great! Now select a camera type",
        icon: Camera,
        color: "purple",
        bgColor: "bg-purple-50/90",
        borderColor: "border-purple-200/60",
        iconBg: "bg-purple-100/60",
        iconColor: "text-purple-700",
        textColor: "text-purple-800",
        hoverColor: "hover:bg-purple-200/60",
        closeColor: "text-purple-700",
      },
      {
        step: 3,
        message: "Perfect! Next, choose the resolution",
        icon: Monitor,
        color: "indigo",
        bgColor: "bg-indigo-50/90",
        borderColor: "border-indigo-200/60",
        iconBg: "bg-indigo-100/60",
        iconColor: "text-indigo-700",
        textColor: "text-indigo-800",
        hoverColor: "hover:bg-indigo-200/60",
        closeColor: "text-indigo-700",
      },
      {
        step: 4,
        message: "Almost there! First, enter indoor cameras and/or outdoor cameras based on your requirement. Then enter wiring in meters (required).",
        icon: Users,
        color: "orange",
        bgColor: "bg-orange-50/90",
        borderColor: "border-orange-200/60",
        iconBg: "bg-orange-100/60",
        iconColor: "text-orange-700",
        textColor: "text-orange-800",
        hoverColor: "hover:bg-orange-200/60",
        closeColor: "text-orange-700",
      },
      {
        step: 5,
        message: "Final step! Select HDD storage or enter recording days",
        icon: HardDrive,
        color: "green",
        bgColor: "bg-green-50/90",
        borderColor: "border-green-200/60",
        iconBg: "bg-green-100/60",
        iconColor: "text-green-700",
        textColor: "text-green-800",
        hoverColor: "hover:bg-green-200/60",
        closeColor: "text-green-700",
      },
    ];

    const totalSteps = steps.length;

    if (!formData.brandId) {
      return { ...steps[0], currentStep: 1, totalSteps, remainingSteps: totalSteps - 1 };
    }
    if (!formData.cameraTypeId) {
      return { ...steps[1], currentStep: 2, totalSteps, remainingSteps: totalSteps - 2 };
    }
    if (!formData.resolutionId) {
      return { ...steps[2], currentStep: 3, totalSteps, remainingSteps: totalSteps - 3 };
    }
    // After Resolution, check step 4 (Cameras & Wiring)
    // Check if indoor or outdoor cameras are filled and wiring is filled
    const hasIndoorCameras = formData.indoorCameraCount && formData.indoorCameraCount !== "0" && formData.indoorCameraCount !== "";
    const hasOutdoorCameras = formData.outdoorCameraCount && formData.outdoorCameraCount !== "0" && formData.outdoorCameraCount !== "";
    const hasWiring = formData.wiringMeters && formData.wiringMeters !== "0" && formData.wiringMeters !== "";
    
    // Show step 4 if:
    // - No cameras are filled (indoor AND outdoor both empty), OR
    // - At least one camera is filled BUT wiring is not filled
    // Step 5 will only show when BOTH conditions are met: (at least one camera filled) AND (wiring filled)
    if ((!hasIndoorCameras && !hasOutdoorCameras) || !hasWiring) {
      return { ...steps[3], currentStep: 4, totalSteps, remainingSteps: totalSteps - 4 };
    }
    // Show HDD step (step 5) only if BOTH conditions are met:
    // 1. At least one camera field is filled (indoor OR outdoor)
    // 2. Wiring field is also filled
    if (!formData.hddId && (!formData.recordingDays || formData.recordingDays === "")) {
      return { ...steps[4], currentStep: 5, totalSteps, remainingSteps: totalSteps - 5 };
    }
    return null;
  };

  const stepInfo = getStepInfo();

  // Auto-show guidance when formData changes
  useEffect(() => {
    if (stepInfo) {
      setShowGuidance(true);
    }
  }, [formData, stepInfo]);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [territoryCategories, setTerritoryCategories] = useState<TerritoryCategory[]>([]);
  const [hddTerritoryCategories, setHddTerritoryCategories] = useState<HDDTerritoryCategory[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch(`/api/user/profile`);
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data.user);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, status]);

  // Scroll to calculator section if hash is present
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#calculator") {
      setTimeout(() => {
        const calculatorSection = document.getElementById("calculator");
        if (calculatorSection) {
          calculatorSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    }
  }, []);

  // Check if user profile is complete
  const isProfileComplete = useMemo(() => {
    if (!userProfile) return false;
    return !!(
      userProfile.name &&
      userProfile.email &&
      userProfile.phone &&
      userProfile.phoneVerified
    );
  }, [userProfile]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBrands(),
        fetchCategories(),
        fetchTerritoryCategories(),
        fetchHDDTerritoryCategories(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/quotation/brands");
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/quotation/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTerritoryCategories = async () => {
    try {
      const response = await fetch("/api/quotation/territory-categories");
      const data = await response.json();
      setTerritoryCategories(data.territoryCategories || []);
    } catch (error) {
      console.error("Error fetching territory categories:", error);
    }
  };

  const fetchHDDTerritoryCategories = async () => {
    try {
      const response = await fetch("/api/quotation/hdd/territory-categories");
      if (!response.ok) {
        setHddTerritoryCategories([]);
        return;
      }
      const data = await response.json();
      if (data.territoryCategories && Array.isArray(data.territoryCategories)) {
        setHddTerritoryCategories(data.territoryCategories);
      } else {
        setHddTerritoryCategories([]);
      }
    } catch (error) {
      console.error("Error fetching HDD territory categories:", error);
      setHddTerritoryCategories([]);
    }
  };

  const calculateQuotation = useCallback(async () => {
    if (!formData.brandId || !formData.cameraTypeId || !formData.resolutionId) {
      setCalculatedQuotation(null);
      return;
    }

    const indoorCount = parseInt(formData.indoorCameraCount) || 0;
    const outdoorCount = parseInt(formData.outdoorCameraCount) || 0;
    const wiringMeters = parseFloat(formData.wiringMeters) || 0;
    const recordingDays = parseInt(formData.recordingDays) || 0;

    if (indoorCount === 0 && outdoorCount === 0 && !formData.hddId && recordingDays === 0 && wiringMeters === 0) {
      setCalculatedQuotation(null);
      return;
    }

    setCalculating(true);
    try {
      const params = new URLSearchParams({
        brandId: formData.brandId,
        categoryId: formData.cameraTypeId,
        territoryCategoryId: formData.resolutionId,
        indoorCount: indoorCount.toString(),
        outdoorCount: outdoorCount.toString(),
        wiringMeters: wiringMeters.toString(),
      });

      if (formData.hddId) {
        params.append("hddTerritoryCategoryId", formData.hddId);
      } else if (recordingDays > 0) {
        params.append("recordingDays", recordingDays.toString());
      }

      const response = await fetch(`/api/quotation/calculate?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Calculation failed");
      }
      const data = await response.json();
      setCalculatedQuotation(data);
    } catch (error) {
      console.error("Error calculating quotation:", error);
      setCalculatedQuotation(null);
    } finally {
      setCalculating(false);
    }
  }, [formData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateQuotation();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.brandId,
    formData.cameraTypeId,
    formData.resolutionId,
    formData.indoorCameraCount,
    formData.outdoorCameraCount,
    formData.hddId,
    formData.recordingDays,
    formData.wiringMeters,
    calculateQuotation,
  ]);

  const totalPrice = calculatedQuotation
    ? (calculatedQuotation.indoorCamera?.total || 0) +
      (calculatedQuotation.outdoorCamera?.total || 0) +
      (calculatedQuotation.recordingDevice?.total || calculatedQuotation.recordingDevice?.price || 0) +
      (calculatedQuotation.hddStorage?.total || 0) +
      (calculatedQuotation.powerSupply?.total || calculatedQuotation.powerSupply?.price || 0) +
      (calculatedQuotation.wiring?.total || 0) +
      (calculatedQuotation.accessories?.reduce((sum: number, acc: any) => sum + (acc.total || 0), 0) || 0) +
      (calculatedQuotation.installation?.total || 0)
    : 0;

  // Format price with XXX (hide digits)
  const formatPriceXXX = (price: number): string => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return formatted.replace(/\d/g, "X");
  };

  // Format actual price
  const formatPriceActual = (price: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate quotation summary details similar to quotation form
  const quotationSummaryDetails = useMemo(() => {
    if (!calculatedQuotation) {
      return { totalPrice: 0, details: [] };
    }

    const details: any[] = [];
    let totalPrice = 0;

    const indoorCount = parseInt(formData.indoorCameraCount) || 0;
    const outdoorCount = parseInt(formData.outdoorCameraCount) || 0;

    if (calculatedQuotation.indoorCamera) {
      const indoor = calculatedQuotation.indoorCamera;
      details.push({
        item: `${indoorCount} Indoor Camera${indoorCount > 1 ? 's' : ''} - ${indoor.productName}`,
        quantity: indoor.quantity,
        price: indoor.price,
        total: indoor.total,
      });
      totalPrice += indoor.total;
    }

    if (calculatedQuotation.outdoorCamera) {
      const outdoor = calculatedQuotation.outdoorCamera;
      details.push({
        item: `${outdoorCount} Outdoor Camera${outdoorCount > 1 ? 's' : ''} - ${outdoor.productName}`,
        quantity: outdoor.quantity,
        price: outdoor.price,
        total: outdoor.total,
      });
      totalPrice += outdoor.total;
    }

    if (calculatedQuotation.recordingDevice) {
      const device = calculatedQuotation.recordingDevice;
      const deviceTypeDisplay = device.deviceType || 'DVR/NVR';
      const productName = device.productName || 'Recording Device';
      const deviceTotal = device.total || device.price || 0;
      details.push({
        item: `${deviceTypeDisplay} - ${productName}`,
        quantity: device.quantity || 1,
        price: device.price || 0,
        total: deviceTotal,
      });
      totalPrice += deviceTotal;
    }

    if (calculatedQuotation.hddStorage) {
      const hdd = calculatedQuotation.hddStorage;
      let hddItemName = hdd.productName || "HDD Storage";
      if (hdd.calculationType === "days_entered") {
        hddItemName = `Required HDD (Estimated): ${hdd.productName || "HDD Storage"}`;
      } else if (hdd.calculationType === "hdd_selected") {
        hddItemName = hdd.productName || "HDD Storage";
      }
      details.push({
        item: hddItemName,
        quantity: hdd.quantity,
        price: hdd.price,
        total: hdd.total,
        hasCalculation: !!hdd.calculationType,
        calculationType: hdd.calculationType,
        estimatedDays: hdd.recordingDays,
        estimatedDaysDisplay: hdd.recordingDays ? `${hdd.recordingDays} days` : null,
        requiredHDDGB: hdd.requiredHDDGB,
        suggestedHDDGB: hdd.suggestedHDDGB,
        resolutionMP: formData.resolutionId ? territoryCategories.find(tc => tc.id === formData.resolutionId)?.name : null,
        totalCameras: indoorCount + outdoorCount,
      });
      totalPrice += hdd.total;
    }

    if (calculatedQuotation.powerSupply) {
      const powerSupply = calculatedQuotation.powerSupply;
      const productName = powerSupply.productName || 'Power Supply';
      const powerSupplyTotal = powerSupply.total || powerSupply.price || 0;
      details.push({
        item: `Power Supply - ${productName}`,
        quantity: powerSupply.quantity || 1,
        price: powerSupply.price || 0,
        total: powerSupplyTotal,
      });
      totalPrice += powerSupplyTotal;
    }

    if (calculatedQuotation.wiring) {
      const wiring = calculatedQuotation.wiring;
      if (wiring.exceedsMaxLength) {
        details.push({
          item: `Cable (${wiring.meters} meters) + Wiring Charge`,
          quantity: wiring.meters,
          price: wiring.pricePerMeter,
          total: wiring.total,
          isDetailed: true,
          cablePrice: wiring.cablePrice,
          wiringCharge: wiring.wiringCharge,
          wirePricePerMeter: wiring.wirePricePerMeter,
          wiringChargePerMeter: wiring.wiringChargePerMeter,
        });
        totalPrice += wiring.total;
      } else {
        details.push({
          item: `Cable (${wiring.meters} meters)`,
          quantity: wiring.meters,
          price: wiring.pricePerMeter,
          total: wiring.total,
        });
        totalPrice += wiring.total;
      }
    }

    if (calculatedQuotation.accessories && Array.isArray(calculatedQuotation.accessories) && calculatedQuotation.accessories.length > 0) {
      calculatedQuotation.accessories.forEach((accessory: any) => {
        details.push({
          item: accessory.itemName,
          quantity: accessory.quantity,
          price: accessory.rate,
          total: accessory.total,
        });
        totalPrice += accessory.total;
      });
    }

    if (calculatedQuotation.installation) {
      const installation = calculatedQuotation.installation;
      details.push({
        item: `Installation & Setup (${installation.quantity} camera${installation.quantity > 1 ? 's' : ''})`,
        quantity: installation.quantity,
        price: installation.ratePerCamera,
        total: installation.total,
      });
      totalPrice += installation.total;
    }

    return { totalPrice, details };
  }, [calculatedQuotation, formData, territoryCategories]);

  // Auto-save quotation with button action tracking
  const autoSaveQuotation = async (buttonAction: string): Promise<{ success: boolean; quotationId?: string }> => {
    if (!calculatedQuotation || totalPrice === 0) {
      return { success: false };
    }

    if (!session?.user) {
      return { success: false };
    }

    try {
      const selectedBrand = brands.find((b) => b.id === formData.brandId);
      const selectedCategory = categories.find((c) => c.id === formData.cameraTypeId);
      const selectedResolution = territoryCategories.find((t) => t.id === formData.resolutionId);
      const selectedHdd = hddTerritoryCategories.find((h) => h.id === formData.hddId);

      const quotationData = {
        source: "HOME_CALCULATOR",
        brandId: formData.brandId,
        brandName: selectedBrand?.name,
        cameraTypeId: formData.cameraTypeId,
        cameraTypeName: selectedCategory?.name,
        resolutionId: formData.resolutionId,
        resolutionName: selectedResolution?.name,
        indoorCameraCount: parseInt(formData.indoorCameraCount) || 0,
        outdoorCameraCount: parseInt(formData.outdoorCameraCount) || 0,
        wiringMeters: parseFloat(formData.wiringMeters) || 0,
        hddId: formData.hddId,
        hddName: selectedHdd?.name,
        recordingDays: parseInt(formData.recordingDays) || 0,
        totalPrice,
        subtotal: totalPrice,
        tax: 0,
        installationCost: calculatedQuotation.installation?.total || 0,
        wiringCost: calculatedQuotation.wiring?.total || 0,
        hddCost: calculatedQuotation.hddStorage?.total || 0,
        accessoriesCost: calculatedQuotation.accessories?.reduce((sum: number, acc: any) => sum + (acc.total || 0), 0) || 0,
        powerSupplyCost: calculatedQuotation.powerSupply?.total || calculatedQuotation.powerSupply?.price || 0,
        recordingDeviceCost: calculatedQuotation.recordingDevice?.total || calculatedQuotation.recordingDevice?.price || 0,
        calculationDetails: calculatedQuotation,
        selectedProducts: {
          indoorCamera: calculatedQuotation.indoorCamera,
          outdoorCamera: calculatedQuotation.outdoorCamera,
          recordingDevice: calculatedQuotation.recordingDevice,
          hddStorage: calculatedQuotation.hddStorage,
          powerSupply: calculatedQuotation.powerSupply,
          wiring: calculatedQuotation.wiring,
          accessories: calculatedQuotation.accessories,
          installation: calculatedQuotation.installation,
        },
        buttonAction: buttonAction, // Track which button was pressed
      };

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quotationData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.quotation?.quotationNumber) {
          setCurrentQuotationNumber(data.quotation.quotationNumber);
        }
        return { 
          success: true, 
          quotationId: data.quotation?.id 
        };
      }

      return { success: false };
    } catch (error) {
      console.error("Error auto-saving quotation:", error);
      return { success: false };
    }
  };

  // Check login and profile before executing action
  const checkAuthAndProfile = async (action: (quotationId?: string) => void | Promise<void>, buttonAction: string) => {
    // Check if user is logged in
    if (status !== "authenticated" || !session?.user) {
      // Store current URL with hash to calculator section and button action for redirect after login
      const currentUrl = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "") + "#calculator";
      const callbackUrl = `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}&action=${buttonAction}`;
      router.push(callbackUrl);
      return;
    }

    // Check if profile is complete
    if (!isProfileComplete) {
      toast.error("Please complete your profile first (Name, Email, Phone with OTP verification)");
      const currentUrl = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "") + "#calculator";
      const callbackUrl = `/dashboard/profile?callbackUrl=${encodeURIComponent(currentUrl)}&action=${buttonAction}`;
      router.push(callbackUrl);
      return;
    }

    // Auto-save quotation before executing action and get quotation ID
    let quotationId: string | undefined = undefined;
    if (calculatedQuotation && totalPrice > 0) {
      const result = await autoSaveQuotation(buttonAction);
      if (result.success && result.quotationId) {
        quotationId = result.quotationId;
      }
    }

    // Execute the action with quotation ID
    await action(quotationId);
  };

  const handleGetQuote = async () => {
    if (!calculatedQuotation || totalPrice === 0) {
      toast.error("Please calculate a quotation first");
      return;
    }

    await checkAuthAndProfile(async () => {
      setShowQuoteSummary(true);
    }, "SHOW_QUOTATION_SUMMARY");
  };

  const handleBookInstallationWithCheck = async () => {
    await checkAuthAndProfile(handleBookInstallation, "BOOK_INSTALLATION");
  };

  const handleBookInstallation = async (quotationId?: string) => {
    // Redirect to booking page with installation type and quotation ID if available
    const bookingUrl = quotationId 
      ? `/services/book?type=INSTALLATION&quotationId=${quotationId}`
      : `/services/book?type=INSTALLATION`;
    
    router.push(bookingUrl);
  };

  const handleContactSeller = () => {
    // Get phone number from settings or use default
    const phoneNumber = settings?.phone || "+919876543210";
    const cleanNumber = phoneNumber.replace(/[\s\-()]/g, "");
    window.location.href = `tel:${cleanNumber}`;
  };

  const handleShowSuggestedProducts = async () => {
    await checkAuthAndProfile(async () => {
      const params = new URLSearchParams();
      if (formData.brandId) params.append("brandId", formData.brandId);
      if (formData.cameraTypeId) params.append("categoryId", formData.cameraTypeId);
      if (formData.resolutionId) params.append("territoryCategoryId", formData.resolutionId);
      if (formData.indoorCameraCount) params.append("indoorCount", formData.indoorCameraCount);
      if (formData.outdoorCameraCount) params.append("outdoorCount", formData.outdoorCameraCount);
      if (formData.hddId) params.append("hddTerritoryCategoryId", formData.hddId);
      if (formData.recordingDays) params.append("recordingDays", formData.recordingDays);
      if (formData.wiringMeters) params.append("wiringMeters", formData.wiringMeters);
      router.push(`/quotation/suggestions?${params.toString()}`);
    }, "SHOW_SUGGESTED_PRODUCTS");
  };

  // Prepare PDF data and download
  const handleDownloadPDF = useCallback(async () => {
    try {
      const quotationData = await getQuotationData();
      
      // Validate that we have items
      if (!quotationData.items || quotationData.items.length === 0) {
        toast.error("No items found in quotation. Please recalculate.");
        console.error("Quotation data items:", quotationData.items);
        setDownloadTimer(null);
        return;
      }
      
      // Validate total price
      if (!quotationData.totalPrice || quotationData.totalPrice <= 0) {
        toast.error("Invalid quotation total. Please recalculate.");
        setDownloadTimer(null);
        return;
      }
      
      console.log("Generating PDF with data:", {
        itemsCount: quotationData.items.length,
        totalPrice: quotationData.totalPrice,
        quotationNumber: quotationData.quotationNumber,
      });
      
      // Generate and download PDF
      generateQuotationPDF(quotationData);
      
      // Stop timer and show thank you message immediately after download
      setDownloadTimer(null);
      setTimeout(() => {
        setShowThankYou(true);
      }, 300);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error?.message || "Failed to generate PDF. Please try again.");
      setDownloadTimer(null);
    }
  }, [calculatedQuotation, totalPrice, formData, brands, categories, territoryCategories, hddTerritoryCategories, session, userProfile, settings, currentQuotationNumber]);

  // Download timer countdown effect - just for display, doesn't trigger download
  useEffect(() => {
    if (downloadTimer === null || downloadTimer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setDownloadTimer((prev) => {
        if (prev === null || prev <= 0) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [downloadTimer]);

  const handleDownloadQuotation = async () => {
    if (!calculatedQuotation || totalPrice === 0) {
      toast.error("Please calculate a quotation first");
      return;
    }

    // Check if we have items in quotation summary
    if (!quotationSummaryDetails.details || quotationSummaryDetails.details.length === 0) {
      toast.error("No items found in quotation. Please recalculate.");
      return;
    }

    // Start timer for display (30 seconds max)
    const timerDuration = 30; // 30 seconds max display
    setDownloadTimer(timerDuration);
    
    // Start download immediately
    handleDownloadPDF();
    
    // Auto-save quotation in background if user is logged in (optional)
    if (status === "authenticated" && session?.user && isProfileComplete) {
      try {
        await autoSaveQuotation("DOWNLOAD_QUOTATION");
      } catch (error) {
        // Silent fail - don't block download if save fails
        console.error("Failed to auto-save quotation:", error);
      }
    }
  };

  // Generate short code from quotation parameters (base64 encoded)
  const generateShortCode = (): string => {
    if (!calculatedQuotation || totalPrice === 0) return "";
    
    // Create a compact JSON object with all parameters
    const params = {
      b: formData.brandId || "",
      c: formData.cameraTypeId || "",
      r: formData.resolutionId || "",
      i: formData.indoorCameraCount || "0",
      o: formData.outdoorCameraCount || "0",
      h: formData.hddId || "",
      d: formData.recordingDays || "0",
      w: formData.wiringMeters || "0",
      p: totalPrice.toString(),
    };

    // Convert to JSON string and encode to base64
    const jsonString = JSON.stringify(params);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    
    // Remove padding and special characters, make URL-safe
    const shortCode = base64.replace(/[+/=]/g, (match) => {
      if (match === "+") return "-";
      if (match === "/") return "_";
      return "";
    }).substring(0, 16);
    
    return shortCode;
  };

  // Generate shareable PDF download link (short version)
  const generatePDFDownloadLink = () => {
    if (!calculatedQuotation || totalPrice === 0) return "";
    
    const shortCode = generateShortCode();
    if (!shortCode) return "";
    
    const baseUrl = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/q/${shortCode}`;
  };

  // Generate short PDF download text with clickable link
  const generatePDFDownloadText = () => {
    const pdfLink = generatePDFDownloadLink();
    if (!pdfLink) return "";
    return `📄 Click here to download detailed quotation: ${pdfLink}`;
  };

  // Generate quotation data for PDF
  // Helper function to convert image URL to base64
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!url) {
        reject(new Error('No URL provided'));
        return;
      }
      
      // If already base64, return as is
      if (url.startsWith('data:image')) {
        resolve(url);
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        img.src = (typeof window !== "undefined" ? window.location.origin : "") + url;
      } else {
        img.src = url;
      }
    });
  };

  const getQuotationData = async () => {
    const selectedBrand = brands.find((b) => b.id === formData.brandId);
    const selectedCategory = categories.find((c) => c.id === formData.cameraTypeId);
    const selectedResolution = territoryCategories.find((t) => t.id === formData.resolutionId);
    const selectedHdd = hddTerritoryCategories.find((h) => h.id === formData.hddId);
    const indoorCount = parseInt(formData.indoorCameraCount) || 0;
    const outdoorCount = parseInt(formData.outdoorCameraCount) || 0;

    // Convert logo to base64 if available
    let logoBase64 = null;
    if (settings?.logo) {
      try {
        console.log("Converting logo to base64:", settings.logo.substring(0, 50));
        logoBase64 = await imageToBase64(settings.logo);
        console.log("Logo converted successfully, length:", logoBase64?.length);
      } catch (error) {
        console.error("Failed to convert logo to base64:", error);
        console.error("Logo URL:", settings.logo);
        // Continue without logo
      }
    } else {
      console.log("No logo found in settings");
    }

    // Fetch settings for company info
    let companyInfo = {
      companyName: settings?.siteName || "D.G.Yard",
      companyTagline: settings?.siteTagline || null,
      companyLogo: logoBase64, // Use base64 version
      companyWebsite: typeof window !== "undefined" ? window.location.origin : "",
      companyEmail: settings?.email || null,
      companyPhone: settings?.phone || null,
      companyAddress: settings?.address || null,
      companyCity: settings?.city || null,
      companyState: settings?.state || null,
      companyPincode: settings?.pincode || null,
      companyCountry: settings?.country || "India",
    };

    // Fetch user address if available
    let customerAddress = "";
    if (session?.user?.id) {
      try {
        const addressesResponse = await fetch("/api/addresses");
        if (addressesResponse.ok) {
          const addressesData = await addressesResponse.json();
          const defaultAddress = addressesData.addresses?.find((addr: any) => addr.isDefault) || addressesData.addresses?.[0];
          if (defaultAddress) {
            customerAddress = [
              defaultAddress.addressLine1,
              defaultAddress.addressLine2,
              defaultAddress.city,
              defaultAddress.state,
              defaultAddress.pincode,
              defaultAddress.country,
            ].filter(Boolean).join(", ");
          }
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    }

    // Use stored quotation number or fetch if not available
    let quotationNumber = currentQuotationNumber;
    if (!quotationNumber) {
      try {
        const quotationsResponse = await fetch("/api/quotations");
        if (quotationsResponse.ok) {
          const quotationsData = await quotationsResponse.json();
          // Find the most recent quotation matching current form data
          const matchingQuotation = quotationsData.quotations?.find((q: any) => 
            q.brandId === formData.brandId &&
            q.cameraTypeId === formData.cameraTypeId &&
            q.resolutionId === formData.resolutionId
          );
          if (matchingQuotation?.quotationNumber) {
            quotationNumber = matchingQuotation.quotationNumber;
            setCurrentQuotationNumber(quotationNumber);
          }
        }
      } catch (error) {
        console.error("Error fetching quotation number:", error);
      }
    }

    return {
      quotationNumber,
      brandName: selectedBrand?.name,
      cameraTypeName: selectedCategory?.name,
      resolutionName: selectedResolution?.name,
      indoorCameraCount: indoorCount,
      outdoorCameraCount: outdoorCount,
      wiringMeters: parseFloat(formData.wiringMeters) || 0,
      hddName: selectedHdd?.name,
      recordingDays: parseInt(formData.recordingDays) || 0,
      items: quotationSummaryDetails.details.filter((detail: any) => detail && detail.item && detail.item.trim() !== ''),
      totalPrice: totalPrice,
      // Company Info
      ...companyInfo,
      // Customer Info
      customerName: userProfile?.name || session?.user?.name || null,
      customerEmail: userProfile?.email || session?.user?.email || null,
      customerPhone: userProfile?.phone || null,
      customerAddress: customerAddress || null,
    };
  };

  // Generate quotation text for sharing
  const generateQuotationText = (includePdfLink: boolean = false) => {
    if (!calculatedQuotation || totalPrice === 0) return "";
    
    const selectedBrand = brands.find((b) => b.id === formData.brandId);
    const selectedCategory = categories.find((c) => c.id === formData.cameraTypeId);
    const selectedResolution = territoryCategories.find((t) => t.id === formData.resolutionId);
    const indoorCount = parseInt(formData.indoorCameraCount) || 0;
    const outdoorCount = parseInt(formData.outdoorCameraCount) || 0;
    
    let text = `📹 CCTV System Quotation - D.G.Yard\n\n`;
    text += `Brand: ${selectedBrand?.name || 'N/A'}\n`;
    text += `Camera Type: ${selectedCategory?.name || 'N/A'}\n`;
    text += `Resolution: ${selectedResolution?.name || 'N/A'}\n`;
    text += `Indoor Cameras: ${indoorCount}\n`;
    text += `Outdoor Cameras: ${outdoorCount}\n\n`;
    
    if (quotationSummaryDetails.details && quotationSummaryDetails.details.length > 0) {
      text += `Items:\n`;
      quotationSummaryDetails.details.forEach((item: any) => {
        text += `• ${item.item} - ${formatPrice(item.total)}\n`;
      });
      text += `\n`;
    }
    
    text += `Total Price: ${formatPrice(totalPrice)}\n\n`;
    
    if (includePdfLink) {
      const pdfLinkText = generatePDFDownloadText();
      if (pdfLinkText) {
        text += `${pdfLinkText}\n\n`;
      }
    }
    
    const baseUrl = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_APP_URL || '';
    text += `Visit D.G.Yard for more details: ${baseUrl}/quotation`;
    
    return text;
  };

  // Share handlers
  const handleShareViaEmail = async () => {
    await checkAuthAndProfile(async () => {
      try {
        // Generate PDF blob for attachment
        const quotationData = await getQuotationData();
        const pdfDataUrl = await generateQuotationPDFBlob(quotationData);
        
        const subject = encodeURIComponent("CCTV System Quotation - D.G.Yard");
        const text = generateQuotationText(true);
        const body = encodeURIComponent(text);
        
        // Create mailto link with PDF data URL (some email clients support this)
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowShareDropdown(false);
        setShowShareDropdownInSummary(false);
        toast.success("Email client opened! PDF download link included.");
      } catch (error) {
        console.error("Error generating PDF for email:", error);
        // Fallback to text only
        const subject = encodeURIComponent("CCTV System Quotation - D.G.Yard");
        const body = encodeURIComponent(generateQuotationText(true));
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowShareDropdown(false);
        setShowShareDropdownInSummary(false);
        toast.success("Email client opened!");
      }
    }, "SHARE_EMAIL");
  };

  // Helper function to clean phone number for WhatsApp
  const cleanPhoneNumber = (number: string): string => {
    let cleanNumber = number.replace(/[\s\-()]/g, "");
    if (!cleanNumber.startsWith("+")) {
      cleanNumber = cleanNumber.replace(/^0+/, "");
      if (!cleanNumber.startsWith("91") && cleanNumber.length === 10) {
        cleanNumber = "91" + cleanNumber;
      }
    } else {
      cleanNumber = cleanNumber.substring(1);
    }
    return cleanNumber;
  };

  const handleShareViaWhatsApp = async () => {
    await checkAuthAndProfile(async () => {
      const text = encodeURIComponent(generateQuotationText(true));
      
      // Open WhatsApp without number - WhatsApp will show native number selection
      // User can select which number/contact to send to
      window.open(`https://wa.me/?text=${text}`, '_blank');
      setShowShareDropdown(false);
      setShowShareDropdownInSummary(false);
      toast.success("Opening WhatsApp... Select number to share!");
    }, "SHARE_WHATSAPP");
  };

  const handleShareViaWhatsAppBusiness = async () => {
    await checkAuthAndProfile(async () => {
      const text = encodeURIComponent(generateQuotationText(true));
      
      // Open WhatsApp without number - WhatsApp will show native number selection
      // User can select which number/contact to send to
      window.open(`https://wa.me/?text=${text}`, '_blank');
      setShowShareDropdown(false);
      setShowShareDropdownInSummary(false);
      toast.success("Opening WhatsApp Business... Select number to share!");
    }, "SHARE_WHATSAPP_BUSINESS");
  };

  const handleShareViaTelegram = async () => {
    await checkAuthAndProfile(async () => {
      const text = encodeURIComponent(generateQuotationText(true));
      const pdfLink = generatePDFDownloadLink();
      // Use PDF download link as URL, text already contains "Click here to download" message
      const shareUrl = pdfLink || window.location.href;
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
      setShowShareDropdown(false);
      setShowShareDropdownInSummary(false);
      toast.success("Opening Telegram... PDF download link included!");
    }, "SHARE_TELEGRAM");
  };

  const handleShareViaSMS = async () => {
    await checkAuthAndProfile(async () => {
      const text = generateQuotationText(true);
      const phoneNumber = settings?.phone || "+919876543210";
      const cleanNumber = phoneNumber.replace(/[\s\-()]/g, "");
      window.location.href = `sms:${cleanNumber}?body=${encodeURIComponent(text)}`;
      setShowShareDropdown(false);
      setShowShareDropdownInSummary(false);
      toast.success("Opening SMS... PDF download link included!");
    }, "SHARE_SMS");
  };

  const handleShareViaCopy = async () => {
    await checkAuthAndProfile(async () => {
      try {
        const text = generateQuotationText(true);
        await navigator.clipboard.writeText(text);
        setShowShareDropdown(false);
        setShowShareDropdownInSummary(false);
        toast.success("Quotation with PDF download link copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast.error("Failed to copy. Please try again.");
      }
    }, "SHARE_COPY");
  };

  const handleNativeShare = async () => {
    await checkAuthAndProfile(async () => {
      if (navigator.share) {
        try {
          // Try to share PDF file if Web Share API supports files
          const quotationData = await getQuotationData();
          const pdfDataUrl = await generateQuotationPDFBlob(quotationData);
          
          // Convert data URL to blob
          const response = await fetch(pdfDataUrl);
          const blob = await response.blob();
          const file = new File([blob], `quotation-dgyard-${new Date().toISOString().split("T")[0]}.pdf`, { type: "application/pdf" });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "CCTV System Quotation - D.G.Yard",
              text: generateQuotationText(true),
              files: [file],
              url: window.location.href,
            });
          } else {
            // Fallback to sharing text and URL
            const pdfLink = generatePDFDownloadLink();
            await navigator.share({
              title: "CCTV System Quotation - D.G.Yard",
              text: generateQuotationText(true),
              url: pdfLink || window.location.href,
            });
          }
          setShowShareDropdown(false);
          setShowShareDropdownInSummary(false);
          toast.success("Sharing...");
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error("Error sharing:", error);
            // Fallback to text only
            try {
              const pdfLink = generatePDFDownloadLink();
              await navigator.share({
                title: "CCTV System Quotation - D.G.Yard",
                text: generateQuotationText(true),
                url: pdfLink || window.location.href,
              });
              setShowShareDropdown(false);
              setShowShareDropdownInSummary(false);
              toast.success("Sharing...");
            } catch (fallbackError: any) {
              if (fallbackError.name !== 'AbortError') {
                toast.error("Sharing failed");
              }
            }
          }
        }
      } else {
        // Fallback to copy
        handleShareViaCopy();
      }
    }, "SHARE_NATIVE");
  };

  const handleSaveQuotation = async () => {
    if (!session?.user) {
      toast.error("Please login to save quotations");
      router.push("/auth/signin");
      return;
    }

    if (!calculatedQuotation || totalPrice === 0) {
      toast.error("Please calculate a quotation first");
      return;
    }

    setSaving(true);
    try {
      // Get brand and category names
      const selectedBrand = brands.find((b) => b.id === formData.brandId);
      const selectedCategory = categories.find((c) => c.id === formData.cameraTypeId);
      const selectedResolution = territoryCategories.find((t) => t.id === formData.resolutionId);
      const selectedHdd = hddTerritoryCategories.find((h) => h.id === formData.hddId);

      const quotationData = {
        source: "HOME_CALCULATOR",
        brandId: formData.brandId,
        brandName: selectedBrand?.name,
        cameraTypeId: formData.cameraTypeId,
        cameraTypeName: selectedCategory?.name,
        resolutionId: formData.resolutionId,
        resolutionName: selectedResolution?.name,
        indoorCameraCount: parseInt(formData.indoorCameraCount) || 0,
        outdoorCameraCount: parseInt(formData.outdoorCameraCount) || 0,
        wiringMeters: parseFloat(formData.wiringMeters) || 0,
        hddId: formData.hddId,
        hddName: selectedHdd?.name,
        recordingDays: parseInt(formData.recordingDays) || 0,
        totalPrice,
        subtotal: totalPrice,
        tax: 0,
        installationCost: calculatedQuotation.installation?.total || 0,
        wiringCost: calculatedQuotation.wiring?.total || 0,
        hddCost: calculatedQuotation.hddStorage?.total || 0,
        accessoriesCost: calculatedQuotation.accessories?.reduce((sum: number, acc: any) => sum + (acc.total || 0), 0) || 0,
        powerSupplyCost: calculatedQuotation.powerSupply?.total || calculatedQuotation.powerSupply?.price || 0,
        recordingDeviceCost: calculatedQuotation.recordingDevice?.total || calculatedQuotation.recordingDevice?.price || 0,
        calculationDetails: calculatedQuotation,
        selectedProducts: {
          indoorCamera: calculatedQuotation.indoorCamera,
          outdoorCamera: calculatedQuotation.outdoorCamera,
          recordingDevice: calculatedQuotation.recordingDevice,
          hddStorage: calculatedQuotation.hddStorage,
          powerSupply: calculatedQuotation.powerSupply,
          wiring: calculatedQuotation.wiring,
          accessories: calculatedQuotation.accessories,
          installation: calculatedQuotation.installation,
        },
      };

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quotationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save quotation");
      }

      const data = await response.json();
      setQuotationSaved(true);
      setShowSavePopup(true);
    } catch (error: any) {
      console.error("Error saving quotation:", error);
      toast.error(error.message || "Failed to save quotation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center font-serif text-gray-600">Loading calculator...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="calculator" ref={ref} className="py-12 md:py-16 bg-gray-50 relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.01]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Classical */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-full mb-4 border border-gray-300"
          >
            <CalcIcon className="w-6 h-6 md:w-7 md:h-7 text-gray-700" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
            Calculate Your CCTV System Price
          </h2>
          <div className="w-16 h-0.5 bg-gray-300 mx-auto mb-3"></div>
          <p className="text-sm md:text-base text-gray-600 font-serif max-w-2xl mx-auto">
            Get an instant estimate for your custom CCTV setup
          </p>
        </motion.div>

        {/* AI Helper - At Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-6xl mx-auto mb-6"
        >
          <InlineAIHelper
            context="using the price calculator"
            suggestions={[
              "How many cameras do I need?",
              "What camera type is best for me?",
              "How much storage should I get?",
              "What resolution should I choose?",
            ]}
            position="top"
          />
        </motion.div>

        {/* Guidance Notification - Sticky (Below AI Helper) */}
        {showGuidance && stepInfo && (
          <div className="sticky top-24 sm:top-28 md:top-24 z-50 max-w-6xl mx-auto mb-6">
          <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              key={stepInfo.currentStep}
              className={`${stepInfo.bgColor} backdrop-blur-md border-2 ${stepInfo.borderColor} rounded-xl p-4 md:p-5 shadow-lg`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 ${stepInfo.iconBg} rounded-lg flex-shrink-0`}>
                  {stepInfo.icon && <stepInfo.icon className={`w-5 h-5 ${stepInfo.iconColor}`} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-serif font-bold ${stepInfo.textColor}`}>
                      Step {stepInfo.currentStep} of {stepInfo.totalSteps}
                    </span>
                    <span className={`text-xs font-serif ${stepInfo.textColor} opacity-70`}>
                      ({stepInfo.remainingSteps} {stepInfo.remainingSteps === 1 ? 'step' : 'steps'} remaining)
                    </span>
                  </div>
                  <p className={`text-sm md:text-base font-serif font-semibold ${stepInfo.textColor}`}>
                    {stepInfo.message}
                  </p>
                </div>
                <button
                  onClick={() => setShowGuidance(false)}
                  className={`p-1 ${stepInfo.hoverColor} rounded-lg transition-colors flex-shrink-0`}
                >
                  <X className={`w-4 h-4 ${stepInfo.closeColor}`} />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Calculator Card - Classical Design - Wider & Attractive */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl border-2 border-gray-300 p-8 md:p-10 relative overflow-hidden"
        >
          {/* Glow Effect on Shadow Background */}
          <motion.div
            className="absolute -inset-1 rounded-2xl -z-10"
            animate={{
              opacity: [0.4, 0.6, 0.4],
              boxShadow: [
                '0 0 40px 15px rgba(0, 0, 0, 0.2)',
                '0 0 60px 25px rgba(0, 0, 0, 0.25)',
                '0 0 40px 15px rgba(0, 0, 0, 0.2)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              filter: 'blur(15px)',
            }}
          />
          
          <div className="relative z-10 space-y-6 md:space-y-8">

            {/* Brand Selection - Classical & Attractive */}
            <div className="bg-gray-50/50 rounded-xl p-4 md:p-6 border border-gray-200">
              <Label className="text-base md:text-lg font-serif font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                </div>
                Select Brand *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {brands.slice(0, 8).map((brand) => (
                  <motion.button
                    key={brand.id}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHoveredBrandId(brand.id)}
                    onMouseLeave={() => setHoveredBrandId(null)}
                    onClick={() => {
                      setFormData({ ...formData, brandId: brand.id });
                      toast.success(`${brand.name} selected!`, { duration: 1000 });
                    }}
                    className={`p-4 md:p-5 rounded-xl border-2 transition-all relative overflow-hidden font-serif shadow-sm hover:shadow-md ${
                      formData.brandId === brand.id
                        ? "border-green-300 bg-green-100/80 text-green-800 shadow-lg ring-2 ring-green-200"
                        : "border-gray-300 hover:border-gray-600 bg-white text-gray-900"
                    }`}
                  >
                    {formData.brandId === brand.id && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center z-10 shadow-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                      </motion.div>
                    )}
                    {/* Hover Glow Effect */}
                    {formData.brandId === brand.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                    {brand.logo ? (
                      <div className="relative w-full h-10 md:h-12 mb-2">
                        <Image 
                          src={brand.logo} 
                          alt={brand.name} 
                          fill 
                          className={`object-contain transition-all ${
                            formData.brandId === brand.id 
                              ? "grayscale-0 brightness-100 contrast-100" 
                              : hoveredBrandId === brand.id
                              ? "grayscale-0 brightness-100 contrast-100"
                              : "grayscale brightness-50 contrast-150"
                          }`}
                        />
                      </div>
                    ) : (
                      <div className={`w-full h-10 md:h-12 mb-2 rounded flex items-center justify-center transition-all ${
                        formData.brandId === brand.id 
                          ? "bg-green-100/80" 
                          : "bg-gray-100"
                      }`}>
                        <Tag className={`w-4 h-4 md:w-5 md:h-5 ${
                          formData.brandId === brand.id 
                            ? "text-white" 
                            : "text-gray-400"
                        }`} />
                      </div>
                    )}
                    <p className="text-xs font-semibold text-center">{brand.name}</p>
                  </motion.button>
                  ))}
                </div>
              </div>

            {/* Camera Type - Classical & Attractive */}
            <div className="bg-gray-50/50 rounded-xl p-4 md:p-6 border border-gray-200">
              <Label className="text-base md:text-lg font-serif font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Camera className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                </div>
                Camera Type *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {categories.slice(0, 6).map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFormData({ ...formData, cameraTypeId: category.id });
                      toast.success(`${category.name} selected!`, { duration: 1000 });
                    }}
                    className={`p-4 md:p-5 rounded-xl border-2 transition-all font-serif shadow-sm hover:shadow-md relative overflow-hidden ${
                      formData.cameraTypeId === category.id
                        ? "border-green-300 bg-green-100/80 text-green-800 shadow-lg ring-2 ring-green-200"
                        : "border-gray-300 hover:border-gray-600 bg-white text-gray-900"
                    }`}
                  >
                    {formData.cameraTypeId === category.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                    <div className="font-semibold text-sm md:text-base relative z-10">{category.name}</div>
                  </motion.button>
                  ))}
                </div>
              </div>

            {/* Resolution - Classical & Attractive */}
            <div className="bg-gray-50/50 rounded-xl p-4 md:p-6 border border-gray-200">
              <Label className="text-base md:text-lg font-serif font-bold text-gray-900 mb-4">
                Resolution *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {territoryCategories.slice(0, 8).map((tc) => (
                  <motion.button
                    key={tc.id}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFormData({ ...formData, resolutionId: tc.id });
                      toast.success(`${tc.name} selected!`, { duration: 1000 });
                    }}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all font-serif shadow-sm hover:shadow-md relative overflow-hidden ${
                      formData.resolutionId === tc.id
                        ? "border-green-300 bg-green-100/80 text-green-800 shadow-lg ring-2 ring-green-200"
                        : "border-gray-300 hover:border-gray-600 bg-white text-gray-900"
                    }`}
                  >
                    {formData.resolutionId === tc.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                    <div className="font-semibold text-xs md:text-sm relative z-10">{tc.name}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Camera Counts & Wiring - Classical & Attractive */}
            <div className="bg-gray-50/50 rounded-xl p-4 md:p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <Label htmlFor="indoor" className="text-sm md:text-base font-serif font-bold text-gray-900 mb-3 block">
                    Indoor Cameras
                  </Label>
                  <Input
                    id="indoor"
                    type="number"
                    min="0"
                    value={formData.indoorCameraCount}
                    onChange={(e) => setFormData({ ...formData, indoorCameraCount: e.target.value })}
                    onBlur={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    className="font-serif border-2 border-gray-300 focus:border-gray-900 rounded-lg h-12 text-base"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="outdoor" className="text-sm md:text-base font-serif font-bold text-gray-900 mb-3 block">
                    Outdoor Cameras
                  </Label>
                  <Input
                    id="outdoor"
                    type="number"
                    min="0"
                    value={formData.outdoorCameraCount}
                    onChange={(e) => setFormData({ ...formData, outdoorCameraCount: e.target.value })}
                    onBlur={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    className="font-serif border-2 border-gray-300 focus:border-gray-900 rounded-lg h-12 text-base"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="wiring" className="text-sm md:text-base font-serif font-bold text-gray-900 mb-3 block">
                    Wiring (meters)
                  </Label>
                  <Input
                    id="wiring"
                    type="number"
                    min="0"
                    value={formData.wiringMeters}
                    onChange={(e) => setFormData({ ...formData, wiringMeters: e.target.value })}
                    onBlur={(e) => e.target.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    className="font-serif border-2 border-gray-300 focus:border-gray-900 rounded-lg h-12 text-base"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* HDD Storage - Classical & Attractive */}
            <div className="bg-gray-50/50 rounded-xl p-4 md:p-6 border border-gray-200">
              <Label className="text-base md:text-lg font-serif font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <HardDrive className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                </div>
                Storage (HDD)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                {hddTerritoryCategories.slice(0, 8).map((hdd) => (
                  <motion.button
                    key={hdd.id}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFormData({ ...formData, hddId: hdd.id, recordingDays: "" });
                    }}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all font-serif shadow-sm hover:shadow-md relative overflow-hidden ${
                      formData.hddId === hdd.id
                        ? "border-green-300 bg-green-100/80 text-green-800 shadow-lg ring-2 ring-green-200"
                        : "border-gray-300 hover:border-gray-600 bg-white text-gray-900"
                    }`}
                  >
                    {formData.hddId === hdd.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                    <div className="font-semibold text-xs md:text-sm relative z-10">{hdd.name}</div>
                  </motion.button>
                ))}
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                <Label htmlFor="recordingDays" className="text-sm md:text-base font-serif font-semibold text-gray-900 mb-2 block">
                  Or Enter Recording Days (to calculate required HDD)
                </Label>
                <Input
                  id="recordingDays"
                  type="number"
                  min="0"
                  value={formData.recordingDays}
                  onChange={(e) => {
                    setFormData({ ...formData, recordingDays: e.target.value, hddId: "" });
                  }}
                  onBlur={(e) => e.target.blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                  className="font-serif border-2 border-gray-300 focus:border-gray-900 rounded-lg h-12 text-base"
                  placeholder="e.g., 30 days"
                />
              </div>
                  </div>

            {/* Total Price - Classical & Attractive */}
            <div className="border-t-2 border-gray-300 pt-6 md:pt-8 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Estimated Total</h3>
                  <p className="text-sm md:text-base text-gray-600 font-serif mt-2">
                    {calculating ? "Calculating..." : "Including all components & installation"}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  {calculating ? (
                    <div className="flex items-center gap-2 text-gray-600 font-serif">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-base">Calculating...</span>
                    </div>
                  ) : calculatedQuotation && totalPrice > 0 ? (
                    <button
                      onClick={handleSaveQuotation}
                      disabled={saving || !session?.user}
                      className={`w-full bg-green-100/80 backdrop-blur-sm border-2 border-green-200/60 rounded-xl p-4 md:p-6 shadow-xl transition-all ${
                        session?.user && !quotationSaved
                          ? "hover:bg-green-200/90 hover:shadow-2xl cursor-pointer hover:scale-105"
                          : "cursor-default"
                      } ${saving ? "opacity-50 cursor-not-allowed" : ""} ${quotationSaved ? "bg-blue-100/80 border-blue-200/60" : ""}`}
                    >
                      <div className="text-3xl md:text-5xl font-serif font-bold text-green-800">
                        {quotationSaved ? formatPriceActual(totalPrice) : formatPriceXXX(totalPrice)}
                      </div>
                      <div className="text-sm md:text-base text-green-700 font-serif mt-2 flex items-center justify-center gap-2">
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : quotationSaved ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Price visible</span>
                          </>
                        ) : session?.user ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>Click to save and view</span>
                          </>
                        ) : (
                          "Login to see price"
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="text-lg md:text-xl font-serif text-gray-500 bg-gray-100 rounded-lg p-4">
                      Select options to see price
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Classic & Elegant Design */}
              {calculatedQuotation && totalPrice > 0 && (
                <div className="border-t-2 border-gray-200 pt-6 md:pt-8 mt-6 md:mt-8">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-4 md:mb-6 text-center">
                    What would you like to do next?
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                    {/* Contact Seller */}
                    <motion.button
                      onClick={handleContactSeller}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:from-blue-100 hover:to-blue-200/50"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-200/60 group-hover:bg-blue-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Phone className="w-4 h-4 md:w-6 md:h-6 text-blue-700 group-hover:text-blue-900" />
                        </div>
                        <span className="font-serif font-semibold text-blue-900 text-xs md:text-base group-hover:text-blue-950 leading-tight">
                          Contact Seller
                        </span>
                      </div>
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    {/* Book Installation */}
                    <motion.button
                      onClick={handleBookInstallation}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-purple-300 hover:from-purple-100 hover:to-purple-200/50"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-200/60 group-hover:bg-purple-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Calendar className="w-4 h-4 md:w-6 md:h-6 text-purple-700 group-hover:text-purple-900" />
                        </div>
                        <span className="font-serif font-semibold text-purple-900 text-xs md:text-base group-hover:text-purple-950 leading-tight">
                          Book Installation
                        </span>
                      </div>
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    {/* Show Suggested Products */}
                    <motion.button
                      onClick={handleShowSuggestedProducts}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-amber-300 hover:from-amber-100 hover:to-amber-200/50"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-200/60 group-hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-amber-700 group-hover:text-amber-900" />
                        </div>
                        <span className="font-serif font-semibold text-amber-900 text-xs md:text-base group-hover:text-amber-950 leading-tight">
                          Show Suggestions
                        </span>
                      </div>
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    {/* Download Quotation */}
                    <motion.button
                      onClick={handleDownloadQuotation}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-emerald-300 hover:from-emerald-100 hover:to-emerald-200/50"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-emerald-200/60 group-hover:bg-emerald-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Download className="w-4 h-4 md:w-6 md:h-6 text-emerald-700 group-hover:text-emerald-900" />
                        </div>
                        <span className="font-serif font-semibold text-emerald-900 text-xs md:text-base group-hover:text-emerald-950 leading-tight">
                          Download Quotation
                        </span>
                      </div>
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    {/* Share Button with Dropdown */}
                    <div className="relative">
                      <motion.button
                        onClick={() => setShowShareDropdown(!showShareDropdown)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative bg-gradient-to-br from-rose-50 to-rose-100/50 border-2 border-rose-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-rose-300 hover:from-rose-100 hover:to-rose-200/50 w-full"
                      >
                        <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                          <div className="w-8 h-8 md:w-12 md:h-12 bg-rose-200/60 group-hover:bg-rose-300 rounded-full flex items-center justify-center transition-colors duration-300">
                            <Share2 className="w-4 h-4 md:w-6 md:h-6 text-rose-700 group-hover:text-rose-900" />
                          </div>
                          <span className="font-serif font-semibold text-rose-900 text-xs md:text-base group-hover:text-rose-950 leading-tight">
                            Share
                          </span>
                        </div>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.button>

                      {/* Share Dropdown Menu */}
                      <AnimatePresence>
                        {showShareDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden"
                          >
                            <div className="p-2">
                              <button
                                onClick={handleShareViaEmail}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">Email</div>
                                  <div className="text-xs text-gray-500">Share via email</div>
                                </div>
                              </button>

                              <button
                                onClick={handleShareViaWhatsApp}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <MessageCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">WhatsApp</div>
                                  <div className="text-xs text-gray-500">Share on WhatsApp</div>
                                </div>
                              </button>

                              <button
                                onClick={handleShareViaWhatsAppBusiness}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <MessageCircle className="w-5 h-5 text-green-700" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">WhatsApp Business</div>
                                  <div className="text-xs text-gray-500">Share on WhatsApp Business</div>
                                </div>
                              </button>

                              <button
                                onClick={handleShareViaTelegram}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Send className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">Telegram</div>
                                  <div className="text-xs text-gray-500">Share on Telegram</div>
                                </div>
                              </button>

                              <button
                                onClick={handleShareViaSMS}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <Phone className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">SMS</div>
                                  <div className="text-xs text-gray-500">Share via SMS</div>
                                </div>
                              </button>

                              <div className="border-t border-gray-200 my-1"></div>

                              <button
                                onClick={handleNativeShare}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                                  <Share2 className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">More Options</div>
                                  <div className="text-xs text-gray-500">Share via native share</div>
                                </div>
                              </button>

                              <button
                                onClick={handleShareViaCopy}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">Copy Link</div>
                                  <div className="text-xs text-gray-500">Copy quotation text</div>
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Show Quotation Summary */}
                    <motion.button
                      onClick={handleGetQuote}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-green-300 hover:from-green-100 hover:to-green-200/50"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-green-200/60 group-hover:bg-green-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-green-700 group-hover:text-green-900" />
                        </div>
                        <span className="font-serif font-semibold text-green-900 text-xs md:text-base group-hover:text-green-950 leading-tight">
                          Show Quotation Summary
                        </span>
                      </div>
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </motion.div>
      </div>

      {/* Save Quotation Popup */}
      <AnimatePresence>
        {showSavePopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-gray-200"
            >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                Quotation Saved!
              </h3>
              <p className="text-gray-600 mb-6">
                Your quotation has been saved successfully. You can view it in your dashboard.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowSavePopup(false);
                    router.push("/dashboard/quotations");
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  View Quotations
                </Button>
                <Button
                  onClick={() => setShowSavePopup(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      {/* Quotation Summary Popup */}
      <AnimatePresence>
        {showQuoteSummary && calculatedQuotation && totalPrice > 0 && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 max-w-6xl w-full shadow-2xl border-2 border-gray-200/50 my-8 relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900">Quotation Summary</h3>
                </div>
                <button
                  onClick={() => setShowQuoteSummary(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Selected Options */}
              <div className="space-y-3 mb-6">
                {brands.find((b) => b.id === formData.brandId) && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Brand</p>
                    <p className="font-semibold text-gray-900">{brands.find((b) => b.id === formData.brandId)?.name}</p>
                  </div>
                )}
                {categories.find((c) => c.id === formData.cameraTypeId) && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Camera Type</p>
                    <p className="font-semibold text-gray-900">{categories.find((c) => c.id === formData.cameraTypeId)?.name}</p>
                  </div>
                )}
                {territoryCategories.find((t) => t.id === formData.resolutionId) && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Resolution</p>
                    <p className="font-semibold text-gray-900">{territoryCategories.find((t) => t.id === formData.resolutionId)?.name}</p>
                  </div>
                )}
              </div>

              {/* Price Details */}
              {quotationSummaryDetails.details.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="space-y-2 mb-4 max-h-96 overflow-y-auto pr-2">
                    {quotationSummaryDetails.details
                      .filter((detail) => detail && detail.item && detail.item.trim() !== '')
                      .map((detail, index) => (
                        <motion.div
                          key={`detail-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="text-sm p-3 rounded-lg hover:bg-gray-50/80 border border-gray-100 backdrop-blur-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium text-xs mb-1">{detail.item}</p>
                              {detail.isDetailed && detail.cablePrice !== undefined && detail.wiringCharge !== undefined ? (
                                <div className="mt-1 space-y-1">
                                  <p className="text-xs text-gray-500">
                                    Cable: {formatPriceActual(detail.wirePricePerMeter)} × {detail.quantity}m = {formatPriceActual(detail.cablePrice)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Wiring: {formatPriceActual(detail.wiringChargePerMeter)} × {detail.quantity}m = {formatPriceActual(detail.wiringCharge)}
                                  </p>
                                </div>
                              ) : detail.hasCalculation && detail.calculationType === "hdd_selected" && detail.estimatedDaysDisplay ? (
                                <p className="text-xs text-gray-500 mt-1">
                                  Approx. Recording: {detail.estimatedDaysDisplay} with {detail.totalCameras} × {detail.resolutionMP} cameras
                                </p>
                              ) : detail.hasCalculation && detail.calculationType === "days_entered" && detail.estimatedDaysDisplay ? (
                                <div className="mt-1">
                                  <p className="text-xs text-gray-500">
                                    Recording Days: {detail.estimatedDaysDisplay} with {detail.totalCameras} × {detail.resolutionMP} cameras
                                  </p>
                                  {detail.requiredHDDGB && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Required Storage: {detail.requiredHDDGB} GB
                                    </p>
                                  )}
                                  {detail.suggestedHDDGB && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Suggested Storage: {detail.suggestedHDDGB} GB
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  {detail.quantity} × {formatPriceActual(detail.price)} = {formatPriceActual(detail.total)}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm font-semibold text-gray-900">{formatPriceActual(detail.total)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {/* Total Price */}
              <div className="border-t-2 border-gray-300 pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-serif font-bold text-gray-900">Total Price</span>
                  <span className="text-2xl md:text-3xl font-serif font-bold text-green-600">
                    {formatPriceActual(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Button
                    onClick={handleContactSeller}
                    variant="outline"
                    className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Seller
                  </Button>
                  <Button
                    onClick={handleBookInstallationWithCheck}
                    variant="outline"
                    className="border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white transition-all"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Installation
                  </Button>
                  <Button
                    onClick={() => {
                      setShowQuoteSummary(false);
                      handleShowSuggestedProducts();
                    }}
                    variant="outline"
                    className="border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Show Suggestions
                  </Button>
                  <Button
                    onClick={handleDownloadQuotation}
                    variant="outline"
                    className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Quotation
                  </Button>
                  {/* Share Button with Dropdown */}
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Button
                      onClick={() => setShowShareDropdownInSummary(!showShareDropdownInSummary)}
                      variant="outline"
                      className="border-2 border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white transition-all w-full"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Quotation
                    </Button>

                    {/* Share Dropdown Menu */}
                    <AnimatePresence>
                      {showShareDropdownInSummary && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden"
                        >
                          <div className="p-2">
                            <button
                              onClick={() => {
                                handleShareViaEmail();
                                setShowShareDropdownInSummary(false);
                                setShowQuoteSummary(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">Email</div>
                                <div className="text-xs text-gray-500">Share via email</div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleShareViaWhatsApp();
                                setShowShareDropdownInSummary(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">WhatsApp</div>
                                <div className="text-xs text-gray-500">Share on WhatsApp</div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleShareViaWhatsAppBusiness();
                                setShowShareDropdownInSummary(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-green-700" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">WhatsApp Business</div>
                                <div className="text-xs text-gray-500">Share on WhatsApp Business</div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleShareViaTelegram();
                                setShowShareDropdownInSummary(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Send className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">Telegram</div>
                                <div className="text-xs text-gray-500">Share on Telegram</div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleShareViaSMS();
                                setShowShareDropdownInSummary(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Phone className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">SMS</div>
                                <div className="text-xs text-gray-500">Share via SMS</div>
                              </div>
                            </button>

                            <div className="border-t border-gray-200 my-1"></div>

                            <button
                              onClick={() => {
                                handleNativeShare();
                                setShowShareDropdownInSummary(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                                <Share2 className="w-5 h-5 text-rose-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">More Options</div>
                                <div className="text-xs text-gray-500">Share via native share</div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleShareViaCopy();
                                setShowShareDropdownInSummary(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">Copy Link</div>
                                <div className="text-xs text-gray-500">Copy quotation text</div>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Download Timer */}
      <DownloadTimer
        isVisible={downloadTimer !== null && downloadTimer > 0}
        timeRemaining={downloadTimer || 0}
        initialTime={30}
        onComplete={() => setDownloadTimer(null)}
      />

      {/* Thank You Message */}
      <ThankYouMessage
        isVisible={showThankYou}
        onClose={() => setShowThankYou(false)}
      />
    </section>
  );
}
