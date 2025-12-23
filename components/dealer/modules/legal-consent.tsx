"use client";

import { FileText, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegalConsent() {
  const legalDocuments = [
    {
      id: "terms",
      title: "Platform Terms & Conditions",
      description: "Read our terms and conditions",
      lastUpdated: "2024-01-01",
    },
    {
      id: "seller",
      title: "Seller Agreement",
      description: "Agreement for product sellers",
      lastUpdated: "2024-01-01",
    },
    {
      id: "service",
      title: "Service Agreement",
      description: "Agreement for service providers",
      lastUpdated: "2024-01-01",
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      description: "How we handle your data",
      lastUpdated: "2024-01-01",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Legal & Consent</h2>
        <p className="text-gray-500 mt-1">View terms, agreements, and privacy policy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {legalDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Last updated: {doc.lastUpdated}</p>
              <Button variant="outline" size="sm">
                View
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          By using this platform, you agree to all terms and conditions. Please read all documents carefully.
        </p>
      </div>
    </div>
  );
}
