"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Network, TrendingUp, Settings, Calendar, MapPin, Phone, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";

const services = [
  { value: "INSTALLATION", label: "Installation Services", icon: Wrench },
  { value: "REPAIR", label: "Repair Services", icon: Settings },
  { value: "NETWORKING", label: "Networking Solutions", icon: Network },
  { value: "DIGITAL_MARKETING", label: "Digital Marketing", icon: TrendingUp },
  { value: "MAINTENANCE", label: "Maintenance & Support", icon: Settings },
  { value: "CONSULTATION", label: "Consultation", icon: Phone },
];

export function ServiceBookingForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: "INSTALLATION",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: session?.user?.email || "",
    scheduledAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        router.push(`/bookings/${data.booking.id}`);
      } else {
        toast.error(data.error || "Failed to create booking");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Book a Service</h1>
        <p className="text-light-gray mb-8">Fill in the details below to book your service</p>

        {/* AI Helper for Service Booking */}
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 border border-lavender-light space-y-6">
          {/* Service Type */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Select Service Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <label
                    key={service.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.serviceType === service.value
                        ? "border-primary-blue bg-primary-blue/10"
                        : "border-lavender-light hover:border-light-gray"
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
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-blue-600" />
                      <span className="font-medium">{service.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Service Description *</Label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Describe your service requirements..."
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
              placeholder="Enter your address"
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
              Preferred Date (Optional)
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
            style={{ backgroundColor: '#3A59FF' }}
          >
            {loading ? "Booking..." : "Book Service"}
          </Button>
        </form>
      </div>
    </div>
  );
}

