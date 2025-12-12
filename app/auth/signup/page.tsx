import { Metadata } from "next";
import { SignUpForm } from "@/components/auth/signup-form";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Sign Up - D.G.Yard",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center py-12">
        <SignUpForm />
      </main>
      <Footer />
    </>
  );
}

