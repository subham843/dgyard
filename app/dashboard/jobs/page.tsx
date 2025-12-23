"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  Briefcase, MapPin, User, Phone, Mail, Calendar, 
  Clock, DollarSign, FileText, Plus, CheckCircle2,
  AlertCircle, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { LocationMapPicker } from "@/components/ui/location-map-picker";

export default function DealerJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<"post" | "list">("post");
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    workDetails: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    placeName: "",
    serviceCategoryId: "",
    serviceSubCategoryId: "",
    serviceDomainId: "",
    skillId: "",
    priority: "NORMAL",
    scheduledAt: "",
    estimatedDuration: "",
    estimatedCost: "",
    notes: "",
  });

  const [skillsData, setSkillsData] = useState({
    serviceCategories: [] as any[],
    serviceSubCategories: [] as any[],
    serviceDomains: [] as any[],
    skills: [] as any[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "DEALER") {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") {
      fetchSkillsData();
      fetchJobs();
    }
  }, [status, session, router]);

  const fetchSkillsData = async () => {
    try {
      const response = await fetch("/api/jobs/skills");
      if (response.ok) {
        const data = await response.json();
        setSkillsData(data);
      }
    } catch (error) {
      console.error("Error fetching skills data:", error);
    } finally {
      setFetching(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setFormData({
      ...formData,
      serviceCategoryId: categoryId,
      serviceSubCategoryId: "",
      serviceDomainId: "",
      skillId: "",
    });
    
    if (categoryId) {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData({ ...skillsData, serviceSubCategories: data.serviceSubCategories || [] });
      }
    }
  };

  const handleSubCategoryChange = async (subCategoryId: string) => {
    setFormData({
      ...formData,
      serviceSubCategoryId: subCategoryId,
      serviceDomainId: "",
      skillId: "",
    });
    
    if (subCategoryId) {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${formData.serviceCategoryId}&serviceSubCategoryId=${subCategoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData({ ...skillsData, serviceDomains: data.serviceDomains || [] });
      }
    }
  };

  const handleDomainChange = async (domainId: string) => {
    setFormData({
      ...formData,
      serviceDomainId: domainId,
      skillId: "",
    });
    
    if (domainId) {
      const response = await fetch(`/api/jobs/skills?serviceCategoryId=${formData.serviceCategoryId}&serviceSubCategoryId=${formData.serviceSubCategoryId}&serviceDomainId=${domainId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillsData({ ...skillsData, skills: data.skills || [] });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Job posted successfully! Notifications sent to ${data.notificationsSent} technicians.`);
        setFormData({
          title: "",
          description: "",
          workDetails: "",
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          latitude: "",
          longitude: "",
          placeName: "",
          serviceCategoryId: "",
          serviceSubCategoryId: "",
          serviceDomainId: "",
          skillId: "",
          priority: "NORMAL",
          scheduledAt: "",
          estimatedDuration: "",
          estimatedCost: "",
          notes: "",
        });
        setActiveTab("list");
        fetchJobs();
      } else {
        toast.error(data.error || "Failed to post job");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED": return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS": return "bg-purple-100 text-purple-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || fetching) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-lavender-soft flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Job Management</h1>
            <p className="text-light-gray">Post jobs and manage your technician assignments</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("post")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "post"
                    ? "text-primary-blue border-b-2 border-primary-blue"
                    : "text-dark-blue-light hover:text-primary-blue"
                }`}
              >
                <Plus className="inline w-5 h-5 mr-2" />
                Post New Job
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "list"
                    ? "text-primary-blue border-b-2 border-primary-blue"
                    : "text-dark-blue-light hover:text-primary-blue"
                }`}
              >
                <Briefcase className="inline w-5 h-5 mr-2" />
                My Jobs ({jobs.length})
              </button>
            </div>
          </div>

          {/* Post Job Form */}
          {activeTab === "post" && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Job Details */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6" />
                    Job Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., CCTV Installation at Office"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description *</Label>
                      <textarea
                        id="description"
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the job"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="workDetails">Work Details *</Label>
                      <textarea
                        id="workDetails"
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        value={formData.workDetails}
                        onChange={(e) => setFormData({ ...formData, workDetails: e.target.value })}
                        placeholder="Detailed work description - what needs to be done, requirements, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Service Selection *</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceCategoryId">Service Category *</Label>
                      <select
                        id="serviceCategoryId"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        value={formData.serviceCategoryId}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {skillsData.serviceCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="serviceSubCategoryId">Sub-Category *</Label>
                      <select
                        id="serviceSubCategoryId"
                        required
                        disabled={!formData.serviceCategoryId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-100"
                        value={formData.serviceSubCategoryId}
                        onChange={(e) => handleSubCategoryChange(e.target.value)}
                      >
                        <option value="">Select Sub-Category</option>
                        {skillsData.serviceSubCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>{sub.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="serviceDomainId">Service Domain *</Label>
                      <select
                        id="serviceDomainId"
                        required
                        disabled={!formData.serviceSubCategoryId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-100"
                        value={formData.serviceDomainId}
                        onChange={(e) => handleDomainChange(e.target.value)}
                      >
                        <option value="">Select Domain</option>
                        {skillsData.serviceDomains.map((domain) => (
                          <option key={domain.id} value={domain.id}>{domain.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="skillId">Skill (Optional)</Label>
                      <select
                        id="skillId"
                        disabled={!formData.serviceDomainId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-100"
                        value={formData.skillId}
                        onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
                      >
                        <option value="">Select Skill (Optional)</option>
                        {skillsData.skills.map((skill) => (
                          <option key={skill.id} value={skill.id}>{skill.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    Customer Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="Customer full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Customer Phone *</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        placeholder="customer@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    Location Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Complete address"
                      />
                    </div>
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
                        placeholder="123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="placeName">Place Name (Optional)</Label>
                      <Input
                        id="placeName"
                        value={formData.placeName}
                        onChange={(e) => setFormData({ ...formData, placeName: e.target.value })}
                        placeholder="e.g., Connaught Place"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Select Location on Map *</Label>
                      <p className="text-sm text-gray-600 mb-2">Click on the map to set the exact location</p>
                      <LocationMapPicker
                        onLocationSelect={(location) => {
                          setFormData({
                            ...formData,
                            latitude: location.lat.toString(),
                            longitude: location.lng.toString(),
                            placeName: location.placeName || location.address || formData.placeName,
                          });
                        }}
                        initialLocation={
                          formData.latitude && formData.longitude
                            ? {
                                address: formData.address,
                                lat: parseFloat(formData.latitude),
                                lng: parseFloat(formData.longitude),
                                placeName: formData.placeName,
                              }
                            : undefined
                        }
                        height="300px"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="scheduledAt">Scheduled Date & Time (Optional)</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                      <Input
                        id="estimatedDuration"
                        type="number"
                        value={formData.estimatedDuration}
                        onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                        placeholder="e.g., 4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                        placeholder="e.g., 5000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <textarea
                        id="notes"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional notes or instructions"
                      />
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
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Posting Job...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Post Job
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Jobs List */}
          {activeTab === "list" && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold mb-6">My Posted Jobs</h2>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No jobs posted yet</p>
                  <Button
                    onClick={() => setActiveTab("post")}
                    className="mt-4"
                    style={{ backgroundColor: '#3A59FF' }}
                  >
                    Post Your First Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-sm text-gray-600">Job #: {job.jobNumber}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
                          {job.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600"><strong>Customer:</strong> {job.customerName}</p>
                          <p className="text-gray-600"><strong>Location:</strong> {job.city}, {job.state}</p>
                        </div>
                        <div>
                          <p className="text-gray-600"><strong>Priority:</strong> {job.priority}</p>
                          {job.assignedTechnicianId && (
                            <p className="text-gray-600"><strong>Assigned To:</strong> {job.technician?.fullName || "Technician"}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{job.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Posted: {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}











