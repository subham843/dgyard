"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Star, X, Upload, CheckCircle2, RefreshCw, Download, Link2, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export function ReviewManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    content: "",
    rating: "5",
    image: "",
    source: "Manual",
    googleReviewId: "",
    verified: false,
    featured: false,
    active: true,
    order: "0",
  });
  const [uploading, setUploading] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncConfig, setSyncConfig] = useState({
    placeId: "",
    googleApiKey: "",
    scrapingApiKey: "",
    useFullSync: false,
  });
  const [gmbStatus, setGmbStatus] = useState<{
    connected: boolean;
    locationId: string | null;
    accountName: string | null;
  } | null>(null);
  const [checkingGmbStatus, setCheckingGmbStatus] = useState(true);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
    checkGMBStatus();
  }, []);

  const checkGMBStatus = async () => {
    try {
      const response = await fetch("/api/admin/gmb/status", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setGmbStatus(data);
      }
    } catch (error) {
      console.error("Error checking GMB status:", error);
    } finally {
      setCheckingGmbStatus(false);
    }
  };

  const handleConnectGMB = async () => {
    try {
      const response = await fetch("/api/admin/gmb/auth", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || "Failed to get authorization URL");
      }
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`);
    }
  };

  const handleSyncGMB = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch("/api/admin/gmb/reviews", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to sync reviews");
        setSyncResult(data);
        return;
      }

      toast.success(
        `Sync completed! ${data.imported} imported, ${data.updated} updated`
      );
      setSyncResult(data);
      fetchReviews();
      checkGMBStatus();
    } catch (error: any) {
      console.error("Error syncing GMB reviews:", error);
      toast.error(`Sync failed: ${error.message || "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/admin/reviews", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch reviews");
        return;
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast.error(`Failed to fetch reviews: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/admin/reviews/${editingId}`
        : "/api/admin/reviews";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || `Failed to save review`);
        return;
      }

      toast.success(editingId ? "Review updated!" : "Review created!");
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchReviews();
    } catch (error: any) {
      console.error("Error saving review:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const handleEdit = (review: any) => {
    setEditingId(review.id);
    setFormData({
      name: review.name,
      role: review.role || "",
      content: review.content,
      rating: review.rating.toString(),
      image: review.image || "",
      source: review.source || "Manual",
      googleReviewId: review.googleReviewId || "",
      verified: review.verified || false,
      featured: review.featured || false,
      active: review.active !== undefined ? review.active : true,
      order: review.order?.toString() || "0",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete review");
        return;
      }

      toast.success("Review deleted!");
      fetchReviews();
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast.error(`Failed to delete: ${error.message || "Unknown error"}`);
    }
  };

  const handleToggleActive = async (review: any) => {
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...review,
          active: !review.active,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to update review");
        return;
      }

      toast.success(review.active ? "Review hidden" : "Review shown");
      fetchReviews();
    } catch (error: any) {
      console.error("Error toggling review:", error);
      toast.error(`Failed to update: ${error.message || "Unknown error"}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      content: "",
      rating: "5",
      image: "",
      source: "Manual",
      googleReviewId: "",
      verified: false,
      featured: false,
      active: true,
      order: "0",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to upload image");
        return;
      }

      setFormData({ ...formData, image: data.url });
      toast.success("Image uploaded!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSyncGoogle = async () => {
    if (!syncConfig.placeId) {
      toast.error("Please enter Place ID");
      return;
    }

    if (!syncConfig.useFullSync && !syncConfig.googleApiKey) {
      toast.error("Please enter Google API Key");
      return;
    }

    if (syncConfig.useFullSync && !syncConfig.scrapingApiKey) {
      toast.error("Please enter Scraping API Key for full sync");
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    try {
      const endpoint = syncConfig.useFullSync 
        ? "/api/admin/reviews/sync-google-full"
        : "/api/admin/reviews/sync-google";

      const payload = syncConfig.useFullSync
        ? { placeId: syncConfig.placeId, scrapingApiKey: syncConfig.scrapingApiKey }
        : { placeId: syncConfig.placeId, googleApiKey: syncConfig.googleApiKey };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to sync reviews");
        setSyncResult(data);
        return;
      }

      toast.success(
        `Sync completed! ${data.imported} imported, ${data.updated} updated`
      );
      setSyncResult(data);
      fetchReviews(); // Refresh the list
    } catch (error: any) {
      console.error("Error syncing reviews:", error);
      toast.error(`Sync failed: ${error.message || "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };

  const filteredReviews = reviews.filter(
    (review) =>
      review.name.toLowerCase().includes(search.toLowerCase()) ||
      review.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* GMB Connection Status */}
      {!checkingGmbStatus && (
        <div
          className={`p-4 rounded-lg border-2 ${
            gmbStatus?.connected
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {gmbStatus?.connected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      Google My Business Connected
                    </p>
                    {gmbStatus.locationId && (
                      <p className="text-sm text-green-700">
                        Location ID: {gmbStatus.locationId.split("/").pop()}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">
                      Google My Business Not Connected
                    </p>
                    <p className="text-sm text-yellow-700">
                      Connect your GMB account to import all reviews automatically
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-600 mt-1">Manage customer reviews and testimonials</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {gmbStatus?.connected ? (
            <Button
              onClick={handleSyncGMB}
              disabled={syncing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync GMB Reviews
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConnectGMB}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Connect Google My Business
            </Button>
          )}
          <Button
            onClick={() => setShowSyncModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Import from Places API
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Review
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Review" : "Add Review"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="e.g., Business Owner"
                  />
                </div>
              </div>

              <div>
                <Label>Review Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rating * (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({ ...formData, rating: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source</Label>
                  <select
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Google My Business">Google My Business</option>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                  </select>
                </div>
                <div>
                  <Label>Google Review ID</Label>
                  <Input
                    value={formData.googleReviewId}
                    onChange={(e) =>
                      setFormData({ ...formData, googleReviewId: e.target.value })
                    }
                    placeholder="If from Google My Business"
                  />
                </div>
              </div>

              <div>
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {formData.image && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) =>
                      setFormData({ ...formData, verified: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span>Verified Review</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span>Active (Show on Website)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gray-900 hover:bg-gray-800">
                  {editingId ? "Update Review" : "Create Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Import from Google My Business</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncConfig({ placeId: "", googleApiKey: "", scrapingApiKey: "", useFullSync: false });
                  setSyncResult(null);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Google Places API is limited to <strong>5 reviews</strong> per request. 
                  To get all reviews, use the Google My Business integration above (requires OAuth setup).
                </p>
              </div>
              
              {gmbStatus && !gmbStatus.connected && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Tip:</strong> For all reviews, connect Google My Business above. 
                    If you get "invalid_scope" error, see <code>docs/GMB_SCOPE_TROUBLESHOOTING.md</code> for help.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="useFullSync"
                  checked={syncConfig.useFullSync}
                  onChange={(e) =>
                    setSyncConfig({ ...syncConfig, useFullSync: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="useFullSync" className="cursor-pointer">
                  Use Full Sync (Get all reviews using scraping service)
                </Label>
              </div>

              <div>
                <Label>Google Place ID *</Label>
                <Input
                  value={syncConfig.placeId}
                  onChange={(e) =>
                    setSyncConfig({ ...syncConfig, placeId: e.target.value })
                  }
                  placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find your Place ID:{" "}
                  <a
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    How to find Place ID
                  </a>
                </p>
              </div>

              {!syncConfig.useFullSync ? (
                <div>
                  <Label>Google Places API Key *</Label>
                  <Input
                    type="password"
                    value={syncConfig.googleApiKey}
                    onChange={(e) =>
                      setSyncConfig({ ...syncConfig, googleApiKey: e.target.value })
                    }
                    placeholder="Enter your Google Places API Key"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get API Key:{" "}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google Cloud Console
                    </a>
                    {" "}(Limited to 5 reviews)
                  </p>
                </div>
              ) : (
                <div>
                  <Label>Scraping Service API Key * (e.g., Outscraper)</Label>
                  <Input
                    type="password"
                    value={syncConfig.scrapingApiKey}
                    onChange={(e) =>
                      setSyncConfig({ ...syncConfig, scrapingApiKey: e.target.value })
                    }
                    placeholder="Enter your Outscraper or scraping service API Key"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get Outscraper API Key:{" "}
                    <a
                      href="https://outscraper.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Outscraper.com
                    </a>
                    {" "}(Gets all reviews)
                  </p>
                </div>
              )}

              {syncResult && (
                <div
                  className={`p-4 rounded-lg ${
                    syncResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      syncResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {syncResult.message || syncResult.error}
                  </p>
                  {syncResult.success && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>Imported: {syncResult.imported}</p>
                      <p>Updated: {syncResult.updated}</p>
                      <p>Skipped: {syncResult.skipped}</p>
                      <p>Total: {syncResult.total}</p>
                      {syncResult.warning && (
                        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                          <p className="text-yellow-800 text-xs font-semibold">
                            ⚠️ {syncResult.warning}
                          </p>
                          <p className="text-yellow-700 text-xs mt-1">
                            To get all reviews, consider using Google My Business API or a scraping service.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSyncGoogle}
                  disabled={
                    syncing || 
                    !syncConfig.placeId || 
                    (!syncConfig.useFullSync && !syncConfig.googleApiKey) ||
                    (syncConfig.useFullSync && !syncConfig.scrapingApiKey)
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Import Reviews
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncConfig({ placeId: "", googleApiKey: "" });
                    setSyncResult(null);
                  }}
                >
                  Close
                </Button>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Imported reviews will be set to <strong>Hidden</strong> by
                  default. You can review and activate them individually from the list below.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No reviews found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{review.name}</h3>
                    {review.verified && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    )}
                    {review.featured && (
                      <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
                        Featured
                      </span>
                    )}
                    {!review.active && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  {review.role && (
                    <p className="text-sm text-gray-600 mb-2">{review.role}</p>
                  )}
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-2 line-clamp-2">"{review.content}"</p>
                  {review.source && (
                    <p className="text-xs text-gray-500">Source: {review.source}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(review)}
                    className={review.active ? "text-green-600 hover:text-green-700" : "text-gray-600 hover:text-gray-700"}
                    title={review.active ? "Hide review" : "Show review"}
                  >
                    {review.active ? "👁️" : "🚫"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(review)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

