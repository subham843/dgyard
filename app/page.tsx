import { Hero } from "@/components/sections/hero";
import { HowWeWork } from "@/components/sections/how-we-work";
import { Offers } from "@/components/sections/offers";
import { Features } from "@/components/sections/features";
import { Products } from "@/components/sections/products";
import { Services } from "@/components/sections/services";
import { ProductCategories } from "@/components/sections/product-categories";
import { TrustedBrands } from "@/components/sections/trusted-brands";
import { Calculator } from "@/components/sections/calculator";
import { Testimonials } from "@/components/sections/testimonials";
import { MeetHoney } from "@/components/sections/meet-honey";
import { MarketingAudit } from "@/components/sections/marketing-audit";
import { BookService } from "@/components/sections/book-service";
import { CTA } from "@/components/sections/cta";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <HowWeWork />
        <Offers />
        <Calculator />
        <Products />
        <ProductCategories />
        <TrustedBrands />
        <Services />
        <Features />
        <BookService />
        <MarketingAudit />
        <Testimonials />
        <MeetHoney />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

