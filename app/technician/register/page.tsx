"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Shield, UserPlus, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const serviceTypes = [
  "INSTALLATION",
  "NETWORKING",
  "DIGITAL_MARKETING",
  "MAINTENANCE",
  "CONSULTATION",
  "CCTV",
  "AV",
  "FIRE",
  "AUTOMATION",
  "DEVELOPMENT",
  "REPAIR",
  "TRAINING",
];

export default function TechnicianRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    employeeId: "",
    specialization: [] as string[],
    experience: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.specialization.length === 0) {
      toast.error("Please select at least one specialization");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/technician/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          employeeId: formData.employeeId || undefined,
          specialization: formData.specialization,
          experience: formData.experience ? parseInt(formData.experience) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Registration successful! Please wait for admin approval.");
        router.push("/auth/signin?message=technician-registered");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialization = (serviceType: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(serviceType)
        ? prev.specialization.filter((s) => s !== serviceType)
        : [...prev.specialization, serviceType],
    }));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Technician Registration</h1>
              <p className="text-gray-600">
                Register as a technician. Your account will be activated after admin approval.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
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
                    <Label htmlFor="employeeId">Employee ID (Optional)</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Account Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Professional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g., 5"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <Label>Specialization * (Select at least one)</Label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {serviceTypes.map((serviceType) => (
                      <label
                        key={serviceType}
                        className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                          formData.specialization.includes(serviceType)
                            ? "bg-blue-50 border-blue-500"
                            : "bg-white border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialization.includes(serviceType)}
                          onChange={() => toggleSpecialization(serviceType)}
                          className="rounded"
                        />
                        <span className="text-sm">{serviceType}</span>
                      </label>
                    ))}
                  </div>
                  {formData.specialization.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {formData.specialization.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Registration Process:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Fill in all required information</li>
                      <li>Select your specializations</li>
                      <li>Submit the form</li>
                      <li>Wait for admin approval</li>
                      <li>You'll receive an email once your account is activated</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
                style={{ backgroundColor: '#3A59FF' }}
              >
                {loading ? "Registering..." : "Register as Technician"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/auth/signin" className="text-blue-600 hover:underline">
                  Sign in
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
