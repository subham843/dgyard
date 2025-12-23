"use client";

import { useState } from "react";
import { CheckSquare, Square, MoreVertical, Trash2, Edit, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionsProps {
  selectedIds: string[];
  onBulkAction: (action: string, ids: string[]) => Promise<void>;
  actions?: Array<{
    label: string;
    value: string;
    icon: any;
    className?: string;
  }>;
}

export function BulkActions({ selectedIds, onBulkAction, actions }: BulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const defaultActions = actions || [
    { label: "Approve", value: "approve", icon: CheckCircle2, className: "text-green-600" },
    { label: "Suspend", value: "suspend", icon: Ban, className: "text-red-600" },
    { label: "Delete", value: "delete", icon: Trash2, className: "text-red-600" },
  ];

  const handleAction = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} item(s)?`)) return;

    setLoading(true);
    try {
      await onBulkAction(action, selectedIds);
      setShowActions(false);
    } catch (error) {
      console.error("Bulk action error:", error);
      alert(`Failed to ${action} items`);
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">{selectedIds.length} selected</span>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowActions(!showActions)}
            disabled={loading}
          >
            <MoreVertical className="w-4 h-4 mr-2" />
            Actions
          </Button>

          {showActions && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]">
              {defaultActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.value}
                    onClick={() => handleAction(action.value)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${action.className || "text-gray-700"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

