import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | D.G.Yard",
  description: "Learn about D.G.Yard's cancellation and refund policy. Understand your rights for order cancellation and refund requests within 24-48 hours.",
  keywords: "cancellation policy, refund policy, return policy, order cancellation, refund request, D.G.Yard",
  openGraph: {
    title: "Cancellation & Refund Policy | D.G.Yard",
    description: "Learn about D.G.Yard's cancellation and refund policy.",
    type: "website",
  },
};

export default function CancellationRefundPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">
              Cancellation & Refund Policy
            </h1>
            <p className="text-gray-600 text-sm">
              Last Updated: {lastUpdated}
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <p className="text-gray-700 leading-relaxed">
              This policy applies to all payments, regardless of payment method (UPI, card, net banking, wallet, cash, or any third-party gateway).
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6">
            {/* Section 1: Order Cancellation */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                1. Order Cancellation
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Customers may request cancellation within <strong>24 hours</strong> of placing an order.
                </p>
                <div>
                  <p className="font-semibold mb-2">Cancellation is not allowed if:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>The order is already shipped</li>
                    <li>A technician has been assigned</li>
                    <li>Service work has started</li>
                  </ul>
                </div>
                <p>
                  For service bookings, cancellation is allowed only before technician assignment.
                </p>
              </div>
            </section>

            {/* Section 2: Refund Request Time */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                2. Refund Request Time
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Refund requests must be raised within <strong>48 hours</strong> of:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cancellation confirmation, or</li>
                  <li>Product delivery (in case of damaged/incorrect items)</li>
                </ul>
                <p className="text-red-600 font-semibold">
                  Requests beyond this time window will not be eligible for refund.
                </p>
              </div>
            </section>

            {/* Section 3: Refund Processing Time */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                3. Refund Processing Time
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Approved refunds will be processed within <strong>5–7 working days</strong>.
                </p>
                <p>
                  Refunds will be issued via:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Original payment method, OR</li>
                  <li>Platform wallet / ledger (if applicable)</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Non-Refundable Scenarios */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                4. Non-Refundable Scenarios
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Refunds will not be applicable in cases including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Change of mind after processing</li>
                  <li>Partially or fully completed services</li>
                  <li>Customer unavailability or delay</li>
                  <li>Custom, special, or made-to-order products</li>
                  <li>Incorrect information provided by the customer</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Damaged / Incorrect Products */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                5. Damaged / Incorrect Products
              </h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Issues must be reported within <strong>24 hours</strong> of delivery.</li>
                  <li>Photo or video proof is mandatory.</li>
                  <li>After verification, refund or replacement will be initiated.</li>
                </ul>
              </div>
            </section>

            {/* Section 6: Contact & Support */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                6. Contact & Support
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>For cancellation or refund assistance:</p>
                <ul className="list-none space-y-2 ml-4">
                  <li>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:support@dgyard.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@dgyard.com
                    </a>
                  </li>
                  <li>
                    <strong>Website:</strong>{" "}
                    <a
                      href="https://www.dgyard.com"
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://www.dgyard.com
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7: Policy Updates */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                7. Policy Updates
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  D.G.Yard reserves the right to modify this policy at any time.
                </p>
                <p>
                  Updated terms will apply to future orders.
                </p>
              </div>
            </section>
          </div>

          {/* Footer Note */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This policy is payment-gateway independent and applies to all payment methods including UPI, cards, net banking, wallets, and cash payments.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}





