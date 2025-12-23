"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  MessageSquare,
  Phone,
  Mail,
  FileText,
  BookOpen,
  Loader2,
  Send,
  Shield,
  Briefcase
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
import toast from "react-hot-toast";

export function SupportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [ticketData, setTicketData] = useState({
    subject: "",
    category: "",
    description: "",
  });

  const handleSubmitTicket = async () => {
    if (!ticketData.subject || !ticketData.category || !ticketData.description) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch("/api/technician/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      });
      if (response.ok) {
        toast.success("Support ticket created successfully!");
        setTicketData({ subject: "", category: "", description: "" });
      } else {
        toast.error("Failed to create ticket");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Help</h1>
          <p className="text-gray-600">Get help and support for your account</p>
        </div>

        {/* Raise Support Ticket */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Raise Support Ticket</CardTitle>
            <CardDescription>Submit a ticket for any issues or questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={ticketData.category}
                  onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select category</option>
                  <option value="PAYMENT">Payment Help</option>
                  <option value="WARRANTY">Warranty Rules</option>
                  <option value="BIDDING">Bidding Rules</option>
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={ticketData.subject}
                  onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={ticketData.description}
                  onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                  placeholder="Provide detailed information about your issue..."
                  rows={6}
                />
              </div>
              <Button
                onClick={handleSubmitTicket}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Payment Help
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Learn about payment processing, withdrawals, and warranty holds
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Warranty Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Understand warranty periods, hold amounts, and release conditions
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Bidding Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Learn how to bid on jobs, eligibility requirements, and bid types
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Platform Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Read our terms of service, privacy policy, and platform guidelines
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <Card className="mt-6 border-2">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold">Phone Support</div>
                  <div className="text-sm text-gray-600">+91 1800-XXX-XXXX</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold">Email Support</div>
                  <div className="text-sm text-gray-600">support@dgyard.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold">Chat Support</div>
                  <div className="text-sm text-gray-600">Available 24/7</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

