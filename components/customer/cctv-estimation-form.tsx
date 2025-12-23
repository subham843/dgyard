"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Monitor,
  HardDrive,
  Zap,
  Wrench,
  Calculator,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  MapPin,
  Calendar,
  Building,
  Home,
  Store,
  Factory,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface EstimationResult {
  indoorCamera?: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    total: number;
  };
  outdoorCamera?: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    total: number;
  };
  recordingDevice?: {
    productId: string;
    productName: string;
    price: number;
    total: number;
  };
  hddStorage?: {
    productId: string;
    productName: string;
    price: number;
    total: number;
  };
  wiring?: {
    price: number;
    total: number;
  };
  installation?: {
    price: number;
    total: number;
  };
  accessories: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  totalPrice: number;
}

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export function CCTVEstimationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [step, setStep] = useState<"details" | "estimation" | "quotation">("details");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [estimation, setEstimation] = useState<EstimationResult | null>(null);
  const [quotationId, setQuotationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceType: "INSTALLATION",
    siteType: "HOME",
    cameraType: "HD",
    resolution: "2MP",
    indoorCount: 0,
    outdoorCount: 0,
    recordingDays: 7,
    brandId: "",
    categoryId: "",
    territoryCategoryId: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });

  useEffect(() => {
    fetchBrandsAndCategories();
  }, []);

  const fetchBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        fetch("/api/quotation/brands"),
        fetch("/api/quotation/categories"),
      ]);
      const brandsData = await brandsRes.json();
      const categoriesData = await categoriesRes.json();
      setBrands(brandsData.brands || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error("Error fetching brands/categories:", error);
    }
  };

  const calculateEstimation = async () => {
    if (!formData.brandId || !formData.categoryId || !formData.territoryCategoryId) {
      toast.error("Please select Brand, Category, and Territory");
      return;
    }

    if (formData.indoorCount === 0 && formData.outdoorCount === 0) {
      toast.error("Please specify at least one camera");
      return;
    }

    setCalculating(true);
    try {
      const params = new URLSearchParams({
        brandId: formData.brandId,
        categoryId: formData.categoryId,
        territoryCategoryId: formData.territoryCategoryId,
        indoorCount: formData.indoorCount.toString(),
        outdoorCount: formData.outdoorCount.toString(),
        recordingDays: formData.recordingDays.toString(),
        wiringMeters: "90", // Default wiring
      });

      const response = await fetch(`/api/quotation/calculate?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEstimation(data);
        setStep("estimation");
        toast.success("Estimation calculated successfully!");
      } else {
        toast.error(data.error || "Failed to calculate estimation");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const saveQuotation = async () => {
    if (!session) {
      toast.error("Please login to save quotation");
      router.push("/auth/signin");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimation,
          status: "SAVED",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setQuotationId(data.quotation.id);
        setStep("quotation");
        toast.success("Quotation saved successfully!");
      } else {
        toast.error(data.error || "Failed to save quotation");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const acceptQuotation = async () => {
    if (!quotationId) {
      toast.error("Quotation not found");
      return;
    }

    setLoading(true);
    try {
      // Create booking from quotation
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: formData.serviceType,
          description: `CCTV Installation - ${formData.indoorCount + formData.outdoorCount} cameras`,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: session?.user?.phone || "",
          email: session?.user?.email || "",
          scheduledAt: formData.preferredDate
            ? `${formData.preferredDate}T${formData.preferredTime || "10:00"}`
            : null,
          customerNotes: formData.notes,
          quotationId: quotationId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Service request created successfully!");
        router.push(`/dashboard/services/${data.booking.id}`);
      } else {
        toast.error(data.error || "Failed to create service request");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalCameras = formData.indoorCount + formData.outdoorCount;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CCTV Estimation & Quotation</h1>
          <p className="text-gray-600">Get an instant price estimate for your CCTV installation</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step === "details" ? "text-blue-600" : step !== "details" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === "details" ? "border-blue-600 bg-blue-50" : step !== "details" ? "border-green-600 bg-green-50" : "border-gray-300"}`}>
                {step !== "details" ? <CheckCircle2 className="w-6 h-6" /> : "1"}
              </div>
              <span className="ml-2 font-medium">Details</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step !== "details" ? "bg-green-600" : "bg-gray-200"}`} />
            <div className={`flex items-center ${step === "estimation" ? "text-blue-600" : step === "quotation" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === "estimation" ? "border-blue-600 bg-blue-50" : step === "quotation" ? "border-green-600 bg-green-50" : "border-gray-300"}`}>
                {step === "quotation" ? <CheckCircle2 className="w-6 h-6" /> : step === "estimation" ? "2" : "2"}
              </div>
              <span className="ml-2 font-medium">Estimation</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step === "quotation" ? "bg-green-600" : "bg-gray-200"}`} />
            <div className={`flex items-center ${step === "quotation" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === "quotation" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>
                3
              </div>
              <span className="ml-2 font-medium">Quotation</span>
            </div>
          </div>
        </div>

        {step === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Fill in your requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Site Type */}
              <div>
                <Label>Site Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {[
                    { value: "HOME", label: "Home", icon: Home },
                    { value: "SHOP", label: "Shop", icon: Store },
                    { value: "OFFICE", label: "Office", icon: Building },
                    { value: "FACTORY", label: "Factory", icon: Factory },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.siteType === type.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="siteType"
                          value={type.value}
                          checked={formData.siteType === type.value}
                          onChange={(e) => setFormData({ ...formData, siteType: e.target.value })}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <Icon className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">{type.label}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Camera Type & Resolution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Camera Type *</Label>
                  <select
                    value={formData.cameraType}
                    onChange={(e) => setFormData({ ...formData, cameraType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="HD">HD Camera</option>
                    <option value="IP">IP Camera</option>
                  </select>
                </div>
                <div>
                  <Label>Resolution *</Label>
                  <select
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="2MP">2MP</option>
                    <option value="4MP">4MP</option>
                    <option value="5MP">5MP</option>
                    <option value="8MP">8MP</option>
                    <option value="12MP">12MP</option>
                  </select>
                </div>
              </div>

              {/* Number of Cameras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Indoor Cameras *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.indoorCount}
                    onChange={(e) => setFormData({ ...formData, indoorCount: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Outdoor Cameras *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.outdoorCount}
                    onChange={(e) => setFormData({ ...formData, outdoorCount: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Recording Days */}
              <div>
                <Label>Recording Days *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.recordingDays}
                  onChange={(e) => setFormData({ ...formData, recordingDays: parseInt(e.target.value) || 7 })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Number of days to store recordings</p>
              </div>

              {/* Brand, Category, Territory */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Brand *</Label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    required
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Territory *</Label>
                  <Input
                    placeholder="Enter territory"
                    value={formData.territoryCategoryId}
                    onChange={(e) => setFormData({ ...formData, territoryCategoryId: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address *
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete address"
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Preferred Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Preferred Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes / Requirements</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  rows={3}
                  placeholder="Any special requirements or notes..."
                />
              </div>

              <Button
                onClick={calculateEstimation}
                disabled={calculating || totalCameras === 0}
                className="w-full"
                size="lg"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Estimation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "estimation" && estimation && (
          <Card>
            <CardHeader>
              <CardTitle>Price Estimation</CardTitle>
              <CardDescription>Review your CCTV installation estimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {estimation.indoorCamera && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Indoor Camera ({estimation.indoorCamera.quantity}x)</div>
                        <div className="text-sm text-gray-600">{estimation.indoorCamera.productName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{estimation.indoorCamera.total.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">₹{estimation.indoorCamera.price.toLocaleString()} each</div>
                    </div>
                  </div>
                )}

                {estimation.outdoorCamera && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">Outdoor Camera ({estimation.outdoorCamera.quantity}x)</div>
                        <div className="text-sm text-gray-600">{estimation.outdoorCamera.productName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{estimation.outdoorCamera.total.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">₹{estimation.outdoorCamera.price.toLocaleString()} each</div>
                    </div>
                  </div>
                )}

                {estimation.recordingDevice && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Recording Device (DVR/NVR)</div>
                        <div className="text-sm text-gray-600">{estimation.recordingDevice.productName}</div>
                      </div>
                    </div>
                    <div className="font-semibold">₹{estimation.recordingDevice.total.toLocaleString()}</div>
                  </div>
                )}

                {estimation.hddStorage && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium">HDD Storage</div>
                        <div className="text-sm text-gray-600">{estimation.hddStorage.productName}</div>
                      </div>
                    </div>
                    <div className="font-semibold">₹{estimation.hddStorage.total.toLocaleString()}</div>
                  </div>
                )}

                {estimation.wiring && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <div className="font-medium">Wiring & Cables</div>
                    </div>
                    <div className="font-semibold">₹{estimation.wiring.total.toLocaleString()}</div>
                  </div>
                )}

                {estimation.installation && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-indigo-600" />
                      <div className="font-medium">Installation Charges</div>
                    </div>
                    <div className="font-semibold">₹{estimation.installation.total.toLocaleString()}</div>
                  </div>
                )}

                {estimation.accessories.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium">Accessories</div>
                    {estimation.accessories.map((acc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="text-sm">{acc.productName} (x{acc.quantity})</div>
                        <div className="font-medium">₹{acc.total.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span>Total Price</span>
                  <span className="text-blue-600">₹{estimation.totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">* Prices are estimates and may vary based on site conditions</p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={saveQuotation}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Save Quotation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "quotation" && quotationId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Quotation Saved Successfully!
              </CardTitle>
              <CardDescription>Your quotation has been saved. You can accept it to create a service request.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Your quotation has been saved. Accept it to automatically create a service request.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("estimation")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={acceptQuotation}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept & Book Service
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}





