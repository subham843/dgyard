"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Award, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Loader2,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrustScoreData {
  currentScore: number;
  jobSuccessRate: number;
  complaintCount: number;
  penaltiesApplied: number;
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  improvements: string[];
}

export function TrustScorePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrustScoreData>({
    currentScore: 0,
    jobSuccessRate: 0,
    complaintCount: 0,
    penaltiesApplied: 0,
    reviews: {
      averageRating: 0,
      totalReviews: 0,
    },
    improvements: [],
  });

  useEffect(() => {
    fetchTrustScore();
  }, []);

  const fetchTrustScore = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/trust-score");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching trust score:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading trust score...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trust Score & Performance</h1>
          <p className="text-gray-600">Track your performance metrics</p>
        </div>

        {/* Trust Score Card */}
        <Card className="mb-6 border-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-700">Current Trust Score</CardTitle>
                <div className={`text-5xl font-bold mt-2 ${getScoreColor(data.currentScore)}`}>
                  {data.currentScore}/100
                </div>
              </div>
              <TrendingUp className="w-16 h-16 text-blue-600" />
            </div>
          </CardHeader>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm">Job Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {data.jobSuccessRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{data.reviews.averageRating.toFixed(1)}</div>
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <div className="text-sm text-gray-600">
                  ({data.reviews.totalReviews} reviews)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm">Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {data.complaintCount}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm">Penalties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {data.penaltiesApplied}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Improvement Suggestions */}
        {data.improvements.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.improvements.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}





