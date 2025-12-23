"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Upload, 
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Camera,
  FileText,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface KYCData {
  aadhaarCard: {
    front?: string;
    back?: string;
    status: string;
    rejectionReason?: string;
  };
  panCard: {
    image?: string;
    status: string;
    rejectionReason?: string;
  };
  addressProof: {
    image?: string;
    status: string;
    rejectionReason?: string;
  };
  livePhoto: {
    image?: string;
    status: string;
    rejectionReason?: string;
  };
  overallStatus: string;
}

export function KYCPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kyc, setKyc] = useState<KYCData>({
    aadhaarCard: { status: "PENDING" },
    panCard: { status: "PENDING" },
    addressProof: { status: "PENDING" },
    livePhoto: { status: "PENDING" },
    overallStatus: "PENDING",
  });

  const aadhaarFrontRef = useRef<HTMLInputElement>(null);
  const aadhaarBackRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const livePhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKYC();
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchKYC = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/kyc");
      if (response.ok) {
        const data = await response.json();
        setKyc(data.kyc || kyc);
      }
    } catch (error) {
      console.error("Error fetching KYC:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: string) => {
    try {
      setUploading(type);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", type);

      const response = await fetch("/api/technician/kyc/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Document uploaded successfully");
        await fetchKYC();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Something went wrong");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitKYC = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/technician/kyc/submit", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("KYC submitted successfully! Pending admin verification.");
        await fetchKYC();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit KYC");
      }
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "live-photo.jpg", { type: "image/jpeg" });
            stopCamera();
            await handleFileUpload(file, "live_photo");
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  // Check if all documents are uploaded
  const allDocumentsUploaded = 
    kyc.aadhaarCard.front && 
    kyc.aadhaarCard.back && 
    kyc.panCard.image && 
    kyc.addressProof.image && 
    kyc.livePhoto.image;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC & Verification</h1>
          <p className="text-gray-600">Complete your KYC to enable bidding and payouts</p>
        </div>

        {/* Overall Status */}
        <Card className={`mb-6 border-2 ${
          kyc.overallStatus === "VERIFIED" ? "border-green-200 bg-green-50" :
          kyc.overallStatus === "REJECTED" ? "border-red-200 bg-red-50" :
          "border-yellow-200 bg-yellow-50"
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg mb-1">KYC Status</div>
                <div className="text-sm text-gray-600">
                  {kyc.overallStatus === "VERIFIED" && "Your KYC is verified. You can bid and withdraw funds."}
                  {kyc.overallStatus === "REJECTED" && "Your KYC was rejected. Please resubmit documents."}
                  {kyc.overallStatus === "PENDING" && "KYC is pending verification. Please complete all documents."}
                </div>
              </div>
              {getStatusBadge(kyc.overallStatus)}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <div className="space-y-4">
          {/* Aadhaar Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Aadhaar Card</CardTitle>
              <CardDescription>Upload front and back of your Aadhaar card</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Front Side</Label>
                  <div className="mt-2 space-y-2">
                    {kyc.aadhaarCard.front && (
                      <div className="relative w-full">
                        <img 
                          src={kyc.aadhaarCard.front} 
                          alt="Aadhaar Front" 
                          className="w-full h-48 object-contain rounded border bg-gray-50" 
                          onError={(e) => {
                            console.error("Failed to load image:", kyc.aadhaarCard.front);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => aadhaarFrontRef.current?.click()}
                      disabled={uploading === "aadhaar_front"}
                    >
                      {uploading === "aadhaar_front" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Front
                    </Button>
                    <input
                      ref={aadhaarFrontRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "aadhaar_front");
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Back Side</Label>
                  <div className="mt-2 space-y-2">
                    {kyc.aadhaarCard.back && (
                      <div className="relative w-full">
                        <img 
                          src={kyc.aadhaarCard.back} 
                          alt="Aadhaar Back" 
                          className="w-full h-48 object-contain rounded border bg-gray-50" 
                          onError={(e) => {
                            console.error("Failed to load image:", kyc.aadhaarCard.back);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => aadhaarBackRef.current?.click()}
                      disabled={uploading === "aadhaar_back"}
                    >
                      {uploading === "aadhaar_back" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Back
                    </Button>
                    <input
                      ref={aadhaarBackRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "aadhaar_back");
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {getStatusBadge(kyc.aadhaarCard.status)}
                {kyc.aadhaarCard.rejectionReason && (
                  <p className="text-sm text-red-600">{kyc.aadhaarCard.rejectionReason}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PAN Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>PAN Card</CardTitle>
              <CardDescription>Upload your PAN card</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kyc.panCard.image && (
                  <div className="relative w-full">
                    <img 
                      src={kyc.panCard.image} 
                      alt="PAN Card" 
                      className="w-full h-48 object-contain rounded border bg-gray-50" 
                      onError={(e) => {
                        console.error("Failed to load image:", kyc.panCard.image);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => panRef.current?.click()}
                  disabled={uploading === "pan"}
                >
                  {uploading === "pan" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload PAN Card
                </Button>
                <input
                  ref={panRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "pan");
                  }}
                />
                <div className="flex items-center justify-between">
                  {getStatusBadge(kyc.panCard.status)}
                  {kyc.panCard.rejectionReason && (
                    <p className="text-sm text-red-600">{kyc.panCard.rejectionReason}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Proof */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Address Proof</CardTitle>
              <CardDescription>Upload address proof document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kyc.addressProof.image && (
                  <div className="relative w-full">
                    <img 
                      src={kyc.addressProof.image} 
                      alt="Address Proof" 
                      className="w-full h-48 object-contain rounded border bg-gray-50" 
                      onError={(e) => {
                        console.error("Failed to load image:", kyc.addressProof.image);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => addressRef.current?.click()}
                  disabled={uploading === "address"}
                >
                  {uploading === "address" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Address Proof
                </Button>
                <input
                  ref={addressRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "address");
                  }}
                />
                <div className="flex items-center justify-between">
                  {getStatusBadge(kyc.addressProof.status)}
                  {kyc.addressProof.rejectionReason && (
                    <p className="text-sm text-red-600">{kyc.addressProof.rejectionReason}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Photo */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Live Photo</CardTitle>
              <CardDescription>Take a live photo for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showCamera ? (
                  <div className="space-y-2">
                    <div className="relative w-full bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={capturePhoto}
                        className="flex-1"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={stopCamera}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {kyc.livePhoto.image && (
                      <div className="relative w-full">
                        <img 
                          src={kyc.livePhoto.image} 
                          alt="Live Photo" 
                          className="w-full h-64 object-contain rounded border bg-gray-50" 
                          onError={(e) => {
                            console.error("Failed to load image:", kyc.livePhoto.image);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={startCamera}
                        disabled={uploading === "live_photo"}
                        className="flex-1"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Live Photo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => livePhotoRef.current?.click()}
                        disabled={uploading === "live_photo"}
                      >
                        {uploading === "live_photo" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload Photo
                      </Button>
                    </div>
                    <input
                      ref={livePhotoRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "live_photo");
                      }}
                    />
                  </>
                )}
                <div className="flex items-center justify-between">
                  {getStatusBadge(kyc.livePhoto.status)}
                  {kyc.livePhoto.rejectionReason && (
                    <p className="text-sm text-red-600">{kyc.livePhoto.rejectionReason}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        {allDocumentsUploaded && kyc.overallStatus !== "VERIFIED" && (
          <Card className="mt-6 border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg mb-1">Ready to Submit</div>
                  <div className="text-sm text-gray-600">
                    All documents uploaded. Click submit to send for verification.
                  </div>
                </div>
                <Button
                  onClick={handleSubmitKYC}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit KYC for Verification"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning */}
        {kyc.overallStatus !== "VERIFIED" && (
          <Card className="mt-6 border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-900 mb-1">KYC Required</div>
                  <div className="text-sm text-yellow-800">
                    ❌ KYC incomplete → bidding & payout blocked
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


