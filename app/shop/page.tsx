import { Metadata } from "next";
import { ProductListing } from "@/components/products/product-listing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Shop - Premium CCTV Cameras & Security Solutions | D.G.Yard",
  description: "Browse our complete range of CCTV cameras, security systems, networking products, and accessories. Smart filters, AI recommendations, and world-class shopping experience.",
};

export default function ShopPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <ProductListing />
      </main>
      <Footer />
    </>
  );
}

