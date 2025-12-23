"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Award, 
  MapPin, 
  Clock,
  Save,
  Loader2,
  Camera,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import { TechnicianSkillsEditor } from "./technician-skills-editor";
import toast from "react-hot-toast";

interface ProfileData {
  fullName: string;
  displayName: string;
  email: string;
  mobile: string;
  profilePhoto?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  yearsOfExperience: number;
  primarySkills: any[];
  serviceCategories: string[];
  latitude?: number;
  longitude?: number;
  placeName?: string;
  serviceRadiusKm?: number;
  availableForInstallation: boolean;
  availableForMaintenance: boolean;
  availableForEmergencyCalls: boolean;
  workingDays: string;
  dailyAvailability: string;
  brandExpertise: string[];
  indoorCapability: boolean;
  outdoorCapability: boolean;
}

export function ProfileManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "service" | "availability">("basic");
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    displayName: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    yearsOfExperience: 0,
    primarySkills: [],
    serviceCategories: [],
    availableForInstallation: false,
    availableForMaintenance: false,
    availableForEmergencyCalls: false,
    workingDays: "BOTH",
    dailyAvailability: "FULL_DAY",
    brandExpertise: [],
    indoorCapability: false,
    outdoorCapability: false,
  });
  const [selectedSkills, setSelectedSkills] = useState<Array<{skillId: string; skillTitle: string; level: string}>>([]);
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);
  const [skillsData, setSkillsData] = useState({
    serviceCategories: [] as any[],
    serviceSubCategories: [] as any[],
    serviceDomains: [] as any[],
    skills: [] as any[],
  });
  const [locationData, setLocationData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchSkillsData();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/profile");
      if (response.ok) {
        const data = await response.json();
        const tech = data.technician;
        setProfile({
          fullName: tech.fullName || "",
          displayName: tech.displayName || "",
          email: tech.email || "",
          mobile: tech.mobile || "",
          profilePhoto: tech.profilePhoto,
          address: tech.address || "",
          city: tech.city || "",
          state: tech.state || "",
          pincode: tech.pincode || "",
          yearsOfExperience: tech.yearsOfExperience || 0,
          primarySkills: tech.primarySkills || [],
          serviceCategories: tech.serviceCategories || [],
          latitude: tech.latitude,
          longitude: tech.longitude,
          placeName: tech.placeName,
          serviceRadiusKm: tech.serviceRadiusKm,
          availableForInstallation: tech.availableForInstallation || false,
          availableForMaintenance: tech.availableForMaintenance || false,
          availableForEmergencyCalls: tech.availableForEmergencyCalls || false,
          workingDays: tech.workingDays || "BOTH",
          dailyAvailability: tech.dailyAvailability || "FULL_DAY",
          brandExpertise: tech.brandExpertise || [],
          indoorCapability: tech.indoorCapability || false,
          outdoorCapability: tech.outdoorCapability || false,
        });
        
        if (tech.primarySkills) {
          const skills = typeof tech.primarySkills === 'string' 
            ? JSON.parse(tech.primarySkills) 
            : tech.primarySkills;
          if (Array.isArray(skills)) {
            setSelectedSkills(skills.map((s: any) => ({
              skillId: s.skillId || "",
              skillTitle: s.skill || s.skillTitle || "",
              level: s.level || "BEGINNER",
            })));
          }
        }
        if (tech.serviceCategories) {
          setSelectedServiceCategories(Array.isArray(tech.serviceCategories) ? tech.serviceCategories : []);
        }
        if (tech.latitude && tech.longitude) {
          setLocationData({
            address: tech.placeName || "",
            lat: tech.latitude,
            lng: tech.longitude,
            placeName: tech.placeName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillsData = async () => {
    try {
      const response = await fetch("/api/jobs/skills");
      if (response.ok) {
        const data = await response.json();
        setSkillsData({
          serviceCategories: data.serviceCategories || [],
          serviceSubCategories: data.serviceSubCategories || [],
          serviceDomains: data.serviceDomains || [],
          skills: data.skills || [],
        });
      }
    } catch (error) {
      console.error("Error fetching skills data:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = {};

      if (activeTab === "basic") {
        payload.fullName = profile.fullName;
        payload.displayName = profile.displayName;
        payload.email = profile.email;
        payload.mobile = profile.mobile;
        payload.address = profile.address;
        payload.city = profile.city;
        payload.state = profile.state;
        payload.pincode = profile.pincode;
        if (locationData) {
          payload.latitude = locationData.lat;
          payload.longitude = locationData.lng;
          payload.placeName = locationData.placeName;
        }
      } else if (activeTab === "service") {
        payload.yearsOfExperience = profile.yearsOfExperience;
        payload.primarySkills = selectedSkills.map(s => ({
          skill: s.skillTitle,
          skillId: s.skillId,
          level: s.level,
        }));
        payload.serviceCategories = selectedServiceCategories;
        payload.brandExpertise = profile.brandExpertise;
        payload.indoorCapability = profile.indoorCapability;
        payload.outdoorCapability = profile.outdoorCapability;
      } else if (activeTab === "availability") {
        payload.availableForInstallation = profile.availableForInstallation;
        payload.availableForMaintenance = profile.availableForMaintenance;
        payload.availableForEmergencyCalls = profile.availableForEmergencyCalls;
        payload.workingDays = profile.workingDays;
        payload.dailyAvailability = profile.dailyAvailability;
        if (locationData) {
          payload.serviceRadiusKm = profile.serviceRadiusKm || 10;
        }
      }

      const response = await fetch("/api/technician/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Management</h1>
          <p className="text-gray-600">Manage your profile information</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "basic"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-blue-600"
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Basic Profile
          </button>
          <button
            onClick={() => setActiveTab("service")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "service"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-blue-600"
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Service Profile
          </button>
          <button
            onClick={() => setActiveTab("availability")}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "availability"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-blue-600"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Availability
          </button>
        </div>

        {/* Basic Profile Tab */}
        {activeTab === "basic" && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Profile Photo */}
                <div>
                  <Label>Profile Photo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {profile.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      placeholder="How you want to be displayed"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={profile.mobile}
                      onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Street address"
                    rows={2}
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={profile.pincode}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                {/* Service Location Map */}
                <div>
                  <Label>Service Location (Map) *</Label>
                  <div className="mt-2 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <LocationMapPicker
                      onLocationSelect={(location) => {
                        setLocationData(location);
                      }}
                      initialLocation={locationData}
                      height="300px"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Profile Tab */}
        {activeTab === "service" && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Service Profile</CardTitle>
              <CardDescription>Manage your skills and expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Experience */}
                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    value={profile.yearsOfExperience}
                    onChange={(e) => setProfile({ ...profile, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Skills Editor */}
                <div>
                  <Label>Skills & Service Categories</Label>
                  <TechnicianSkillsEditor
                    skillsData={skillsData}
                    selectedSkills={selectedSkills}
                    setSelectedSkills={setSelectedSkills}
                    selectedServiceCategories={selectedServiceCategories}
                    setSelectedServiceCategories={setSelectedServiceCategories}
                    onSubmit={handleSave}
                    loading={saving}
                  />
                </div>

                {/* Brand Expertise */}
                <div>
                  <Label htmlFor="brandExpertise">Brand Expertise</Label>
                  <Textarea
                    id="brandExpertise"
                    value={profile.brandExpertise.join(", ")}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      brandExpertise: e.target.value.split(",").map(b => b.trim()).filter(Boolean)
                    })}
                    placeholder="e.g., CP Plus, Hikvision, Dahua (comma separated)"
                    rows={2}
                  />
                </div>

                {/* Capabilities */}
                <div>
                  <Label>Service Capability</Label>
                  <div className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="indoor"
                        checked={profile.indoorCapability}
                        onCheckedChange={(checked) => 
                          setProfile({ ...profile, indoorCapability: checked as boolean })
                        }
                      />
                      <Label htmlFor="indoor" className="cursor-pointer">Indoor</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="outdoor"
                        checked={profile.outdoorCapability}
                        onCheckedChange={(checked) => 
                          setProfile({ ...profile, outdoorCapability: checked as boolean })
                        }
                      />
                      <Label htmlFor="outdoor" className="cursor-pointer">Outdoor</Label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Availability Tab */}
        {activeTab === "availability" && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>Set your working schedule and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Service Types */}
                <div>
                  <Label>Available For</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="installation"
                        checked={profile.availableForInstallation}
                        onCheckedChange={(checked) => 
                          setProfile({ ...profile, availableForInstallation: checked as boolean })
                        }
                      />
                      <Label htmlFor="installation" className="cursor-pointer">Installation</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="maintenance"
                        checked={profile.availableForMaintenance}
                        onCheckedChange={(checked) => 
                          setProfile({ ...profile, availableForMaintenance: checked as boolean })
                        }
                      />
                      <Label htmlFor="maintenance" className="cursor-pointer">Maintenance</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="emergency"
                        checked={profile.availableForEmergencyCalls}
                        onCheckedChange={(checked) => 
                          setProfile({ ...profile, availableForEmergencyCalls: checked as boolean })
                        }
                      />
                      <Label htmlFor="emergency" className="cursor-pointer">Emergency Calls</Label>
                    </div>
                  </div>
                </div>

                {/* Working Days */}
                <div>
                  <Label htmlFor="workingDays">Working Days *</Label>
                  <Select
                    value={profile.workingDays}
                    onValueChange={(value) => setProfile({ ...profile, workingDays: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKDAYS">Weekdays Only</SelectItem>
                      <SelectItem value="WEEKENDS">Weekends Only</SelectItem>
                      <SelectItem value="BOTH">Both Weekdays & Weekends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Daily Availability */}
                <div>
                  <Label htmlFor="dailyAvailability">Daily Availability *</Label>
                  <Select
                    value={profile.dailyAvailability}
                    onValueChange={(value) => setProfile({ ...profile, dailyAvailability: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_DAY">Full Day</SelectItem>
                      <SelectItem value="MORNING">Morning Only</SelectItem>
                      <SelectItem value="AFTERNOON">Afternoon Only</SelectItem>
                      <SelectItem value="EVENING">Evening Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Radius */}
                {locationData && (
                  <div>
                    <Label htmlFor="serviceRadiusKm">Service Radius (km) *</Label>
                    <Input
                      id="serviceRadiusKm"
                      type="number"
                      value={profile.serviceRadiusKm || 10}
                      onChange={(e) => setProfile({ ...profile, serviceRadiusKm: parseFloat(e.target.value) || 10 })}
                      placeholder="10"
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum distance you're willing to travel for jobs
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}





