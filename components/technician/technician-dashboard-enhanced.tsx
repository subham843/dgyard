"use client";

import { useState, useEffect, useRef } from "react";
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
  Briefcase,
  MapPin,
  DollarSign,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Navigation,
  Camera,
  Shield,
  Bell,
  Settings,
  User,
  Award,
  Loader2,
  X,
  Send,
  Eye,
  FileText,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Navigation2,
  Play,
  Pause,
  ShieldCheck,
  AlertTriangle,
  Ban,
  History,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import { NotificationCenter } from "@/components/notifications/notification-center";

// Types
interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  workDetails: string;
  status: string;
  priority: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
  dealerName: string;
  dealerPhone: string;
  dealerEmail: string;
  estimatedCost?: number;
  finalPrice?: number;
  priceLocked: boolean;
  allowBargaining: boolean;
  negotiationRounds: number;
  completionOtp?: string;
  otpExpiresAt?: string;
  otpVerifiedAt?: string;
  warrantyDays?: number;
  warrantyStartDate?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  distanceKm?: number;
  beforePhotos?: string[];
  afterPhotos?: string[];
  bids?: JobBid[];
}

interface JobBid {
  id: string;
  offeredPrice: number;
  status: string;
  isCounterOffer: boolean;
  roundNumber: number;
  createdAt: string;
}

interface Stats {
  availableJobs: number;
  activeJobs: number;
  completedJobs: number;
  warrantyJobs: number;
  freeTrialUsed: number;
  freeTrialRemaining: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageRating: number;
}

interface Earnings {
  totalEarnings: number;
  releasedAmount: number;
  warrantyHoldAmount: number;
  commissionDeducted: number;
  jobBreakdown: Array<{
    jobId: string;
    jobNumber: string;
    finalPrice: number;
    commission: number;
    releasedDate?: string;
    holdReleaseDate?: string;
  }>;
}

interface WarrantyJob {
  id: string;
  jobId: string;
  jobNumber: string;
  warrantyDays: number;
  remainingDays: number;
  status: string;
  issueReportedAt?: string;
  issueDescription?: string;
}

