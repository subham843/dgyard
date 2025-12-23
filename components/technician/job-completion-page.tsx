"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileText,
  MapPin,
  Building2,
  Calendar,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  location?: {
    city: string;
    state: string;
    address: string;
  };
  dealer: {
    businessName: string;
  };
  city?: string;
  state?: string;
  address?: string;
}

export function JobCompletionPage({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [remarks, setRemarks] = useState("");
  const [customerOtp, setCustomerOtp] = useState("");
  const [workChecklist, setWorkChecklist] = useState<string[]>([]);
  const [otpInfo, setOtpInfo] = useState<{
    sent: boolean;
    channels: string[];
    customerPhone?: string;
    customerEmail?: string;
  } | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJobDetails();
    fetchOtpInfo();
  }, [jobId]);

  // OTP Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/technician/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob({
          id: data.job.id,
          jobNumber: data.job.jobNumber,
          title: data.job.title,
          description: data.job.description,
          location: data.job.location,
          dealer: data.job.dealer,
          city: data.job.location?.city,
          state: data.job.location?.state,
          address: data.job.location?.address,
        });
        // Generate work checklist based on job type
        generateWorkChecklist(data.job);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch job details");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const generateWorkChecklist = (jobData: any) => {
    // Auto-generate checklist based on job type/description
    const checklist = [
      "Work completed as per requirements",
      "All equipment tested and functioning",
      "Site cleaned and organized",
      "Customer briefed on usage",
    ];
    setWorkChecklist(checklist);
  };

  const fetchOtpInfo = async () => {
    try {
      // Fetch job details to get customer contact info
      const response = await fetch(`/api/technician/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        const jobData = data.job;
        // Note: OTP info might not be in technician endpoint, fetch from main endpoint if needed
        const otpResponse = await fetch(`/api/jobs/${jobId}/otp`).catch(() => null);
        let otpData = null;
        if (otpResponse?.ok) {
          otpData = await otpResponse.json();
        }
        const isOtpSent = otpData?.otpSent || false;
        setOtpInfo({
          sent: isOtpSent,
          channels: otpData?.channels || [],
          customerPhone: jobData.customerPhone,
          customerEmail: jobData.customerEmail,
        });
        
        // If OTP was sent, check if we need to set timer
        if (isOtpSent && otpData?.otpExpiresAt) {
          const expiresAt = new Date(otpData.otpExpiresAt);
          const now = new Date();
          const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
          if (secondsRemaining > 0 && secondsRemaining <= 30) {
            setOtpTimer(secondsRemaining);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching OTP info:", error);
    }
  };

  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      const response = await fetch(`/api/jobs/${jobId}/otp`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "OTP sent successfully");
        
        // Update OTP info
        setOtpInfo((prev) => ({
          ...prev!,
          sent: true,
          channels: data.channels || [],
        }));
        
        // Start 30 second timer
        setOtpTimer(30);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePhotoUpload = (
    files: FileList | null,
    type: "before" | "after"
  ) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const imageFiles = newFiles.filter(
      (file) => file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      return;
    }

    if (type === "before") {
      setBeforePhotos((prev) => [...prev, ...imageFiles].slice(0, 10));
    } else {
      setAfterPhotos((prev) => [...prev, ...imageFiles].slice(0, 10));
    }
  };

  const removePhoto = (index: number, type: "before" | "after") => {
    if (type === "before") {
      setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (beforePhotos.length === 0) {
      toast.error("Please upload at least one 'Before' photo");
      return;
    }

    if (afterPhotos.length === 0) {
      toast.error("Please upload at least one 'After' photo");
      return;
    }

    // Remarks is now optional - removed validation

    if (!customerOtp.trim()) {
      toast.error("Please enter customer OTP for verification");
      return;
    }

    try {
      setSubmitting(true);

      // Upload photos
      const beforeUrls: string[] = [];
      const afterUrls: string[] = [];

      // Upload before photos
      for (const photo of beforePhotos) {
        const formData = new FormData();
        formData.append("file", photo);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          beforeUrls.push(data.url);
        }
      }

      // Upload after photos
      for (const photo of afterPhotos) {
        const formData = new FormData();
        formData.append("file", photo);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          afterUrls.push(data.url);
        }
      }

      // Submit completion
      const response = await fetch(`/api/jobs/${jobId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beforePhotos: beforeUrls,
          afterPhotos: afterUrls,
          remarks,
          customerOtp,
          workChecklist,
        }),
      });

      if (response.ok) {
        toast.success("Job completed successfully!");
        setTimeout(() => {
          window.location.href = "/technician/jobs/my-jobs";
        }, 2000);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to complete job");
      }
    } catch (error) {
      console.error("Error completing job:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Job not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Job</h1>
          <p className="text-gray-600">Upload proof and complete the job</p>
        </div>

        {/* Job Info */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="font-mono text-xs">{job.jobNumber}</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {job.dealer.businessName}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location?.city || "N/A"}, {job.location?.state || "N/A"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{job.description}</p>
          </CardContent>
        </Card>

        {/* Before Photos */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Before Photos *</CardTitle>
            <CardDescription>Upload photos of the work area before starting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => beforeInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
                <input
                  ref={beforeInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files, "before")}
                />
                <span className="text-sm text-gray-600">
                  {beforePhotos.length} photo(s) selected
                </span>
              </div>
              {beforePhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {beforePhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Before ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removePhoto(index, "before")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* After Photos */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>After Photos *</CardTitle>
            <CardDescription>Upload photos of the completed work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => afterInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
                <input
                  ref={afterInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files, "after")}
                />
                <span className="text-sm text-gray-600">
                  {afterPhotos.length} photo(s) selected
                </span>
              </div>
              {afterPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {afterPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`After ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removePhoto(index, "after")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Checklist */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Work Checklist</CardTitle>
            <CardDescription>Auto-generated checklist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Remarks */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Remarks (Optional)</CardTitle>
            <CardDescription>Add any additional notes about the work</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe the work completed, any issues faced, recommendations... (Optional)"
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Customer OTP */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Customer OTP / Signature *</CardTitle>
            <CardDescription>Enter the OTP provided by the customer for verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  value={customerOtp}
                  onChange={(e) => setCustomerOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || otpTimer > 0}
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : otpTimer > 0 ? (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Resend OTP ({otpTimer}s)
                    </>
                  ) : otpInfo?.sent ? (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Resend OTP
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
              
              {/* OTP Info */}
              {otpInfo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">OTP Delivery Information:</p>
                  <div className="space-y-1 text-xs text-blue-800">
                    {otpInfo.customerPhone && (
                      <p>📱 WhatsApp: {otpInfo.customerPhone}</p>
                    )}
                    {otpInfo.customerEmail && (
                      <p>📧 Email: {otpInfo.customerEmail}</p>
                    )}
                    {otpInfo.sent && (
                      <p className="text-green-700 font-medium mt-2">
                        ✅ OTP has been sent to the customer
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-600">
                {otpInfo?.sent 
                  ? "The OTP has been sent to the customer via WhatsApp and Email. Ask them to provide it for verification."
                  : "Click 'Send OTP' to send the verification code to the customer via WhatsApp and Email."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || beforePhotos.length === 0 || afterPhotos.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Job as Completed
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

