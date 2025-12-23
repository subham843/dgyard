"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Camera,
  FileText,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Upload,
  X,
  History,
  Briefcase,
  User,
  Award,
  Settings,
  Loader2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import { TechnicianSkillsEditor } from "./technician-skills-editor";
import { TechnicianDashboardEnhanced } from "./technician-dashboard-enhanced";

const serviceLabels: Record<string, string> = {
  INSTALLATION: "Installation",
  NETWORKING: "Networking",
  DIGITAL_MARKETING: "Digital Marketing",
  MAINTENANCE: "Maintenance",
  CONSULTATION: "Consultation",
  CCTV: "CCTV & Surveillance",
  AV: "Audio Visual",
  FIRE: "Fire Safety",
  AUTOMATION: "Home Automation",
  DEVELOPMENT: "Software Development",
  REPAIR: "Repair",
  TRAINING: "Training",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
};

const getStatusColor = (status: string) => {
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function TechnicianDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || "dashboard";
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"assignments" | "jobs" | "available">("available");
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionData, setActionData] = useState<any>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [otp, setOtp] = useState("");
  
  // Profile editing states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileFormData, setProfileFormData] = useState({
    fullName: "",
    displayName: "",
    email: "",
    mobile: "",
  });
  
  // Skills editing states
  const [skillsData, setSkillsData] = useState({
    serviceCategories: [] as any[],
    serviceSubCategories: [] as any[],
    serviceDomains: [] as any[],
    skills: [] as any[],
  });
  const [selectedSkills, setSelectedSkills] = useState<Array<{skillId: string; skillTitle: string; level: string}>>([]);
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);
  
  // Location editing states
  const [locationFormData, setLocationFormData] = useState({
    latitude: "",
    longitude: "",
    placeName: "",
    serviceRadiusKm: "10",
  });
  const [locationData, setLocationData] = useState<any>(null);

  useEffect(() => {
    if (tabParam === "dashboard") {
      fetchAssignments();
      fetchAvailableJobs();
      fetchMyJobs();
    } else if (tabParam === "profile") {
      fetchProfile();
    } else if (tabParam === "skills") {
      fetchProfile();
      fetchSkillsData();
    } else if (tabParam === "location") {
      fetchProfile();
    }
  }, [statusFilter, activeTab, tabParam]);
  
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch("/api/technician/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.technician);
        setProfileFormData({
          fullName: data.technician.fullName || "",
          displayName: data.technician.displayName || "",
          email: data.technician.email || "",
          mobile: data.technician.mobile || "",
        });
        if (data.technician.latitude && data.technician.longitude) {
          setLocationFormData({
            latitude: data.technician.latitude.toString(),
            longitude: data.technician.longitude.toString(),
            placeName: data.technician.placeName || "",
            serviceRadiusKm: data.technician.serviceRadiusKm?.toString() || "10",
          });
          setLocationData({
            address: data.technician.placeName || "",
            lat: data.technician.latitude,
            lng: data.technician.longitude,
            placeName: data.technician.placeName,
          });
        }
        // Parse primary skills if available
        if (data.technician.primarySkills) {
          try {
            const primarySkills = typeof data.technician.primarySkills === 'string' 
              ? JSON.parse(data.technician.primarySkills) 
              : data.technician.primarySkills;
            if (Array.isArray(primarySkills)) {
              setSelectedSkills(primarySkills.map((ps: any) => ({
                skillId: ps.skillId || "",
                skillTitle: ps.skill || "",
                level: ps.level || "BEGINNER",
              })));
            }
          } catch (e) {
            console.error("Error parsing primary skills:", e);
          }
        }
        if (data.technician.serviceCategories && Array.isArray(data.technician.serviceCategories)) {
          setSelectedServiceCategories(data.technician.serviceCategories);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    } finally {
      setProfileLoading(false);
    }
  };
  
  const fetchSkillsData = async () => {
    try {
      const response = await fetch("/api/jobs/skills");
      if (response.ok) {
        const data = await response.json();
        setSkillsData(prev => ({
          ...prev,
          serviceCategories: data.serviceCategories || [],
          serviceSubCategories: data.serviceSubCategories || [],
          serviceDomains: data.serviceDomains || [],
          skills: data.skills || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching skills data:", error);
    }
  };
  
  const handleCategoryChangeForSkills = async (categoryId: string) => {
    if (categoryId) {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData(prev => ({
          ...prev,
          serviceSubCategories: data.serviceSubCategories || [],
          serviceDomains: [],
          skills: [],
        }));
      }
    }
  };
  
  const handleSubCategoryChangeForSkills = async (subCategoryId: string, categoryId: string) => {
    if (subCategoryId && categoryId) {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${categoryId}&serviceSubCategoryId=${subCategoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData(prev => ({
          ...prev,
          serviceDomains: data.serviceDomains || [],
        }));
      }
    }
  };
  
  const handleDomainChangeForSkills = async (domainId: string, categoryId: string, subCategoryId: string) => {
    if (domainId && categoryId && subCategoryId) {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${categoryId}&serviceSubCategoryId=${subCategoryId}&serviceDomainId=${domainId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData(prev => ({
          ...prev,
          skills: data.skills || [],
        }));
      }
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const response = await fetch("/api/technician/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileFormData),
      });
      
      if (response.ok) {
        toast.success("Profile updated successfully!");
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleLocationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const response = await fetch("/api/technician/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: locationFormData.latitude,
          longitude: locationFormData.longitude,
          placeName: locationFormData.placeName,
          serviceRadiusKm: locationFormData.serviceRadiusKm,
        }),
      });
      
      if (response.ok) {
        toast.success("Location updated successfully!");
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update location");
      }
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleSkillsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const primarySkillsWithLevels = selectedSkills.map((selected) => ({
        skill: selected.skillTitle,
        skillId: selected.skillId,
        level: selected.level,
      }));
      
      const response = await fetch("/api/technician/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primarySkills: primarySkillsWithLevels,
          serviceCategories: selectedServiceCategories,
        }),
      });
      
      if (response.ok) {
        toast.success("Skills updated successfully!");
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update skills");
      }
    } catch (error) {
      console.error("Error updating skills:", error);
      toast.error("Failed to update skills");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/technician/assignments${params}`);
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentDetail = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/technician/assignments/${assignmentId}`);
      const data = await response.json();
      setSelectedAssignment(data.assignment);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching assignment detail:", error);
      toast.error("Failed to fetch assignment details");
    }
  };

  const handleAction = async () => {
    if (!selectedAssignment) return;

    try {
      const payload: any = { action: actionType, ...actionData };
      
      const response = await fetch(`/api/technician/assignments/${selectedAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Action completed successfully");
        setShowActionModal(false);
        setShowDetailModal(false);
        setActionData({});
        fetchAssignments();
        if (selectedAssignment) {
          fetchAssignmentDetail(selectedAssignment.id);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to perform action");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Something went wrong");
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!selectedAssignment) return;

    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("photos", file);
      });

      // Upload photos (you'll need to implement this endpoint)
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        const { urls } = await uploadResponse.json();
        setActionData({ ...actionData, photos: urls });
        toast.success("Photos uploaded successfully");
      } else {
        toast.error("Failed to upload photos");
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      console.log("[Technician Dashboard] Fetching available jobs...");
      const response = await fetch("/api/jobs?status=available");
      console.log("[Technician Dashboard] Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("[Technician Dashboard] Jobs received:", data.jobs?.length || 0);
        setAvailableJobs(data.jobs || []);
      } else {
        const errorData = await response.json();
        console.error("[Technician Dashboard] Error response:", errorData);
        toast.error(errorData.error || "Failed to fetch jobs");
      }
    } catch (error) {
      console.error("[Technician Dashboard] Error fetching available jobs:", error);
      toast.error("Failed to fetch jobs");
    }
  };

  const fetchMyJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setMyJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching my jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        if (action === "accept") {
          toast.success("Job accepted successfully!");
        } else if (action === "start") {
          toast.success("Job started!");
        } else if (action === "complete") {
          toast.success("OTP sent to customer. Waiting for verification...");
        }
        setShowJobModal(false);
        fetchAvailableJobs();
        fetchMyJobs();
      } else {
        toast.error(data.error || "Failed to perform action");
      }
    } catch (error) {
      console.error("Error performing job action:", error);
      toast.error("Something went wrong");
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedJob || !otp) {
      toast.error("Please enter OTP");
      return;
    }

    try {
      // Try to get Firebase ID token if available (optional, for enhanced verification)
      let firebaseIdToken = null;
      try {
        const { auth } = await import("@/lib/firebase");
        if (auth && auth.currentUser) {
          firebaseIdToken = await auth.currentUser.getIdToken();
        }
      } catch (error) {
        // Firebase token is optional, continue without it
        console.log("Firebase token not available, using OTP only");
      }

      const response = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "verify-otp", 
          otp,
          firebaseIdToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Job completed and verified!");
        setShowJobModal(false);
        setOtp("");
        fetchMyJobs();
      } else {
        toast.error(data.error || "Failed to verify OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Something went wrong");
    }
  };

  const fetchJobDetail = async (jobId: string) => {
    try {
      console.log("[Technician Dashboard] Fetching job detail for:", jobId);
      const response = await fetch(`/api/jobs/${jobId}`);
      console.log("[Technician Dashboard] Job detail response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("[Technician Dashboard] Job detail received:", data);
        setSelectedJob(data.job);
        setShowJobModal(true);
      } else {
        const errorData = await response.json();
        console.error("[Technician Dashboard] Error fetching job detail:", errorData);
        toast.error(errorData.error || "Failed to fetch job details");
      }
    } catch (error) {
      console.error("[Technician Dashboard] Error fetching job detail:", error);
      toast.error("Failed to fetch job details");
    }
  };

  const openActionModal = (type: string) => {
    setActionType(type);
    setActionData({});
    setShowActionModal(true);
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED").length,
    inProgress: assignments.filter((a) => a.status === "IN_PROGRESS").length,
    completed: assignments.filter((a) => a.status === "COMPLETED").length,
  };

  // Profile Tab Content
  if (tabParam === "profile") {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 md:px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-gray-600 mt-1">Update your personal information</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            {profileLoading && !profileData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading profile...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 md:p-8">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        required
                        value={profileFormData.fullName}
                        onChange={(e) => setProfileFormData({ ...profileFormData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        className="h-11"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="displayName" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Display Name (Optional)
                      </Label>
                      <Input
                        id="displayName"
                        value={profileFormData.displayName}
                        onChange={(e) => setProfileFormData({ ...profileFormData, displayName: e.target.value })}
                        placeholder="How you want to be displayed"
                        className="h-11"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={profileFormData.email}
                        onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="h-11"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Mobile Number *
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        required
                        value={profileFormData.mobile}
                        onChange={(e) => setProfileFormData({ ...profileFormData, mobile: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md px-8"
                    >
                      {profileLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Skills Tab Content
  if (tabParam === "skills") {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 md:px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Update Skills</h1>
                <p className="text-gray-600 mt-1">Manage your service categories and skills</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {profileLoading && !profileData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading skills data...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 md:p-8">
                <TechnicianSkillsEditor
                  skillsData={skillsData}
                  selectedSkills={selectedSkills}
                  setSelectedSkills={setSelectedSkills}
                  selectedServiceCategories={selectedServiceCategories}
                  setSelectedServiceCategories={setSelectedServiceCategories}
                  onSubmit={handleSkillsUpdate}
                  loading={profileLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Location Tab Content
  if (tabParam === "location") {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 md:px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 rounded-lg p-2">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Service Location</h1>
                <p className="text-gray-600 mt-1">Update your service area and radius</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {profileLoading && !profileData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading location data...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 md:p-8">
                <form onSubmit={handleLocationUpdate} className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Select Service Location *
                    </Label>
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <LocationMapPicker
                        onLocationSelect={(location) => {
                          setLocationData(location);
                          setLocationFormData({
                            ...locationFormData,
                            latitude: location.lat.toString(),
                            longitude: location.lng.toString(),
                            placeName: location.placeName || location.address,
                          });
                        }}
                        onRadiusChange={(radius) => {
                          setLocationFormData({
                            ...locationFormData,
                            serviceRadiusKm: radius.toString(),
                          });
                        }}
                        initialLocation={locationData || undefined}
                        initialRadius={parseFloat(locationFormData.serviceRadiusKm) || 10}
                        height="400px"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="serviceRadiusKm" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Service Radius (km) *
                      </Label>
                      <Input
                        id="serviceRadiusKm"
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={locationFormData.serviceRadiusKm}
                        onChange={(e) => setLocationFormData({ ...locationFormData, serviceRadiusKm: e.target.value })}
                        placeholder="10"
                        className="h-11"
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum distance you're willing to travel for jobs</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={profileLoading || !locationFormData.latitude || !locationFormData.longitude}
                      className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md px-8"
                    >
                      {profileLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Location
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Settings Tab Content
  if (tabParam === "settings") {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 md:px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gray-100 rounded-lg p-2">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account settings</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 text-center">
              <Settings className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-blue-900 mb-2">Account Settings</h3>
              <p className="text-blue-700">
                More settings options will be available soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Dashboard Tab - Use Enhanced Dashboard
  if (tabParam === "dashboard") {
    return <TechnicianDashboardEnhanced />;
  }

  // Default Dashboard Tab (Jobs & Assignments)
  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage your jobs and assignments</p>
        </div>
        {/* Tabs */}
        <div className="px-8 flex gap-4 border-t">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === "available"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-blue-600"
            }`}
          >
            Available Jobs ({availableJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === "jobs"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-blue-600"
            }`}
          >
            My Jobs ({myJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === "assignments"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-blue-600"
            }`}
          >
            Assignments ({assignments.length})
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Available Jobs Tab */}
        {activeTab === "available" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : availableJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No available jobs matching your skills and location</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[job.priority]}`}>
                              {job.priority}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <strong>Customer:</strong> {job.customerName}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{job.city}, {job.state}</span>
                            </div>
                            {job.scheduledAt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(job.scheduledAt)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => fetchJobDetail(job.id)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleJobAction(job.id, "accept")}
                            style={{ backgroundColor: '#3A59FF' }}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* My Jobs Tab */}
        {activeTab === "jobs" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">My Jobs</h2>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : myJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(job.status)}`}>
                              {job.status.replace("_", " ")}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[job.priority]}`}>
                              {job.priority}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <strong>Customer:</strong> {job.customerName}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{job.city}, {job.state}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => fetchJobDetail(job.id)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {job.status === "ASSIGNED" && (
                            <Button
                              onClick={() => handleJobAction(job.id, "start")}
                              style={{ backgroundColor: '#3A59FF' }}
                            >
                              Start Job
                            </Button>
                          )}
                          {job.status === "IN_PROGRESS" && (
                            <Button
                              onClick={() => {
                                setSelectedJob(job);
                                setShowActionModal(true);
                                setActionType("complete");
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-sm text-yellow-700">Pending</div>
                <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-700">In Progress</div>
                <div className="text-2xl font-bold text-purple-800">{stats.inProgress}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-700">Completed</div>
                <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
              {["all", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "All" : status}
                </Button>
              ))}
            </div>

            {/* Assignments List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse"></div>
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No assignments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{assignment.bookingNumber}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[assignment.status]}`}>
                            {assignment.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[assignment.priority]}`}>
                            {assignment.priority}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <strong>Service:</strong> {serviceLabels[assignment.serviceType] || assignment.serviceType}
                          </div>
                          <div>
                            <strong>Customer:</strong> {assignment.user?.name || assignment.user?.email}
                          </div>
                          {assignment.scheduledAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <strong>Scheduled:</strong> {formatDate(assignment.scheduledAt)}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{assignment.city}, {assignment.state}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{assignment.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fetchAssignmentDetail(assignment.id)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Assignment: {selectedAssignment.bookingNumber}</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${statusColors[selectedAssignment.status]}`}>
                  {selectedAssignment.status}
                </span>
              </DialogTitle>
              <DialogDescription>
                {serviceLabels[selectedAssignment.serviceType]} - {selectedAssignment.requestType === "COMPLAINT" ? "Complaint" : "Service Request"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Customer Information</Label>
                  <div className="mt-2 space-y-1">
                    <div className="font-medium">{selectedAssignment.user?.name || "N/A"}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {selectedAssignment.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedAssignment.phone}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Service Details</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div><strong>Type:</strong> {serviceLabels[selectedAssignment.serviceType]}</div>
                    <div><strong>Priority:</strong> <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[selectedAssignment.priority]}`}>{selectedAssignment.priority}</span></div>
                    {selectedAssignment.scheduledAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <strong>Scheduled:</strong> {formatDate(selectedAssignment.scheduledAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Address
                </Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  {selectedAssignment.address}, {selectedAssignment.city}, {selectedAssignment.state} - {selectedAssignment.pincode}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Description</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedAssignment.description}
                </div>
              </div>

              {/* Technician Notes */}
              {selectedAssignment.technicianNotes && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">My Notes</Label>
                  <div className="mt-2 p-3 bg-purple-50 rounded-md text-sm whitespace-pre-wrap">
                    {selectedAssignment.technicianNotes}
                  </div>
                </div>
              )}

              {/* Photos */}
              {selectedAssignment.photos && selectedAssignment.photos.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photos ({selectedAssignment.photos.length})
                  </Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {selectedAssignment.photos.map((photo: string, idx: number) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Logs */}
              {selectedAssignment.activityLogs && selectedAssignment.activityLogs.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Activity Log
                  </Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {selectedAssignment.activityLogs.map((log: any, idx: number) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-gray-600">{log.description}</div>
                        <div className="text-gray-400 text-xs mt-1">{formatDate(log.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedAssignment.status !== "COMPLETED" && (
                  <>
                    <Button
                      onClick={() => openActionModal("update_status")}
                      variant="outline"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Update Status
                    </Button>
                    <Button
                      onClick={() => openActionModal("add_note")}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                    <Button
                      onClick={() => openActionModal("upload_photos")}
                      variant="outline"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photos
                    </Button>
                    {selectedAssignment.status === "IN_PROGRESS" && (
                      <Button
                        onClick={() => openActionModal("complete")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedJob.title}</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(selectedJob.status)}`}>
                  {selectedJob.status.replace("_", " ")}
                </span>
              </DialogTitle>
              <DialogDescription>
                Job Number: {selectedJob.jobNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Customer Information</Label>
                  <div className="mt-2 space-y-1">
                    <div className="font-medium">{selectedJob.customerName}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedJob.customerPhone}
                    </div>
                    {selectedJob.customerEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {selectedJob.customerEmail}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Job Details</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div><strong>Priority:</strong> <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[selectedJob.priority]}`}>{selectedJob.priority}</span></div>
                    {selectedJob.scheduledAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <strong>Scheduled:</strong> {formatDate(selectedJob.scheduledAt)}
                      </div>
                    )}
                    {selectedJob.estimatedDuration && (
                      <div><strong>Estimated Duration:</strong> {selectedJob.estimatedDuration} hours</div>
                    )}
                    {selectedJob.estimatedCost && (
                      <div><strong>Estimated Cost:</strong> ₹{selectedJob.estimatedCost}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Address
                </Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  {selectedJob.address}, {selectedJob.city}, {selectedJob.state} - {selectedJob.pincode}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Description</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedJob.description}
                </div>
              </div>

              {/* Work Details */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Work Details</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedJob.workDetails}
                </div>
              </div>

              {/* OTP Verification (if job is completed) */}
              {selectedJob.status === "IN_PROGRESS" && selectedJob.completionOtp && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <Label className="text-sm font-semibold text-gray-700">OTP Verification</Label>
                  <p className="text-sm text-gray-600 mt-2 mb-4">
                    OTP has been sent to customer. Enter the OTP provided by customer to complete the job.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button onClick={handleVerifyOtp} className="bg-green-600 hover:bg-green-700">
                      Verify OTP
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedJob.status === "PENDING" && (
                  <Button
                    onClick={() => handleJobAction(selectedJob.id, "accept")}
                    style={{ backgroundColor: '#3A59FF' }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Accept Job
                  </Button>
                )}
                {selectedJob.status === "ASSIGNED" && (
                  <Button
                    onClick={() => handleJobAction(selectedJob.id, "start")}
                    style={{ backgroundColor: '#3A59FF' }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Start Job
                  </Button>
                )}
                {selectedJob.status === "IN_PROGRESS" && !selectedJob.completionOtp && (
                  <Button
                    onClick={() => handleJobAction(selectedJob.id, "complete")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Job
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "update_status" && "Update Status"}
              {actionType === "add_note" && "Add Note"}
              {actionType === "upload_photos" && "Upload Photos"}
              {actionType === "complete" && "Complete Assignment"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "update_status" && "Update the status of this assignment."}
              {actionType === "add_note" && "Add a note to this assignment."}
              {actionType === "upload_photos" && "Upload photos related to this assignment."}
              {actionType === "complete" && "Mark this assignment as completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "update_status" && (
              <div>
                <Label>New Status *</Label>
                <select
                  value={actionData.status || ""}
                  onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select status...</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                </select>
              </div>
            )}

            {actionType === "add_note" && (
              <div>
                <Label>Note *</Label>
                <Textarea
                  value={actionData.note || ""}
                  onChange={(e) => setActionData({ ...actionData, note: e.target.value })}
                  placeholder="Enter your note..."
                  rows={4}
                />
              </div>
            )}

            {actionType === "upload_photos" && (
              <div>
                <Label>Upload Photos *</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handlePhotoUpload(e.target.files);
                    }
                  }}
                  disabled={uploadingPhotos}
                />
                {actionData.photos && actionData.photos.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {actionData.photos.length} photo(s) ready to upload
                  </div>
                )}
              </div>
            )}

            {actionType === "complete" && selectedJob && (
              <div>
                <Label>Complete Job</Label>
                <p className="text-sm text-gray-600 mt-2 mb-4">
                  This will generate an OTP and send it to the customer. The job will be marked as completed once the customer verifies the OTP.
                </p>
                <Button
                  onClick={() => {
                    handleJobAction(selectedJob.id, "complete");
                    setShowActionModal(false);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Generate OTP & Complete
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionModal(false)}>
              Cancel
            </Button>
            {actionType !== "complete" && (
              <Button onClick={handleAction} disabled={uploadingPhotos}>
                {actionType === "update_status" && "Update"}
                {actionType === "add_note" && "Add Note"}
                {actionType === "upload_photos" && "Upload"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




