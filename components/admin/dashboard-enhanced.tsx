"use client";

import { RevenueChart } from "./charts/revenue-chart";
import { useState, useEffect } from "react";

export function DashboardEnhanced() {
  const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number }>>([]);

  useEffect(() => {
    // Fetch revenue data for chart
    fetch("/api/admin/finance/revenue-chart")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setRevenueData(data.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="mt-8">
      <RevenueChart data={revenueData} type="line" />
    </div>
  );
}

