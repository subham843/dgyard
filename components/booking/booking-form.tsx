"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wrench, 
  Network, 
  TrendingUp, 
  Settings, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  Monitor,
  GraduationCap,
  FileText,
  Zap
} from "lucide-react";
import toast from "react-hot-toast";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";
import Link from "next/link";

const serviceTypes = [
  { value: "INSTALLATION", label: "Installation Services", icon: Wrench, description: "CCTV, networking, AV systems installation" },
  { value: "REPAIR", label: "Repair Services", icon: Settings, description: "Equipment repair and troubleshooting" },
  { value: "NETWORKING", label: "Networking Solutions", icon: Network, description: "Wi-Fi, LAN, fiber setup" },
  { value: "DIGITAL_MARKETING", label: "Digital Marketing", icon: TrendingUp, description: "SEO, social media, branding" },
  { value: "MAINTENANCE", label: "Maintenance & Support", icon: Settings, description: "Regular maintenance and support" },
  { value: "CONSULTATION", label: "Consultation", icon: Phone, description: "Expert consultation and advice" },
  { value: "DEMO", label: "Product Demo", icon: Monitor, description: "Live product demonstration" },
  { value: "UPGRADE", label: "Upgrade Services", icon: Zap, description: "System upgrades and enhancements" },
  { value: "AUDIT", label: "System Audit", icon: FileText, description: "Security and system audits" },
  { value: "TRAINING", label: "Training", icon: GraduationCap, description: "Staff training and workshops" },
];

interface BookingFormProps {
  defaultServiceType?: string;
  quotationId?: string;
  onSuccess?: (bookingId: string) => void;
  compact?: boolean;
}

export function BookingForm({ defaultServiceType, quotationId, onSuccess, compact = false }: BookingFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: defaultServiceType || "INSTALLATION",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: session?.user?.phone || "",
    email: session?.user?.email || "",
    scheduledAt: "",
    customerNotes: "",
    priority: "NORMAL",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please login to book a service");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quotationId: quotationId || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Booking created successfully!");
        if (onSuccess) {
          onSuccess(data.booking.id);
        } else {
          router.push(`/dashboard/bookings/${data.booking.id}`);
        }
      } else {
        toast.error(data.error || "Failed to create booking");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Service Type *</Label>
          <select
            required
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            {serviceTypes.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Description (Optional)</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your requirements..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Phone *</Label>
            <Input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Booking..." : "Book Now"}
        </Button>
      </form>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Book a Service</h1>
          <p className="text-gray-600 mb-4">Fill in the details below to book your service</p>
          {defaultServiceType === "INSTALLATION" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Need CCTV Installation?</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Get an instant price estimation with our CCTV calculator and auto quotation system.
                  </p>
                  <Link href="/services/cctv-estimation">
                    <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      Get CCTV Estimation →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Helper */}
        <InlineAIHelper
          context="booking a service"
          suggestions={[
            "What information do I need to book?",
            "How long does installation take?",
            "What's the booking process?",
            "Can I reschedule my booking?"
          ]}
          position="top"
        />

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 border border-gray-200 space-y-6 shadow-sm">
          {/* Service Type */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Select Service Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                if (!Icon) {
                  console.error(`Icon is undefined for service: ${service.value}`);
                  return null;
                }
                return (
                  <label
                    key={service.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.serviceType === service.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="serviceType"
                      value={service.value}
                      checked={formData.serviceType === service.value}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      {Icon && <Icon className={`w-6 h-6 mt-1 ${formData.serviceType === service.value ? "text-blue-600" : "text-gray-600"}`} />}
                      <div>
                        <div className="font-medium text-gray-900">{service.label}</div>
                        <div className="text-sm text-gray-500 mt-1">{service.description}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Service Description (Optional)</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full"
              placeholder="Describe your service requirements in detail..."
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address *
            </Label>
            <Input
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter your complete address"
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Pincode"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Scheduled Date */}
          <div>
            <Label htmlFor="scheduledAt" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Preferred Date & Time (Optional)
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Customer Notes */}
          <div>
            <Label htmlFor="customerNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="customerNotes"
              rows={3}
              value={formData.customerNotes}
              onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
              placeholder="Any additional information or special requirements..."
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Booking..." : "Book Service"}
          </Button>
        </form>
      </div>
    </div>
  );
}
