"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Upload, 
  X,
  Award,
  GraduationCap,
  Building2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const skillCertRef = useRef<HTMLInputElement>(null);
  const trainingCertRef = useRef<HTMLInputElement>(null);
  const companyIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, type: string) => {
    try {
      setUploading(type);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", type);

      const response = await fetch("/api/technician/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Document uploaded successfully");
        fetchDocuments();
      } else {
        toast.error("Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Something went wrong");
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents & Certifications</h1>
          <p className="text-gray-600">Upload and manage your certificates</p>
        </div>

        <div className="space-y-6">
          {/* Skill Certificates */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Skill Certificates
              </CardTitle>
              <CardDescription>Upload certificates for your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(d => d.type === "SKILL_CERTIFICATE").map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => skillCertRef.current?.click()}
                  disabled={uploading === "SKILL_CERTIFICATE"}
                >
                  {uploading === "SKILL_CERTIFICATE" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Certificate
                </Button>
                <input
                  ref={skillCertRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "SKILL_CERTIFICATE");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Training Certificates */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Training Certificates
              </CardTitle>
              <CardDescription>Upload training and course certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(d => d.type === "TRAINING_CERTIFICATE").map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => trainingCertRef.current?.click()}
                  disabled={uploading === "TRAINING_CERTIFICATE"}
                >
                  {uploading === "TRAINING_CERTIFICATE" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Certificate
                </Button>
                <input
                  ref={trainingCertRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "TRAINING_CERTIFICATE");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Company ID */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company ID
              </CardTitle>
              <CardDescription>Upload company identification documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(d => d.type === "COMPANY_ID").map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => companyIdRef.current?.click()}
                  disabled={uploading === "COMPANY_ID"}
                >
                  {uploading === "COMPANY_ID" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Company ID
                </Button>
                <input
                  ref={companyIdRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "COMPANY_ID");
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





