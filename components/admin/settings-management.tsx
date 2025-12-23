"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { VoiceSettings } from "@/components/admin/voice-settings";
import { WhatsAppConnection } from "@/components/admin/whatsapp-connection";

export function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    siteName: "",
    siteTagline: "",
    logo: "",
    favicon: "",
    favicon16x16: "",
    favicon32x32: "",
    favicon192x192: "",
    favicon512x512: "",
    appleTouchIcon: "",
    description: "",
    keywords: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    // Voice Settings
    aiVoiceName: "",
    aiVoiceLang: "en-IN",
    aiVoiceRate: 1.0,
    aiVoicePitch: 1.0,
    aiVoiceVolume: 1.0,
    aiVoiceURI: "",
    aiCustomVoiceUrl: "",
    aiVoiceScript: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch settings:", {
          status: response.status,
          error: errorData.error,
        });
        toast.error(errorData.error || "Failed to fetch settings");
        return;
      }
      
      const data = await response.json();
      if (data.settings) {
        setFormData({
          siteName: data.settings.siteName || "",
          siteTagline: data.settings.siteTagline || "",
          logo: data.settings.logo || "",
          favicon: data.settings.favicon || "",
          favicon16x16: data.settings.favicon16x16 || data.settings.favicon || "",
          favicon32x32: data.settings.favicon32x32 || data.settings.favicon || "",
          favicon192x192: data.settings.favicon192x192 || data.settings.favicon || "",
          favicon512x512: data.settings.favicon512x512 || data.settings.favicon || "",
          appleTouchIcon: data.settings.appleTouchIcon || data.settings.favicon || "",
          description: data.settings.description || "",
          keywords: data.settings.keywords || "",
          email: data.settings.email || "",
          phone: data.settings.phone || "",
          whatsappNumber: data.settings.whatsappNumber || "",
          address: data.settings.address || "",
          city: data.settings.city || "",
          state: data.settings.state || "",
          pincode: data.settings.pincode || "",
          country: data.settings.country || "India",
          facebookUrl: data.settings.facebookUrl || "",
          twitterUrl: data.settings.twitterUrl || "",
          instagramUrl: data.settings.instagramUrl || "",
          linkedinUrl: data.settings.linkedinUrl || "",
          metaTitle: data.settings.metaTitle || "",
          metaDescription: data.settings.metaDescription || "",
          ogImage: data.settings.ogImage || "",
          // Voice Settings
          aiVoiceName: data.settings.aiVoiceName || "",
          aiVoiceLang: data.settings.aiVoiceLang || "en-IN",
          aiVoiceRate: data.settings.aiVoiceRate ?? 1.0,
          aiVoicePitch: data.settings.aiVoicePitch ?? 1.0,
          aiVoiceVolume: data.settings.aiVoiceVolume ?? 1.0,
          aiVoiceURI: data.settings.aiVoiceURI || "",
          aiCustomVoiceUrl: data.settings.aiCustomVoiceUrl || "",
          aiVoiceScript: data.settings.aiVoiceScript || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          [type]: data.url,
        }));
        const typeLabels: { [key: string]: string } = {
          logo: "Logo",
          favicon: "Favicon",
          favicon16x16: "Favicon 16x16",
          favicon32x32: "Favicon 32x32",
          favicon192x192: "Favicon 192x192",
          favicon512x512: "Favicon 512x512",
          appleTouchIcon: "Apple Touch Icon",
          ogImage: "OG Image",
        };
        toast.success(`${typeLabels[type] || type} uploaded successfully!`);
      } else {
        toast.error(data.error || `Failed to upload ${type}`);
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Settings Save Error:", {
          status: response.status,
          error: data.error,
        });
        toast.error(data.error || `Failed to save settings (Status: ${response.status})`);
        return;
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Settings Save Error:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-blue mb-2">Website Settings</h1>
        <p className="text-light-gray">Manage website settings, SEO, and contact information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName">Site Name *</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="siteTagline">Site Tagline</Label>
              <Input
                id="siteTagline"
                value={formData.siteTagline}
                onChange={(e) => setFormData({ ...formData, siteTagline: e.target.value })}
                placeholder="Your punchline here"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Logo & Favicon */}
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Logo & Favicon</h2>
          
          {/* Logo */}
          <div className="mb-6">
            <Label>Logo (PNG, JPG, SVG, WebP)</Label>
            <p className="text-xs text-light-gray mb-2">Recommended: Wide format, transparent background if possible</p>
            {formData.logo && (
              <div className="relative w-48 h-24 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center">
                <img
                  src={formData.logo}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logo: "" })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={(e) => handleImageUpload(e, "logo")}
              disabled={uploading === "logo"}
              className="cursor-pointer"
            />
            {uploading === "logo" && (
              <p className="text-sm text-primary-blue mt-1">Uploading...</p>
            )}
          </div>

          {/* Favicons - Multiple Sizes */}
          <div className="mb-6">
            <Label>Favicon Icons (PNG, ICO, SVG)</Label>
            <p className="text-xs text-light-gray mb-4">Upload different sizes for better browser compatibility</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Main Favicon */}
              <div>
                <Label className="text-sm font-semibold">Favicon (Main)</Label>
                <p className="text-xs text-light-gray mb-2">Default favicon</p>
                {formData.favicon && (
                  <div className="relative w-20 h-20 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center mx-auto">
                    <img
                      src={formData.favicon}
                      alt="Favicon"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, favicon: "" })}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, "favicon")}
                  disabled={uploading === "favicon"}
                  className="cursor-pointer text-xs"
                />
                {uploading === "favicon" && (
                  <p className="text-xs text-primary-blue mt-1">Uploading...</p>
                )}
              </div>

              {/* 16x16 Favicon */}
              <div>
                <Label className="text-sm font-semibold">16x16 Favicon</Label>
                <p className="text-xs text-light-gray mb-2">Small browser tab icon</p>
                {formData.favicon16x16 && (
                  <div className="relative w-20 h-20 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center mx-auto">
                    <img
                      src={formData.favicon16x16}
                      alt="Favicon 16x16"
                      className="w-4 h-4 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, favicon16x16: "" })}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, "favicon16x16")}
                  disabled={uploading === "favicon16x16"}
                  className="cursor-pointer text-xs"
                />
                {uploading === "favicon16x16" && (
                  <p className="text-xs text-primary-blue mt-1">Uploading...</p>
                )}
              </div>

              {/* 32x32 Favicon */}
              <div>
                <Label className="text-sm font-semibold">32x32 Favicon</Label>
                <p className="text-xs text-light-gray mb-2">Standard browser tab icon</p>
                {formData.favicon32x32 && (
                  <div className="relative w-20 h-20 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center mx-auto">
                    <img
                      src={formData.favicon32x32}
                      alt="Favicon 32x32"
                      className="w-8 h-8 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, favicon32x32: "" })}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, "favicon32x32")}
                  disabled={uploading === "favicon32x32"}
                  className="cursor-pointer text-xs"
                />
                {uploading === "favicon32x32" && (
                  <p className="text-xs text-primary-blue mt-1">Uploading...</p>
                )}
              </div>

              {/* 192x192 PWA Icon */}
              <div>
                <Label className="text-sm font-semibold">192x192 PWA Icon</Label>
                <p className="text-xs text-light-gray mb-2">For mobile home screen</p>
                {formData.favicon192x192 && (
                  <div className="relative w-20 h-20 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center mx-auto">
                    <img
                      src={formData.favicon192x192}
                      alt="Favicon 192x192"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, favicon192x192: "" })}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, "favicon192x192")}
                  disabled={uploading === "favicon192x192"}
                  className="cursor-pointer text-xs"
                />
                {uploading === "favicon192x192" && (
                  <p className="text-xs text-primary-blue mt-1">Uploading...</p>
                )}
              </div>

              {/* 512x512 PWA Icon */}
              <div>
                <Label className="text-sm font-semibold">512x512 PWA Icon</Label>
                <p className="text-xs text-light-gray mb-2">High-res mobile icon</p>
                {formData.favicon512x512 && (
                  <div className="relative w-20 h-20 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center mx-auto">
                    <img
                      src={formData.favicon512x512}
                      alt="Favicon 512x512"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, favicon512x512: "" })}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, "favicon512x512")}
                  disabled={uploading === "favicon512x512"}
                  className="cursor-pointer text-xs"
                />
                {uploading === "favicon512x512" && (
                  <p className="text-xs text-primary-blue mt-1">Uploading...</p>
                )}
              </div>

              {/* Apple Touch Icon */}
              <div>
                <Label className="text-sm font-semibold">Apple Touch Icon (180x180)</Label>
                <p className="text-xs text-light-gray mb-2">For iOS home screen</p>
                {formData.appleTouchIcon && (
                  <div className="relative w-20 h-20 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center mx-auto">
                    <img
                      src={formData.appleTouchIcon}
                      alt="Apple Touch Icon"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, appleTouchIcon: "" })}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => handleImageUpload(e, "appleTouchIcon")}
                  disabled={uploading === "appleTouchIcon"}
                  className="cursor-pointer text-xs"
                />
                {uploading === "appleTouchIcon" && (
                  <p className="text-xs text-primary-blue mt-1">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          {/* OG Image */}
          <div>
            <Label>OG Image (Social Sharing)</Label>
            <p className="text-xs text-light-gray mb-2">Recommended: 1200x630 pixels for social media previews</p>
            {formData.ogImage && (
              <div className="relative w-full h-32 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center">
                <img
                  src={formData.ogImage}
                  alt="OG Image"
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ogImage: "" })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => handleImageUpload(e, "ogImage")}
              disabled={uploading === "ogImage"}
              className="cursor-pointer"
            />
            {uploading === "ogImage" && (
              <p className="text-sm text-primary-blue mt-1">Uploading...</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="twitterUrl">Twitter URL</Label>
              <Input
                id="twitterUrl"
                type="url"
                value={formData.twitterUrl}
                onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="Page title for search engines"
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                rows={3}
                placeholder="Description for search engines (150-160 characters recommended)"
              />
            </div>
            <div>
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>
        </div>

        {/* AI Voice Settings */}
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">🤖 AI Voice Settings (Honey AI)</h2>
          <VoiceSettings
            voiceSettings={{
              aiVoiceName: formData.aiVoiceName,
              aiVoiceLang: formData.aiVoiceLang,
              aiVoiceRate: formData.aiVoiceRate,
              aiVoicePitch: formData.aiVoicePitch,
              aiVoiceVolume: formData.aiVoiceVolume,
              aiVoiceURI: formData.aiVoiceURI,
              aiCustomVoiceUrl: formData.aiCustomVoiceUrl,
              aiVoiceScript: formData.aiVoiceScript,
            }}
            onSave={(voiceData) => {
              setFormData((prev) => ({
                ...prev,
                ...voiceData,
              }));
              toast.success("Voice settings updated! Click 'Save Settings' to save all changes.");
            }}
          />
        </div>

        {/* WhatsApp Web Connection */}
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <WhatsAppConnection />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

