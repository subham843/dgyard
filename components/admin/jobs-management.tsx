"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Briefcase, Eye, Filter, Search, MapPin, User, Phone, Calendar, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function JobsManagement() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/jobs${params}`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetail = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedJob(data.job);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error fetching job detail:", error);
      toast.error("Failed to fetch job details");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(query) ||
      job.jobNumber?.toLowerCase().includes(query) ||
      job.customerName?.toLowerCase().includes(query) ||
      job.customerPhone?.includes(query) ||
      job.city?.toLowerCase().includes(query) ||
      job.dealerName?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "PENDING").length,
    assigned: jobs.filter((j) => j.status === "ASSIGNED").length,
    inProgress: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
  };

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold">Jobs Management</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage all job posts</p>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-600">Total Jobs</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm text-yellow-700">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-700">Assigned</div>
            <div className="text-2xl font-bold text-blue-800">{stats.assigned}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-700">In Progress</div>
            <div className="text-2xl font-bold text-purple-800">{stats.inProgress}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-700">Completed</div>
            <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by job number, title, customer, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All" : status.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse"></div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No jobs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[job.status]}`}>
                        {job.status.replace("_", " ")}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[job.priority]}`}>
                        {job.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Job #: {job.jobNumber}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span><strong>Customer:</strong> {job.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{job.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.city}, {job.state}</span>
                      </div>
                      <div>
                        <strong>Dealer:</strong> {job.dealerName}
                      </div>
                      {job.technician && (
                        <div>
                          <strong>Technician:</strong> {job.technician.fullName}
                        </div>
                      )}
                      {job.scheduledAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(job.scheduledAt)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Posted: {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fetchJobDetail(job.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${
            showDetailModal ? "block" : "hidden"
          }`}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Job Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div>
                <h3 className="font-semibold mb-2">Job Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Job Number:</strong> {selectedJob.jobNumber}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[selectedJob.status]}`}>
                      {selectedJob.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <strong>Priority:</strong>{" "}
                    <span className={`px-2 py-1 rounded text-xs ${priorityColors[selectedJob.priority]}`}>
                      {selectedJob.priority}
                    </span>
                  </div>
                  <div>
                    <strong>Title:</strong> {selectedJob.title}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedJob.customerName}</div>
                  <div><strong>Phone:</strong> {selectedJob.customerPhone}</div>
                  {selectedJob.customerEmail && (
                    <div><strong>Email:</strong> {selectedJob.customerEmail}</div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="text-sm">
                  <p>{selectedJob.address}</p>
                  <p>{selectedJob.city}, {selectedJob.state} - {selectedJob.pincode}</p>
                  {selectedJob.placeName && <p><strong>Place:</strong> {selectedJob.placeName}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="font-semibold mb-2">Work Details</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.workDetails}</p>
              </div>

              {/* Dealer & Technician */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Dealer</h3>
                  <div className="text-sm">
                    <p><strong>Name:</strong> {selectedJob.dealerName}</p>
                    <p><strong>Phone:</strong> {selectedJob.dealerPhone}</p>
                    <p><strong>Email:</strong> {selectedJob.dealerEmail}</p>
                  </div>
                </div>
                {selectedJob.technician && (
                  <div>
                    <h3 className="font-semibold mb-2">Assigned Technician</h3>
                    <div className="text-sm">
                      <p><strong>Name:</strong> {selectedJob.technician.fullName}</p>
                      <p><strong>Phone:</strong> {selectedJob.technician.mobile}</p>
                      <p><strong>Email:</strong> {selectedJob.technician.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold mb-2">Timeline</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Posted:</strong> {formatDate(selectedJob.createdAt)}</p>
                  {selectedJob.assignedAt && (
                    <p><strong>Assigned:</strong> {formatDate(selectedJob.assignedAt)}</p>
                  )}
                  {selectedJob.startedAt && (
                    <p><strong>Started:</strong> {formatDate(selectedJob.startedAt)}</p>
                  )}
                  {selectedJob.completedAt && (
                    <p><strong>Completed:</strong> {formatDate(selectedJob.completedAt)}</p>
                  )}
                  {selectedJob.scheduledAt && (
                    <p><strong>Scheduled:</strong> {formatDate(selectedJob.scheduledAt)}</p>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {(selectedJob.estimatedDuration || selectedJob.estimatedCost || selectedJob.notes) && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Information</h3>
                  <div className="text-sm space-y-1">
                    {selectedJob.estimatedDuration && (
                      <p><strong>Estimated Duration:</strong> {selectedJob.estimatedDuration} hours</p>
                    )}
                    {selectedJob.estimatedCost && (
                      <p><strong>Estimated Cost:</strong> ₹{selectedJob.estimatedCost}</p>
                    )}
                    {selectedJob.actualCost && (
                      <p><strong>Actual Cost:</strong> ₹{selectedJob.actualCost}</p>
                    )}
                    {selectedJob.notes && (
                      <div>
                        <strong>Notes:</strong>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}











