"use client";

import { useState } from "react";
import { CheckSquare, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface BulkOperationsProps {
  items: any[];
  selectedItems: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onBulkAction: (action: string, itemIds: string[]) => Promise<void>;
  actions: Array<{
    label: string;
    value: string;
    variant?: "default" | "destructive" | "outline";
  }>;
}

export function BulkOperations({
  items,
  selectedItems,
  onSelectionChange,
  onBulkAction,
  actions,
}: BulkOperationsProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map((item) => item.id)));
    }
  };

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    onSelectionChange(newSelected);
  };

  const handleBulkAction = async () => {
    if (!selectedAction) {
      toast.error("Please select an action");
      return;
    }

    if (selectedItems.size === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setLoading(true);
    try {
      await onBulkAction(selectedAction, Array.from(selectedItems));
      onSelectionChange(new Set());
      setSelectedAction("");
      toast.success(`Bulk action completed successfully`);
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {selectedItems.size === items.length ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
            <span>
              {selectedItems.size === 0
                ? "Select All"
                : `${selectedItems.size} selected`}
            </span>
          </button>
        </div>

        {selectedItems.size > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={loading}
            >
              <option value="">Select Action</option>
              {actions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
            <Button
              onClick={handleBulkAction}
              disabled={!selectedAction || loading}
              variant={actions.find((a) => a.value === selectedAction)?.variant || "default"}
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Apply"
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectionChange(new Set());
                setSelectedAction("");
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}