export function TechnicianDashboardEnhanced() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || "dashboard";
  
  // State
  const [stats, setStats] = useState<Stats>({
    availableJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    warrantyJobs: 0,
    freeTrialUsed: 0,
    freeTrialRemaining: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    averageRating: 0,
  });
  
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [warrantyJobs, setWarrantyJobs] = useState<WarrantyJob[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  
  // Bidding state
  const [counterOffer, setCounterOffer] = useState("");
  const [bidReason, setBidReason] = useState("");
  const [bidding, setBidding] = useState(false);
  
  // OTP state
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  // Photo upload state
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoType, setPhotoType] = useState<"before" | "after">("before");
  
  // Location tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Profile state
  const [profileData, setProfileData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [kycStatus, setKycStatus] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (tabParam === "dashboard") {
      fetchDashboardData();
      fetchProfile(); // Also fetch profile for distance calculations
    } else if (tabParam === "profile") {
      fetchProfile();
    }
  }, [tabParam]);

  // Location tracking effect
  useEffect(() => {
    if (isTracking && selectedJob) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    
    return () => {
      stopLocationTracking();
    };
  }, [isTracking, selectedJob]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchAvailableJobs(),
        fetchMyJobs(),
        fetchWarrantyJobs(),
        fetchEarnings(),
        fetchMyBids(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [availableRes, myJobsRes, earningsRes, profileRes] = await Promise.all([
        fetch("/api/jobs?status=available"),
        fetch("/api/jobs"),
        fetch("/api/technician/earnings"),
        fetch("/api/technician/profile"),
      ]);

      const availableData = await availableRes.json();
      const myJobsData = await myJobsRes.json();
      const earningsData = earningsRes.ok ? await earningsRes.json() : null;
      const profileData = profileRes.ok ? await profileRes.json() : null;

      const available = availableData.jobs || [];
      const myJobsList = myJobsData.jobs || [];
      
      const active = myJobsList.filter((j: Job) => 
        j.status === "ASSIGNED" || j.status === "IN_PROGRESS"
      ).length;
      
      const completed = myJobsList.filter((j: Job) => 
        j.status === "COMPLETED"
      ).length;

      const warranty = warrantyJobs.length;

      setStats({
        availableJobs: available.length,
        activeJobs: active,
        completedJobs: completed,
        warrantyJobs: warranty,
        freeTrialUsed: profileData?.technician?.freeTrialUsed || 0,
        freeTrialRemaining: Math.max(0, (profileData?.technician?.freeTrialRemaining || 0)),
        totalEarnings: earningsData?.totalEarnings || 0,
        pendingEarnings: earningsData?.pendingEarnings || 0,
        averageRating: profileData?.technician?.rating || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      const response = await fetch("/api/jobs?status=available");
      if (response.ok) {
        const data = await response.json();
        // Jobs already have distance calculated and sorted by API
        setAvailableJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching available jobs:", error);
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
    }
  };

  const fetchWarrantyJobs = async () => {
    try {
      const response = await fetch("/api/technician/warranty");
      if (response.ok) {
        const data = await response.json();
        setWarrantyJobs(data.warranties || []);
      }
    } catch (error) {
      console.error("Error fetching warranty jobs:", error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await fetch("/api/technician/earnings");
      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  const fetchMyBids = async () => {
    try {
      const response = await fetch("/api/technician/bids");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched bids data:", data);
        console.log("Number of bids:", data.bids?.length || 0);
        setMyBids(data.bids || []);
        if (data.bids && data.bids.length > 0) {
          console.log("Bids details:", data.bids.map((b: any) => ({
            id: b.id,
            status: b.status,
            price: b.offeredPrice,
            jobNumber: b.job?.jobNumber
          })));
        }
      } else {
        const errorData = await response.json();
        console.error("Error fetching bids - Response not OK:", response.status, errorData);
        toast.error(errorData.error || "Failed to fetch bids");
      }
    } catch (error) {
      console.error("Error fetching bids - Exception:", error);
      toast.error("Failed to fetch bids");
    }
  };

  const handleAcceptCounterOffer = async (jobId: string, bidId: string) => {
    if (!confirm("Are you sure you want to accept this counter offer? The job will be assigned to you at the dealer's price.")) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/bids/${bidId}/accept-technician`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Counter offer accepted! Job assigned to you.");
        fetchMyBids();
        fetchDashboardData();
        setShowJobModal(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to accept counter offer");
      }
    } catch (error) {
      console.error("Error accepting counter offer:", error);
      toast.error("Failed to accept counter offer");
    }
  };

  const handleRejectCounterOffer = async (jobId: string, bidId: string) => {
    if (!confirm("Are you sure you want to reject this counter offer?")) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/bids/${bidId}/reject-technician`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Counter offer rejected");
        fetchMyBids();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject counter offer");
      }
    } catch (error) {
      console.error("Error rejecting counter offer:", error);
      toast.error("Failed to reject counter offer");
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/technician/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.technician);
        setIsOnline(data.technician?.isOnline !== false);
        setKycStatus(data.technician?.isKycCompleted ? "approved" : "pending");
        // Refresh available jobs with distance after profile loads
        if (data.technician?.latitude && data.technician?.longitude) {
          fetchAvailableJobs();
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleAcceptJob = async (jobId: string, price?: number) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "accept",
          price: price ? parseFloat(price.toString()) : undefined,
        }),
      });

      if (response.ok) {
        toast.success("Job accepted successfully!");
        fetchDashboardData();
        setShowJobModal(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to accept job");
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Failed to accept job");
    }
  };

  const handleRejectJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "reject",
        }),
      });

      if (response.ok) {
        toast.success("Job rejected");
        fetchDashboardData();
        setShowJobModal(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject job");
      }
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.error("Failed to reject job");
    }
  };

  const handleSendCounterOffer = async (jobId?: string, previousBidId?: string) => {
    const job = jobId ? myBids.find(b => b.jobId === jobId)?.job : selectedJob;
    
    if (!job || !counterOffer) {
      toast.error("Please enter a bid price");
      return;
    }

    const price = parseFloat(counterOffer);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!bidReason) {
      toast.error("Please select a reason");
      return;
    }

    // Check if this is the first bid or a counter-offer
    const existingBid = myBids.find(b => b.jobId === job.id);
    const isCounterOffer = !!existingBid; // If bid exists, this is a counter-offer

    try {
      setBidding(true);
      const response = await fetch(`/api/jobs/${job.id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredPrice: price,
          message: bidReason,
          isCounterOffer: isCounterOffer,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(isCounterOffer ? "Counter-offer sent successfully!" : "Bid submitted successfully!");
        setShowBidModal(false);
        setCounterOffer("");
        setBidReason("");
        fetchMyBids();
        fetchAvailableJobs();
        if (selectedJob?.id === job.id) {
          fetchJobDetail(job.id);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit bid");
      }
    } catch (error) {
      console.error("Error submitting bid:", error);
      toast.error("Failed to submit bid");
    } finally {
      setBidding(false);
    }
  };

  const handleStartNavigation = async (job: Job) => {
    setSelectedJob(job);
    setIsTracking(true);
    toast.success("Navigation started. Location sharing enabled.");
  };

  const handleStartWork = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (response.ok) {
        toast.success("Work started!");
        setIsTracking(true);
        fetchMyJobs();
        if (selectedJob?.id === jobId) {
          fetchJobDetail(jobId);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to start work");
      }
    } catch (error) {
      console.error("Error starting work:", error);
      toast.error("Failed to start work");
    }
  };

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(location);
            
            // Send location to server every 5-10 seconds
            if (selectedJob) {
              fetch(`/api/jobs/${selectedJob.id}/tracking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(location),
              }).catch((err) => console.error("Error updating location:", err));
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error("Failed to get location. Please enable GPS.");
          }
        );
      };

      // Update immediately
      updateLocation();

      // Update every 5 seconds
      locationIntervalRef.current = setInterval(updateLocation, 5000);
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const stopLocationTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const handleUploadPhotos = async (type: "before" | "after") => {
    if (!selectedJob) return;

    const photos = type === "before" ? beforePhotos : afterPhotos;
    if (photos.length === 0) {
      toast.error(`Please select ${type} photos`);
      return;
    }

    try {
      setUploadingPhotos(true);
      const formData = new FormData();
      photos.forEach((file) => {
        formData.append("photos", file);
      });
      formData.append("type", type);

      const response = await fetch(`/api/jobs/${selectedJob.id}/photos`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success(`${type === "before" ? "Before" : "After"} photos uploaded successfully!`);
        setShowPhotoModal(false);
        if (type === "before") {
          setBeforePhotos([]);
        } else {
          setAfterPhotos([]);
        }
        fetchJobDetail(selectedJob.id);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to upload photos");
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!selectedJob) return;

    // Check if photos are uploaded
    if (!selectedJob.beforePhotos || selectedJob.beforePhotos.length === 0) {
      toast.error("Please upload 'Before' photos first");
      return;
    }

    if (!selectedJob.afterPhotos || selectedJob.afterPhotos.length === 0) {
      toast.error("Please upload 'After' photos first");
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/otp`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show detailed message based on what was sent
        if (data.emailSent && data.whatsappSent) {
          toast.success("OTP sent to customer via WhatsApp and Email");
        } else if (data.emailSent) {
          toast.success("OTP sent to customer via Email");
        } else if (data.whatsappSent) {
          toast.success("OTP sent to customer via WhatsApp");
        } else {
          toast.error("Failed to send OTP via any channel");
        }
        
        // Show warnings if any
        if (data.warnings && data.warnings.length > 0) {
          setTimeout(() => {
            data.warnings.forEach((warning: string) => {
              toast.error(warning, { duration: 4000 });
            });
          }, 500);
        }
        
        setShowOtpModal(true);
        fetchJobDetail(selectedJob.id);
      } else {
        toast.error(data.error || "Failed to request OTP");
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      toast.error("Failed to request OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedJob || !otp) {
      toast.error("Please enter OTP");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      const response = await fetch(`/api/jobs/${selectedJob.id}/otp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Job completed and verified successfully!");
        setShowOtpModal(false);
        setOtp("");
        fetchDashboardData();
        setShowJobModal(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Invalid OTP. Please check and try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const fetchJobDetail = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedJob(data.job);
      }
    } catch (error) {
      console.error("Error fetching job detail:", error);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const response = await fetch("/api/technician/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: !isOnline }),
      });

      if (response.ok) {
        setIsOnline(!isOnline);
        toast.success(`You are now ${!isOnline ? "online" : "offline"}`);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    }
  };

  // Profile Tab
  if (tabParam === "profile") {
    return (
      <div className="bg-white min-h-screen">
        <div className="border-b">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold">Profile & Settings</h1>
          </div>
        </div>
        <div className="px-8 py-8 max-w-4xl">
          {/* Availability Toggle */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Availability</h3>
                <p className="text-sm text-gray-600">
                  {isOnline ? "You are currently online" : "You are currently offline"}
                </p>
              </div>
              <Button
                onClick={handleToggleAvailability}
                className={isOnline ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 hover:bg-gray-500"}
              >
                {isOnline ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </div>

          {/* KYC Status */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">KYC Status</h3>
            <div className="flex items-center gap-4">
              {kycStatus === "approved" ? (
                <>
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-600">KYC Approved</p>
                    <p className="text-sm text-gray-600">Your KYC verification is complete</p>
                  </div>
                </>
              ) : kycStatus === "rejected" ? (
                <>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-600">KYC Rejected</p>
                    <p className="text-sm text-gray-600">Please re-upload your documents</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-600">KYC Pending</p>
                    <p className="text-sm text-gray-600">Please complete your KYC verification</p>
                  </div>
                </>
              )}
            </div>
            <Button className="mt-4" variant="outline">
              {kycStatus === "rejected" ? "Re-upload Documents" : "Upload Documents"}
            </Button>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-lg mb-4">Notification Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>New job available</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Counter-offer response</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Payment released</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Warranty rework request</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back! 👋</h1>
              <p className="text-gray-600">Manage your jobs, track earnings, and grow your business</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          
          {/* Bids Summary Card - Prominent Display */}
          {myBids.length > 0 && (
            <div className="mb-6 p-5 rounded-xl border-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-300 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-4 shadow-md">
                    <Send className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">My Bids</h3>
                    <p className="text-sm text-gray-600">Track your job bids and dealer responses</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  {myBids.filter((b: any) => {
                    const hasCounterOffer = b.status === "COUNTERED" || (b.counterOffers && b.counterOffers.length > 0);
                    const pendingCounter = hasCounterOffer && b.counterOffers?.some((co: any) => co.status === "PENDING");
                    return pendingCounter;
                  }).length > 0 && (
                    <div className="text-center bg-orange-100 px-4 py-2 rounded-lg border border-orange-300">
                      <div className="relative inline-block">
                        <Bell className="w-6 h-6 text-orange-600 animate-pulse" />
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {myBids.filter((b: any) => {
                            const hasCounterOffer = b.status === "COUNTERED" || (b.counterOffers && b.counterOffers.length > 0);
                            const pendingCounter = hasCounterOffer && b.counterOffers?.some((co: any) => co.status === "PENDING");
                            return pendingCounter;
                          }).length}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-orange-700 mt-1">Action Required</p>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{myBids.length}</div>
                    <p className="text-xs text-gray-600 font-medium">Total Bids</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {myBids.filter((b: any) => b.status === "PENDING" || b.status === "COUNTERED").length}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Pending</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {myBids.filter((b: any) => b.status === "ACCEPTED").length}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Accepted</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Briefcase}
              label="Available Jobs"
              value={stats.availableJobs}
              color="blue"
              subtitle="New opportunities"
            />
            <StatCard
              icon={Clock}
              label="Active Jobs"
              value={stats.activeJobs}
              color="purple"
              subtitle="In progress"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={stats.completedJobs}
              color="green"
              subtitle="All time"
            />
            <StatCard
              icon={Shield}
              label="Warranty Jobs"
              value={stats.warrantyJobs}
              color="orange"
              subtitle="Active warranty"
            />
          </div>

          {/* Earnings & Performance Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="md:col-span-2">
              <StatCard
                icon={DollarSign}
                label="Total Earnings"
                value={formatPrice(stats.totalEarnings)}
                color="green"
                subtitle="Lifetime earnings"
                large
              />
            </div>
            <StatCard
              icon={TrendingUp}
              label="Pending Earnings"
              value={formatPrice(stats.pendingEarnings)}
              color="yellow"
              subtitle="Awaiting release"
            />
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Star}
                label="Rating"
                value={stats.averageRating.toFixed(1)}
                color="yellow"
                suffix="⭐"
                small
              />
              <StatCard
                icon={Award}
                label="Free Trial"
                value={`${stats.freeTrialUsed}/${stats.freeTrialRemaining + stats.freeTrialUsed}`}
                color="blue"
                small
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Available Jobs Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Available Jobs</h2>
              <p className="text-gray-600 text-sm">Jobs near your location matching your skills</p>
            </div>
            {availableJobs.length > 0 && (
              <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                {availableJobs.length} Available
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse"></div>
              ))}
            </div>
          ) : availableJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">No available jobs</p>
              <p className="text-gray-500 text-sm">Jobs matching your skills and location will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableJobs.map((job) => (
                <AvailableJobCard
                  key={job.id}
                  job={job}
                  onView={() => {
                    setSelectedJob(job);
                    fetchJobDetail(job.id);
                    setShowJobModal(true);
                  }}
                  onAccept={() => handleAcceptJob(job.id)}
                  onReject={() => handleRejectJob(job.id)}
                  onBid={() => {
                    setSelectedJob(job);
                    setShowBidModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* My Bids Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">My Bids</h2>
              <p className="text-gray-600 text-sm">Track your bids and dealer responses</p>
            </div>
            {myBids.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  {myBids.filter((b: any) => b.status === "COUNTERED" || (b.counterOffers && b.counterOffers.length > 0)).length} with response
                </span>
                <span className="text-sm text-gray-600">
                  {myBids.filter((b: any) => b.status === "PENDING" || b.status === "COUNTERED").length} pending
                </span>
                <span className="text-sm text-gray-600">
                  {myBids.filter((b: any) => b.status === "ACCEPTED").length} accepted
                </span>
                <span className="text-sm text-gray-500">
                  Total: {myBids.length}
                </span>
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse"></div>
              ))}
            </div>
          ) : myBids.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Send className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">No bids submitted yet</p>
              <p className="text-gray-500 text-sm">Submit bids on available jobs to see them here</p>
            </div>
          ) : myBids.filter((b: any) => {
            // Filter out bids where job is null or deleted
            return b.job !== null && b.job !== undefined;
          }).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="bg-yellow-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-yellow-400" />
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">No active bids</p>
              <p className="text-gray-500 text-sm">All your bids are for jobs that no longer exist</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sort: Action Required First, Then Pending, Then Others */}
              {myBids
                .filter((bid: any) => {
                  // Filter out bids where job is null or deleted
                  return bid.job !== null && bid.job !== undefined;
                })
                .sort((a: any, b: any) => {
                  const aHasPendingCounter = (a.status === "COUNTERED" || (a.counterOffers && a.counterOffers.length > 0)) && 
                    a.counterOffers?.some((co: any) => co.status === "PENDING");
                  const bHasPendingCounter = (b.status === "COUNTERED" || (b.counterOffers && b.counterOffers.length > 0)) && 
                    b.counterOffers?.some((co: any) => co.status === "PENDING");
                  
                  if (aHasPendingCounter && !bHasPendingCounter) return -1;
                  if (!aHasPendingCounter && bHasPendingCounter) return 1;
                  
                  const aPending = a.status === "PENDING" || a.status === "COUNTERED";
                  const bPending = b.status === "PENDING" || b.status === "COUNTERED";
                  
                  if (aPending && !bPending) return -1;
                  if (!aPending && bPending) return 1;
                  
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((bid) => {
                  const hasCounterOffer = bid.status === "COUNTERED" || (bid.counterOffers && bid.counterOffers.length > 0);
                  const pendingCounter = hasCounterOffer && bid.counterOffers?.some((co: any) => co.status === "PENDING");
                  
                  return (
                    <MyBidCard
                      key={bid.id}
                      bid={bid}
                      hasDealerResponse={pendingCounter || false}
                      onView={() => {
                        setSelectedJob(bid.job);
                        fetchJobDetail(bid.job.id);
                        setShowJobModal(true);
                      }}
                      onAcceptCounterOffer={() => {
                        const latestCounterOffer = bid.counterOffers && bid.counterOffers.length > 0 
                          ? bid.counterOffers.find((co: any) => co.status === "PENDING") || bid.counterOffers[0]
                          : null;
                        if (latestCounterOffer) {
                          handleAcceptCounterOffer(bid.job.id, latestCounterOffer.id);
                        } else {
                          toast.error("Counter offer not found");
                        }
                      }}
                      onRejectCounterOffer={() => {
                        const latestCounterOffer = bid.counterOffers && bid.counterOffers.length > 0 
                          ? bid.counterOffers.find((co: any) => co.status === "PENDING") || bid.counterOffers[0]
                          : null;
                        if (latestCounterOffer) {
                          handleRejectCounterOffer(bid.job.id, latestCounterOffer.id);
                        } else {
                          toast.error("Counter offer not found");
                        }
                      }}
                      onSendCounterOffer={() => {
                        setSelectedJob(bid.job);
                        setCounterOffer("");
                        setBidReason("");
                        setShowBidModal(true);
                      }}
                    />
                  );
                })}
            </div>
          )}
        </section>

        {/* My Jobs Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">My Jobs</h2>
              <p className="text-gray-600 text-sm">Your active and completed jobs</p>
            </div>
            {myJobs.length > 0 && (
              <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold">
                {myJobs.length} Total
              </div>
            )}
          </div>
          {myJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">No jobs assigned yet</p>
              <p className="text-gray-500 text-sm">Accepted jobs will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myJobs.map((job) => (
                <MyJobCard
                  key={job.id}
                  job={job}
                  onView={() => {
                    setSelectedJob(job);
                    fetchJobDetail(job.id);
                    setShowJobModal(true);
                  }}
                  onStartNavigation={() => handleStartNavigation(job)}
                  onStartWork={() => handleStartWork(job.id)}
                  isTracking={isTracking && selectedJob?.id === job.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Warranty Jobs Section */}
        {warrantyJobs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Warranty Jobs</h2>
                <p className="text-gray-600 text-sm">Jobs under warranty period</p>
              </div>
              <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-semibold">
                {warrantyJobs.length} Active
              </div>
            </div>
            <div className="space-y-4">
              {warrantyJobs.map((warranty) => (
                <WarrantyJobCard key={warranty.id} warranty={warranty} />
              ))}
            </div>
          </section>
        )}

        {/* Earnings Section */}
        {earnings && (
          <section className="mb-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Earnings & Payments</h2>
              <p className="text-gray-600 text-sm">Track your earnings and payment status</p>
            </div>
            <EarningsCard earnings={earnings} />
          </section>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOpen={showJobModal}
          onClose={() => {
            setShowJobModal(false);
            setSelectedJob(null);
          }}
          onStartNavigation={() => handleStartNavigation(selectedJob)}
          onStartWork={() => handleStartWork(selectedJob.id)}
          onUploadPhotos={(type) => {
            setPhotoType(type);
            setShowPhotoModal(true);
          }}
          onRequestOtp={handleRequestOtp}
          isTracking={isTracking}
          currentLocation={currentLocation}
        />
      )}

      {/* Bidding Modal */}
      <BiddingModal
        isOpen={showBidModal}
        onClose={() => {
          setShowBidModal(false);
          setCounterOffer("");
          setBidReason("");
        }}
        job={selectedJob}
        counterOffer={counterOffer}
        setCounterOffer={setCounterOffer}
        bidReason={bidReason}
        setBidReason={setBidReason}
        onSubmit={() => handleSendCounterOffer()}
        loading={bidding}
      />

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          if (photoType === "before") {
            setBeforePhotos([]);
          } else {
            setAfterPhotos([]);
          }
        }}
        type={photoType}
        photos={photoType === "before" ? beforePhotos : afterPhotos}
        setPhotos={photoType === "before" ? setBeforePhotos : setAfterPhotos}
        onUpload={() => handleUploadPhotos(photoType)}
        uploading={uploadingPhotos}
      />

      {/* OTP Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setOtp("");
        }}
        otp={otp}
        setOtp={setOtp}
        onVerify={handleVerifyOtp}
        verifying={verifyingOtp}
        job={selectedJob}
      />

      {/* Notifications */}
      <div className="fixed bottom-4 right-4">
        <NotificationCenter />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, suffix, subtitle, large, small }: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  suffix?: string;
  subtitle?: string;
  large?: boolean;
  small?: boolean;
}) {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-300 shadow-sm",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-300 shadow-sm",
    green: "bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-300 shadow-sm",
    orange: "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 border-orange-300 shadow-sm",
    yellow: "bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-300 shadow-sm",
  };

  const iconBgClasses = {
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    green: "bg-green-600",
    orange: "bg-orange-600",
    yellow: "bg-yellow-600",
  };

  const iconSize = small ? 'w-4 h-4' : large ? 'w-6 h-6' : 'w-5 h-5';
  const paddingClass = small ? 'p-3' : large ? 'p-4 md:p-6' : 'p-4 md:p-5';
  const textSize = small ? 'text-xs' : 'text-sm';
  const valueSize = large ? 'text-3xl md:text-4xl' : small ? 'text-xl' : 'text-2xl';

  return (
    <div className={`rounded-xl border-2 ${paddingClass} transition-all hover:shadow-md ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`${iconBgClasses[color as keyof typeof iconBgClasses]} rounded-lg p-2 shadow-sm`}>
            <Icon className={`${iconSize} text-white`} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`${textSize} font-semibold block truncate`}>{label}</span>
            {subtitle && (
              <span className="text-xs text-gray-500 mt-0.5 block">{subtitle}</span>
            )}
          </div>
        </div>
      </div>
      <div className={`${valueSize} font-bold`}>
        {value}{suffix && ` ${suffix}`}
      </div>
    </div>
  );
}

// Available Job Card Component - Enhanced Design
function AvailableJobCard({ job, onView, onAccept, onReject, onBid }: {
  job: Job;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
  onBid: () => void;
}) {
  const priorityColors = {
    URGENT: "bg-red-100 text-red-700 border-red-300",
    HIGH: "bg-orange-100 text-orange-700 border-orange-300",
    NORMAL: "bg-gray-100 text-gray-700 border-gray-300",
    LOW: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Section - Job Info */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex-1 min-w-[200px]">{job.title}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {job.jobNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                priorityColors[job.priority as keyof typeof priorityColors] || priorityColors.NORMAL
              }`}>
                {job.priority}
              </span>
              {job.allowBargaining && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  💰 Bidding Allowed
                </span>
              )}
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <span className="font-medium">{job.city}, {job.state}</span>
                {job.distanceKm && (
                  <span className="ml-2 text-sm text-blue-600 font-semibold">
                    📍 {job.distanceKm.toFixed(1)} km away
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Dealer:</span>
                <span className="font-medium ml-1">{job.dealerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Expected:</span>
                <span className="font-bold text-lg text-green-600 ml-1">
                  {job.estimatedCost ? formatPrice(job.estimatedCost) : "Not specified"}
                </span>
              </div>
            </div>
            {job.scheduledAt && (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-600">Scheduled:</span>
                  <span className="font-medium ml-1">{formatDate(job.scheduledAt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {job.description}
            </p>
          )}
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex flex-col gap-2 lg:w-auto w-full">
          <Button 
            variant="outline" 
            onClick={onView}
            className="w-full lg:w-auto border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={onAccept} 
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button 
              onClick={onReject} 
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
          {job.allowBargaining && (
            <Button 
              onClick={onBid} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Bid
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// My Job Card Component - Enhanced Design
function MyJobCard({ job, onView, onStartNavigation, onStartWork, isTracking }: {
  job: Job;
  onView: () => void;
  onStartNavigation: () => void;
  onStartWork: () => void;
  isTracking: boolean;
}) {
  const statusColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    ASSIGNED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", icon: Clock },
    WAITING_FOR_PAYMENT: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-300", icon: DollarSign },
    IN_PROGRESS: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300", icon: Play },
    COMPLETED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", icon: CheckCircle2 },
    COMPLETION_PENDING_APPROVAL: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300", icon: Clock },
  };

  const statusInfo = statusColors[job.status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-300", icon: Briefcase };
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-purple-300">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Section */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex-1 min-w-[200px]">{job.title}</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} flex items-center gap-1.5`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {job.status.replace(/_/g, " ")}
              </span>
              {job.finalPrice && (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                  💰 {formatPrice(job.finalPrice)}
                </span>
              )}
              {job.warrantyDays && (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-300">
                  🛡️ {job.warrantyDays} days warranty
                </span>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="font-semibold ml-1">{job.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="font-medium">{job.city}, {job.state}</span>
            </div>
            {job.scheduledAt && (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-600">Scheduled:</span>
                  <span className="font-medium ml-1">{formatDate(job.scheduledAt)}</span>
                </div>
              </div>
            )}
            {job.startedAt && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-600">Started:</span>
                  <span className="font-medium ml-1">{formatDate(job.startedAt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tracking Status */}
          {isTracking && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Navigation2 className="w-5 h-5 text-green-600 animate-pulse" />
              <span className="text-sm font-semibold text-green-700">Location sharing active</span>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-col gap-2 lg:w-auto w-full">
          <Button 
            variant="outline" 
            onClick={onView}
            className="w-full lg:w-auto border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          {job.status === "ASSIGNED" && (
            <>
              <Button 
                onClick={onStartNavigation} 
                variant="outline"
                className="w-full lg:w-auto border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigation
              </Button>
              <Button 
                onClick={onStartWork} 
                className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Work
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// My Bid Card Component - Enhanced Design
function MyBidCard({ bid, hasDealerResponse, onView, onAcceptCounterOffer, onRejectCounterOffer, onSendCounterOffer }: {
  bid: any;
  hasDealerResponse: boolean;
  onView: () => void;
  onAcceptCounterOffer: () => void;
  onRejectCounterOffer: () => void;
  onSendCounterOffer: () => void;
}) {
  const statusColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300", icon: Clock },
    ACCEPTED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", icon: CheckCircle2 },
    REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", icon: X },
    COUNTERED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", icon: Send },
    EXPIRED: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-300", icon: Clock },
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending Response";
      case "ACCEPTED":
        return "Accepted ✓";
      case "REJECTED":
        return "Rejected ✗";
      case "COUNTERED":
        return "Counter Offer";
      case "EXPIRED":
        return "Expired";
      default:
        return status;
    }
  };

  // Check if there's a counter offer from dealer
  const hasCounterOffer = bid.status === "COUNTERED" || (bid.counterOffers && bid.counterOffers.length > 0);
  const latestCounterOffer = bid.counterOffers && bid.counterOffers.length > 0 
    ? bid.counterOffers.find((co: any) => co.status === "PENDING" || co.status === "ACCEPTED") || bid.counterOffers[0]
    : null;
  
  const pendingCounter = hasCounterOffer && bid.counterOffers?.some((co: any) => co.status === "PENDING");
  const needsAction = (bid.status === "PENDING" || bid.status === "COUNTERED" || pendingCounter) && bid.status !== "ACCEPTED" && bid.status !== "REJECTED";
  
  const statusInfo = statusColors[bid.status] || statusColors.PENDING;
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-200 ${
      hasDealerResponse ? "border-orange-400 shadow-md" : "border-gray-200"
    }`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Section */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex-1 min-w-[200px]">{bid.job?.title || "Job"}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {bid.job?.jobNumber}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {getStatusText(bid.status)}
              </span>
              {bid.isCounterOffer && (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  Round {bid.roundNumber}
                </span>
              )}
            </div>
          </div>
          
          {/* Bid Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Your Bid:</span>
                <span className="font-bold text-lg text-green-600 ml-2">{formatPrice(bid.offeredPrice)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Dealer Expected:</span>
                <span className="font-semibold ml-2">{bid.job?.estimatedCost ? formatPrice(bid.job.estimatedCost) : "Not specified"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="font-medium">{bid.job?.city}, {bid.job?.state}</span>
              {bid.distanceKm && (
                <span className="text-sm text-blue-600 font-semibold ml-1">({bid.distanceKm.toFixed(1)} km)</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Dealer:</span>
                <span className="font-semibold ml-1">{bid.job?.dealerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Bid Date:</span>
                <span className="font-medium ml-1">{formatDate(bid.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Counter Offer from Dealer */}
          {hasCounterOffer && latestCounterOffer && (
            <div className={`rounded-xl p-5 mb-4 ${
              hasDealerResponse || (pendingCounter && latestCounterOffer.status === "PENDING")
                ? "bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-50 border-2 border-orange-400 shadow-lg ring-2 ring-orange-200" 
                : "bg-blue-50 border-2 border-blue-200"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${hasDealerResponse ? "bg-orange-500 animate-pulse" : "bg-blue-500"}`}>
                  <AlertCircle className={`w-5 h-5 text-white`} />
                </div>
                <h4 className={`font-bold ${hasDealerResponse ? "text-orange-900 text-lg" : "text-blue-900"}`}>
                  {hasDealerResponse ? "🔔 Counter Offer - Action Required!" : "Counter Offer from Dealer"}
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Dealer's Offer:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {formatPrice(latestCounterOffer.offeredPrice)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full">
                    📅 {formatDate(latestCounterOffer.createdAt)}
                  </div>
                </div>
                {latestCounterOffer.roundNumber && (
                  <div className="text-xs text-gray-500">
                    Negotiation Round: {latestCounterOffer.roundNumber} / 2
                  </div>
                )}
                
                {/* Action buttons based on counter offer status */}
                {latestCounterOffer.status === "PENDING" && (
                  <>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        onClick={onAcceptCounterOffer}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Accept Offer
                      </Button>
                      <Button
                        onClick={onRejectCounterOffer}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      {bid.job?.negotiationRounds < 2 && (
                        <Button
                          onClick={onSendCounterOffer}
                          variant="outline"
                          className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Counter
                        </Button>
                      )}
                    </div>
                    {bid.job?.negotiationRounds >= 2 && (
                      <div className="text-xs text-orange-600 mt-2">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Maximum negotiation rounds reached. You can only accept or reject this counter offer.
                      </div>
                    )}
                  </>
                )}
                {latestCounterOffer.status === "ACCEPTED" && (
                  <div className="text-sm text-green-700 mt-2 font-semibold">
                    ✓ Counter offer accepted. Job assigned to you.
                  </div>
                )}
                {latestCounterOffer.status === "REJECTED" && (
                  <div className="text-sm text-gray-600 mt-2">
                    Counter offer was rejected. You can send a new counter offer if rounds remaining.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bid Accepted - Job Assigned */}
          {bid.status === "ACCEPTED" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Bid Accepted! Job Assigned to You</p>
                  {bid.job?.finalPrice && (
                    <p className="text-sm text-green-700 mt-1">
                      Final Price: {formatPrice(bid.job.finalPrice)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bid Rejected */}
          {bid.status === "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <p className="font-semibold text-red-900">Your bid was rejected by the dealer</p>
              </div>
            </div>
          )}

          {/* Bid Message */}
          {bid.message && (
            <div className="text-sm text-gray-700 mt-2">
              <strong>Your Message:</strong> {bid.message}
            </div>
          )}
        </div>
        
        {/* Right Section - Actions */}
        <div className="flex flex-col gap-2 lg:w-auto w-full">
          <Button 
            variant="outline" 
            onClick={onView}
            className="w-full lg:w-auto border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Job
          </Button>
          {needsAction && !pendingCounter && bid.job?.allowBargaining && bid.job?.negotiationRounds < 2 && (
            <Button
              onClick={onSendCounterOffer}
              variant="outline"
              className="w-full lg:w-auto border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Counter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Warranty Job Card Component
function WarrantyJobCard({ warranty }: { warranty: WarrantyJob }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">Warranty: {warranty.jobNumber}</h3>
            <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
              {warranty.remainingDays} days remaining
            </span>
          </div>
          {warranty.issueDescription && (
            <p className="text-sm text-gray-700 mt-2">{warranty.issueDescription}</p>
          )}
        </div>
        <Button variant="outline">View Details</Button>
      </div>
    </div>
  );
}

// Earnings Card Component - Enhanced Design
function EarningsCard({ earnings }: { earnings: Earnings }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-600 rounded-lg p-2">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Total Earnings</p>
              <p className="text-2xl md:text-3xl font-bold text-green-700">{formatPrice(earnings.totalEarnings)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 rounded-lg p-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Released</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-700">{formatPrice(earnings.releasedAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-600 rounded-lg p-2">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Warranty Hold</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-700">{formatPrice(earnings.warrantyHoldAmount)}</p>
            </div>
          </div>
        </div>
        {/* Commission card removed - technicians should not see platform fee breakdown */}
      </div>

      {/* Job Breakdown */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Job-wise Breakdown
        </h3>
        <div className="space-y-3">
          {earnings.jobBreakdown.map((job) => {
            const isReleased = !!job.releasedDate;
            const isOnHold = !!job.holdReleaseDate;
            
            return (
              <div 
                key={job.jobId} 
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  isReleased 
                    ? "bg-green-50 border-green-200" 
                    : isOnHold 
                    ? "bg-orange-50 border-orange-200" 
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-bold text-gray-900">{job.jobNumber}</p>
                    {isReleased && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-700">
                        Released
                      </span>
                    )}
                    {isOnHold && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-200 text-orange-700">
                        On Hold
                      </span>
                    )}
                    {!isReleased && !isOnHold && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-700">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {job.releasedDate ? `Released: ${formatDate(job.releasedDate)}` : 
                     job.holdReleaseDate ? `Hold until: ${formatDate(job.holdReleaseDate)}` : 
                     "Awaiting release"}
                  </p>
                </div>
                <div className="text-right ml-4">
                  {/* Show only net amount - hide commission breakdown */}
                  <p className="text-xl font-bold text-gray-900">
                    {isReleased 
                      ? formatPrice(job.finalPrice - (job.commission || 0))
                      : formatPrice(job.finalPrice - (job.commission || 0))
                    }
                  </p>
                  {isReleased && (
                    <p className="text-sm text-green-600 font-semibold mt-1">
                      Available
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Job Detail Modal Component - Complete with all details
function JobDetailModal({ job, isOpen, onClose, onStartNavigation, onStartWork, onUploadPhotos, onRequestOtp, isTracking, currentLocation }: {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onStartNavigation: () => void;
  onStartWork: () => void;
  onUploadPhotos: (type: "before" | "after") => void;
  onRequestOtp: () => void;
  isTracking: boolean;
  currentLocation: { lat: number; lng: number } | null;
}) {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    COMPLETION_PENDING_APPROVAL: "bg-orange-100 text-orange-800 border-orange-200",
    WAITING_FOR_PAYMENT: "bg-amber-100 text-amber-800 border-amber-200",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    NORMAL: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const openGoogleMaps = () => {
    if (job.latitude && job.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2">{job.title}</DialogTitle>
              <DialogDescription className="text-base">
                Job Number: <span className="font-semibold text-gray-900">{job.jobNumber}</span>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(job.status)}`}>
                {job.status.replace(/_/g, " ")}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityColors[job.priority] || priorityColors.NORMAL}`}>
                {job.priority}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Customer & Dealer Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-900">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{job.customerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${job.customerPhone}`} className="text-blue-600 hover:underline font-medium">
                    {job.customerPhone}
                  </a>
                </div>
                {job.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <a href={`mailto:${job.customerEmail}`} className="text-blue-600 hover:underline text-sm">
                      {job.customerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Dealer Info */}
            <div className="bg-green-50 rounded-lg p-5 border border-green-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-900">
                <Briefcase className="w-5 h-5" />
                Dealer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{job.dealerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${job.dealerPhone}`} className="text-green-600 hover:underline font-medium">
                    {job.dealerPhone}
                  </a>
                </div>
                {job.dealerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <a href={`mailto:${job.dealerEmail}`} className="text-green-600 hover:underline text-sm">
                      {job.dealerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Location */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Service Address
              </h3>
              <div className="space-y-2 text-gray-700">
                <p className="font-medium">{job.address}</p>
                <p>{job.city}, {job.state} - {job.pincode}</p>
                {job.placeName && (
                  <p className="text-sm text-gray-500">{job.placeName}</p>
                )}
                {job.distanceKm && (
                  <p className="text-sm text-blue-600 font-medium">
                    📍 Distance: {job.distanceKm.toFixed(1)} km away
                  </p>
                )}
                {job.latitude && job.longitude && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openGoogleMaps}
                    className="mt-3"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Open in Google Maps
                  </Button>
                )}
              </div>
            </div>

            {/* Schedule & Pricing */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Schedule & Pricing
              </h3>
              <div className="space-y-3">
                {job.scheduledAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Scheduled Date</p>
                    <p className="font-semibold">{formatDate(job.scheduledAt)}</p>
                  </div>
                )}
                {job.estimatedCost && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
                    <p className="font-semibold text-lg text-blue-600">{formatPrice(job.estimatedCost)}</p>
                  </div>
                )}
                {job.finalPrice && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Final Price</p>
                    <p className="font-semibold text-lg text-green-600">{formatPrice(job.finalPrice)}</p>
                  </div>
                )}
                {job.warrantyDays && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Warranty</p>
                    <p className="font-semibold text-orange-600">{job.warrantyDays} days</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Description & Work Details */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Job Details
            </h3>
            <div className="space-y-4">
              {job.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{job.description}</p>
                </div>
              )}
              {job.workDetails && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Work Details</p>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{job.workDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* Photos Section */}
          {(job.beforePhotos && job.beforePhotos.length > 0) || (job.afterPhotos && job.afterPhotos.length > 0) ? (
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-600" />
                Work Photos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {job.beforePhotos && job.beforePhotos.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Before Photos ({job.beforePhotos.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {job.beforePhotos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Before ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {job.afterPhotos && job.afterPhotos.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">After Photos ({job.afterPhotos.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {job.afterPhotos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`After ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Status & Tracking */}
          {isTracking && currentLocation && (
            <div className="bg-green-50 rounded-lg p-5 border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <Navigation2 className="w-5 h-5 animate-pulse" />
                <span className="font-semibold">Location Tracking Active</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Current Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {job.status === "ASSIGNED" && (
              <>
                <Button onClick={onStartNavigation} variant="outline" className="flex-1">
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Navigation
                </Button>
                <Button onClick={onStartWork} style={{ backgroundColor: '#3A59FF' }} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Start Work
                </Button>
              </>
            )}
            {job.status === "IN_PROGRESS" && (
              <>
                <Button 
                  onClick={() => onUploadPhotos("before")} 
                  variant="outline"
                  disabled={job.beforePhotos && job.beforePhotos.length > 0}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {job.beforePhotos && job.beforePhotos.length > 0 ? `Before (${job.beforePhotos.length})` : "Upload Before Photos"}
                </Button>
                <Button 
                  onClick={() => onUploadPhotos("after")} 
                  variant="outline"
                  disabled={job.afterPhotos && job.afterPhotos.length > 0}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {job.afterPhotos && job.afterPhotos.length > 0 ? `After (${job.afterPhotos.length})` : "Upload After Photos"}
                </Button>
                <Button 
                  onClick={onRequestOtp} 
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  disabled={!job.beforePhotos || job.beforePhotos.length === 0 || !job.afterPhotos || job.afterPhotos.length === 0}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Request OTP
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Bidding Modal Component
function BiddingModal({ isOpen, onClose, job, counterOffer, setCounterOffer, bidReason, setBidReason, onSubmit, loading }: {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  counterOffer: string;
  setCounterOffer: (value: string) => void;
  bidReason: string;
  setBidReason: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{job.allowBargaining ? "Submit Bid / Counter-Offer" : "Submit Bid"}</DialogTitle>
          <DialogDescription>
            {job.allowBargaining 
              ? "You can send only 1 counter-offer. Max negotiation rounds: 2"
              : "Submit your bid for this job"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Dealer Expected Price</Label>
            <Input value={job.estimatedCost ? formatPrice(job.estimatedCost) : "Not specified"} disabled />
          </div>
          <div>
            <Label>Your Counter-Offer *</Label>
            <Input
              type="number"
              value={counterOffer}
              onChange={(e) => setCounterOffer(e.target.value)}
              placeholder="Enter your price"
            />
          </div>
          <div>
            <Label>Reason *</Label>
            <select
              value={bidReason}
              onChange={(e) => setBidReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select reason...</option>
              <option value="distance">Distance</option>
              <option value="complexity">Complexity</option>
              <option value="urgency">Urgency</option>
            </select>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Price will be locked after acceptance. No further negotiation allowed.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading || !counterOffer || !bidReason}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {job.allowBargaining ? "Submit Bid" : "Submit Bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Photo Upload Modal Component
function PhotoUploadModal({ isOpen, onClose, type, photos, setPhotos, onUpload, uploading }: {
  isOpen: boolean;
  onClose: () => void;
  type: "before" | "after";
  photos: File[];
  setPhotos: (files: File[]) => void;
  onUpload: () => void;
  uploading: boolean;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload {type === "before" ? "Before" : "After"} Photos</DialogTitle>
          <DialogDescription>
            {type === "before" ? "Upload photos before starting work" : "Upload photos after completing work"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Select Photos *</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
            {photos.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">{photos.length} photo(s) selected</p>
            )}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {type === "before" ? "Before" : "After"} photos are mandatory. You cannot request OTP without uploading photos.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onUpload} disabled={uploading || photos.length === 0}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// OTP Modal Component
function OtpModal({ isOpen, onClose, otp, setOtp, onVerify, verifying, job }: {
  isOpen: boolean;
  onClose: () => void;
  otp: string;
  setOtp: (value: string) => void;
  onVerify: () => void;
  verifying: boolean;
  job: Job | null;
}) {
  const [resending, setResending] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState<string>("");

  // Fetch OTP sent info when modal opens
  useEffect(() => {
    if (isOpen && job) {
      // OTP is sent to customer phone and email
      if (job.customerPhone) {
        const phone = job.customerPhone.startsWith("+") 
          ? job.customerPhone 
          : `+91${job.customerPhone}`;
        setOtpSentTo(`WhatsApp: ${phone}${job.customerEmail ? ` & Email: ${job.customerEmail}` : ""}`);
      } else if (job.customerEmail) {
        setOtpSentTo(`Email: ${job.customerEmail}`);
      } else {
        setOtpSentTo("Customer contact");
      }
    }
  }, [isOpen, job]);

  const handleResendOtp = async () => {
    if (!job) return;
    
    try {
      setResending(true);
      const response = await fetch(`/api/jobs/${job.id}/otp`, { method: "POST" });
      if (response.ok) {
        toast.success("OTP resent to customer via WhatsApp and Email");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing on outside click - only allow explicit close
      if (!open && !verifying) {
        onClose();
      }
    }}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Verify OTP to Complete Job</DialogTitle>
          <DialogDescription>
            Enter the 6-digit OTP sent to the customer to complete and verify the job
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {otpSentTo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  <strong>OTP sent to:</strong> {otpSentTo}
                </span>
              </div>
            </div>
          )}
          <div>
            <Label>OTP *</Label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Enter the OTP received by the customer</p>
          </div>
          <Button
            variant="outline"
            onClick={handleResendOtp}
            disabled={resending}
            className="w-full"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Resend OTP to Customer
              </>
            )}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={verifying}>
            Cancel
          </Button>
          <Button onClick={onVerify} disabled={verifying || !otp || otp.length !== 6}>
            {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Verify & Complete Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


