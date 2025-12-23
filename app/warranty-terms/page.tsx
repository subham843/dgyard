import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Warranty Terms - D.G.Yard",
  description: "Warranty terms and conditions for D.G.Yard services",
};

export default function WarrantyTermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Warranty Terms & Conditions</CardTitle>
              <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Warranty Coverage</h2>
                <p className="text-gray-700 mb-2">Our warranty covers:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Manufacturing defects in products and equipment</li>
                  <li>Installation defects and workmanship issues</li>
                  <li>Component failures under normal usage</li>
                  <li>Service-related issues within the warranty period</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Warranty Period</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>CCTV Installations:</strong> 1 year from date of completion</li>
                  <li><strong>Networking Services:</strong> 6 months from date of completion</li>
                  <li><strong>Repair Services:</strong> 3 months from date of repair</li>
                  <li><strong>Products:</strong> As per manufacturer warranty</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. What is NOT Covered</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Damage due to misuse, accidents, or negligence</li>
                  <li>Damage from natural disasters, fire, or water</li>
                  <li>Unauthorized modifications or repairs</li>
                  <li>Normal wear and tear</li>
                  <li>Consumables and accessories (unless specified)</li>
                  <li>Issues arising from improper maintenance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Warranty Claim Process</h2>
                <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>Raise a complaint through your dashboard or contact support</li>
                  <li>Provide details of the issue and warranty information</li>
                  <li>Our team will review and verify the warranty claim</li>
                  <li>If approved, we will schedule a service visit</li>
                  <li>Technician will assess and resolve the issue</li>
                  <li>Service completion will be confirmed with you</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Warranty Service</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Warranty services are provided free of charge</li>
                  <li>Replacement parts are covered under warranty</li>
                  <li>Labor charges are waived for warranty claims</li>
                  <li>Service response time: Within 48-72 hours</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Warranty Transfer</h2>
                <p className="text-gray-700">
                  Warranty is non-transferable and applies only to the original customer and service location.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Warranty Extension</h2>
                <p className="text-gray-700">
                  Extended warranty options may be available for purchase. Please contact our support team for details.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Documentation</h2>
                <p className="text-gray-700">
                  Keep your service completion certificate and warranty documents safe. These may be required for warranty claims.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Contact for Warranty Claims</h2>
                <p className="text-gray-700">
                  For warranty claims, please contact us at warranty@dgyard.com or call +91 98765 43210. You can also raise a complaint through your dashboard.
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





