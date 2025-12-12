"use client";

import { useState, useEffect, useMemo, useCallback, ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  HardDrive, 
  Cable, 
  Eye, 
  Sparkles,
  Loader2,
  Check,
  Tag,
  TrendingUp,
  Download,
  Phone,
  Star,
  CheckCircle2,
  Circle,
  Radio,
  Calculator,
  FileText,
  ShoppingCart,
  Activity,
  Share2,
  Mail,
  MessageCircle,
  Send,
  X,
  ArrowRight,
  Save,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import { IconRenderer } from "@/components/ui/icon-renderer";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";
import { DownloadTimer, ThankYouMessage } from "@/components/ui/download-timer";
import { generateQuotationPDF, generateQuotationPDFBlob } from "@/lib/pdf-generator";
import { useSettings } from "@/lib/hooks/use-settings";

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
  slug: string;
  description?: string;
}

export function QuotationForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { settings } = useSettings();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [downloadTimer, setDownloadTimer] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showShareDropdownInSummary, setShowShareDropdownInSummary] = useState(false);
  const [showQuoteSummary, setShowQuoteSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quotationSaved, setQuotationSaved] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [currentQuotationNumber, setCurrentQuotationNumber] = useState<string | null>(null);

  // Fetch user profile data
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

  // Check if user profile is complete and mobile is verified
  const isProfileComplete = useMemo(() => {
    if (!userProfile) return false;
    return !!(
      userProfile.name &&
      userProfile.email &&
      userProfile.phone &&
      userProfile.phoneVerified
    );
  }, [userProfile]);

  // Check login and profile before executing action (like calculator)
  const checkAuthAndProfile = async (action: (quotationId?: string) => void | Promise<void>, buttonAction: string) => {
    // Check if user is logged in
    if (status !== "authenticated" || !session?.user) {
      const currentUrl = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
      const callbackUrl = `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}&action=${buttonAction}`;
      router.push(callbackUrl);
      return;
    }

    // Check if profile is complete
    if (!isProfileComplete) {
      toast.error("Please complete your profile first (Name, Email, Phone with OTP verification)");
      const currentUrl = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
      const callbackUrl = `/dashboard/profile?callbackUrl=${encodeURIComponent(currentUrl)}&action=${buttonAction}`;
      router.push(callbackUrl);
      return;
    }

    // Auto-save quotation before executing action and get quotation ID
    let quotationId: string | undefined = undefined;
    if (calculatedQuotation && quotationDetails.totalPrice > 0) {
      const result = await autoSaveQuotation(buttonAction);
      if (result.success && result.quotationId) {
        quotationId = result.quotationId;
      }
    }

    // Execute the action with quotation ID
    await action(quotationId);
  };

  // Auto-save quotation function
  const autoSaveQuotation = async (buttonAction: string): Promise<{ success: boolean; quotationId?: string }> => {
    if (!calculatedQuotation || quotationDetails.totalPrice === 0) {
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
        source: "GET_QUOTATION_PAGE",
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
        totalPrice: quotationDetails.totalPrice,
        subtotal: quotationDetails.totalPrice,
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
        buttonAction: buttonAction,
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

  const handleSaveQuotation = async () => {
    if (!calculatedQuotation || quotationDetails.totalPrice === 0) {
      toast.error("Please calculate a quotation first");
      return;
    }

    try {
      // Get brand and category names
      const selectedBrand = brands.find((b) => b.id === formData.brandId);
      const selectedCategory = categories.find((c) => c.id === formData.cameraTypeId);
      const selectedResolution = territoryCategories.find((t) => t.id === formData.resolutionId);
      const selectedHdd = hddTerritoryCategories.find((h) => h.id === formData.hddId);

      const quotationData = {
        source: "GET_QUOTATION_PAGE",
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
        totalPrice: quotationDetails.totalPrice,
        subtotal: quotationDetails.totalPrice,
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
      toast.success("Quotation saved successfully!");
      router.push("/dashboard/quotations");
    } catch (error: any) {
      console.error("Error saving quotation:", error);
      toast.error(error.message || "Failed to save quotation");
    }
  };


  // Refetch profile when session changes (after login)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchUserProfile = async () => {
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
      };
      fetchUserProfile();
    }
  }, [status, session]);

  // Format price with currency symbol and replace digits with XXX
  const formatPriceXXX = (price: number): string => {
    // First format with currency symbol and commas
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    // Replace all digits (0-9) with X, keeping currency symbol and commas
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

  // Convert GB to TB format
  // 500GB to 1024GB → 1TB
  // 1024GB to 2048GB → 2TB
  // And so on...
  const formatHDDSize = (gb: number): string => {
    const gbValue = Math.ceil(gb);
    
    // If less than 500GB, show in GB
    if (gbValue < 500) {
      return `${gbValue} GB`;
    }
    
    // 500GB to 1023GB → 1TB
    if (gbValue >= 500 && gbValue < 1024) {
      return "1 TB";
    }
    
    // 1024GB and above: calculate TB
    // 1024-2047 → 2TB, 2048-3071 → 3TB, etc.
    const tb = Math.floor((gbValue - 1024) / 1024) + 2;
    return `${tb} TB`;
  };

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
  const [hddLoading, setHddLoading] = useState(true);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [territoryCategories, setTerritoryCategories] = useState<TerritoryCategory[]>([]);
  const [hddTerritoryCategories, setHddTerritoryCategories] = useState<HDDTerritoryCategory[]>([]);

  const progress = useMemo(() => {
    const steps = [
      { key: "brand", label: "Brand", done: !!formData.brandId },
      { key: "category", label: "Camera Type", done: !!formData.cameraTypeId },
      { key: "resolution", label: "Resolution", done: !!formData.resolutionId },
      { key: "details", label: "Details", done: (parseInt(formData.indoorCameraCount) || 0) > 0 || (parseInt(formData.outdoorCameraCount) || 0) > 0 },
    ];
    const completed = steps.filter(s => s.done).length;
    return { steps, completed, total: steps.length, percentage: (completed / steps.length) * 100 };
  }, [formData]);

  // Animated progress value for smooth transitions
  const progressValue = useMotionValue(0);
  const springProgress = useSpring(progressValue, { stiffness: 100, damping: 30 });
  const progressWidth = useTransform(springProgress, (value) => `${value}%`);

  useEffect(() => {
    progressValue.set(progress.percentage);
  }, [progress.percentage, progressValue]);

  useEffect(() => {
    fetchAllData();
  }, []);

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
      toast.error("Failed to load quotation data");
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
    setHddLoading(true);
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
    } finally {
      setHddLoading(false);
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

  const quotationDetails = useMemo(() => {
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
        totalCameras: (parseInt(formData.indoorCameraCount) || 0) + (parseInt(formData.outdoorCameraCount) || 0),
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

  // Alias for compatibility with calculator functions
  const quotationSummaryDetails = quotationDetails;
  const totalPrice = quotationDetails.totalPrice;

  const selectedBrand = brands.find((b) => b.id === formData.brandId);
  const selectedCategory = categories.find((c) => c.id === formData.cameraTypeId);
  const selectedResolution = territoryCategories.find((tc) => tc.id === formData.resolutionId);

  // Prepare PDF data and download
  const handleDownloadPDF = useCallback(async () => {
    try {
      // Get settings for company info
      const settingsResponse = await fetch("/api/settings");
      const settingsData = await settingsResponse.ok ? await settingsResponse.json() : {};
      const settings = settingsData.settings || {};

      // Prepare quotation data for PDF
      const pdfData = {
        quotationNumber: `QT-${Date.now()}`,
        items: quotationDetails.details,
        totalPrice: quotationDetails.totalPrice,
        brandName: selectedBrand?.name,
        cameraTypeName: selectedCategory?.name,
        resolutionName: selectedResolution?.name,
        indoorCameraCount: parseInt(formData.indoorCameraCount) || 0,
        outdoorCameraCount: parseInt(formData.outdoorCameraCount) || 0,
        wiringMeters: parseFloat(formData.wiringMeters) || 0,
        hddName: hddTerritoryCategories.find(h => h.id === formData.hddId)?.name,
        recordingDays: parseInt(formData.recordingDays) || 0,
        companyName: settings.siteName || "D.G.Yard",
        companyTagline: settings.siteTagline || "Security & Technology Solutions",
        companyLogo: settings.logo,
        companyWebsite: settings.websiteUrl,
        companyEmail: settings.email,
        companyPhone: settings.phone,
        companyAddress: settings.address,
        companyCity: settings.city,
        companyState: settings.state,
        companyPincode: settings.pincode,
        companyCountry: settings.country || "India",
        customerName: userProfile?.name || "Customer",
        customerEmail: userProfile?.email || "",
        customerPhone: userProfile?.phone || "",
        customerAddress: userProfile?.address || "",
      };

      // Generate and download PDF
      generateQuotationPDF(pdfData);
      
      // Show thank you message after a short delay
      setTimeout(() => {
        setShowThankYou(true);
      }, 500);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download quotation");
      setDownloadTimer(null);
    }
  }, [quotationDetails, selectedBrand, selectedCategory, selectedResolution, formData, hddTerritoryCategories, userProfile]);

  // Download timer countdown effect
  useEffect(() => {
    if (downloadTimer === null || downloadTimer <= 0) {
      if (downloadTimer === 0) {
        // Timer completed, trigger download
        handleDownloadPDF();
        setDownloadTimer(null);
      }
      return;
    }

    const interval = setInterval(() => {
      setDownloadTimer((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [downloadTimer, handleDownloadPDF]);

  // Handle download button click
  const handleDownloadClick = async () => {
    await checkAuthAndProfile(async () => {
      if (quotationDetails.totalPrice === 0) {
        toast.error("Please calculate quotation first");
        return;
      }
      // Start timer (2 minutes = 120 seconds)
      const timerDuration = 120; // 2 minutes
      setDownloadTimer(timerDuration);
    }, "DOWNLOAD_QUOTATION");
  };

  // Helper function to convert image URL to base64
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!url) {
        reject(new Error('No URL provided'));
        return;
      }
      
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
      
      if (url.startsWith('/')) {
        img.src = (typeof window !== "undefined" ? window.location.origin : "") + url;
      } else {
        img.src = url;
      }
    });
  };

  // Generate quotation data for PDF (like calculator)
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
        logoBase64 = await imageToBase64(settings.logo);
      } catch (error) {
        console.error("Failed to convert logo to base64:", error);
      }
    }

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

    // Use stored quotation number or generate
    let quotationNumber = currentQuotationNumber;
    if (!quotationNumber) {
      quotationNumber = `QT-${Date.now()}`;
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
      items: quotationDetails.details.filter((detail: any) => detail && detail.item && detail.item.trim() !== ''),
      totalPrice: totalPrice,
      companyName: settings?.siteName || "D.G.Yard",
      companyTagline: settings?.siteTagline || null,
      companyLogo: logoBase64,
      companyWebsite: typeof window !== "undefined" ? window.location.origin : "",
      companyEmail: settings?.email || null,
      companyPhone: settings?.phone || null,
      companyAddress: settings?.address || null,
      companyCity: settings?.city || null,
      companyState: settings?.state || null,
      companyPincode: settings?.pincode || null,
      companyCountry: settings?.country || "India",
      customerName: userProfile?.name || session?.user?.name || null,
      customerEmail: userProfile?.email || session?.user?.email || null,
      customerPhone: userProfile?.phone || null,
      customerAddress: customerAddress || null,
    };
  };

  // Generate short code from quotation parameters
  const generateShortCode = (): string | null => {
    if (!calculatedQuotation || totalPrice === 0) return null;
    
    const params = {
      b: formData.brandId || '',
      c: formData.cameraTypeId || '',
      r: formData.resolutionId || '',
      i: formData.indoorCameraCount || '0',
      o: formData.outdoorCameraCount || '0',
      w: formData.wiringMeters || '0',
      h: formData.hddId || '',
      d: formData.recordingDays || '0',
      p: Math.round(totalPrice).toString(),
    };
    
    try {
      const jsonString = JSON.stringify(params);
      const base64 = btoa(jsonString);
      return base64.substring(0, 20); // Short code
    } catch (error) {
      console.error("Error generating short code:", error);
      return null;
    }
  };

  // Generate PDF download link
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

  // Generate quotation text for sharing
  const generateQuotationText = (includePdfLink: boolean = false) => {
    if (!calculatedQuotation || totalPrice === 0) return "";
    
    let text = `📹 CCTV System Quotation - D.G.Yard\n\n`;
    text += `Brand: ${selectedBrand?.name || 'N/A'}\n`;
    text += `Camera Type: ${selectedCategory?.name || 'N/A'}\n`;
    text += `Resolution: ${selectedResolution?.name || 'N/A'}\n`;
    text += `Indoor Cameras: ${parseInt(formData.indoorCameraCount) || 0}\n`;
    text += `Outdoor Cameras: ${parseInt(formData.outdoorCameraCount) || 0}\n\n`;
    
    if (quotationDetails.details && quotationDetails.details.length > 0) {
      text += `Items:\n`;
      quotationDetails.details.forEach((item: any) => {
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

  // Share handlers (like calculator)
  const handleShareViaEmail = async () => {
    await checkAuthAndProfile(async () => {
      try {
        const quotationData = await getQuotationData();
        const pdfDataUrl = await generateQuotationPDFBlob(quotationData);
        
        const subject = encodeURIComponent("CCTV System Quotation - D.G.Yard");
        const text = generateQuotationText(true);
        const body = encodeURIComponent(text);
        
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowShareDropdown(false);
        setShowShareDropdownInSummary(false);
        toast.success("Email client opened! PDF download link included.");
      } catch (error) {
        console.error("Error generating PDF for email:", error);
        const subject = encodeURIComponent("CCTV System Quotation - D.G.Yard");
        const body = encodeURIComponent(generateQuotationText(true));
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowShareDropdown(false);
        setShowShareDropdownInSummary(false);
        toast.success("Email client opened!");
      }
    }, "SHARE_EMAIL");
  };

  const handleShareViaWhatsApp = async () => {
    await checkAuthAndProfile(async () => {
      const text = encodeURIComponent(generateQuotationText(true));
      window.open(`https://wa.me/?text=${text}`, '_blank');
      setShowShareDropdown(false);
      setShowShareDropdownInSummary(false);
      toast.success("Opening WhatsApp... Select number to share!");
    }, "SHARE_WHATSAPP");
  };

  const handleShareViaWhatsAppBusiness = async () => {
    await checkAuthAndProfile(async () => {
      const text = encodeURIComponent(generateQuotationText(true));
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
          const quotationData = await getQuotationData();
          const pdfDataUrl = await generateQuotationPDFBlob(quotationData);
          
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
            const pdfLink = generatePDFDownloadLink();
            await navigator.share({
              title: "CCTV System Quotation - D.G.Yard",
              text: generateQuotationText(true),
              url: pdfLink || window.location.href,
            });
            setShowShareDropdown(false);
            setShowShareDropdownInSummary(false);
            toast.success("Sharing...");
          }
        }
      } else {
        handleShareViaCopy();
      }
    }, "SHARE_NATIVE");
  };

  // Other button handlers
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
    const bookingUrl = quotationId 
      ? `/services/book?type=INSTALLATION&quotationId=${quotationId}`
      : `/services/book?type=INSTALLATION`;
    
    router.push(bookingUrl);
  };

  const handleContactSeller = () => {
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

  // Update handleDownloadPDF to use getQuotationData
  const handleDownloadQuotation = async () => {
    await checkAuthAndProfile(async () => {
      try {
        const quotationData = await getQuotationData();
        
        if (!quotationData.items || quotationData.items.length === 0) {
          toast.error("No items found in quotation. Please recalculate.");
          return;
        }
        
        if (!quotationData.totalPrice || quotationData.totalPrice <= 0) {
          toast.error("Invalid quotation total. Please recalculate.");
          return;
        }
        
        generateQuotationPDF(quotationData);
        
        setDownloadTimer(null);
        setTimeout(() => {
          setShowThankYou(true);
        }, 300);
      } catch (error: any) {
        console.error("Error generating PDF:", error);
        toast.error(error?.message || "Failed to generate PDF. Please try again.");
        setDownloadTimer(null);
      }
    }, "DOWNLOAD_QUOTATION");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Loading quotation options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* CCTV Background Images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <motion.div
          className="absolute top-20 right-10 w-64 h-64"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Camera className="w-full h-full text-blue-500" />
        </motion.div>
        <motion.div
          className="absolute bottom-40 left-20 w-48 h-48"
          animate={{
            rotate: [360, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Camera className="w-full h-full text-cyan-500" />
        </motion.div>
        <motion.div
          className="absolute top-1/2 right-1/4 w-32 h-32"
          animate={{
            rotate: [0, -360],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Camera className="w-full h-full text-blue-400" />
        </motion.div>
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-10"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg"
        >
          <Calculator className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Get Your Quotation</h1>
        <p className="text-gray-600">Fill in your requirements below</p>
      </motion.div>

      {/* AI Helper for Quotation */}
      <InlineAIHelper
        context="creating a quotation"
        suggestions={[
          "How to select the right camera type?",
          "What resolution should I choose?",
          "How much storage do I need?",
          "Help me calculate the total price"
        ]}
        position="top"
      />

      {/* Single Line Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-20 z-40 mb-6 mt-4"
      >
        <div className="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200 p-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Progress Steps - Horizontal Single Line */}
            <div className="flex-1 flex items-center gap-2 md:gap-3 relative">
              {progress.steps.map((step, index) => (
                <div key={step.key} className="flex-1 flex items-center relative">
                  {/* Step Indicator */}
                  <div className="flex items-center gap-2 flex-1">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all border-2 flex-shrink-0 ${
                        step.done
                          ? "bg-green-500 text-white shadow-md border-green-400"
                          : "bg-gray-200 text-gray-500 border-gray-300"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <span className="text-xs md:text-sm font-bold">{index + 1}</span>
                      )}
                    </motion.div>
                    
                    {/* Step Label */}
                    <span className={`text-xs md:text-sm font-medium hidden sm:block ${
                      step.done ? "text-green-600" : "text-gray-500"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  
                  {/* Connecting Line */}
                  {index < progress.steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 md:mx-2 relative">
                      <div
                        className={`h-full transition-all duration-300 ${
                          step.done ? "bg-green-400" : "bg-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress Percentage */}
            <div className="flex-shrink-0 text-right bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              <span className="text-sm md:text-base font-bold text-blue-600">
                {progress.completed}/{progress.total}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({Math.round(progress.percentage)}%)
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <Label className="text-lg font-bold text-gray-900">Select Brand *</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {brands.map((brand, index) => (
                <motion.button
                  key={brand.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setFormData({ ...formData, brandId: brand.id });
                    toast.success(`${brand.name} selected!`, { duration: 1000 });
                  }}
                  className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                    formData.brandId === brand.id
                      ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  {formData.brandId === brand.id && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  {formData.brandId === brand.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  {brand.logo ? (
                    <div className="relative w-full h-12 mb-2">
                      <Image src={brand.logo} alt={brand.name} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-12 mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-700 text-center">{brand.name}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Camera Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <Label className="text-lg font-bold text-gray-900">Camera Type *</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setFormData({ ...formData, cameraTypeId: category.id });
                    toast.success(`${category.name} selected!`, { duration: 1000 });
                  }}
                  className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                    formData.cameraTypeId === category.id
                      ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  {formData.cameraTypeId === category.id && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  {formData.cameraTypeId === category.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  {category.icon && (
                    <div className="mb-2 flex justify-center">
                      <IconRenderer
                        iconName={category.icon}
                        fallback={Camera as ComponentType<{ className?: string; size?: number }>}
                        className="w-6 h-6 text-blue-600"
                      />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-700 text-center">{category.name}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Resolution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <Label className="text-lg font-bold text-gray-900">Resolution (Megapixel) *</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {territoryCategories.map((tc, index) => (
                <motion.button
                  key={tc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setFormData({ ...formData, resolutionId: tc.id });
                    toast.success(`${tc.name} selected!`, { duration: 1000 });
                  }}
                  className={`p-3 rounded-xl border-2 transition-all font-semibold relative overflow-hidden ${
                    formData.resolutionId === tc.id
                      ? "border-blue-500 bg-blue-500 text-white shadow-md ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300 bg-white text-gray-700"
                  }`}
                >
                  {formData.resolutionId === tc.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  <span className="relative z-10">{tc.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recording Days / HDD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <Label className="text-lg font-bold text-gray-900">Recording Days / HDD Storage</Label>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"
                >
                  <HardDrive className="w-4 h-4 text-white" />
                </motion.div>
                <Label className="text-sm font-bold text-gray-800 whitespace-nowrap">Recording Days:</Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileFocus={{ scale: 1.05 }}
                  className="relative flex-1 min-w-[150px] max-w-[200px]"
                >
                  <Input
                    type="number"
                    placeholder="Enter days"
                    value={formData.recordingDays}
                    onChange={(e) => {
                      setFormData({ ...formData, recordingDays: e.target.value, hddId: "" });
                      if (e.target.value) {
                        toast.success(`Recording days: ${e.target.value}`, { duration: 1000 });
                      }
                    }}
                    className="w-full bg-white border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 transition-all shadow-md text-gray-900 font-semibold placeholder:text-gray-400"
                  />
                  {formData.recordingDays && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -right-2 -top-2 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
            {!hddLoading && hddTerritoryCategories.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-blue-600">Or</span>
                  <Label className="text-sm font-semibold text-gray-700">Select Hard Disk Drive:</Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {hddTerritoryCategories.map((tc, index) => (
                    <motion.button
                      key={tc.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setFormData({ ...formData, hddId: tc.id, recordingDays: "" });
                        toast.success(`${tc.name} selected!`, { duration: 1000 });
                      }}
                      className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                        formData.hddId === tc.id
                          ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300 bg-white"
                      }`}
                    >
                      {formData.hddId === tc.id && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                      {formData.hddId === tc.id && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                      <div className="w-full h-12 mb-2 flex items-center justify-center">
                        <div className={`p-2 rounded-lg ${formData.hddId === tc.id ? "bg-blue-500" : "bg-blue-100"}`}>
                          <HardDrive className={`w-6 h-6 ${formData.hddId === tc.id ? "text-white" : "text-blue-600"}`} />
                        </div>
                      </div>
                      <p className={`text-xs font-semibold text-center ${formData.hddId === tc.id ? "text-blue-700" : "text-gray-700"}`}>
                        {tc.name}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            {hddLoading && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading HDD options...</p>
              </div>
            )}
          </motion.div>

          {/* Camera Counts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-2xl shadow-lg border-2 border-purple-200 p-6 overflow-hidden"
          >
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-5"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, #8b5cf6 1px, transparent 0)",
                backgroundSize: "30px 30px",
              }}
            />
            
            {/* Glowing effects */}
            <motion.div
              className="absolute -top-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md"
                >
                  <Camera className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <Label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Number of Cameras
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-purple-600 text-sm"
                    >
                      *
                    </motion.span>
                  </Label>
                  <p className="text-xs text-gray-600 mt-0.5">Specify indoor and outdoor camera counts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="relative bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-purple-200 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Camera className="w-4 h-4 text-purple-600" />
                    </div>
                    <Label className="text-sm font-bold text-gray-900">Indoor Cameras</Label>
                  </div>
                  <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                <Input
                  type="number"
                  min="0"
                      placeholder="Enter count"
                  value={formData.indoorCameraCount}
                  onChange={(e) => {
                    setFormData({ ...formData, indoorCameraCount: e.target.value });
                    if (e.target.value) {
                      toast.success(`${e.target.value} indoor camera(s) added!`, { duration: 1000 });
                    }
                  }}
                      className="w-full border-2 border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200/50 transition-all bg-white shadow-sm text-lg font-semibold placeholder:text-gray-400"
                />
                {formData.indoorCameraCount && parseInt(formData.indoorCameraCount) > 0 && (
                  <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -right-2 -top-2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="text-white text-xs font-bold"
                  >
                    {formData.indoorCameraCount}
                        </motion.div>
                  </motion.div>
                )}
              </motion.div>
                  {formData.indoorCameraCount && parseInt(formData.indoorCameraCount) > 0 && (
              <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-2 text-sm"
                    >
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{formData.indoorCameraCount} indoor camera{parseInt(formData.indoorCameraCount) > 1 ? 's' : ''} added</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="relative bg-white/80 backdrop-blur-sm rounded-xl p-5 border-2 border-cyan-200 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-cyan-100 rounded-lg">
                      <Camera className="w-4 h-4 text-cyan-600" />
                    </div>
                    <Label className="text-sm font-bold text-gray-900">Outdoor Cameras</Label>
                  </div>
                  <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                <Input
                  type="number"
                  min="0"
                      placeholder="Enter count"
                  value={formData.outdoorCameraCount}
                  onChange={(e) => {
                    setFormData({ ...formData, outdoorCameraCount: e.target.value });
                    if (e.target.value) {
                      toast.success(`${e.target.value} outdoor camera(s) added!`, { duration: 1000 });
                    }
                  }}
                      className="w-full border-2 border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200/50 transition-all bg-white shadow-sm text-lg font-semibold placeholder:text-gray-400"
                />
                {formData.outdoorCameraCount && parseInt(formData.outdoorCameraCount) > 0 && (
                  <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -right-2 -top-2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="text-white text-xs font-bold"
                  >
                    {formData.outdoorCameraCount}
                        </motion.div>
                  </motion.div>
                )}
              </motion.div>
                  {formData.outdoorCameraCount && parseInt(formData.outdoorCameraCount) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-2 text-sm"
                    >
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{formData.outdoorCameraCount} outdoor camera{parseInt(formData.outdoorCameraCount) > 1 ? 's' : ''} added</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Wiring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6 overflow-hidden"
          >
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-5"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)",
                backgroundSize: "30px 30px",
              }}
            />
            
            {/* Glowing effect */}
            <motion.div
              className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md"
                >
                  <Cable className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <Label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Wiring (meters)
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-blue-600 text-sm"
                    >
                      *
                    </motion.span>
                  </Label>
                  <p className="text-xs text-gray-600 mt-0.5">Enter cable length for installation</p>
              </div>
            </div>
            <div className="relative w-full">
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="Enter cable length in meters"
                value={formData.wiringMeters}
                onChange={(e) => {
                  setFormData({ ...formData, wiringMeters: e.target.value });
                  if (e.target.value) {
                    toast.success(`${e.target.value}m cable added!`, { duration: 1000 });
                  }
                }}
                    className="w-full border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 transition-all bg-white shadow-md text-lg font-semibold placeholder:text-gray-400"
              />
              {formData.wiringMeters && parseFloat(formData.wiringMeters) > 0 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -right-2 -top-2 w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
                {formData.wiringMeters && parseFloat(formData.wiringMeters) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 text-sm"
                  >
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{formData.wiringMeters}m cable added</span>
                </div>
                  </motion.div>
              )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Quotation Summary - Fixed Position Below Progress Bar with Gap */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-[300px]"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Quotation Summary</h3>
              </div>

              {/* Selected Items */}
              <div className="space-y-3 mb-6">
                <AnimatePresence>
                  {selectedBrand && (
                    <motion.div
                      key="brand"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <p className="text-xs text-gray-500 mb-1">Brand</p>
                      <p className="font-semibold text-gray-900">{selectedBrand.name}</p>
                    </motion.div>
                  )}
                  {selectedCategory && (
                    <motion.div
                      key="category"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <p className="text-xs text-gray-500 mb-1">Camera Type</p>
                      <p className="font-semibold text-gray-900">{selectedCategory.name}</p>
                    </motion.div>
                  )}
                  {selectedResolution && (
                    <motion.div
                      key="resolution"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <p className="text-xs text-gray-500 mb-1">Resolution</p>
                      <p className="font-semibold text-gray-900">{selectedResolution.name}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Loading State */}
              {calculating && (
                <div className="border-t border-gray-200 pt-4 mb-4 text-center py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Calculating quotation...</p>
                </div>
              )}

              {/* Price Details */}
              <AnimatePresence>
                {!calculating && quotationDetails.details.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 pt-4 mb-4"
                  >
                    <div className="space-y-2 mb-4">
                      {quotationDetails.details
                        .filter((detail) => detail && detail.item && detail.item.trim() !== '')
                        .map((detail, index) => (
                          <motion.div
                            key={`detail-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="text-sm p-2 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium text-xs">{detail.item}</p>
                              {detail.isDetailed && detail.cablePrice !== undefined && detail.wiringCharge !== undefined ? (
                                <div className="mt-1 space-y-1">
                                  <p className="text-xs text-gray-500">
                                    Cable: {formatPriceXXX(detail.wirePricePerMeter)} × {detail.quantity}m = {formatPriceXXX(detail.cablePrice)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Wiring: {formatPriceXXX(detail.wiringChargePerMeter)} × {detail.quantity}m = {formatPriceXXX(detail.wiringCharge)}
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
                                      Required Storage: {formatHDDSize(detail.requiredHDDGB)}
                                    </p>
                                  )}
                                  {detail.suggestedHDDGB && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Suggested Storage: {formatHDDSize(detail.suggestedHDDGB)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  {detail.quantity} × {formatPriceXXX(detail.price)}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Total Price - Clickable to Save and View (like calculator) */}
              <AnimatePresence>
                {quotationDetails.totalPrice > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => checkAuthAndProfile(handleSaveQuotation, "SAVE_QUOTATION")}
                    disabled={saving || !session?.user}
                    className={`w-full bg-green-100/80 backdrop-blur-sm border-2 border-green-200/60 rounded-xl p-4 md:p-6 shadow-xl transition-all mb-4 ${
                      session?.user && !quotationSaved
                        ? "hover:bg-green-200/90 hover:shadow-2xl cursor-pointer hover:scale-105"
                        : "cursor-default"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""} ${quotationSaved ? "bg-blue-100/80 border-blue-200/60" : ""}`}
                  >
                    <div className="text-3xl md:text-5xl font-serif font-bold text-green-800">
                      {quotationSaved ? formatPriceActual(quotationDetails.totalPrice) : formatPriceXXX(quotationDetails.totalPrice)}
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
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Action Buttons - Same as Calculator */}
              <AnimatePresence>
                {quotationDetails.totalPrice > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-3 mb-4"
                  >
                    {/* Contact Seller */}
                    <motion.button
                      onClick={handleContactSeller}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:from-blue-100 hover:to-blue-200/50 w-full"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-200/60 group-hover:bg-blue-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Phone className="w-4 h-4 md:w-6 md:h-6 text-blue-700 group-hover:text-blue-900" />
                        </div>
                        <span className="font-serif font-semibold text-blue-900 text-xs md:text-base group-hover:text-blue-950 leading-tight">
                          Contact Seller
                        </span>
                      </div>
                    </motion.button>

                    {/* Book Installation */}
                    <motion.button
                      onClick={handleBookInstallationWithCheck}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-purple-300 hover:from-purple-100 hover:to-purple-200/50 w-full"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-200/60 group-hover:bg-purple-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Calculator className="w-4 h-4 md:w-6 md:h-6 text-purple-700 group-hover:text-purple-900" />
                        </div>
                        <span className="font-serif font-semibold text-purple-900 text-xs md:text-base group-hover:text-purple-950 leading-tight">
                          Book Installation
                        </span>
                      </div>
                    </motion.button>

                    {/* Show Suggested Products */}
                    <motion.button
                      onClick={handleShowSuggestedProducts}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-amber-300 hover:from-amber-100 hover:to-amber-200/50 w-full"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-200/60 group-hover:bg-amber-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-amber-700 group-hover:text-amber-900" />
                        </div>
                        <span className="font-serif font-semibold text-amber-900 text-xs md:text-base group-hover:text-amber-950 leading-tight">
                          Show Suggestions
                        </span>
                      </div>
                    </motion.button>

                    {/* Download Quotation */}
                    <motion.button
                      onClick={handleDownloadQuotation}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-emerald-300 hover:from-emerald-100 hover:to-emerald-200/50 w-full"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-emerald-200/60 group-hover:bg-emerald-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Download className="w-4 h-4 md:w-6 md:h-6 text-emerald-700 group-hover:text-emerald-900" />
                        </div>
                        <span className="font-serif font-semibold text-emerald-900 text-xs md:text-base group-hover:text-emerald-950 leading-tight">
                          Download Quotation
                        </span>
                      </div>
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
                      className="group relative bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200/60 rounded-lg p-2 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:border-green-300 hover:from-green-100 hover:to-green-200/50 w-full"
                    >
                      <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-green-200/60 group-hover:bg-green-300 rounded-full flex items-center justify-center transition-colors duration-300">
                          <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-green-700 group-hover:text-green-900" />
                        </div>
                        <span className="font-serif font-semibold text-green-900 text-xs md:text-base group-hover:text-green-950 leading-tight">
                          Show Quotation Summary
                        </span>
                      </div>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty State */}
              {quotationDetails.totalPrice === 0 && !calculating && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Select options to see quotation</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
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
                {selectedBrand && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Brand</p>
                    <p className="font-semibold text-gray-900">{selectedBrand.name}</p>
                  </div>
                )}
                {selectedCategory && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Camera Type</p>
                    <p className="font-semibold text-gray-900">{selectedCategory.name}</p>
                  </div>
                )}
                {selectedResolution && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Resolution</p>
                    <p className="font-semibold text-gray-900">{selectedResolution.name}</p>
                  </div>
                )}
              </div>

              {/* Price Details */}
              {quotationDetails.details.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="space-y-2 mb-4 max-h-96 overflow-y-auto pr-2">
                    {quotationDetails.details
                      .filter((detail: any) => detail && detail.item && detail.item.trim() !== '')
                      .map((detail: any, index: number) => (
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
                                    Cable: {formatPrice(detail.wirePricePerMeter || detail.pricePerMeter)} × {detail.quantity}m = {formatPrice(detail.cablePrice)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Wiring: {formatPrice(detail.wiringChargePerMeter)} × {detail.quantity}m = {formatPrice(detail.wiringCharge)}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  {detail.quantity} × {formatPrice(detail.price)} = {formatPrice(detail.total)}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm font-semibold text-gray-900">{formatPrice(detail.total)}</p>
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
                    {formatPrice(totalPrice)}
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
        initialTime={120}
        onComplete={() => setDownloadTimer(null)}
      />

      {/* Thank You Message */}
      <ThankYouMessage
        isVisible={showThankYou}
        onClose={() => setShowThankYou(false)}
      />
    </div>
  );
}
