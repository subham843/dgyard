"use client";

import { useState, useEffect } from "react";
import { HelpCircle, AlertCircle, MessageSquare, Plus, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface SupportDisputesProps {
  onStatsUpdate?: () => void;
}

export function SupportDisputes({ onStatsUpdate }: SupportDisputesProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Fetch disputes from jobs
      const response = await fetch("/api/dealer/jobs");
      if (response.ok) {
        const data = await response.json();
        const jobs = data.jobs || [];
        // Filter jobs with disputes or create support tickets list
        // For now, show empty state - can be enhanced later
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support & Disputes</h2>
          <p className="text-gray-500 mt-1">Raise tickets and manage disputes</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Raise Ticket
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-12">
          Support & Disputes - Raise support tickets, manage order disputes, payment issues, and warranty issues.
          Chat and call support features will be available soon.
        </p>
      </div>
    </div>
  );
}
