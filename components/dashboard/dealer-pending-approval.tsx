"use client";

import { Clock, XCircle, AlertCircle, Mail, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type DealerAccountStatus = "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED";

interface DealerPendingApprovalProps {
  accountStatus: DealerAccountStatus;
}

export function DealerPendingApproval({ accountStatus }: DealerPendingApprovalProps) {
  const getStatusInfo = () => {
    switch (accountStatus) {
      case "PENDING_APPROVAL":
        return {
          icon: Clock,
          title: "Account Pending Approval",
          message: "Your mobile number and email have been successfully verified. Your account is currently pending admin approval. Our admin team will review your registration details and approve your account within 24 hours.",
          color: "bg-yellow-50 border-yellow-200",
          iconColor: "text-yellow-600",
          bgColor: "bg-yellow-100",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          title: "Account Application Rejected",
          message: "We regret to inform you that your dealer account application could not be approved at this time. Please contact support for more information.",
          color: "bg-red-50 border-red-200",
          iconColor: "text-red-600",
          bgColor: "bg-red-100",
        };
      case "SUSPENDED":
        return {
          icon: AlertCircle,
          title: "Account Suspended",
          message: "Your dealer account has been temporarily suspended. Please contact support for assistance.",
          color: "bg-gray-50 border-gray-200",
          iconColor: "text-gray-600",
          bgColor: "bg-gray-100",
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  const Icon = statusInfo.icon;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card className={`border-2 ${statusInfo.color} shadow-lg`}>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className={`${statusInfo.bgColor} rounded-full p-4 flex-shrink-0`}>
              <Icon className={`w-8 h-8 ${statusInfo.iconColor}`} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4 text-gray-900">{statusInfo.title}</h1>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">{statusInfo.message}</p>
              
              {accountStatus === "PENDING_APPROVAL" && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Notifications:</strong> You will receive notifications via email and WhatsApp once your account is approved. You can also check your account status by logging into your dashboard.
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      <span>Email notifications enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>WhatsApp notifications enabled</span>
                    </div>
                  </div>
                </>
              )}

              {(accountStatus === "REJECTED" || accountStatus === "SUSPENDED") && (
                <div className="mt-6">
                  <Link href="/contact">
                    <Button size="lg">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  You can sign out and return later to check your account status.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}











