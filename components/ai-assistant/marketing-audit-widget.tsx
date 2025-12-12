"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, X, Link as LinkIcon, MapPin, Share2, Loader2, CheckCircle2, AlertCircle, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface AuditWidgetProps {
  onClose?: () => void;
}

export function MarketingAuditWidget({ onClose }: AuditWidgetProps) {
  const [step, setStep] = useState<"form" | "processing" | "results">("form");
  const [loading, setLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [formData, setFormData] = useState({
    websiteUrl: "",
    gbpName: "",
    gbpAddress: "",
    facebook: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    twitter: ""
  });
  const [auditResult, setAuditResult] = useState<any>(null);

  const handleDownloadPDF = () => {
    if (!auditResult) {
      toast.error("No audit results available");
      return;
    }

    try {
      const doc = new jsPDF();
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        if (isBold) {
          doc.setFont(undefined, "bold");
        } else {
          doc.setFont(undefined, "normal");
        }
        
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += fontSize * 0.5;
        });
        yPos += 5;
      };

      // Title
      addText("Marketing Audit Report", 24, true, [0, 0, 0]);
      yPos += 5;

      // Date
      addText(`Generated on: ${new Date().toLocaleDateString("en-IN", { 
        year: "numeric", 
        month: "long", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}`, 10, false, [100, 100, 100]);
      yPos += 10;

      // Score Section
      addText("Marketing Visibility Score", 18, true);
      addText(`${auditResult.score}/100`, 32, true, [0, 0, 0]);
      const scoreText = auditResult.score >= 80 ? "Excellent!" : 
                       auditResult.score >= 60 ? "Good, but room for improvement" : 
                       "Needs significant work";
      addText(scoreText, 12, false, [100, 100, 100]);
      yPos += 10;

      // Top Issues
      addText("Priority Issues", 16, true);
      auditResult.topIssues.forEach((issue: any, idx: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        addText(`${idx + 1}. [${issue.severity}] ${issue.title}`, 12, true);
        addText(issue.description, 10, false, [60, 60, 60]);
        addText(`Estimated fix time: ${issue.fixEstimate}`, 9, false, [100, 100, 100]);
        yPos += 5;
      });
      yPos += 10;

      // Quick Wins
      addText("Quick Wins", 16, true);
      auditResult.quickWins.forEach((win: any, idx: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        addText(`${idx + 1}. ${win.title}`, 12, true);
        addText(win.action, 10, false, [60, 60, 60]);
        yPos += 5;
      });
      yPos += 10;

      // Sample Content
      addText("Generated Content Suggestions", 16, true);
      
      if (auditResult.sampleTexts) {
        // Meta Title & Description
        addText("Meta Title & Description", 12, true);
        addText(`Title: ${auditResult.sampleTexts.metaTitle || "N/A"}`, 10, false);
        addText(`Description: ${auditResult.sampleTexts.metaDescription || "N/A"}`, 10, false);
        yPos += 5;

        // Social Media Posts
        if (auditResult.sampleTexts.socialPosts && auditResult.sampleTexts.socialPosts.length > 0) {
          addText("Social Media Posts", 12, true);
          auditResult.sampleTexts.socialPosts.forEach((post: string, idx: number) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            addText(`Post ${idx + 1}:`, 10, true);
            addText(post, 9, false, [60, 60, 60]);
            yPos += 3;
          });
          yPos += 5;
        }

        // Ad Headlines
        if (auditResult.sampleTexts.adHeadlines && auditResult.sampleTexts.adHeadlines.length > 0) {
          addText("Ad Headlines", 12, true);
          auditResult.sampleTexts.adHeadlines.forEach((headline: string, idx: number) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            addText(`${idx + 1}. ${headline}`, 10, false);
            yPos += 3;
          });
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.text(
          `Generated by D.G.Yard - Marketing Audit Tool | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `marketing-audit-report-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF report downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    if (sessionStatus === "loading") {
      toast.loading("Checking authentication...");
      return;
    }

    if (sessionStatus === "unauthenticated" || !session?.user?.id) {
      toast.error("Please login to use this feature");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    // Check profile completion
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        const profileComplete = !!(user?.name && user?.email && user?.phone);
        const phoneVerified = user?.phoneVerified === true;

        if (!profileComplete) {
          toast.error("Please complete your profile first");
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=complete`);
          return;
        }

        if (!phoneVerified) {
          toast.error("Please verify your phone number first");
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=verify-phone`);
          return;
        }
      } else {
        toast.error("Please login to use this feature");
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      toast.error("Please login to use this feature");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    
    if (!formData.websiteUrl && !formData.gbpName) {
      toast.error("Please provide at least a website URL or Google Business name");
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      const response = await fetch("/api/audit/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "public",
          websiteUrl: formData.websiteUrl,
          gbpName: formData.gbpName,
          gbpAddress: formData.gbpAddress,
          socialLinks: {
            facebook: formData.facebook,
            instagram: formData.instagram,
            youtube: formData.youtube,
            linkedin: formData.linkedin,
            twitter: formData.twitter
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mock) {
          toast.success("Audit request received! (Mock mode - database migration pending)");
        } else {
          toast.success("Audit request submitted!");
        }
        
        // Simulate processing (in real implementation, this would poll for results)
        setTimeout(() => {
          // Mock result for now
          setAuditResult({
            score: 65,
            topIssues: [
              { id: 1, title: "Incomplete Google Business Profile", severity: "P1", description: "Missing services, hours, and photos", fixEstimate: "2-4 hours" },
              { id: 2, title: "Slow Page Speed", severity: "P1", description: "LCP is 3.8s (target: <2.5s)", fixEstimate: "4-6 hours" },
              { id: 3, title: "Missing Meta Tags", severity: "P2", description: "Several pages lack proper meta descriptions", fixEstimate: "1-2 hours" },
              { id: 4, title: "Low Review Count", severity: "P2", description: "Only 3 reviews visible", fixEstimate: "Ongoing" },
              { id: 5, title: "No Social Media Links", severity: "P3", description: "Website doesn't link to social profiles", fixEstimate: "30 min" }
            ],
            quickWins: [
              { title: "Add 5 high-quality photos to GBP", action: "Upload photos via Google Business Profile" },
              { title: "Complete business hours", action: "Update hours in GBP settings" },
              { title: "Add meta description to homepage", action: "Update page meta tags" }
            ],
            sampleTexts: {
              metaTitle: "D.G.Yard - Digital Marketing & IT Solutions | Ranchi",
              metaDescription: "Professional digital marketing, branding, and IT solutions in Ranchi. Get measurable results with data-driven strategies.",
              socialPosts: [
                "🚀 Ready to grow your business online? D.G.Yard offers complete digital marketing solutions — from SEO to social media management. Get started today!",
                "📈 Tired of low visibility? Our local SEO and Google Business optimization services help you rank higher and get more customers.",
                "💡 Smart marketing, measurable growth. Let's build a brand that people remember. Contact D.G.Yard for a free consultation!"
              ],
              adHeadlines: [
                "Get More Customers with Professional Digital Marketing",
                "Local SEO That Actually Works — See Results in 30 Days"
              ]
            }
          });
          setStep("results");
          setLoading(false);
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to submit audit request");
        console.error("Audit request failed:", errorData);
        setStep("form");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error submitting audit:", error);
      toast.error(error.message || "Error submitting audit request");
      setStep("form");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900">Honey Marketing Audit</h2>
                <p className="text-sm text-gray-600">Get instant insights about your online presence</p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {step === "form" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="websiteUrl" className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4" />
                    Website URL
                  </Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gbpName" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Google Business Name
                    </Label>
                    <Input
                      id="gbpName"
                      placeholder="Your Business Name"
                      value={formData.gbpName}
                      onChange={(e) => setFormData({ ...formData, gbpName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gbpAddress" className="mb-2">Business Address</Label>
                    <Input
                      id="gbpAddress"
                      placeholder="City, State"
                      value={formData.gbpAddress}
                      onChange={(e) => setFormData({ ...formData, gbpAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Social Media Links (Optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="facebook" className="text-xs text-gray-600">Facebook</Label>
                      <Input
                        id="facebook"
                        type="url"
                        placeholder="https://facebook.com/yourpage"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagram" className="text-xs text-gray-600">Instagram</Label>
                      <Input
                        id="instagram"
                        type="url"
                        placeholder="https://instagram.com/yourpage"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="youtube" className="text-xs text-gray-600">YouTube</Label>
                      <Input
                        id="youtube"
                        type="url"
                        placeholder="https://youtube.com/@yourchannel"
                        value={formData.youtube}
                        onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin" className="text-xs text-gray-600">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        placeholder="https://linkedin.com/company/yourcompany"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-serif font-bold">
                    <Bot className="w-4 h-4 mr-2" />
                    Start Free Audit
                  </Button>
                  {onClose && (
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}

            {step === "processing" && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-6"
                />
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Analyzing Your Online Presence</h3>
                <p className="text-gray-600 font-serif">
                  Honey is checking your website, Google Business Profile, and social media...
                </p>
              </div>
            )}

            {step === "results" && auditResult && (
              <div className="space-y-6">
                {/* Score */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 text-center">
                  <h3 className="text-sm font-serif font-semibold text-gray-700 mb-2">Your Marketing Visibility Score</h3>
                  <div className="text-5xl font-serif font-bold text-gray-900 mb-2">
                    {auditResult.score}/100
                  </div>
                  <p className="text-sm text-gray-600 font-serif">
                    {auditResult.score >= 80 ? "Excellent!" : auditResult.score >= 60 ? "Good, but room for improvement" : "Needs significant work"}
                  </p>
                </div>

                {/* Top Issues */}
                <div>
                  <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Priority Issues</h3>
                  <div className="space-y-3">
                    {auditResult.topIssues.map((issue: any) => (
                      <div key={issue.id} className="bg-gray-50 rounded-lg border-2 border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              issue.severity === "P1" ? "bg-red-100 text-red-700" :
                              issue.severity === "P2" ? "bg-orange-100 text-orange-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {issue.severity}
                            </span>
                            <h4 className="font-serif font-bold text-gray-900">{issue.title}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 font-serif mb-2">{issue.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Est. fix time: {issue.fixEstimate}</span>
                          <Button size="sm" variant="outline" className="text-xs">
                            Fix This
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Wins */}
                <div>
                  <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Quick Wins</h3>
                  <div className="space-y-2">
                    {auditResult.quickWins.map((win: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 bg-green-50 rounded-lg p-3 border border-green-200">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-serif font-semibold text-gray-900 text-sm">{win.title}</p>
                          <p className="text-xs text-gray-600">{win.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Content */}
                <div>
                  <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Generated Content Suggestions</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-serif font-bold text-gray-900 mb-2 text-sm">Meta Title & Description</h4>
                      <p className="text-sm text-gray-700 font-serif mb-1"><strong>Title:</strong> {auditResult.sampleTexts.metaTitle}</p>
                      <p className="text-sm text-gray-700 font-serif"><strong>Description:</strong> {auditResult.sampleTexts.metaDescription}</p>
                      <Button size="sm" variant="outline" className="mt-2 text-xs">
                        Copy
                      </Button>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-serif font-bold text-gray-900 mb-2 text-sm">Social Media Posts</h4>
                      {auditResult.sampleTexts.socialPosts.map((post: string, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded border border-purple-100">
                          <p className="text-sm text-gray-700 font-serif">{post}</p>
                          <Button size="sm" variant="ghost" className="mt-1 text-xs">
                            Copy
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-serif font-bold"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Full Report (PDF)
                  </Button>
                  <Button variant="outline" className="flex-1 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-serif font-bold">
                    Hire D.G.Yard to Fix
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

