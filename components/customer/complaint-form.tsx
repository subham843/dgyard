"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Upload,
  X,
  Camera,
  Video,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface ComplaintFormProps {
  warrantyId?: string;
}

const issueTypes = [
  "Equipment Not Working",
  "Poor Service Quality",
  "Technician Issue",
  "Billing Dispute",
  "Warranty Claim",
  "Other",
];

export function ComplaintForm({ warrantyId }: ComplaintFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    warrantyId: warrantyId || "",
    serviceId: "",
    issueType: "",
    description: "",
    photos: [] as string[],
    videos: [] as string[],
  });

  useEffect(() => {
    if (warrantyId) {
      setFormData((prev) => ({ ...prev, warrantyId }));
    }
    fetchWarranties();
  }, [warrantyId]);

  const fetchWarranties = async () => {
    try {
      const response = await fetch("/api/warranties");
      const data = await response.json();
      if (response.ok) {
        setWarranties(data.warranties || []);
      }
    } catch (error) {
      console.error("Error fetching warranties:", error);
    }
  };

  const handleFileUpload = async (file: File, type: "photo" | "video") => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "complaints");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.url) {
        if (type === "photo") {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, data.url],
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            videos: [...prev.videos, data.url],
          }));
        }
        toast.success("File uploaded successfully");
      } else {
        toast.error("Failed to upload file");
      }
    } catch (error) {
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (url: string, type: "photo" | "video") => {
    if (type === "photo") {
      setFormData((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p !== url),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v !== url),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please login to raise a complaint");
      router.push("/auth/signin");
      return;
    }

    if (!formData.issueType || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "REPAIR",
          requestType: "COMPLAINT",
          description: formData.description,
          issueType: formData.issueType,
          warrantyId: formData.warrantyId || null,
          photos: formData.photos,
          customerNotes: `Issue Type: ${formData.issueType}`,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Complaint raised successfully!");
        router.push(`/dashboard/complaints/${data.booking.id}`);
      } else {
        toast.error(data.error || "Failed to raise complaint");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Raise Service Complaint</h1>
          <p className="text-gray-600">Report an issue with your service or warranty</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
            <CardDescription>Provide details about the issue you're facing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {warranties.length > 0 && (
                <div>
                  <Label>Select Service (Optional)</Label>
                  <select
                    value={formData.warrantyId}
                    onChange={(e) => setFormData({ ...formData, warrantyId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="">Select a service/warranty</option>
                    {warranties.map((warranty) => (
                      <option key={warranty.id} value={warranty.id}>
                        {warranty.serviceName} - {warranty.bookingNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>Issue Type *</Label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  required
                >
                  <option value="">Select issue type</option>
                  {issueTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="mt-1"
                  placeholder="Describe the issue in detail..."
                  required
                />
              </div>

              <div>
                <Label>Upload Photos (Optional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "photo");
                    }}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                  </label>
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(photo, "photo")}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Upload Videos (Optional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "video");
                    }}
                    className="hidden"
                    id="video-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="video-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Upload Video
                        </>
                      )}
                    </Button>
                  </label>
                  {formData.videos.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {formData.videos.map((video, idx) => (
                        <div key={idx} className="relative">
                          <video
                            src={video}
                            controls
                            className="w-full rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(video, "video")}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Submit Complaint
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





