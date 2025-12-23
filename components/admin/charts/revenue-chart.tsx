"use client";

import { useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
  type?: "line" | "bar";
}

export function RevenueChart({ data, type = "line" }: RevenueChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max value
    const maxRevenue = Math.max(...data.map((d) => d.revenue));

    // Draw axes
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      ctx.strokeStyle = "#f3f4f6";
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        `₹${((maxRevenue / gridLines) * (gridLines - i)).toLocaleString()}`,
        padding - 10,
        y + 4
      );
    }

    // Draw data
    if (type === "line") {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - (chartHeight * point.revenue) / maxRevenue;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - (chartHeight * point.revenue) / maxRevenue;

        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Bar chart
      const barWidth = chartWidth / data.length - 10;
      data.forEach((point, index) => {
        const x = padding + (chartWidth / data.length) * index + 5;
        const barHeight = (chartHeight * point.revenue) / maxRevenue;
        const y = height - padding - barHeight;

        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // X-axis labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      ctx.fillText(
        new Date(point.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        x,
        height - padding + 20
      );
    });
  }, [data, type]);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Revenue Trend
        </h3>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${type === "line" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
            onClick={() => {}}
          >
            Line
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${type === "bar" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
            onClick={() => {}}
          >
            Bar
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto" />
    </div>
  );
}

