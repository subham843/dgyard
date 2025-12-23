"use client";

import { DealerJobManagement } from "@/components/dealer/dealer-job-management";

interface ServiceJobManagementProps {
  onStatsUpdate?: () => void;
  onNavigateToPostJob?: () => void;
}

export function ServiceJobManagement({ onStatsUpdate, onNavigateToPostJob }: ServiceJobManagementProps) {
  return <DealerJobManagement onStatsUpdate={onStatsUpdate} onNavigateToPostJob={onNavigateToPostJob} />;
}

