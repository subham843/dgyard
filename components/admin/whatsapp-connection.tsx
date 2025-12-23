"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle2, XCircle, Loader2, RefreshCw, QrCode } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

export function WhatsAppConnection() {
  const [status, setStatus] = useState<{
    isConnected: boolean;
    isConnecting: boolean;
    hasQRCode: boolean;
    qrCode: string | null;
  }>({
    isConnected: false,
    isConnecting: false,
    hasQRCode: false,
    qrCode: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    // Poll for status updates every 2 seconds
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/whatsapp/status");
      const data = await response.json();
      
      if (response.ok) {
        setStatus({
          isConnected: data.isConnected || false,
          isConnecting: data.isConnecting || false,
          hasQRCode: data.hasQRCode || false,
          qrCode: data.qrCode || null,
        });
      }
    } catch (error) {
      console.error("Error fetching WhatsApp status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/whatsapp/connect", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("WhatsApp connection initiated. Please scan the QR code.");
        fetchStatus();
      } else {
        toast.error(data.error || "Failed to connect WhatsApp");
      }
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);
      toast.error("Failed to connect WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/whatsapp/disconnect", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("WhatsApp disconnected");
        fetchStatus();
      } else {
        toast.error(data.error || "Failed to disconnect WhatsApp");
      }
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      toast.error("Failed to disconnect WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status.qrCode) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            WhatsApp Web Connection
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect your WhatsApp account to send automated messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status.isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Connected</span>
            </div>
          ) : status.isConnecting ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {status.qrCode && !status.isConnected && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center mb-4">
            <QrCode className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-600">
              Open WhatsApp on your phone, go to Settings → Linked Devices → Link a Device, and scan this QR code
            </p>
          </div>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
              <Image
                src={status.qrCode}
                alt="WhatsApp QR Code"
                width={256}
                height={256}
                className="w-64 h-64"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!status.isConnected && !status.isConnecting && (
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                Connect WhatsApp
              </>
            )}
          </Button>
        )}

        {status.isConnected && (
          <Button
            onClick={handleDisconnect}
            variant="destructive"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Disconnect
              </>
            )}
          </Button>
        )}

        <Button
          onClick={fetchStatus}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </Button>
      </div>

      {status.isConnected && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✓ WhatsApp Web is connected!</strong> You can now send automated messages through the system.
          </p>
        </div>
      )}
    </div>
  );
}











