"use client";

import { useState } from "react";
import { 
  Lock, 
  Key,
  Smartphone,
  LogOut,
  Save,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

export function SecurityPage() {
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pinData, setPinData] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    try {
      setChangingPassword(true);
      const response = await fetch("/api/technician/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      if (response.ok) {
        toast.success("Password changed successfully");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangePin = async () => {
    if (!pinData.currentPin || !pinData.newPin) {
      toast.error("Please fill all fields");
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      toast.error("PINs don't match");
      return;
    }
    try {
      setChangingPin(true);
      const response = await fetch("/api/technician/security/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pinData),
      });
      if (response.ok) {
        toast.success("PIN changed successfully");
        setPinData({ currentPin: "", newPin: "", confirmPin: "" });
      } else {
        toast.error("Failed to change PIN");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setChangingPin(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to logout from all devices?")) return;
    try {
      await fetch("/api/technician/security/logout-all", { method: "POST" });
      toast.success("Logged out from all devices");
      signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security & Login</h1>
          <p className="text-gray-600">Manage your account security settings</p>
        </div>

        {/* Change Password */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change PIN */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change PIN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPin">Current PIN</Label>
                <Input
                  id="currentPin"
                  type="password"
                  value={pinData.currentPin}
                  onChange={(e) => setPinData({ ...pinData, currentPin: e.target.value })}
                  maxLength={6}
                />
              </div>
              <div>
                <Label htmlFor="newPin">New PIN</Label>
                <Input
                  id="newPin"
                  type="password"
                  value={pinData.newPin}
                  onChange={(e) => setPinData({ ...pinData, newPin: e.target.value })}
                  maxLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPin">Confirm New PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  value={pinData.confirmPin}
                  onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value })}
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleChangePin}
                disabled={changingPin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {changingPin ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Change PIN
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Login */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Biometric Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Enable Biometric Login</div>
                <div className="text-sm text-gray-600">Use fingerprint or face ID to login</div>
              </div>
              <Checkbox
                checked={biometricEnabled}
                onCheckedChange={setBiometricEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Devices */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Active Devices</CardTitle>
            <CardDescription>Manage devices logged into your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold">Current Device</div>
                  <div className="text-sm text-gray-600">Chrome on Windows</div>
                </div>
                <Badge>Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout All */}
        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="w-5 h-5" />
              Logout from All Devices
            </CardTitle>
            <CardDescription>Sign out from all devices and sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogoutAll}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout from All Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

