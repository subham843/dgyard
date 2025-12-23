"use client";

import { DealerNotifications } from "@/components/dealer/dealer-notifications";

interface NotificationsPreferencesProps {
  onNotificationRead?: () => void;
}

export function NotificationsPreferences({ onNotificationRead }: NotificationsPreferencesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notifications & Preferences</h2>
        <p className="text-gray-500 mt-1">Manage notifications and preferences</p>
      </div>
      <DealerNotifications onNotificationRead={onNotificationRead} />
    </div>
  );
}

