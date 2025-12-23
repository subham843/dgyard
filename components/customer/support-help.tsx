"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const faqs = [
  {
    question: "How do I book a service?",
    answer: "You can book a service by going to the 'Book Service' page, selecting your service type, filling in the details, and submitting the form. For CCTV installation, you can use our estimation tool to get an instant quote.",
  },
  {
    question: "How long does installation take?",
    answer: "Installation time varies based on the service type. CCTV installations typically take 4-8 hours depending on the number of cameras. Our technicians will provide an estimated timeline when they arrive.",
  },
  {
    question: "What is the warranty period?",
    answer: "Warranty periods vary by service type. CCTV installations typically come with 1 year warranty on parts and labor. Check your service details for specific warranty information.",
  },
  {
    question: "How can I track my service request?",
    answer: "You can track your service requests in the 'My Services' section of your dashboard. You'll see real-time updates on the status, assigned technician, and scheduled visit times.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery (for certain services). Payment options are available during checkout.",
  },
  {
    question: "How do I raise a complaint?",
    answer: "You can raise a complaint by going to 'Raise Complaint' in your dashboard, selecting the service/warranty, describing the issue, and submitting. Our support team will respond within 24 hours.",
  },
  {
    question: "Can I reschedule my service appointment?",
    answer: "Yes, you can reschedule your appointment by contacting the assigned technician or through the service details page. Please provide at least 24 hours notice.",
  },
  {
    question: "What should I do if I'm not satisfied with the service?",
    answer: "Please raise a complaint through your dashboard. Our support team will review your case and work with you to resolve the issue. You can also rate the service after completion.",
  },
];

export function SupportHelp() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert("Contact form submission will be implemented soon");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support & Help</h1>
        <p className="text-gray-600">Get assistance with your services and account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowContactForm(true)}>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Chat Support</CardTitle>
            <CardDescription>Get instant help via chat</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Call Support</CardTitle>
            <CardDescription>
              <a href="tel:+919876543210" className="text-blue-600 hover:underline">
                +91 98765 43210
              </a>
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle>Email Support</CardTitle>
            <CardDescription>
              <a href="mailto:support@dgyard.com" className="text-blue-600 hover:underline">
                support@dgyard.com
              </a>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Find answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="p-4 pt-0 text-sm text-gray-600 border-t">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quick Links
            </CardTitle>
            <CardDescription>Important pages and resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/complaints/new" className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Raise a Complaint</div>
                <div className="text-sm text-gray-600">Report an issue with your service</div>
              </Link>
              <Link href="/dashboard/warranties" className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">View Warranties</div>
                <div className="text-sm text-gray-600">Check your warranty coverage</div>
              </Link>
              <Link href="/dashboard/services" className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Track Services</div>
                <div className="text-sm text-gray-600">View your service requests</div>
              </Link>
              <Link href="/terms-and-conditions" className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium flex items-center gap-2">
                  Terms & Conditions
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="text-sm text-gray-600">Read our terms of service</div>
              </Link>
              <Link href="/privacy-policy" className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium flex items-center gap-2">
                  Privacy Policy
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="text-sm text-gray-600">Learn about our privacy practices</div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {showContactForm && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>Send us a message and we'll get back to you</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Message *</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Send Message</Button>
                <Button type="button" variant="outline" onClick={() => setShowContactForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





