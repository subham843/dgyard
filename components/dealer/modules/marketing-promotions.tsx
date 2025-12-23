"use client";

import { useState } from "react";
import { TrendingUp, Plus, Tag, Percent, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface MarketingPromotionsProps {
  onStatsUpdate?: () => void;
}

export function MarketingPromotions({ onStatsUpdate }: MarketingPromotionsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing & Promotions</h2>
          <p className="text-gray-500 mt-1">Create discounts, coupons, and promotional offers</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-12">
          Marketing & Promotions module - Create discount coupons, special price rules, combo offers, and featured products.
          This feature will be available soon.
        </p>
      </div>
    </div>
  );
}
