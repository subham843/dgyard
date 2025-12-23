"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Settings,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface NotificationPreferences {
  newJobAlerts: boolean;
  biddingAlerts: boolean;
  paymentAlerts: boolean;
  warrantyAlerts: boolean;
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newJobAlerts: true,
    biddingAlerts: true,
    paymentAlerts: true,
    warrantyAlerts: true,
    whatsapp: true,
    sms: false,
    email: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/technician/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Preferences saved successfully!");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications & Preferences</h1>
          <p className="text-gray-600">Manage your notification settings</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Alert Types</CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="newJob" className="cursor-pointer">New Job Alerts</Label>
                <Checkbox
                  id="newJob"
                  checked={preferences.newJobAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, newJobAlerts: checked as boolean })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bidding" className="cursor-pointer">Bidding Alerts</Label>
                <Checkbox
                  id="bidding"
                  checked={preferences.biddingAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, biddingAlerts: checked as boolean })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="payment" className="cursor-pointer">Payment Alerts</Label>
                <Checkbox
                  id="payment"
                  checked={preferences.paymentAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, paymentAlerts: checked as boolean })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="warranty" className="cursor-pointer">Warranty Alerts</Label>
                <Checkbox
                  id="warranty"
                  checked={preferences.warrantyAlerts}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, warrantyAlerts: checked as boolean })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-2">
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>Choose how you want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
                </div>
                <Checkbox
                  id="whatsapp"
                  checked={preferences.whatsapp}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, whatsapp: checked as boolean })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="sms" className="cursor-pointer">SMS</Label>
                </div>
                <Checkbox
                  id="sms"
                  checked={preferences.sms}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, sms: checked as boolean })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-red-600" />
                  <Label htmlFor="email" className="cursor-pointer">Email</Label>
                </div>
                <Checkbox
                  id="email"
                  checked={preferences.email}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, email: checked as boolean })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}





