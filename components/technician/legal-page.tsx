"use client";

import { BookOpen, FileText, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function LegalPage() {
  const consentHistory = [
    { id: "1", type: "Terms & Conditions", date: new Date().toISOString(), accepted: true },
    { id: "2", type: "Privacy Policy", date: new Date().toISOString(), accepted: true },
    { id: "3", type: "Service Agreement", date: new Date().toISOString(), accepted: true },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal & Consent</h1>
          <p className="text-gray-600">Review legal documents and consent history</p>
        </div>

        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Please read and accept our terms and conditions to continue using the platform.
              </p>
              <Button variant="outline">View Terms & Conditions</Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Understand how we collect, use, and protect your personal information.
              </p>
              <Button variant="outline">View Privacy Policy</Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Service Agreement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Review the service agreement between you and the platform.
              </p>
              <Button variant="outline">View Service Agreement</Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Consent History
              </CardTitle>
              <CardDescription>Track your consent acceptance history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {consentHistory.map((consent) => (
                  <div key={consent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">{consent.type}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(consent.date)}
                      </div>
                    </div>
                    {consent.accepted && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





