import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy - D.G.Yard",
  description: "Privacy policy for D.G.Yard services",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="text-gray-700 mb-2">We collect the following types of information:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Personal Information:</strong> Name, email, phone number, address</li>
                  <li><strong>Service Information:</strong> Booking details, service history, warranty information</li>
                  <li><strong>Payment Information:</strong> Payment method details (processed securely through payment gateways)</li>
                  <li><strong>Usage Data:</strong> How you interact with our website and services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>To provide and maintain our services</li>
                  <li>To process your bookings and orders</li>
                  <li>To communicate with you about your services</li>
                  <li>To send notifications and updates</li>
                  <li>To improve our services and user experience</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Data Sharing</h2>
                <p className="text-gray-700 mb-2">We do not sell your personal information. We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Service technicians assigned to your bookings</li>
                  <li>Payment processors for transaction processing</li>
                  <li>Legal authorities when required by law</li>
                  <li>Service providers who assist in our operations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="text-gray-700">
                  We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
                <p className="text-gray-700 mb-2">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
                <p className="text-gray-700">
                  We use cookies to enhance your experience. You can control cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Third-Party Links</h2>
                <p className="text-gray-700">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
                <p className="text-gray-700">
                  Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Changes to Privacy Policy</h2>
                <p className="text-gray-700">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
                <p className="text-gray-700">
                  If you have questions about this Privacy Policy, please contact us at privacy@dgyard.com or call +91 98765 43210.
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





