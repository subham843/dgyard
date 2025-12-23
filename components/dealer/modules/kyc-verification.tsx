"use client";

import { useState, useEffect } from "react";
import { Shield, Upload, CheckCircle2, AlertCircle, FileText, Building2, CreditCard, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface KYCVerificationProps {
  dealerInfo: any;
  onUpdate?: () => void;
}

export function KYCVerification({ dealerInfo, onUpdate }: KYCVerificationProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [kycDocs, setKycDocs] = useState<any>({});

  useEffect(() => {
    // Initialize KYC docs from dealerInfo
    if (dealerInfo?.kycDocuments) {
      setKycDocs(dealerInfo.kycDocuments);
    }
  }, [dealerInfo]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const response = await fetch("/api/dealer/kyc/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setKycDocs((prev: any) => ({ ...prev, [docType]: data.url }));
        toast.success(`${docType.toUpperCase()} uploaded successfully`);
        onUpdate?.();
      } else {
        toast.error(data.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Something went wrong");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const kycDocuments = [
    {
      id: "pan",
      name: "PAN Card",
      icon: FileText,
      required: true,
      uploaded: !!kycDocs.pan,
      url: kycDocs.pan,
    },
    {
      id: "aadhaar",
      name: "Aadhaar Card",
      icon: User,
      required: true,
      uploaded: !!kycDocs.aadhaar,
      url: kycDocs.aadhaar,
    },
    {
      id: "gst",
      name: "GST Certificate",
      icon: Building2,
      required: true,
      uploaded: !!kycDocs.gst,
      url: kycDocs.gst,
    },
    {
      id: "bank",
      name: "Bank Proof",
      icon: CreditCard,
      required: true,
      uploaded: !!kycDocs.bank,
      url: kycDocs.bank,
    },
  ];

  const allDocumentsUploaded = kycDocuments.every(doc => doc.uploaded);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">KYC & Verification</h2>
        <p className="text-gray-500 mt-1">Upload and manage your KYC documents</p>
      </div>

      {!allDocumentsUploaded && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">KYC Incomplete</p>
              <p className="text-sm text-yellow-700 mt-1">
                Complete your KYC verification to unlock all features. Product settlements will be blocked until KYC is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kycDocuments.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                doc.uploaded ? "border-green-200 bg-green-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    doc.uploaded ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    <Icon className={`w-6 h-6 ${doc.uploaded ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{doc.name}</p>
                    {doc.required && (
                      <p className="text-xs text-red-600">Required</p>
                    )}
                  </div>
                </div>
                {doc.uploaded && (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>
              {doc.uploaded && doc.url && (
                <div className="mb-4">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View Uploaded Document →
                  </a>
                </div>
              )}
              <label className="block">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, doc.id)}
                  disabled={uploading === doc.id}
                />
                <Button
                  type="button"
                  variant={doc.uploaded ? "outline" : "default"}
                  className="w-full"
                  disabled={uploading === doc.id}
                >
                  {uploading === doc.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {doc.uploaded ? "Re-upload" : "Upload"}
                    </>
                  )}
                </Button>
              </label>
            </div>
          );
        })}
      </div>

      {allDocumentsUploaded && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">KYC Verification Complete</p>
              <p className="text-sm text-green-700 mt-1">
                All required documents have been uploaded. Your KYC is under review.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
