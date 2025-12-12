"use client";

import { usePathname } from "next/navigation";
import { Phone, MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/hooks/use-settings";

export function FloatingContact() {
  const pathname = usePathname();
  const { settings } = useSettings();

  // Get numbers from admin panel settings
  const phoneNumber = settings?.phone;
  const whatsappNumber = settings?.whatsappNumber || settings?.phone;

  // Don't show on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Don't show if no contact numbers are available
  if (!phoneNumber && !whatsappNumber) {
    return null;
  }

  const handleCall = () => {
    if (phoneNumber) {
      // Clean number for tel: link
      const cleanNumber = phoneNumber.replace(/[\s\-()]/g, "");
      window.location.href = `tel:${cleanNumber}`;
    }
  };

  const handleWhatsApp = () => {
    if (whatsappNumber) {
      // Clean the number - remove spaces, dashes, parentheses
      let cleanNumber = whatsappNumber.replace(/[\s\-()]/g, "");
      
      // If number doesn't start with +, format for WhatsApp
      if (!cleanNumber.startsWith("+")) {
        // Remove leading 0 if present
        cleanNumber = cleanNumber.replace(/^0+/, "");
        // Add country code for India (91) if not already present
        if (!cleanNumber.startsWith("91") && cleanNumber.length === 10) {
          cleanNumber = "91" + cleanNumber;
        }
      } else {
        // Remove + for WhatsApp API
        cleanNumber = cleanNumber.substring(1);
      }
      
      const message = encodeURIComponent(
        `Hello! I'm interested in your services.`
      );
      
      // Open WhatsApp with the number from admin settings
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
      console.log("Opening WhatsApp:", whatsappUrl);
      window.open(whatsappUrl, "_blank");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* WhatsApp Button - No Animation */}
      {whatsappNumber && (
        <button
          onClick={handleWhatsApp}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-900 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border-2 border-gray-700 hover:border-gray-600 hover:scale-105"
          aria-label="WhatsApp"
          title={`WhatsApp: ${whatsappNumber}`}
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}

      {/* Call Button - No Animation */}
      {phoneNumber && (
        <button
          onClick={handleCall}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border-2 border-gray-700 hover:border-gray-600 hover:scale-105"
          aria-label="Call"
          title={`Call: ${phoneNumber}`}
        >
          <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}
    </div>
  );
}
