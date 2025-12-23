"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, MapPin, User, Phone, Mail, Calendar, 
  Clock, DollarSign, FileText, Plus, Loader2,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface PostJobFormProps {
  onSuccess?: () => void;
  onStatsUpdate?: () => void;
}

export function PostJobForm({ onSuccess, onStatsUpdate }: PostJobFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    workDetails: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    placeName: "",
    serviceCategoryId: "",
    serviceSubCategoryId: "",
    serviceDomainId: "",
    skillId: "",
    priority: "NORMAL",
    scheduledAt: "",
    estimatedDuration: "",
    estimatedCost: "",
    notes: "",
  });

  const [skillsData, setSkillsData] = useState({
    serviceCategories: [] as any[],
    serviceSubCategories: [] as any[],
    serviceDomains: [] as any[],
    skills: [] as any[],
  });
  const [selectedWarranty, setSelectedWarranty] = useState<number | null>(null);
  
  // Commission disclosure state
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionPreview, setCommissionPreview] = useState<any>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionConfirmed, setCommissionConfirmed] = useState(false);

  useEffect(() => {
    fetchSkillsData();
  }, []);

  const fetchSkillsData = async () => {
    try {
      const response = await fetch("/api/jobs/skills", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSkillsData({
          serviceCategories: data.serviceCategories || [],
          serviceSubCategories: [],
          serviceDomains: [],
          skills: [],
        });
      } else {
        console.error("Failed to fetch skills data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching skills data:", error);
      // Don't show error toast as this is a background fetch
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setFormData({
      ...formData,
      serviceCategoryId: categoryId,
      serviceSubCategoryId: "",
      serviceDomainId: "",
      skillId: "",
    });
    
    if (!categoryId) {
      setSkillsData({ ...skillsData, serviceSubCategories: [], serviceDomains: [], skills: [] });
      setSelectedWarranty(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData({ 
          ...skillsData, 
          serviceSubCategories: data.serviceSubCategories || [],
          serviceDomains: [],
          skills: [],
        });
        
        // Get warranty from category (will be overridden by subcategory if set)
        const category = data.serviceCategories?.find((c: any) => c.id === categoryId);
        setSelectedWarranty(category?.warrantyDays ?? null);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleSubCategoryChange = async (subCategoryId: string) => {
    setFormData({
      ...formData,
      serviceSubCategoryId: subCategoryId,
      serviceDomainId: "",
      skillId: "",
    });
    
    if (!subCategoryId) {
      setSkillsData({ ...skillsData, serviceDomains: [], skills: [] });
      setSelectedWarranty(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${formData.serviceCategoryId}&serviceSubCategoryId=${subCategoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData({ 
          ...skillsData, 
          serviceDomains: data.serviceDomains || [],
          skills: [],
        });
        
        // Get warranty from subcategory (preferred) or category
        const subCategory = data.serviceSubCategories?.find((sc: any) => sc.id === subCategoryId);
        const category = skillsData.serviceCategories.find((c: any) => c.id === formData.serviceCategoryId);
        const warranty = subCategory?.warrantyDays ?? category?.warrantyDays ?? null;
        setSelectedWarranty(warranty);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
    }
  };

  const handleDomainChange = async (domainId: string) => {
    setFormData({
      ...formData,
      serviceDomainId: domainId,
      skillId: "",
    });
    
    if (!domainId) {
      setSkillsData({ ...skillsData, skills: [] });
      return;
    }
    
    try {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${formData.serviceCategoryId}&serviceSubCategoryId=${formData.serviceSubCategoryId}&serviceDomainId=${domainId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData({ 
          ...skillsData, 
          skills: data.skills || [],
        });
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const calculateCommissionPreview = async () => {
    if (!formData.estimatedCost || parseFloat(formData.estimatedCost) <= 0) {
      return null;
    }

    if (!formData.serviceCategoryId || !formData.serviceSubCategoryId) {
      return null;
    }

    try {
      setCommissionLoading(true);
      const response = await fetch("/api/jobs/commission-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAmount: formData.estimatedCost,
          serviceCategoryId: formData.serviceCategoryId,
          serviceSubCategoryId: formData.serviceSubCategoryId,
          city: formData.city,
          state: formData.state,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error calculating commission preview:", error);
    } finally {
      setCommissionLoading(false);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that location is selected (required for technician matching)
    if (!formData.latitude || !formData.longitude) {
      toast.error("Please select the exact location on the map. This is required for matching technicians.");
      return;
    }

    // If commission not yet confirmed, show commission disclosure modal
    if (!commissionConfirmed && formData.estimatedCost && parseFloat(formData.estimatedCost) > 0) {
      const preview = await calculateCommissionPreview();
      if (preview) {
        setCommissionPreview(preview);
        setShowCommissionModal(true);
        return;
      }
    }

    // Proceed with job posting
    await submitJobPost();
  };

  const submitJobPost = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // Ensure latitude and longitude are sent as strings (API will convert)
          latitude: formData.latitude,
          longitude: formData.longitude,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Job posted successfully! Notifications sent to ${data.notificationsSent || 0} technicians.`);
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          workDetails: "",
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          latitude: "",
          longitude: "",
          placeName: "",
          serviceCategoryId: "",
          serviceSubCategoryId: "",
          serviceDomainId: "",
          skillId: "",
          priority: "NORMAL",
          scheduledAt: "",
          estimatedDuration: "",
          estimatedCost: "",
          notes: "",
        });
        
        setSkillsData({
          ...skillsData,
          serviceSubCategories: [],
          serviceDomains: [],
          skills: [],
        });
        
        // Reset commission confirmation
        setCommissionConfirmed(false);
        setCommissionPreview(null);
        
        if (onSuccess) onSuccess();
        if (onStatsUpdate) onStatsUpdate();
      } else {
        toast.error(data.error || "Failed to post job");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionConfirm = () => {
    setCommissionConfirmed(true);
    setShowCommissionModal(false);
    // Re-trigger form submission
    submitJobPost();
  };

  const handleCommissionCancel = () => {
    setShowCommissionModal(false);
    setCommissionPreview(null);
  };

  return (
    <div className="space-y-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Job Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Job Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., CCTV Installation at Office"
                className="mt-1.5 h-11"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the job"
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="workDetails" className="text-sm font-semibold text-gray-700">
                Work Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="workDetails"
                required
                rows={4}
                value={formData.workDetails}
                onChange={(e) => setFormData({ ...formData, workDetails: e.target.value })}
                placeholder="Detailed work description - what needs to be done, requirements, etc."
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Service Selection Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Service Selection</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                Service Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceCategoryId}
                onValueChange={handleCategoryChange}
                required
              >
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {skillsData.serviceCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                Sub-Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceSubCategoryId}
                onValueChange={handleSubCategoryChange}
                disabled={!formData.serviceCategoryId}
                required
              >
                <SelectTrigger className="mt-1.5 h-11" disabled={!formData.serviceCategoryId}>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {skillsData.serviceSubCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                Service Domain <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceDomainId}
                onValueChange={handleDomainChange}
                disabled={!formData.serviceSubCategoryId}
                required
              >
                <SelectTrigger className="mt-1.5 h-11" disabled={!formData.serviceSubCategoryId}>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {skillsData.serviceDomains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700">Skill (Optional)</Label>
              <Select
                value={formData.skillId || "__none__"}
                onValueChange={(value) => setFormData({ ...formData, skillId: value === "__none__" ? "" : value })}
                disabled={!formData.serviceDomainId}
              >
                <SelectTrigger className="mt-1.5 h-11" disabled={!formData.serviceDomainId}>
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {skillsData.skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Warranty Information */}
          {selectedWarranty && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Service Warranty: {selectedWarranty} days
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This service includes {selectedWarranty} days warranty period. Warranty will start after job completion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName" className="text-sm font-semibold text-gray-700">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Customer full name"
                className="mt-1.5 h-11"
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone" className="text-sm font-semibold text-gray-700">
                Customer Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="mt-1.5 h-11"
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail" className="text-sm font-semibold text-gray-700">
                Customer Email (Optional)
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="customer@example.com"
                className="mt-1.5 h-11"
              />
            </div>
          </div>
        </div>

        {/* Location Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Location Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Complete address"
                className="mt-1.5 h-11"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="mt-1.5 h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="mt-1.5 h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="pincode" className="text-sm font-semibold text-gray-700">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pincode"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="123456"
                  className="mt-1.5 h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="placeName" className="text-sm font-semibold text-gray-700">
                  Place Name (Optional)
                </Label>
                <Input
                  id="placeName"
                  value={formData.placeName}
                  onChange={(e) => setFormData({ ...formData, placeName: e.target.value })}
                  placeholder="e.g., Connaught Place"
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                Select Exact Location on Map <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-500 mt-1 mb-3">Click on the map or search to set the exact address location</p>
              <LocationMapPicker
                onLocationSelect={(location) => {
                  setFormData({
                    ...formData,
                    latitude: location.lat.toString(),
                    longitude: location.lng.toString(),
                    placeName: location.placeName || location.address || formData.placeName,
                    address: location.address || formData.address,
                  });
                }}
                initialLocation={
                  formData.latitude && formData.longitude
                    ? {
                        address: formData.address,
                        lat: parseFloat(formData.latitude),
                        lng: parseFloat(formData.longitude),
                        placeName: formData.placeName,
                      }
                    : undefined
                }
                height="300px"
                showRadiusControl={false}
              />
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Additional Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="scheduledAt" className="text-sm font-semibold text-gray-700">
                Scheduled Date & Time (Optional)
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="mt-1.5 h-11"
              />
            </div>
            
            <div>
              <Label htmlFor="estimatedDuration" className="text-sm font-semibold text-gray-700">
                Estimated Duration (hours)
              </Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g., 4"
                className="mt-1.5 h-11"
              />
            </div>
            
            <div>
              <Label htmlFor="estimatedCost" className="text-sm font-semibold text-gray-700">
                Estimated Cost (₹)
              </Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="e.g., 5000"
                className="mt-1.5 h-11"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes or instructions"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={loading || commissionLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Posting Job...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Post Job
              </>
            )}
          </Button>
        </div>
      </motion.form>

      {/* Commission Disclosure Modal */}
      <Dialog open={showCommissionModal} onOpenChange={setShowCommissionModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              Platform Commission Disclosure
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Please review the commission breakdown before posting your job
            </DialogDescription>
          </DialogHeader>

          {commissionPreview && (
            <div className="space-y-4 py-4">
              {/* Service Selection Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Service Selected: {skillsData.serviceCategories.find(c => c.id === formData.serviceCategoryId)?.title || "Service"}
                </p>
                <p className="text-sm text-blue-800">
                  Job Amount: ₹{parseFloat(formData.estimatedCost || "0").toLocaleString('en-IN')}
                </p>
              </div>

              {/* Commission Breakdown */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Job Amount:</span>
                  <span className="text-base font-semibold text-gray-900">
                    ₹{commissionPreview.breakdown.jobAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Platform Commission ({commissionPreview.commission.type === "PERCENTAGE" ? `${commissionPreview.commission.value}%` : `₹${commissionPreview.commission.value}`}):
                    </span>
                    <span className="text-base font-semibold text-red-600">
                      - ₹{commissionPreview.breakdown.platformCommission.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="border-t-2 border-blue-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Net Technician Payout:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{commissionPreview.breakdown.netTechnicianPayout.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Important Notes:
                </p>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Platform commission will be auto-deducted</li>
                  <li>Only ₹{commissionPreview.breakdown.netTechnicianPayout.toLocaleString('en-IN')} will be visible to the technician</li>
                  <li>Payment will be released after job completion and approval</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCommissionCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommissionConfirm}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm and Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

