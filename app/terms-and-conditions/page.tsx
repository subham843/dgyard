import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms & Conditions - D.G.Yard",
  description: "Terms and conditions for using D.G.Yard services",
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Terms & Conditions</CardTitle>
              <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700">
                  By accessing and using D.G.Yard services, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Service Booking</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Service bookings are subject to availability and confirmation</li>
                  <li>We reserve the right to reschedule or cancel bookings with prior notice</li>
                  <li>Cancellation policies apply as per the service type</li>
                  <li>Quotations are valid for 30 days from the date of issue</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Payment Terms</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Payment must be made as per the agreed terms</li>
                  <li>Advance payment may be required for certain services</li>
                  <li>Refunds are processed as per our refund policy</li>
                  <li>All prices are inclusive of applicable taxes unless stated otherwise</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Warranty & Service</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Warranty terms vary by service type and are mentioned in the service agreement</li>
                  <li>Warranty covers manufacturing defects and installation issues</li>
                  <li>Warranty does not cover damage due to misuse, accidents, or natural disasters</li>
                  <li>Service requests must be raised within the warranty period</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Customer Responsibilities</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide accurate information during booking</li>
                  <li>Ensure access to the service location at scheduled times</li>
                  <li>Follow usage guidelines provided by technicians</li>
                  <li>Report issues promptly within warranty period</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
                <p className="text-gray-700">
                  D.G.Yard shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
                <p className="text-gray-700">
                  We reserve the right to modify these terms at any time. Continued use of services after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
                <p className="text-gray-700">
                  For questions about these Terms & Conditions, please contact us at support@dgyard.com or call +91 98765 43210.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}





