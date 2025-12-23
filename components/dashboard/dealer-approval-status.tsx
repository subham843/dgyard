"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Clock, XCircle, AlertCircle, Mail, MessageSquare } from "lucide-react";

export function DealerApprovalStatus() {
  const { data: session } = useSession();
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "DEALER" || session?.user?.role === "USER") {
      fetchDealerInfo();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchDealerInfo = async () => {
    try {
      const response = await fetch("/api/dealer/status");
      if (response.ok) {
        const data = await response.json();
        if (data.dealer) {
          setDealerInfo(data.dealer);
        }
      }
    } catch (error) {
      console.error("Error fetching dealer info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dealerInfo) {
    return null;
  }

  const getStatusMessage = () => {
    switch (dealerInfo.accountStatus) {
      case "PENDING_APPROVAL":
        return {
          icon: Clock,
          title: "Account Pending Approval",
          message: "Your mobile number and email have been successfully verified. Your account is currently pending admin approval. Our admin team will review your registration details and approve your account within 24 hours. You will receive notifications via email and WhatsApp once your account is approved. You can also check your account status here on your dashboard.",
          color: "bg-yellow-50 border-yellow-200",
          iconColor: "text-yellow-600",
          bgColor: "bg-yellow-100",
        };
      case "APPROVED":
        return {
          icon: CheckCircle2,
          title: "Account Approved",
          message: "Congratulations! Your dealer account has been approved. You can now access all dealer features on the platform.",
          color: "bg-green-50 border-green-200",
          iconColor: "text-green-600",
          bgColor: "bg-green-100",
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

  const statusInfo = getStatusMessage();
  if (!statusInfo) return null;

  const Icon = statusInfo.icon;

  return (
    <div className={`rounded-lg border-2 p-6 mb-8 ${statusInfo.color}`}>
      <div className="flex items-start gap-4">
        <div className={`${statusInfo.bgColor} rounded-full p-3 flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${statusInfo.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{statusInfo.title}</h3>
          <p className="text-gray-700 mb-4 leading-relaxed">{statusInfo.message}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Email notifications enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp notifications enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}











