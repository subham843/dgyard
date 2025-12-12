import { Metadata } from "next";
import { SignInForm } from "@/components/auth/signin-form";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Sign In - D.G.Yard",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center py-12">
        <SignInForm />
      </main>
      <Footer />
    </>
  );
}

