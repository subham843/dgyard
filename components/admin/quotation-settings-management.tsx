"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye,
  Cable,
  Wrench,
  HardDrive,
  Tag,
  Camera,
  TrendingUp,
  X,
  Check,
  Monitor,
  Zap,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";

export function QuotationSettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "hdd" | "recording-device" | "wiring" | "installation" | "power-supply" | "accessories" | "bitrate">("overview");
  
  // Overview Data
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [territoryCategories, setTerritoryCategories] = useState<any[]>([]);
  
  // HDD Settings
  const [hddSettings, setHddSettings] = useState<any[]>([]);
  const [hddFormData, setHddFormData] = useState({
    categoryId: "",
    subCategoryId: "",
    territoryCategoryIds: [] as string[],
  });
  const [hddTerritoryItems, setHddTerritoryItems] = useState<Array<{
    territoryCategoryId: string;
    territoryCategoryName: string;
    capacityGB: string;
    capacityTB: string;
  }>>([]);
  const [currentTerritoryCategory, setCurrentTerritoryCategory] = useState("");
  const [currentCapacityGB, setCurrentCapacityGB] = useState("");
  const [currentCapacityTB, setCurrentCapacityTB] = useState("");
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [filteredTerritoryCategories, setFilteredTerritoryCategories] = useState<any[]>([]);
  
  // Recording Device Settings
  const [recordingDeviceSettings, setRecordingDeviceSettings] = useState<any[]>([]);
  const [recordingDeviceFormData, setRecordingDeviceFormData] = useState({
    cameraTypeId: "", // Camera Type (enableForQuotation categories)
    categoryId: "", // Category (all categories)
    subCategoryId: "", // Sub Category (filtered by selected Category)
    territoryCategoryIds: [] as string[],
  });
  const [recordingDeviceSubCategories, setRecordingDeviceSubCategories] = useState<any[]>([]);
  const [filteredRecordingDeviceTerritoryCategories, setFilteredRecordingDeviceTerritoryCategories] = useState<any[]>([]);
  
  // Power Supply Settings
  const [powerSupplySettings, setPowerSupplySettings] = useState<any[]>([]);
  const [powerSupplyFormData, setPowerSupplyFormData] = useState({
    cameraTypeId: "", // Camera Type (enableForQuotation categories)
    categoryId: "", // Category (all categories)
    subCategoryId: "", // Sub Category (filtered by selected Category)
    territoryCategoryIds: [] as string[],
  });
  const [powerSupplySubCategories, setPowerSupplySubCategories] = useState<any[]>([]);
  const [filteredPowerSupplyTerritoryCategories, setFilteredPowerSupplyTerritoryCategories] = useState<any[]>([]);
  
  // Accessories Settings
  const [accessoriesSettings, setAccessoriesSettings] = useState<any[]>([]);
  const [accessoriesFormData, setAccessoriesFormData] = useState({
    cameraTypeId: "", // Camera Type (enableForQuotation categories) - mandatory
    items: [] as Array<{ 
      itemName: string; 
      quantity: string; 
      rate: string; 
      isCableLengthBased?: boolean; 
      maxCableInMeter?: string;
    }>,
  });
  const [editingAccessoriesId, setEditingAccessoriesId] = useState<string | null>(null);

  // Bitrate Settings
  const [bitrateSettings, setBitrateSettings] = useState<any[]>([]);
  const [bitrateFormData, setBitrateFormData] = useState({
    cameraTypeIds: [] as string[], // Multiple Camera Types (enableForQuotation categories) - mandatory
  });
  const [bitrateTerritoryItems, setBitrateTerritoryItems] = useState<Array<{
    territoryCategoryId: string;
    territoryCategoryName: string;
    bitrate: string;
  }>>([]);
  const [currentBitrateTerritoryCategory, setCurrentBitrateTerritoryCategory] = useState("");
  const [currentBitrate, setCurrentBitrate] = useState("");
  const [filteredBitrateTerritoryCategories, setFilteredBitrateTerritoryCategories] = useState<any[]>([]);
  const [editingBitrateId, setEditingBitrateId] = useState<string | null>(null);
  
  // Wiring Settings
  const [wirings, setWirings] = useState<any[]>([]);
  const [wiringFormData, setWiringFormData] = useState({
    categoryId: "",
    cableName: "",
    wirePricePerMeter: "",
    wiringChargePerMeter: "",
    shortDetail: "",
  });
  const [editingWiringId, setEditingWiringId] = useState<string | null>(null);
  
  // Calculate total price per meter
  const totalPricePerMeter = useMemo(() => {
    const wirePrice = parseFloat(wiringFormData.wirePricePerMeter) || 0;
    const wiringCharge = parseFloat(wiringFormData.wiringChargePerMeter) || 0;
    return wirePrice + wiringCharge;
  }, [wiringFormData.wirePricePerMeter, wiringFormData.wiringChargePerMeter]);
  
  // Installation Settings
  const [installations, setInstallations] = useState<any[]>([]);
  const [installationFormData, setInstallationFormData] = useState({
    categoryId: "",
    maxCableLength: "90",
    ratePerCamera: "",
  });
  const [editingInstallationId, setEditingInstallationId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch accessories settings
  const fetchAccessoriesSettings = async () => {
    try {
      const response = await fetch("/api/admin/quotation-settings/accessories", {
        credentials: "include",
      });
      const data = await response.json();
      setAccessoriesSettings(data.settings || []);
    } catch (error) {
      console.error("Error fetching Accessories settings:", error);
    }
  };

  // Fetch bitrate settings
  const fetchBitrateSettings = async () => {
    try {
      const response = await fetch("/api/admin/quotation-settings/bitrate", {
        credentials: "include",
      });
      const data = await response.json();
      setBitrateSettings(data.settings || []);
    } catch (error) {
      console.error("Error fetching Bitrate settings:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchQuotationOverview(),
        fetchHddSettings(),
        fetchRecordingDeviceSettings(),
        fetchPowerSupplySettings(),
        fetchWirings(),
        fetchInstallations(),
        fetchAccessoriesSettings(),
        fetchBitrateSettings(),
        fetchCategories(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load quotation settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotationOverview = async () => {
    try {
      const [brandsRes, categoriesRes, territoryRes] = await Promise.all([
        fetch("/api/quotation/brands", { credentials: "include" }),
        fetch("/api/quotation/categories", { credentials: "include" }),
        fetch("/api/quotation/territory-categories", { credentials: "include" }),
      ]);
      
      const brandsData = await brandsRes.json();
      const categoriesData = await categoriesRes.json();
      const territoryData = await territoryRes.json();
      
      setBrands(brandsData.brands || []);
      setCategories(categoriesData.categories || []);
      setTerritoryCategories(territoryData.territoryCategories || []);
    } catch (error) {
      console.error("Error fetching overview:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories", {
        credentials: "include",
      });
      const data = await response.json();
      setAllCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const response = await fetch(`/api/admin/subcategories?categoryId=${categoryId}`, {
        credentials: "include",
      });
      const data = await response.json();
      setSubCategories(data.subCategories || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchHddSettings = async () => {
    try {
      const response = await fetch("/api/admin/quotation-settings/hdd", {
        credentials: "include",
      });
      const data = await response.json();
      setHddSettings(data.settings || []);
    } catch (error) {
      console.error("Error fetching HDD settings:", error);
    }
  };

  const fetchRecordingDeviceSettings = async () => {
    try {
      const response = await fetch("/api/admin/quotation-settings/recording-device", {
        credentials: "include",
      });
      const data = await response.json();
      setRecordingDeviceSettings(data.settings || []);
    } catch (error) {
      console.error("Error fetching Recording Device settings:", error);
    }
  };

  const fetchPowerSupplySettings = async () => {
    try {
      const response = await fetch("/api/admin/quotation-settings/power-supply", {
        credentials: "include",
      });
      const data = await response.json();
      setPowerSupplySettings(data.settings || []);
    } catch (error) {
      console.error("Error fetching Power Supply settings:", error);
    }
  };

  const fetchWirings = async () => {
    try {
      const response = await fetch("/api/admin/quotation-settings/wiring", {
        credentials: "include",
      });
      const data = await response.json();
      setWirings(data.wirings || []);
    } catch (error) {
      console.error("Error fetching wirings:", error);
    }
  };

  const fetchInstallations = async () => {
    try {
      const response = await fetch("/api/admin/quotation-settings/installation", {
        credentials: "include",
      });
      const data = await response.json();
      setInstallations(data.installations || []);
    } catch (error) {
      console.error("Error fetching installations:", error);
    }
  };

  // HDD Settings Handlers
  useEffect(() => {
    if (hddFormData.categoryId) {
      fetchSubCategories(hddFormData.categoryId);
    } else {
      setSubCategories([]);
      setFilteredTerritoryCategories([]);
    }
  }, [hddFormData.categoryId]);

  useEffect(() => {
    if (hddFormData.categoryId && hddFormData.subCategoryId) {
      const fetchData = async () => {
        try {
          const response = await fetch(
            `/api/admin/territory-categories/filter?categoryId=${hddFormData.categoryId}&subCategoryId=${hddFormData.subCategoryId}`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          setFilteredTerritoryCategories(data.territoryCategories || []);
        } catch (error) {
          console.error("Error fetching filtered territory categories:", error);
          setFilteredTerritoryCategories([]);
        }
      };
      fetchData();
    } else {
      setFilteredTerritoryCategories([]);
    }
  }, [hddFormData.categoryId, hddFormData.subCategoryId]);

  const handleHddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const territoryCategories = hddTerritoryItems.map((item) => ({
        territoryCategoryId: item.territoryCategoryId,
        capacityGB: item.capacityGB ? parseFloat(item.capacityGB) : null,
        capacityTB: item.capacityTB ? parseFloat(item.capacityTB) : null,
      }));

      const response = await fetch("/api/admin/quotation-settings/hdd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          categoryId: hddFormData.categoryId,
          subCategoryId: hddFormData.subCategoryId,
          territoryCategories: territoryCategories,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to save HDD setting");
        return;
      }

      toast.success("HDD setting saved!");
      setHddFormData({ categoryId: "", subCategoryId: "", territoryCategoryIds: [] });
      setFilteredTerritoryCategories([]);
      setHddTerritoryItems([]);
      setCurrentTerritoryCategory("");
      setCurrentCapacityGB("");
      setCurrentCapacityTB("");
      fetchHddSettings();
    } catch (error: any) {
      console.error("Error saving HDD setting:", error);
      toast.error("Failed to save HDD setting");
    }
  };

  const handleDeleteHdd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this HDD setting?")) return;
    
    try {
      const response = await fetch(`/api/admin/quotation-settings/hdd/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Failed to delete HDD setting");
        return;
      }

      toast.success("HDD setting deleted!");
      fetchHddSettings();
    } catch (error) {
      console.error("Error deleting HDD setting:", error);
      toast.error("Failed to delete HDD setting");
    }
  };

  // Recording Device Settings Handlers
  useEffect(() => {
    if (recordingDeviceFormData.categoryId) {
      const fetchData = async () => {
        try {
          const response = await fetch(`/api/admin/subcategories?categoryId=${recordingDeviceFormData.categoryId}`, {
            credentials: "include",
          });
          const data = await response.json();
          setRecordingDeviceSubCategories(data.subCategories || []);
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setRecordingDeviceSubCategories([]);
        }
      };
      fetchData();
    } else {
      setRecordingDeviceSubCategories([]);
    }
  }, [recordingDeviceFormData.categoryId]);

  useEffect(() => {
    if (recordingDeviceFormData.categoryId && recordingDeviceFormData.subCategoryId) {
      const fetchData = async () => {
        try {
          const response = await fetch(
            `/api/admin/territory-categories/filter?categoryId=${recordingDeviceFormData.categoryId}&subCategoryId=${recordingDeviceFormData.subCategoryId}`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          setFilteredRecordingDeviceTerritoryCategories(data.territoryCategories || []);
        } catch (error) {
          console.error("Error fetching filtered territory categories:", error);
          setFilteredRecordingDeviceTerritoryCategories([]);
        }
      };
      fetchData();
    } else {
      setFilteredRecordingDeviceTerritoryCategories([]);
    }
  }, [recordingDeviceFormData.categoryId, recordingDeviceFormData.subCategoryId]);

  const handleRecordingDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/quotation-settings/recording-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(recordingDeviceFormData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to save Recording Device setting");
        return;
      }

      toast.success("Recording Device setting saved!");
      setRecordingDeviceFormData({ cameraTypeId: "", categoryId: "", subCategoryId: "", territoryCategoryIds: [] });
      fetchRecordingDeviceSettings();
    } catch (error: any) {
      console.error("Error saving Recording Device setting:", error);
      toast.error("Failed to save Recording Device setting");
    }
  };

  const handleDeleteRecordingDevice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Recording Device setting?")) return;
    
    try {
      const response = await fetch(`/api/admin/quotation-settings/recording-device/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Failed to delete Recording Device setting");
        return;
      }

      toast.success("Recording Device setting deleted!");
      fetchRecordingDeviceSettings();
    } catch (error) {
      console.error("Error deleting Recording Device setting:", error);
      toast.error("Failed to delete Recording Device setting");
    }
  };

  // Power Supply Settings Handlers
  useEffect(() => {
    if (powerSupplyFormData.categoryId) {
      const fetchData = async () => {
        try {
          const response = await fetch(`/api/admin/subcategories?categoryId=${powerSupplyFormData.categoryId}`, {
            credentials: "include",
          });
          const data = await response.json();
          setPowerSupplySubCategories(data.subCategories || []);
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setPowerSupplySubCategories([]);
        }
      };
      fetchData();
    } else {
      setPowerSupplySubCategories([]);
    }
  }, [powerSupplyFormData.categoryId]);

  useEffect(() => {
    if (powerSupplyFormData.categoryId) {
      const fetchData = async () => {
        try {
          // Build URL with categoryId and optional subCategoryId
          let url = `/api/admin/territory-categories/filter?categoryId=${powerSupplyFormData.categoryId}`;
          if (powerSupplyFormData.subCategoryId) {
            url += `&subCategoryId=${powerSupplyFormData.subCategoryId}`;
          }
          
          const response = await fetch(url, {
            credentials: "include",
          });
          const data = await response.json();
          setFilteredPowerSupplyTerritoryCategories(data.territoryCategories || []);
        } catch (error) {
          console.error("Error fetching filtered territory categories:", error);
          setFilteredPowerSupplyTerritoryCategories([]);
        }
      };
      fetchData();
    } else {
      setFilteredPowerSupplyTerritoryCategories([]);
    }
  }, [powerSupplyFormData.categoryId, powerSupplyFormData.subCategoryId]);

  const handlePowerSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/quotation-settings/power-supply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(powerSupplyFormData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to save Power Supply setting");
        return;
      }

      toast.success("Power Supply setting saved!");
      setPowerSupplyFormData({ cameraTypeId: "", categoryId: "", subCategoryId: "", territoryCategoryIds: [] });
      fetchPowerSupplySettings();
    } catch (error: any) {
      console.error("Error saving Power Supply setting:", error);
      toast.error("Failed to save Power Supply setting");
    }
  };

  const handleDeletePowerSupply = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Power Supply setting?")) return;
    
    try {
      const response = await fetch(`/api/admin/quotation-settings/power-supply/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Failed to delete Power Supply setting");
        return;
      }

      toast.success("Power Supply setting deleted!");
      fetchPowerSupplySettings();
    } catch (error) {
      console.error("Error deleting Power Supply setting:", error);
      toast.error("Failed to delete Power Supply setting");
    }
  };

  // Wiring Handlers
  const handleWiringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingWiringId
        ? `/api/admin/quotation-settings/wiring/${editingWiringId}`
        : "/api/admin/quotation-settings/wiring";
      const method = editingWiringId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          categoryId: wiringFormData.categoryId,
          cableName: wiringFormData.cableName,
          pricePerMeter: totalPricePerMeter, // Store total (wire price + wiring charge)
          wirePricePerMeter: wiringFormData.wirePricePerMeter || "0",
          wiringChargePerMeter: wiringFormData.wiringChargePerMeter || "0",
          shortDetail: wiringFormData.shortDetail || "",
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || "Failed to save wiring";
        toast.error(errorMsg);
        
        // Show detailed error if schema mismatch
        if (errorMsg.includes("schema mismatch") || errorMsg.includes("Unknown argument")) {
          console.error("Schema needs update. Run: npx prisma db push");
          toast.error("Database schema needs update. Please contact admin or run: npx prisma db push", { duration: 6000 });
        }
        return;
      }

      toast.success(editingWiringId ? "Wiring updated!" : "Wiring created!");
      setWiringFormData({ categoryId: "", cableName: "", wirePricePerMeter: "", wiringChargePerMeter: "", shortDetail: "" });
      setEditingWiringId(null);
      fetchWirings();
    } catch (error: any) {
      console.error("Error saving wiring:", error);
      toast.error("Failed to save wiring");
    }
  };

  const handleEditWiring = (wiring: any) => {
    setEditingWiringId(wiring.id);
    // If wiring has separate fields, use them; otherwise split pricePerMeter
    setWiringFormData({
      categoryId: wiring.categoryId,
      cableName: wiring.cableName,
      wirePricePerMeter: wiring.wirePricePerMeter?.toString() || wiring.pricePerMeter?.toString() || "0",
      wiringChargePerMeter: wiring.wiringChargePerMeter?.toString() || "0",
      shortDetail: wiring.shortDetail || "",
    });
  };

  const handleDeleteWiring = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wiring?")) return;
    
    try {
      const response = await fetch(`/api/admin/quotation-settings/wiring/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Failed to delete wiring");
        return;
      }

      toast.success("Wiring deleted!");
      fetchWirings();
    } catch (error) {
      console.error("Error deleting wiring:", error);
      toast.error("Failed to delete wiring");
    }
  };

  // Installation Handlers
  const handleInstallationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingInstallationId
        ? `/api/admin/quotation-settings/installation/${editingInstallationId}`
        : "/api/admin/quotation-settings/installation";
      const method = editingInstallationId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...installationFormData,
          maxCableLength: parseFloat(installationFormData.maxCableLength),
          ratePerCamera: parseFloat(installationFormData.ratePerCamera),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to save installation");
        return;
      }

      toast.success(editingInstallationId ? "Installation updated!" : "Installation created!");
      setInstallationFormData({ categoryId: "", maxCableLength: "90", ratePerCamera: "" });
      setEditingInstallationId(null);
      fetchInstallations();
    } catch (error: any) {
      console.error("Error saving installation:", error);
      toast.error("Failed to save installation");
    }
  };

  const handleEditInstallation = (installation: any) => {
    setEditingInstallationId(installation.id);
    setInstallationFormData({
      categoryId: installation.categoryId,
      maxCableLength: installation.maxCableLength.toString(),
      ratePerCamera: installation.ratePerCamera.toString(),
    });
  };

  const handleDeleteInstallation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this installation?")) return;
    
    try {
      const response = await fetch(`/api/admin/quotation-settings/installation/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Failed to delete installation");
        return;
      }

      toast.success("Installation deleted!");
      fetchInstallations();
    } catch (error) {
      console.error("Error deleting installation:", error);
      toast.error("Failed to delete installation");
    }
  };

  // Accessories Settings Handlers
  const handleAddAccessoriesItem = () => {
    setAccessoriesFormData({
      ...accessoriesFormData,
      items: [...accessoriesFormData.items, { itemName: "", quantity: "", rate: "", isCableLengthBased: false, maxCableInMeter: "" }],
    });
  };

  const handleAddCableLengthBasedItem = () => {
    setAccessoriesFormData({
      ...accessoriesFormData,
      items: [...accessoriesFormData.items, { itemName: "", quantity: "", rate: "", isCableLengthBased: true, maxCableInMeter: "" }],
    });
  };

  const handleRemoveAccessoriesItem = (index: number) => {
    const newItems = accessoriesFormData.items.filter((_, i) => i !== index);
    setAccessoriesFormData({
      ...accessoriesFormData,
      items: newItems,
    });
  };

  const handleUpdateAccessoriesItem = (index: number, field: string, value: string | boolean) => {
    const newItems = [...accessoriesFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setAccessoriesFormData({
      ...accessoriesFormData,
      items: newItems,
    });
  };

  const handleAccessoriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessoriesFormData.cameraTypeId) {
      toast.error("Please select a camera type");
      return;
    }

    if (accessoriesFormData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    // Validate all items
    for (const item of accessoriesFormData.items) {
      if (!item.itemName.trim()) {
        toast.error("Item name is required for all items");
        return;
      }
      if (!item.quantity || parseInt(item.quantity) <= 0) {
        toast.error("Valid quantity is required for all items");
        return;
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        toast.error("Valid rate is required for all items");
        return;
      }
      // Validate cable length for cable-length based items
      if (item.isCableLengthBased && (!item.maxCableInMeter || item.maxCableInMeter.trim() === "" || parseFloat(item.maxCableInMeter) <= 0)) {
        toast.error("Valid maximum cable length (in meters) is required for cable-length based items");
        return;
      }
    }

    try {
      const url = editingAccessoriesId
        ? `/api/admin/quotation-settings/accessories/${editingAccessoriesId}`
        : "/api/admin/quotation-settings/accessories";
      const method = editingAccessoriesId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cameraTypeId: accessoriesFormData.cameraTypeId,
          items: accessoriesFormData.items,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to save accessories setting");
        return;
      }

      toast.success(editingAccessoriesId ? "Accessories setting updated!" : "Accessories setting saved!");
      setAccessoriesFormData({ cameraTypeId: "", items: [] });
      setEditingAccessoriesId(null);
      fetchAccessoriesSettings();
    } catch (error: any) {
      console.error("Error saving accessories setting:", error);
      toast.error("Failed to save accessories setting");
    }
  };

  const handleEditAccessories = (setting: any) => {
    setEditingAccessoriesId(setting.id);
    setAccessoriesFormData({
      cameraTypeId: setting.cameraTypeId,
      items: setting.items.map((item: any) => ({
        itemName: item.itemName,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        isCableLengthBased: item.isCableLengthBased || false,
        maxCableInMeter: item.maxCableInMeter ? item.maxCableInMeter.toString() : "",
      })),
    });
  };

  const handleDeleteAccessories = async (id: string) => {
    if (!confirm("Are you sure you want to delete this accessories setting?")) return;
    
    try {
      const response = await fetch(`/api/admin/quotation-settings/accessories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Failed to delete accessories setting");
        return;
      }

      toast.success("Accessories setting deleted!");
      fetchAccessoriesSettings();
    } catch (error) {
      console.error("Error deleting accessories setting:", error);
      toast.error("Failed to delete accessories setting");
    }
  };

  // Bitrate Settings Handlers
  useEffect(() => {
    if (bitrateFormData.cameraTypeIds.length > 0) {
      // Fetch all territory categories that are enabled for quotation
      const fetchData = async () => {
        try {
          const response = await fetch("/api/admin/territory-categories", {
            credentials: "include",
          });
          const data = await response.json();
          setFilteredBitrateTerritoryCategories(
            (data.territoryCategories || []).filter((tc: any) => tc.enableForQuotation && tc.active)
          );
        } catch (error) {
          console.error("Error fetching territory categories:", error);
          setFilteredBitrateTerritoryCategories([]);
        }
      };
      fetchData();
    } else {
      setFilteredBitrateTerritoryCategories([]);
    }
  }, [bitrateFormData.cameraTypeIds]);

  const handleBitrateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bitrateFormData.cameraTypeIds.length === 0) {
      toast.error("Please select at least one camera type");
      return;
    }

    if (bitrateTerritoryItems.length === 0) {
      toast.error("Please add at least one territory category with bitrate");
      return;
    }

    // Validate all items
    for (const item of bitrateTerritoryItems) {
      if (!item.territoryCategoryId) {
        toast.error("Territory category is required for all items");
        return;
      }
      if (!item.bitrate || parseFloat(item.bitrate) <= 0) {
        toast.error("Valid bitrate (kbps) is required for all territory categories");
        return;
      }
    }

    try {
      const territoryCategories = bitrateTerritoryItems.map((item) => ({
        territoryCategoryId: item.territoryCategoryId,
        bitrate: item.bitrate,
      }));

      if (editingBitrateId) {
        // Update existing setting (single camera type)
        const url = `/api/admin/quotation-settings/bitrate/${editingBitrateId}`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            cameraTypeId: bitrateFormData.cameraTypeIds[0], // For edit, use first selected
            territoryCategories: territoryCategories,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          toast.error(data.error || "Failed to update bitrate setting");
          return;
        }

        toast.success("Bitrate setting updated!");
        setBitrateFormData({ cameraTypeIds: [] });
        setBitrateTerritoryItems([]);
        setCurrentBitrateTerritoryCategory("");
        setCurrentBitrate("");
        setEditingBitrateId(null);
        fetchBitrateSettings();
      } else {
        // Create new settings for each camera type
        const promises = bitrateFormData.cameraTypeIds.map((cameraTypeId) => {
          return fetch("/api/admin/quotation-settings/bitrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              cameraTypeId: cameraTypeId,
              territoryCategories: territoryCategories,
            }),
          });
        });

        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map((r) => r.json()));

        const failed = results.some((data, index) => !responses[index].ok);
        if (failed) {
          const errors = results
            .filter((data, index) => !responses[index].ok)
            .map((data) => data.error || "Failed to save")
            .join(", ");
          toast.error(`Some settings failed to save: ${errors}`);
        } else {
          toast.success(`Bitrate settings saved for ${bitrateFormData.cameraTypeIds.length} camera type(s)!`);
        }

        setBitrateFormData({ cameraTypeIds: [] });
        setBitrateTerritoryItems([]);
        setCurrentBitrateTerritoryCategory("");
        setCurrentBitrate("");
        fetchBitrateSettings();
      }
    } catch (error: any) {
      console.error("Error saving bitrate setting:", error);
      toast.error("Failed to save bitrate setting");
    }
  };

  const handleEditBitrate = (setting: any) => {
    setEditingBitrateId(setting.id);
    setBitrateFormData({
      cameraTypeIds: [setting.cameraTypeId], // For edit, show single camera type
    });
    setBitrateTerritoryItems(
      setting.territoryCategories.map((tc: any) => ({
        territoryCategoryId: tc.territoryCategoryId,
        territoryCategoryName: tc.territoryCategory?.name || "",
        bitrate: tc.bitrate.toString(),
      }))
    );
  };

  const handleDeleteBitrate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bitrate setting?")) return;
    
    try {
      const response = await fetch(`/api/admin/quotation-settings/bitrate/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Failed to delete bitrate setting");
        return;
      }

      toast.success("Bitrate setting deleted!");
      fetchBitrateSettings();
    } catch (error) {
      console.error("Error deleting bitrate setting:", error);
      toast.error("Failed to delete bitrate setting");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
          <p className="text-dark-blue">Loading quotation settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-full overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-blue mb-2">Quotation Settings</h1>
        <p className="text-light-gray">Configure quotation page settings, wiring, and installation rates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-lavender-light overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary-blue scrollbar-track-gray-100">
        {[
          { id: "overview", label: "Overview", icon: Eye },
          { id: "hdd", label: "HDD Settings", icon: HardDrive },
          { id: "recording-device", label: "Recording Device", icon: Monitor },
          { id: "power-supply", label: "Power Supply", icon: Zap },
          { id: "accessories", label: "Accessories Configuration", icon: Package },
          { id: "bitrate", label: "Bitrate (kbps) Configuration", icon: TrendingUp },
          { id: "wiring", label: "Wiring Settings", icon: Cable },
          { id: "installation", label: "Installation Rates", icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary-blue text-primary-blue"
                  : "border-transparent text-light-gray hover:text-dark-blue"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Brands Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Tag className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Brands Showing in Quotation</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 border border-lavender-light rounded-lg hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-dark-blue">{brand.name}</p>
                  <p className="text-sm text-light-gray mt-1">{brands.length} brands enabled</p>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-light-gray mt-4">
              Total: {brands.length} brands enabled for quotation
            </p>
          </div>

          {/* Categories Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Camera Types Showing in Quotation</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 border border-lavender-light rounded-lg hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-dark-blue">{category.name}</p>
                  <p className="text-sm text-light-gray mt-1">
                    {category.subCategories?.length || 0} subcategories
                  </p>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-light-gray mt-4">
              Total: {categories.length} categories enabled for quotation
            </p>
          </div>

          {/* Resolution Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Resolutions Showing in Quotation</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {territoryCategories.map((tc) => (
                <motion.div
                  key={tc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 border border-lavender-light rounded-lg text-center hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-dark-blue text-sm">{tc.name}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-light-gray mt-4">
              Total: {territoryCategories.length} resolutions enabled for quotation
            </p>
          </div>

          {/* HDD Settings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">HDD Settings</h2>
            </div>
            {hddSettings.length === 0 ? (
              <p className="text-light-gray">No HDD settings configured</p>
            ) : (
              <div className="space-y-3">
                {hddSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <p className="font-semibold text-dark-blue mb-2">
                      {setting.category?.name} → {setting.subCategory?.name}
                    </p>
                    {setting.territoryCategories && setting.territoryCategories.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        <span className="text-sm text-light-gray font-semibold">Territory Categories:</span>
                        <div className="flex flex-wrap gap-2">
                        {setting.territoryCategories.map((tc: any) => (
                            <div
                              key={tc.territoryCategory?.id || tc.id}
                              className="px-3 py-2 bg-lavender-light text-primary-blue rounded-md text-sm"
                            >
                              <span className="font-semibold">{tc.territoryCategory?.name || tc.name}</span>
                              {(tc.capacityGB || tc.capacityTB) && (
                                <div className="text-xs text-light-gray mt-1">
                                  {tc.capacityGB && <span>{tc.capacityGB} GB</span>}
                                  {tc.capacityGB && tc.capacityTB && <span> / </span>}
                                  {tc.capacityTB && <span>{tc.capacityTB} TB</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-light-gray">All territory categories</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {hddSettings.length} HDD configuration{hddSettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured in "HDD Settings" tab. Uses Category, Sub Category, and Territory Categories with capacity (GB/TB).<br/>
                <strong>Usage:</strong> Used in Quotation page for HDD storage calculation. When user selects HDD or enters recording days, this data calculates recording days or suggests HDD capacity.
              </p>
            </div>
          </div>

          {/* Recording Device Settings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Recording Device Settings</h2>
            </div>
            {recordingDeviceSettings.length === 0 ? (
              <p className="text-light-gray">No Recording Device settings configured</p>
            ) : (
              <div className="space-y-3">
                {recordingDeviceSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <p className="font-semibold text-dark-blue mb-2">
                      Camera Type: {setting.cameraType?.name} → Category: {setting.category?.name} → Sub Category: {setting.subCategory?.name}
                    </p>
                    {setting.territoryCategories && setting.territoryCategories.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-light-gray font-semibold">Territory Categories: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {setting.territoryCategories.map((tc: any) => (
                            <span
                              key={tc.territoryCategory?.id || tc.id}
                              className="px-2 py-1 bg-lavender-light text-primary-blue rounded text-sm"
                            >
                              {tc.territoryCategory?.name || tc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {recordingDeviceSettings.length} Recording Device configuration{recordingDeviceSettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured in "Recording Device" tab. Uses Camera Type, Category, Sub Category, and Territory Categories.<br/>
                <strong>Usage:</strong> Used in Quotation page to filter and suggest recording devices (DVR/NVR) based on camera type, resolution, and total cameras.
              </p>
            </div>
          </div>

          {/* Power Supply Settings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Power Supply Settings</h2>
            </div>
            {powerSupplySettings.length === 0 ? (
              <p className="text-light-gray">No Power Supply settings configured</p>
            ) : (
              <div className="space-y-3">
                {powerSupplySettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <p className="font-semibold text-dark-blue mb-2">
                      Camera Type: {setting.cameraType?.name} → Category: {setting.category?.name}
                      {setting.subCategory && ` → Sub Category: ${setting.subCategory.name}`}
                    </p>
                    {setting.territoryCategories && setting.territoryCategories.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-light-gray font-semibold">Territory Categories: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {setting.territoryCategories.map((tc: any) => (
                            <span
                              key={tc.territoryCategory?.id || tc.id}
                              className="px-2 py-1 bg-lavender-light text-primary-blue rounded text-sm"
                            >
                              {tc.territoryCategory?.name || tc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {powerSupplySettings.length} Power Supply configuration{powerSupplySettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured in "Power Supply" tab. Uses Camera Type, Category, Territory Categories (Megapixel), Max Camera Supported, and Max Wire in Meter.<br/>
                <strong>Usage:</strong> Used in Quotation page to auto-calculate and suggest power supply based on brand, camera type, megapixel, total cameras, and wire length.
              </p>
            </div>
          </div>

          {/* Accessories Settings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Accessories Configuration</h2>
            </div>
            {accessoriesSettings.length === 0 ? (
              <p className="text-light-gray">No Accessories configurations added</p>
            ) : (
              <div className="space-y-3">
                {accessoriesSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <p className="font-semibold text-dark-blue mb-2">
                      Camera Type: {setting.cameraType?.name || "N/A"}
                    </p>
                    {setting.items && setting.items.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-light-gray font-semibold">Items: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {setting.items.map((item: any, index: number) => (
                            <span
                              key={item.id || index}
                              className="px-2 py-1 bg-lavender-light text-primary-blue rounded text-sm"
                            >
                              {item.itemName} {item.isCableLengthBased && `(Cable ≤ ${item.maxCableInMeter}m)`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {accessoriesSettings.length} accessories configuration{accessoriesSettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured in "Accessories Configuration" tab. Uses Camera Type and Items (Item Name, Quantity, Rate). Can be normal items or cable length-based items.<br/>
                <strong>Usage:</strong> Used in Quotation page to auto-add accessories based on camera type and cable length. Normal items are multiplied by total cameras, cable length-based items are selected based on user's cable length.
              </p>
            </div>
          </div>

          {/* Bitrate Settings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Bitrate (kbps) Configuration</h2>
            </div>
            {bitrateSettings.length === 0 ? (
              <p className="text-light-gray">No Bitrate configurations added</p>
            ) : (
              <div className="space-y-3">
                {bitrateSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <p className="font-semibold text-dark-blue mb-2">
                      Camera Type: {setting.cameraType?.name || "N/A"}
                    </p>
                    {setting.territoryCategories && setting.territoryCategories.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-light-gray font-semibold">Territory Categories: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {setting.territoryCategories.map((tc: any, index: number) => (
                            <span
                              key={tc.id || index}
                              className="px-2 py-1 bg-lavender-light text-primary-blue rounded text-sm"
                            >
                              {tc.territoryCategory?.name || "N/A"} ({tc.bitrate} kbps)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {bitrateSettings.length} bitrate configuration{bitrateSettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured in "Bitrate (kbps) Configuration" tab. Uses Camera Type (multiple selection) and Territory Category wise Bitrate (kbps).<br/>
                <strong>Usage:</strong> Used in Quotation page to calculate recording days. Bitrate is used with HDD capacity, total cameras, and resolution to calculate how many days of recording the selected HDD can store.
              </p>
            </div>
          </div>

          {/* Wiring Settings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cable className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Wiring Settings</h2>
            </div>
            {wirings.length === 0 ? (
              <p className="text-light-gray">No wiring settings configured</p>
            ) : (
              <div className="space-y-3">
                {wirings.map((wiring) => (
                  <div
                    key={wiring.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <p className="font-semibold text-dark-blue mb-2">
                      {wiring.category?.name} - {wiring.cableName}
                    </p>
                    <p className="text-sm text-light-gray">
                      Price: ₹{wiring.pricePerMeter}/meter
                      {wiring.wirePricePerMeter && ` (Wire: ₹${wiring.wirePricePerMeter}/meter`}
                      {wiring.wiringChargePerMeter && `, Wiring Charge: ₹${wiring.wiringChargePerMeter}/meter)`}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {wirings.length} wiring configuration{wirings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured in "Wiring Settings" tab. Uses Category, Cable Name, Wire Price Per Meter, and Wiring Charge Per Meter.<br/>
                <strong>Usage:</strong> Used in Quotation page to calculate cable/wiring costs based on user's input cable length in meters. Shows separate cable price and wiring charge when length exceeds installation max length.
              </p>
            </div>
          </div>

          {/* Installation Rates Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="w-6 h-6 text-primary-blue" />
              <h2 className="text-xl font-bold text-dark-blue">Installation Rates</h2>
            </div>
            {installations.length === 0 ? (
              <p className="text-light-gray">No installation rates configured</p>
            ) : (
              <div className="space-y-3">
                {installations.map((installation) => (
                  <div
                    key={installation.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <p className="font-semibold text-dark-blue mb-2">
                      {installation.category?.name} - Max Length: {installation.maxCableLength}m
                    </p>
                    <p className="text-sm text-light-gray">
                      Rate: ₹{installation.rate}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {installations.length} installation rate{installations.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured in "Installation Rates" tab. Uses Category and Max Cable Length (meters) with Rate.<br/>
                <strong>Usage:</strong> Used in Quotation page to determine if user's cable length exceeds the maximum installation length. When exceeded, shows separate cable price and wiring charge breakdown.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* HDD Settings Tab */}
      {activeTab === "hdd" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* HDD Settings Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-dark-blue mb-4 flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-primary-blue" />
              Configure HDD Section
            </h2>
            <form onSubmit={handleHddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={hddFormData.categoryId}
                    onChange={(e) => {
                      setHddFormData({
                        ...hddFormData,
                        categoryId: e.target.value,
                        subCategoryId: "",
                        territoryCategoryIds: [],
                      });
                      setHddTerritoryItems([]);
                      setCurrentTerritoryCategory("");
                      setCurrentCapacityGB("");
                      setCurrentCapacityTB("");
                    }}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    required
                  >
                    <option value="">Select Category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Sub Category</Label>
                  <select
                    value={hddFormData.subCategoryId}
                    onChange={(e) => {
                      setHddFormData({
                        ...hddFormData,
                        subCategoryId: e.target.value,
                        territoryCategoryIds: [],
                      });
                      setHddTerritoryItems([]);
                      setCurrentTerritoryCategory("");
                      setCurrentCapacityGB("");
                      setCurrentCapacityTB("");
                    }}
                    disabled={!hddFormData.categoryId}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md disabled:bg-gray-100"
                    required
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {hddFormData.categoryId && hddFormData.subCategoryId && (
                <div className="space-y-4">
                <div>
                    <Label>Territory Category</Label>
                    <select
                      value={currentTerritoryCategory}
                      onChange={(e) => setCurrentTerritoryCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-lavender-light rounded-md mt-1"
                    >
                      <option value="">Select Territory Category</option>
                      {filteredTerritoryCategories
                        .filter((tc) => !hddTerritoryItems.some((item) => item.territoryCategoryId === tc.id))
                        .map((tc) => (
                          <option key={tc.id} value={tc.id}>
                            {tc.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {currentTerritoryCategory && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Capacity (GB)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter capacity in GB"
                          value={currentCapacityGB}
                          onChange={(e) => setCurrentCapacityGB(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Capacity (TB)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter capacity in TB"
                          value={currentCapacityTB}
                          onChange={(e) => setCurrentCapacityTB(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {currentTerritoryCategory && (
                    <Button
                        type="button"
                        onClick={() => {
                        const selectedTC = filteredTerritoryCategories.find(
                          (tc) => tc.id === currentTerritoryCategory
                        );
                        if (selectedTC && (currentCapacityGB || currentCapacityTB)) {
                          setHddTerritoryItems([
                            ...hddTerritoryItems,
                            {
                              territoryCategoryId: currentTerritoryCategory,
                              territoryCategoryName: selectedTC.name,
                              capacityGB: currentCapacityGB,
                              capacityTB: currentCapacityTB,
                            },
                          ]);
                          setCurrentTerritoryCategory("");
                          setCurrentCapacityGB("");
                          setCurrentCapacityTB("");
                          } else {
                          toast.error("Please enter at least one capacity value (GB or TB)");
                        }
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Territory Category
                    </Button>
                  )}

                  {hddTerritoryItems.length > 0 && (
                    <div className="border border-lavender-light rounded-md p-4 space-y-2">
                      <Label className="text-sm font-semibold">Added Territory Categories:</Label>
                      {hddTerritoryItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-lavender-light rounded-md"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-dark-blue">{item.territoryCategoryName}</p>
                            <div className="flex gap-4 mt-1">
                              {item.capacityGB && (
                                <span className="text-sm text-light-gray">
                                  Capacity: {item.capacityGB} GB
                                </span>
                              )}
                              {item.capacityTB && (
                                <span className="text-sm text-light-gray">
                                  Capacity: {item.capacityTB} TB
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setHddTerritoryItems(
                                hddTerritoryItems.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button 
                type="submit" 
                disabled={!hddFormData.categoryId || !hddFormData.subCategoryId || hddTerritoryItems.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add HDD Setting
              </Button>
            </form>
          </div>

          {/* HDD Settings List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Current HDD Settings</h3>
            {hddSettings.length === 0 ? (
              <p className="text-light-gray">No HDD settings configured</p>
            ) : (
              <div className="space-y-3">
                {hddSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-dark-blue">
                          {setting.category?.name} → {setting.subCategory?.name}
                        </p>
                        {setting.territoryCategories && setting.territoryCategories.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            <span className="text-sm text-light-gray font-semibold">Territory Categories:</span>
                            <div className="flex flex-wrap gap-2">
                            {setting.territoryCategories.map((tc: any) => (
                                <div
                                key={tc.territoryCategory?.id || tc.id}
                                  className="px-3 py-2 bg-lavender-light text-primary-blue rounded-md text-sm"
                                >
                                  <span className="font-semibold">{tc.territoryCategory?.name || tc.name}</span>
                                  {(tc.capacityGB || tc.capacityTB) && (
                                    <div className="text-xs text-light-gray mt-1">
                                      {tc.capacityGB && <span>{tc.capacityGB} GB</span>}
                                      {tc.capacityGB && tc.capacityTB && <span> / </span>}
                                      {tc.capacityTB && <span>{tc.capacityTB} TB</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-light-gray mt-1">All territory categories</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteHdd(setting.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured here in "HDD Settings" tab. Uses Category, Sub Category, and Territory Categories with capacity (GB/TB).<br/>
                <strong>Usage:</strong> Used in Quotation page for HDD storage calculation. When user selects HDD or enters recording days, this data calculates recording days or suggests HDD capacity based on Bitrate Configuration.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recording Device Settings Tab */}
      {activeTab === "recording-device" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Recording Device Settings Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-dark-blue mb-4 flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary-blue" />
              Configure Recording Device
            </h2>
            <form onSubmit={handleRecordingDeviceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select Camera Type *</Label>
                  <select
                    value={recordingDeviceFormData.cameraTypeId}
                    onChange={(e) => {
                      setRecordingDeviceFormData({
                        ...recordingDeviceFormData,
                        cameraTypeId: e.target.value,
                        categoryId: "",
                        subCategoryId: "",
                        territoryCategoryIds: [],
                      });
                    }}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    required
                  >
                    <option value="">Select Camera Type</option>
                    {allCategories
                      .filter((cat) => cat.enableForQuotation)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <select
                    value={recordingDeviceFormData.categoryId}
                    onChange={(e) => {
                      setRecordingDeviceFormData({
                        ...recordingDeviceFormData,
                        categoryId: e.target.value,
                        subCategoryId: "",
                        territoryCategoryIds: [],
                      });
                    }}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    required
                  >
                    <option value="">Select Category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Sub Category *</Label>
                  <select
                    value={recordingDeviceFormData.subCategoryId}
                    onChange={(e) => {
                      setRecordingDeviceFormData({
                        ...recordingDeviceFormData,
                        subCategoryId: e.target.value,
                        territoryCategoryIds: [],
                      });
                    }}
                    disabled={!recordingDeviceFormData.categoryId}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md disabled:bg-gray-100"
                    required
                  >
                    <option value="">Select Sub Category</option>
                    {recordingDeviceSubCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {recordingDeviceFormData.categoryId && recordingDeviceFormData.subCategoryId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Territory Categories (Select Multiple) *</Label>
                    {filteredRecordingDeviceTerritoryCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = filteredRecordingDeviceTerritoryCategories.every((tc) =>
                            recordingDeviceFormData.territoryCategoryIds.includes(tc.id)
                          );
                          if (allSelected) {
                            setRecordingDeviceFormData({ ...recordingDeviceFormData, territoryCategoryIds: [] });
                          } else {
                            setRecordingDeviceFormData({
                              ...recordingDeviceFormData,
                              territoryCategoryIds: filteredRecordingDeviceTerritoryCategories.map((tc) => tc.id),
                            });
                          }
                        }}
                        className="text-sm text-primary-blue hover:underline"
                      >
                        {filteredRecordingDeviceTerritoryCategories.every((tc) =>
                          recordingDeviceFormData.territoryCategoryIds.includes(tc.id)
                        )
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    )}
                  </div>
                  {filteredRecordingDeviceTerritoryCategories.length === 0 ? (
                    <p className="text-sm text-light-gray p-3 border border-lavender-light rounded-md">
                      No territory categories available for this category/subcategory combination
                    </p>
                  ) : (
                    <div className="border border-lavender-light rounded-md p-4 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {filteredRecordingDeviceTerritoryCategories.map((tc) => (
                          <label
                            key={tc.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-lavender-light p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={recordingDeviceFormData.territoryCategoryIds.includes(tc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRecordingDeviceFormData({
                                    ...recordingDeviceFormData,
                                    territoryCategoryIds: [...recordingDeviceFormData.territoryCategoryIds, tc.id],
                                  });
                                } else {
                                  setRecordingDeviceFormData({
                                    ...recordingDeviceFormData,
                                    territoryCategoryIds: recordingDeviceFormData.territoryCategoryIds.filter(
                                      (id) => id !== tc.id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary-blue border-lavender-light rounded focus:ring-primary-blue"
                            />
                            <span className="text-sm text-dark-blue">{tc.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" disabled={!recordingDeviceFormData.categoryId || !recordingDeviceFormData.subCategoryId || recordingDeviceFormData.territoryCategoryIds.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Recording Device Setting
              </Button>
            </form>
          </div>

          {/* Recording Device Settings List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Current Recording Device Settings</h3>
            {recordingDeviceSettings.length === 0 ? (
              <p className="text-light-gray">No Recording Device settings configured</p>
            ) : (
              <div className="space-y-3">
                {recordingDeviceSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-dark-blue">
                          {setting.category?.name} → {setting.subCategory?.name}
                        </p>
                        {setting.cameraType && (
                          <p className="text-sm text-dark-blue mt-1">
                            Camera Type: <span className="font-semibold">{setting.cameraType.name}</span>
                          </p>
                        )}
                        {setting.territoryCategories && setting.territoryCategories.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            <span className="text-sm text-light-gray font-semibold">Territory Categories:</span>
                            <div className="flex flex-wrap gap-2">
                              {setting.territoryCategories.map((tc: any) => (
                                <div
                                  key={tc.territoryCategory?.id || tc.id}
                                  className="px-3 py-2 bg-lavender-light text-primary-blue rounded-md text-sm"
                                >
                                  <span className="font-semibold">{tc.territoryCategory?.name || tc.name}</span>
                                  {(tc.capacityGB || tc.capacityTB) && (
                                    <div className="text-xs text-light-gray mt-1">
                                      {tc.capacityGB && <span>{tc.capacityGB} GB</span>}
                                      {tc.capacityGB && tc.capacityTB && <span> / </span>}
                                      {tc.capacityTB && <span>{tc.capacityTB} TB</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-light-gray mt-1">All territory categories</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecordingDevice(setting.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {recordingDeviceSettings.length} Recording Device configuration{recordingDeviceSettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured here in "Recording Device" tab. Uses Camera Type, Category, Sub Category, and Territory Categories.<br/>
                <strong>Usage:</strong> Used in Quotation page to filter and suggest recording devices (DVR/NVR) based on camera type, resolution, and total cameras.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Power Supply Settings Tab */}
      {activeTab === "power-supply" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Power Supply Settings Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-dark-blue mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-blue" />
              Configure Power Supply
            </h2>
            <form onSubmit={handlePowerSupplySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select Camera Type *</Label>
                  <select
                    value={powerSupplyFormData.cameraTypeId}
                    onChange={(e) => {
                      setPowerSupplyFormData({
                        ...powerSupplyFormData,
                        cameraTypeId: e.target.value,
                        categoryId: "",
                        subCategoryId: "",
                        territoryCategoryIds: [],
                      });
                    }}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    required
                  >
                    <option value="">Select Camera Type</option>
                    {allCategories
                      .filter((cat) => cat.enableForQuotation)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <select
                    value={powerSupplyFormData.categoryId}
                    onChange={(e) => {
                      setPowerSupplyFormData({
                        ...powerSupplyFormData,
                        categoryId: e.target.value,
                        subCategoryId: "",
                        territoryCategoryIds: [],
                      });
                    }}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    required
                  >
                    <option value="">Select Category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Sub Category</Label>
                  <select
                    value={powerSupplyFormData.subCategoryId}
                    onChange={(e) => {
                      setPowerSupplyFormData({
                        ...powerSupplyFormData,
                        subCategoryId: e.target.value,
                        territoryCategoryIds: [],
                      });
                    }}
                    disabled={!powerSupplyFormData.categoryId}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md disabled:bg-gray-100"
                  >
                    <option value="">Select Sub Category</option>
                    {powerSupplySubCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {powerSupplyFormData.categoryId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Territory Categories (Select Multiple) *</Label>
                    {filteredPowerSupplyTerritoryCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = filteredPowerSupplyTerritoryCategories.every((tc) =>
                            powerSupplyFormData.territoryCategoryIds.includes(tc.id)
                          );
                          if (allSelected) {
                            setPowerSupplyFormData({ ...powerSupplyFormData, territoryCategoryIds: [] });
                          } else {
                            setPowerSupplyFormData({
                              ...powerSupplyFormData,
                              territoryCategoryIds: filteredPowerSupplyTerritoryCategories.map((tc) => tc.id),
                            });
                          }
                        }}
                        className="text-sm text-primary-blue hover:underline"
                      >
                        {filteredPowerSupplyTerritoryCategories.every((tc) =>
                          powerSupplyFormData.territoryCategoryIds.includes(tc.id)
                        )
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    )}
                  </div>
                  {filteredPowerSupplyTerritoryCategories.length === 0 ? (
                    <p className="text-sm text-light-gray p-3 border border-lavender-light rounded-md">
                      No territory categories available for this category/subcategory combination
                    </p>
                  ) : (
                    <div className="border border-lavender-light rounded-md p-4 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {filteredPowerSupplyTerritoryCategories.map((tc) => (
                          <label
                            key={tc.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-lavender-light p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={powerSupplyFormData.territoryCategoryIds.includes(tc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPowerSupplyFormData({
                                    ...powerSupplyFormData,
                                    territoryCategoryIds: [...powerSupplyFormData.territoryCategoryIds, tc.id],
                                  });
                                } else {
                                  setPowerSupplyFormData({
                                    ...powerSupplyFormData,
                                    territoryCategoryIds: powerSupplyFormData.territoryCategoryIds.filter(
                                      (id) => id !== tc.id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary-blue border-lavender-light rounded focus:ring-primary-blue"
                            />
                            <span className="text-sm text-dark-blue">{tc.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" disabled={!powerSupplyFormData.categoryId || powerSupplyFormData.territoryCategoryIds.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Power Supply Setting
              </Button>
            </form>
          </div>

          {/* Power Supply Settings List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Current Power Supply Settings</h3>
            {powerSupplySettings.length === 0 ? (
              <p className="text-light-gray">No Power Supply settings configured</p>
            ) : (
              <div className="space-y-3">
                {powerSupplySettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-dark-blue">
                          {setting.category?.name} → {setting.subCategory?.name}
                        </p>
                        {setting.cameraType && (
                          <p className="text-sm text-dark-blue mt-1">
                            Camera Type: <span className="font-semibold">{setting.cameraType.name}</span>
                          </p>
                        )}
                        {setting.territoryCategories && setting.territoryCategories.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            <span className="text-sm text-light-gray font-semibold">Territory Categories:</span>
                            <div className="flex flex-wrap gap-2">
                            {setting.territoryCategories.map((tc: any) => (
                                <div
                                key={tc.territoryCategory?.id || tc.id}
                                  className="px-3 py-2 bg-lavender-light text-primary-blue rounded-md text-sm"
                                >
                                  <span className="font-semibold">{tc.territoryCategory?.name || tc.name}</span>
                                  {(tc.capacityGB || tc.capacityTB) && (
                                    <div className="text-xs text-light-gray mt-1">
                                      {tc.capacityGB && <span>{tc.capacityGB} GB</span>}
                                      {tc.capacityGB && tc.capacityTB && <span> / </span>}
                                      {tc.capacityTB && <span>{tc.capacityTB} TB</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-light-gray mt-1">All territory categories</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePowerSupply(setting.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {powerSupplySettings.length} Power Supply configuration{powerSupplySettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured here in "Power Supply" tab. Uses Camera Type, Category, Territory Categories (Megapixel), Max Camera Supported, and Max Wire in Meter.<br/>
                <strong>Usage:</strong> Used in Quotation page to auto-calculate and suggest power supply based on brand, camera type, megapixel, total cameras, and wire length.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Accessories Configuration Tab */}
      {activeTab === "accessories" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Accessories Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-dark-blue mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-blue" />
              {editingAccessoriesId ? "Edit Accessories Configuration" : "Configure Accessories"}
            </h2>
            <form onSubmit={handleAccessoriesSubmit} className="space-y-4">
              <div>
                <Label>Camera Type (Category) *</Label>
                <select
                  value={accessoriesFormData.cameraTypeId}
                  onChange={(e) => setAccessoriesFormData({ ...accessoriesFormData, cameraTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-lavender-light rounded-md"
                  required
                  disabled={!!editingAccessoriesId}
                >
                  <option value="">Select Camera Type</option>
                  {allCategories
                    .filter((cat) => cat.enableForQuotation)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-light-gray mt-1">Select a category with enableForQuotation enabled</p>
              </div>

              {/* Items Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">Items *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddAccessoriesItem}
                      disabled={!accessoriesFormData.cameraTypeId}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Normal Item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCableLengthBasedItem}
                      disabled={!accessoriesFormData.cameraTypeId}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                    >
                      <Cable className="w-4 h-4 mr-2" />
                      Add Cable Length Based Item
                    </Button>
                  </div>
                </div>

                {accessoriesFormData.items.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-lavender-light rounded-lg">
                    <p className="text-light-gray">No items added. Click "Add Item" to add accessories.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accessoriesFormData.items.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${
                          item.isCableLengthBased 
                            ? "border-blue-300 bg-blue-50" 
                            : "border-lavender-light bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-dark-blue">Item {index + 1}</h4>
                            {item.isCableLengthBased && (
                              <span className="px-2 py-1 text-xs font-semibold bg-blue-200 text-blue-800 rounded">
                                Cable Length Based
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAccessoriesItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {item.isCableLengthBased && (
                          <div className="mb-4">
                            <Label>Maximum Cable Length (Meters) *</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="e.g., 90"
                              value={item.maxCableInMeter || ""}
                              onChange={(e) => handleUpdateAccessoriesItem(index, "maxCableInMeter", e.target.value)}
                              required
                              className="bg-white"
                            />
                            <p className="text-xs text-light-gray mt-1">
                              Enter the maximum cable length in meters for this item (e.g., 90 meters)
                            </p>
                          </div>
                        )}
                        <div className={`grid gap-4 ${item.isCableLengthBased ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-3"}`}>
                          <div>
                            <Label>Item Name *</Label>
                            <Input
                              type="text"
                              placeholder={item.isCableLengthBased ? "e.g., Wire Clip 5mm" : "e.g., Connector, Cable, etc."}
                              value={item.itemName}
                              onChange={(e) => handleUpdateAccessoriesItem(index, "itemName", e.target.value)}
                              required
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder={item.isCableLengthBased ? "e.g., 1 packet" : "1"}
                              value={item.quantity}
                              onChange={(e) => handleUpdateAccessoriesItem(index, "quantity", e.target.value)}
                              required
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label>Rate (₹) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={item.rate}
                              onChange={(e) => handleUpdateAccessoriesItem(index, "rate", e.target.value)}
                              required
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={!accessoriesFormData.cameraTypeId || accessoriesFormData.items.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingAccessoriesId ? "Update" : "Save"} Accessories Configuration
                </Button>
                {editingAccessoriesId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingAccessoriesId(null);
                      setAccessoriesFormData({ cameraTypeId: "", items: [] });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Accessories Settings List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Current Accessories Configurations</h3>
            {accessoriesSettings.length === 0 ? (
              <p className="text-light-gray">No accessories configurations added</p>
            ) : (
              <div className="space-y-4">
                {accessoriesSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-dark-blue mb-2">
                          Camera Type: {setting.cameraType?.name || "N/A"}
                        </p>
                        {setting.items && setting.items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-semibold text-dark-blue mb-2">Items:</p>
                            <div className="space-y-2">
                              {setting.items.map((item: any, index: number) => (
                                <div
                                  key={item.id || index}
                                  className={`p-3 rounded-lg border ${
                                    item.isCableLengthBased 
                                      ? "bg-blue-50 border-blue-300" 
                                      : "bg-gray-50 border-lavender-light"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-dark-blue">{item.itemName}</p>
                                        {item.isCableLengthBased && (
                                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-200 text-blue-800 rounded">
                                            Cable Length Based
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-4 mt-1">
                                        {item.isCableLengthBased && item.maxCableInMeter && (
                                          <span className="text-sm text-light-gray">
                                            Max Cable: <span className="font-semibold text-blue-600">{item.maxCableInMeter} meters</span>
                                          </span>
                                        )}
                                        <span className="text-sm text-light-gray">
                                          Quantity: <span className="font-semibold text-dark-blue">{item.quantity}</span>
                                        </span>
                                        <span className="text-sm text-light-gray">
                                          Rate: <span className="font-semibold text-primary-blue">{formatPrice(item.rate)}</span>
                                        </span>
                                        <span className="text-sm text-light-gray">
                                          Total: <span className="font-semibold text-green-600">{formatPrice(item.quantity * item.rate)}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-lavender-light">
                              <p className="text-sm font-semibold text-dark-blue">
                                Grand Total:{" "}
                                <span className="text-primary-blue">
                                  {formatPrice(
                                    setting.items.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0)
                                  )}
                                </span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAccessories(setting)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccessories(setting.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {accessoriesSettings.length} accessories configuration{accessoriesSettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured here in "Accessories Configuration" tab. Uses Camera Type and Items (Item Name, Quantity, Rate). Can be normal items or cable length-based items.<br/>
                <strong>Usage:</strong> Used in Quotation page to auto-add accessories based on camera type and cable length. Normal items are multiplied by total cameras, cable length-based items are selected based on user's cable length.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bitrate Configuration Tab */}
      {activeTab === "bitrate" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Bitrate Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-dark-blue mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-blue" />
              {editingBitrateId ? "Edit Bitrate (kbps) Configuration" : "Configure Bitrate (kbps)"}
            </h2>
            <form onSubmit={handleBitrateSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Camera Type (Category) - Select Multiple *</Label>
                  {allCategories.filter((cat) => cat.enableForQuotation && cat.active).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allEnabled = allCategories
                          .filter((cat) => cat.enableForQuotation && cat.active)
                          .every((cat) => bitrateFormData.cameraTypeIds.includes(cat.id));
                        if (allEnabled) {
                          setBitrateFormData({ ...bitrateFormData, cameraTypeIds: [] });
                        } else {
                          setBitrateFormData({
                            ...bitrateFormData,
                            cameraTypeIds: allCategories
                              .filter((cat) => cat.enableForQuotation && cat.active)
                              .map((cat) => cat.id),
                          });
                        }
                        setBitrateTerritoryItems([]);
                        setCurrentBitrateTerritoryCategory("");
                        setCurrentBitrate("");
                      }}
                      className="text-sm text-primary-blue hover:underline"
                      disabled={!!editingBitrateId}
                    >
                      {allCategories
                        .filter((cat) => cat.enableForQuotation && cat.active)
                        .every((cat) => bitrateFormData.cameraTypeIds.includes(cat.id))
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                <div className="border border-lavender-light rounded-md p-4 max-h-60 overflow-y-auto">
                  {allCategories.filter((cat) => cat.enableForQuotation && cat.active).length === 0 ? (
                    <p className="text-sm text-light-gray">No camera types available</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allCategories
                        .filter((cat) => cat.enableForQuotation && cat.active)
                        .map((cat) => (
                          <label
                            key={cat.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-lavender-light p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={bitrateFormData.cameraTypeIds.includes(cat.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBitrateFormData({
                                    ...bitrateFormData,
                                    cameraTypeIds: [...bitrateFormData.cameraTypeIds, cat.id],
                                  });
                                } else {
                                  setBitrateFormData({
                                    ...bitrateFormData,
                                    cameraTypeIds: bitrateFormData.cameraTypeIds.filter(
                                      (id) => id !== cat.id
                                    ),
                                  });
                                }
                                setBitrateTerritoryItems([]);
                                setCurrentBitrateTerritoryCategory("");
                                setCurrentBitrate("");
                              }}
                              disabled={!!editingBitrateId}
                              className="w-4 h-4 text-primary-blue border-lavender-light rounded focus:ring-primary-blue"
                            />
                            <span className="text-sm text-dark-blue">{cat.name}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
                {bitrateFormData.cameraTypeIds.length > 0 && (
                  <p className="text-xs text-light-gray mt-2">
                    {bitrateFormData.cameraTypeIds.length} camera type(s) selected
                  </p>
                )}
              </div>

              {bitrateFormData.cameraTypeIds.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label>Territory Category</Label>
                    <select
                      value={currentBitrateTerritoryCategory}
                      onChange={(e) => setCurrentBitrateTerritoryCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-lavender-light rounded-md mt-1"
                    >
                      <option value="">Select Territory Category</option>
                      {filteredBitrateTerritoryCategories
                        .filter((tc) => !bitrateTerritoryItems.some((item) => item.territoryCategoryId === tc.id))
                        .map((tc) => (
                          <option key={tc.id} value={tc.id}>
                            {tc.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {currentBitrateTerritoryCategory && (
                    <div>
                      <Label>Bitrate (kbps) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter bitrate in kbps"
                        value={currentBitrate}
                        onChange={(e) => setCurrentBitrate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {currentBitrateTerritoryCategory && (
                    <Button
                      type="button"
                      onClick={() => {
                        const selectedTC = filteredBitrateTerritoryCategories.find(
                          (tc) => tc.id === currentBitrateTerritoryCategory
                        );
                        if (selectedTC && currentBitrate && parseFloat(currentBitrate) > 0) {
                          setBitrateTerritoryItems([
                            ...bitrateTerritoryItems,
                            {
                              territoryCategoryId: currentBitrateTerritoryCategory,
                              territoryCategoryName: selectedTC.name,
                              bitrate: currentBitrate,
                            },
                          ]);
                          setCurrentBitrateTerritoryCategory("");
                          setCurrentBitrate("");
                        } else {
                          toast.error("Please enter a valid bitrate (kbps)");
                        }
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Territory Category
                    </Button>
                  )}

                  {bitrateTerritoryItems.length > 0 && (
                    <div className="border border-lavender-light rounded-md p-4 space-y-2">
                      <Label className="text-sm font-semibold">Added Territory Categories:</Label>
                      {bitrateTerritoryItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-lavender-light rounded-md"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-dark-blue">{item.territoryCategoryName}</p>
                            <p className="text-sm text-light-gray mt-1">
                              Bitrate: {item.bitrate} kbps
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBitrateTerritoryItems(
                                bitrateTerritoryItems.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={bitrateFormData.cameraTypeIds.length === 0 || bitrateTerritoryItems.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingBitrateId ? "Update" : "Save"} Bitrate Configuration
                </Button>
                {editingBitrateId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingBitrateId(null);
                      setBitrateFormData({ cameraTypeIds: [] });
                      setBitrateTerritoryItems([]);
                      setCurrentBitrateTerritoryCategory("");
                      setCurrentBitrate("");
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Bitrate Settings List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Current Bitrate Configurations</h3>
            {bitrateSettings.length === 0 ? (
              <p className="text-light-gray">No bitrate configurations added</p>
            ) : (
              <div className="space-y-4">
                {bitrateSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-dark-blue mb-2">
                          Camera Type: {setting.cameraType?.name || "N/A"}
                        </p>
                        {setting.territoryCategories && setting.territoryCategories.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-semibold text-dark-blue mb-2">Territory Categories:</p>
                            <div className="space-y-2">
                              {setting.territoryCategories.map((tc: any, index: number) => (
                                <div
                                  key={tc.id || index}
                                  className="p-3 rounded-lg border bg-gray-50 border-lavender-light"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-dark-blue">
                                        {tc.territoryCategory?.name || "N/A"}
                                      </p>
                                      <p className="text-sm text-light-gray mt-1">
                                        Bitrate: <span className="font-semibold text-primary-blue">{tc.bitrate} kbps</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBitrate(setting)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBitrate(setting.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {bitrateSettings.length} bitrate configuration{bitrateSettings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured here in "Bitrate (kbps) Configuration" tab. Uses Camera Type (multiple selection) and Territory Category wise Bitrate (kbps).<br/>
                <strong>Usage:</strong> Used in Quotation page to calculate recording days. Bitrate is used with HDD capacity, total cameras, and resolution to calculate how many days of recording the selected HDD can store.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wiring Settings Tab */}
      {activeTab === "wiring" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Wiring Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-dark-blue mb-4 flex items-center gap-2">
              <Cable className="w-6 h-6 text-primary-blue" />
              Configure Wiring Section
            </h2>
            <form onSubmit={handleWiringSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Camera Type (Category) *</Label>
                  <select
                    value={wiringFormData.categoryId}
                    onChange={(e) => setWiringFormData({ ...wiringFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    required
                  >
                    <option value="">Select Camera Type</option>
                    {allCategories
                      .filter((cat) => cat.enableForQuotation)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Cable Name *</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Cat6, Coaxial, etc."
                    value={wiringFormData.cableName}
                    onChange={(e) => setWiringFormData({ ...wiringFormData, cableName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Wire Price Per Meter (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="30"
                    value={wiringFormData.wirePricePerMeter}
                    onChange={(e) => setWiringFormData({ ...wiringFormData, wirePricePerMeter: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Wiring Charge Per Meter (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="20"
                    value={wiringFormData.wiringChargePerMeter}
                    onChange={(e) => setWiringFormData({ ...wiringFormData, wiringChargePerMeter: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Total Price Per Meter (₹)</Label>
                  <div className="w-full px-3 py-2 border border-lavender-light rounded-md bg-gray-50 font-semibold text-primary-blue">
                    {totalPricePerMeter.toFixed(2)}
                  </div>
                  <p className="text-xs text-light-gray mt-1">Auto-calculated (Wire Price + Wiring Charge)</p>
                </div>
                <div>
                  <Label>Short Detail</Label>
                  <Input
                    type="text"
                    placeholder="Brief description"
                    value={wiringFormData.shortDetail}
                    onChange={(e) => setWiringFormData({ ...wiringFormData, shortDetail: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={!wiringFormData.categoryId || !wiringFormData.cableName || !wiringFormData.wirePricePerMeter || !wiringFormData.wiringChargePerMeter}>
                  <Plus className="w-4 h-4 mr-2" />
                  {editingWiringId ? "Update" : "Add"} Wiring Configuration
                </Button>
                {editingWiringId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingWiringId(null);
                      setWiringFormData({ categoryId: "", cableName: "", wirePricePerMeter: "", wiringChargePerMeter: "", shortDetail: "" });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Wiring List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Current Wiring Configurations</h3>
            {wirings.length === 0 ? (
              <p className="text-light-gray">No wiring configurations added</p>
            ) : (
              <div className="space-y-3">
                {wirings.map((wiring) => (
                  <div
                    key={wiring.id}
                    className="p-4 border border-lavender-light rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-dark-blue mb-2">
                          {wiring.category?.name || "N/A"} → {wiring.cableName}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {wiring.wirePricePerMeter && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-light-gray">Wire Price/Meter:</span>
                              <span className="text-sm font-semibold text-dark-blue">{formatPrice(wiring.wirePricePerMeter)}</span>
                            </div>
                          )}
                          {wiring.wiringChargePerMeter && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-light-gray">Wiring Charge/Meter:</span>
                              <span className="text-sm font-semibold text-dark-blue">{formatPrice(wiring.wiringChargePerMeter)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-light-gray">Total Price/Meter:</span>
                            <span className="text-sm font-semibold text-primary-blue">{formatPrice(wiring.pricePerMeter)}</span>
                          </div>
                        </div>
                        {wiring.shortDetail && (
                          <p className="text-sm text-light-gray mt-2">{wiring.shortDetail}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditWiring(wiring)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWiring(wiring.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-light-gray mt-4">
              Total: {wirings.length} wiring configuration{wirings.length !== 1 ? 's' : ''} configured
            </p>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured here in "Wiring Settings" tab. Uses Category, Cable Name, Wire Price Per Meter, and Wiring Charge Per Meter.<br/>
                <strong>Usage:</strong> Used in Quotation page to calculate cable/wiring costs based on user's input cable length in meters. Shows separate cable price and wiring charge when length exceeds installation max length.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Installation Settings Tab */}
      {activeTab === "installation" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Installation Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-dark-blue mb-4 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-blue" />
              {editingInstallationId ? "Edit Installation Rate" : "Add Installation Rate"}
            </h2>
            <form onSubmit={handleInstallationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Camera Type (Category) *</Label>
                  <select
                    value={installationFormData.categoryId}
                    onChange={(e) => setInstallationFormData({ ...installationFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    required
                  >
                    <option value="">Select Camera Type</option>
                    {allCategories
                      .filter((cat) => cat.enableForQuotation)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Max Cable Length (meters) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="90"
                    value={installationFormData.maxCableLength}
                    onChange={(e) => setInstallationFormData({ ...installationFormData, maxCableLength: e.target.value })}
                    required
                  />
                  <p className="text-xs text-light-gray mt-1">Rate applies if length ≤ this value</p>
                </div>
                <div>
                  <Label>Rate Per Camera (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="2000"
                    value={installationFormData.ratePerCamera}
                    onChange={(e) => setInstallationFormData({ ...installationFormData, ratePerCamera: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingInstallationId ? "Update" : "Add"} Installation Rate
                </Button>
                {editingInstallationId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingInstallationId(null);
                      setInstallationFormData({ categoryId: "", maxCableLength: "90", ratePerCamera: "" });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Installation List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Current Installation Rates</h3>
            {installations.length === 0 ? (
              <p className="text-light-gray">No installation rates configured</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-lavender-light">
                      <th className="px-4 py-3 text-left font-semibold text-dark-blue">Camera Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-dark-blue">Max Length</th>
                      <th className="px-4 py-3 text-left font-semibold text-dark-blue">Rate/Camera</th>
                      <th className="px-4 py-3 text-center font-semibold text-dark-blue">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installations.map((installation) => (
                      <tr key={installation.id} className="border-b border-lavender-light">
                        <td className="px-4 py-3">{installation.category?.name || "N/A"}</td>
                        <td className="px-4 py-3">≤ {installation.maxCableLength} meters</td>
                        <td className="px-4 py-3 font-semibold">{formatPrice(installation.ratePerCamera)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInstallation(installation)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteInstallation(installation.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary-blue rounded">
              <p className="text-xs text-dark-blue font-semibold mb-1">📝 Note:</p>
              <p className="text-xs text-light-gray">
                <strong>Data Source:</strong> Configured here in "Installation Rates" tab. Uses Category and Max Cable Length (meters) with Rate.<br/>
                <strong>Usage:</strong> Used in Quotation page to determine if user's cable length exceeds the maximum installation length. When exceeded, shows separate cable price and wiring charge breakdown.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

