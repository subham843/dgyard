"use client";

import { useState } from "react";
import { Settings, Shield, User, Bell, MapPin, AlertCircle, CheckCircle2, Mail, Phone, Building2, Save, Edit2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export function DealerSettings({ dealerInfo }: { dealerInfo: any }) {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    inApp: true,
  });

  if (!dealerInfo) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  const getKYCStatusColor = (status: boolean) => {
    return status 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Notification preferences saved successfully!");
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* KYC Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">KYC Verification</h2>
            <p className="text-sm text-gray-500">Verify your business identity</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className={`
            flex items-center justify-between p-5 rounded-xl border-2
            ${dealerInfo.isKycCompleted 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
            }
          `}>
            <div className="flex items-center gap-3">
              {dealerInfo.isKycCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900">KYC Status</p>
                <p className="text-sm text-gray-600">
                  {dealerInfo.isKycCompleted 
                    ? "Your KYC verification is complete" 
                    : "KYC verification is pending"
                  }
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getKYCStatusColor(dealerInfo.isKycCompleted)}`}>
              {dealerInfo.isKycCompleted ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                "Pending"
              )}
            </span>
          </div>
          {!dealerInfo.isKycCompleted && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 mb-3">
                Complete your KYC verification to unlock all features and start receiving payments.
              </p>
              <Button
                onClick={() => toast.info("KYC upload form will be available soon. Please contact admin.")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Shield className="w-4 h-4 mr-2" />
                Upload KYC Documents
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
            <p className="text-sm text-gray-500">Manage your business details</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Business Name
            </Label>
            <Input 
              value={dealerInfo.businessName || ""} 
              disabled 
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input 
                value={dealerInfo.email || ""} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Mobile Number
              </Label>
              <Input 
                value={dealerInfo.mobile || ""} 
                disabled 
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              To update your account information, please contact the admin.
            </p>
            <Button
              variant="outline"
              onClick={() => toast.info("Please contact admin to update your profile information")}
              className="w-full"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Request Profile Update
            </Button>
          </div>
        </div>
      </div>

      {/* Service Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <MapPin className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Service Area</h2>
            <p className="text-sm text-gray-500">Your service coverage details</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2">Service Radius (km)</Label>
              <Input
                type="number"
                value={dealerInfo.serviceRadiusKm || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2">Coverage Type</Label>
              <Input 
                value={dealerInfo.coverageType || "N/A"} 
                disabled 
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Service area updates require admin approval.
            </p>
            <Button
              variant="outline"
              onClick={() => toast.info("Please contact admin to update your service area")}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Request Service Area Update
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-500">Choose how you want to be notified</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive updates via email</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.email}
              onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">WhatsApp Notifications</p>
                <p className="text-xs text-gray-500">Receive updates on WhatsApp</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.whatsapp}
              onChange={(e) => setNotifications({...notifications, whatsapp: e.target.checked})}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">In-App Notifications</p>
                <p className="text-xs text-gray-500">Get notified within the dashboard</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={notifications.inApp}
              onChange={(e) => setNotifications({...notifications, inApp: e.target.checked})}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
          </label>
          <Button
            onClick={handleSaveNotifications}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Security</h2>
            <p className="text-sm text-gray-500">Manage your account security</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-4">
            Keep your account secure by regularly updating your password.
          </p>
          <Button
            variant="outline"
            onClick={() => toast.info("Password change feature will be available soon")}
            className="w-full"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
}
