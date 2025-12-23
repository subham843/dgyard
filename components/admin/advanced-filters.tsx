"use client";

import { useState } from "react";
import { Filter, X, Calendar, DollarSign, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdvancedFiltersProps {
  onApply: (filters: any) => void;
  onClear: () => void;
  filters?: {
    dateRange?: { start: string; end: string };
    amountRange?: { min: number; max: number };
    status?: string[];
    tags?: string[];
  };
}

export function AdvancedFilters({ onApply, onClear, filters }: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    dateRange: {
      start: filters?.dateRange?.start || "",
      end: filters?.dateRange?.end || "",
    },
    amountRange: {
      min: filters?.amountRange?.min || "",
      max: filters?.amountRange?.max || "",
    },
    status: filters?.status || [],
    tags: filters?.tags || [],
  });

  const handleApply = () => {
    onApply(localFilters);
    setShowFilters(false);
  };

  const handleClear = () => {
    setLocalFilters({
      dateRange: { start: "", end: "" },
      amountRange: { min: "", max: "" },
      status: [],
      tags: [],
    });
    onClear();
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Advanced Filters
        {Object.keys(filters || {}).length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            {Object.keys(filters || {}).length}
          </span>
        )}
      </Button>

      {showFilters && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-6 z-50 min-w-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Advanced Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={localFilters.dateRange.start}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      dateRange: { ...localFilters.dateRange, start: e.target.value },
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={localFilters.dateRange.end}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      dateRange: { ...localFilters.dateRange, end: e.target.value },
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4" />
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.amountRange.min}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      amountRange: {
                        ...localFilters.amountRange,
                        min: e.target.value ? parseFloat(e.target.value) : "",
                      },
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.amountRange.max}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      amountRange: {
                        ...localFilters.amountRange,
                        max: e.target.value ? parseFloat(e.target.value) : "",
                      },
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

