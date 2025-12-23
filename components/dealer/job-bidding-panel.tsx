"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, DollarSign, MapPin, Star, CheckCircle2, X, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export function JobBiddingPanel({ 
  job, 
  onBack, 
  onAccept 
}: { 
  job: any; 
  onBack: () => void; 
  onAccept: () => void;
}) {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterOffer, setCounterOffer] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchBids();
  }, [job.id]);

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/bids`);
      if (response.ok) {
        const data = await response.json();
        setBids(data.bids || []);
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
      toast.error("Failed to fetch bids");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/bids/${bidId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Bid accepted! Technician has been assigned.");
        onAccept();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to accept bid");
      }
    } catch (error) {
      console.error("Error accepting bid:", error);
      toast.error("Something went wrong");
    }
  };

  const handleCounterOffer = async (bidId: string, technicianId: string) => {
    const offerAmount = parseFloat(counterOffer[bidId]);
    if (!offerAmount || offerAmount <= 0) {
      toast.error("Please enter a valid counter offer amount");
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${job.id}/bids/${bidId}/counter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: offerAmount }),
      });

      if (response.ok) {
        toast.success("Counter offer sent!");
        setCounterOffer({ ...counterOffer, [bidId]: "" });
        fetchBids();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send counter offer");
      }
    } catch (error) {
      console.error("Error sending counter offer:", error);
      toast.error("Something went wrong");
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/bids/${bidId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Bid rejected");
        fetchBids();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject bid");
      }
    } catch (error) {
      console.error("Error rejecting bid:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Price Bidding & Negotiation</h2>
            <p className="text-sm text-gray-600">Job: {job.title}</p>
          </div>
        </div>
      </div>

      {/* Rules Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800 mb-1">Bidding Rules</p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Maximum 2 negotiation rounds allowed</li>
              <li>• Price will be locked after acceptance</li>
              <li>• You cannot change locked price</li>
            </ul>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading bids...</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No bids received yet</p>
          <p className="text-sm text-gray-500">Technicians will be notified and can place bids</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {/* Show technician name and service location always, other details only after payment */}
                  {bid.technician ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        {bid.technician.fullName ? (
                          <h3 className="font-semibold text-lg">
                            {bid.technician.fullName}
                          </h3>
                        ) : (
                          <h3 className="font-semibold text-lg text-gray-500">
                            Technician
                          </h3>
                        )}
                        {/* Only show rating after payment */}
                        {job.paymentLocked && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{bid.technicianRating || bid.technician?.rating ? (bid.technicianRating || bid.technician.rating).toFixed(1) : "N/A"}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-gray-600">
                        {/* Service location - always visible */}
                        {bid.technician.serviceArea?.placeName && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Service Area: </span>
                            {bid.technician.serviceArea.placeName}
                            {bid.technician.serviceArea.serviceRadiusKm && 
                              ` (${bid.technician.serviceArea.serviceRadiusKm}km radius)`}
                          </div>
                        )}
                        {/* Distance - always visible */}
                        {bid.distanceKm && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{bid.distanceKm.toFixed(1)} km away</span>
                          </div>
                        )}
                        {/* Round number - always visible */}
                        <div className="flex items-center gap-1">
                          <span>Round: {bid.roundNumber}</span>
                        </div>
                        {/* Other details - only after payment */}
                        {job.paymentLocked && (
                          <>
                            {bid.technician.trustScore !== undefined && (
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">Trust Score: </span>
                                {bid.technician.trustScore}/100
                              </div>
                            )}
                            {bid.technician.skills && (
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">Skills: </span>
                                {Array.isArray(bid.technician.skills) 
                                  ? bid.technician.skills.map((s: any) => s.skill || s).join(", ")
                                  : "Available"}
                              </div>
                            )}
                          </>
                        )}
                        {/* Show message if payment not locked */}
                        {!job.paymentLocked && (
                          <div className="text-xs text-orange-600 mt-2">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Complete payment to view full technician details
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <p>Technician details will be available after payment is locked</p>
                      {bid.distanceKm && (
                        <div className="flex items-center gap-1 mt-2">
                          <MapPin className="w-4 h-4" />
                          <span>{bid.distanceKm.toFixed(1)} km away</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ₹{bid.offeredPrice.toLocaleString("en-IN")}
                  </p>
                  {bid.isCounterOffer && (
                    <p className="text-xs text-gray-500 mt-1">Counter Offer</p>
                  )}
                </div>
              </div>

              {bid.message && (
                <p className="text-sm text-gray-700 mb-4 bg-gray-50 p-3 rounded">
                  {bid.message}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {bid.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() => handleAcceptBid(bid.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    {job.negotiationRounds < 2 && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Counter offer (₹)"
                          value={counterOffer[bid.id] || ""}
                          onChange={(e) => setCounterOffer({ ...counterOffer, [bid.id]: e.target.value })}
                          className="w-32"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleCounterOffer(bid.id, bid.technicianId)}
                        >
                          Counter Offer
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleRejectBid(bid.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {bid.status === "ACCEPTED" && (
                  <div className="w-full">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold inline-block mb-2">
                      Accepted
                    </span>
                    <div className="text-center text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="font-semibold text-blue-800">Waiting for Technician</p>
                      <p className="text-xs mt-1 text-blue-700">
                        Technician will be notified. Waiting for their response.
                      </p>
                    </div>
                  </div>
                )}
                {bid.status === "REJECTED" && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    Rejected
                  </span>
                )}
                {bid.status === "COUNTERED" && (
                  <div className="w-full">
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold inline-block mb-2">
                      Counter Offer Sent
                    </span>
                    <div className="text-center text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="font-semibold text-blue-800">Waiting for Technician</p>
                      <p className="text-xs mt-1 text-blue-700">
                        Counter offer sent. Waiting for technician's response.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}






