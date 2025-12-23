"use client";

import { DealerSettings } from "@/components/dealer/dealer-settings";

interface ProfileBusinessSettingsProps {
  dealerInfo: any;
  onUpdate?: () => void;
}

export function ProfileBusinessSettings({ dealerInfo, onUpdate }: ProfileBusinessSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile & Business Settings</h2>
        <p className="text-gray-500 mt-1">Manage your profile and business information</p>
      </div>
      <DealerSettings dealerInfo={dealerInfo} />
    </div>
  );
}

