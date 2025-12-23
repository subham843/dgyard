import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/hero";

// Lazy load below-the-fold components for faster initial page load
const HowWeWork = dynamic(() => import("@/components/sections/how-we-work").then(mod => ({ default: mod.HowWeWork })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Offers = dynamic(() => import("@/components/sections/offers").then(mod => ({ default: mod.Offers })), {
  loading: () => <div className="min-h-[300px]" />,
});

const Calculator = dynamic(() => import("@/components/sections/calculator").then(mod => ({ default: mod.Calculator })), {
  loading: () => <div className="min-h-[500px]" />,
});

const Products = dynamic(() => import("@/components/sections/products").then(mod => ({ default: mod.Products })), {
  loading: () => <div className="min-h-[600px]" />,
});

const ProductCategories = dynamic(() => import("@/components/sections/product-categories").then(mod => ({ default: mod.ProductCategories })), {
  loading: () => <div className="min-h-[400px]" />,
});

const TrustedBrands = dynamic(() => import("@/components/sections/trusted-brands").then(mod => ({ default: mod.TrustedBrands })), {
  loading: () => <div className="min-h-[300px]" />,
});

const Services = dynamic(() => import("@/components/sections/services").then(mod => ({ default: mod.Services })), {
  loading: () => <div className="min-h-[500px]" />,
});

const Features = dynamic(() => import("@/components/sections/features").then(mod => ({ default: mod.Features })), {
  loading: () => <div className="min-h-[400px]" />,
});

const BookService = dynamic(() => import("@/components/sections/book-service").then(mod => ({ default: mod.BookService })), {
  loading: () => <div className="min-h-[300px]" />,
});

const MarketingAudit = dynamic(() => import("@/components/sections/marketing-audit").then(mod => ({ default: mod.MarketingAudit })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Testimonials = dynamic(() => import("@/components/sections/testimonials").then(mod => ({ default: mod.Testimonials })), {
  loading: () => <div className="min-h-[400px]" />,
});

const MeetHoney = dynamic(() => import("@/components/sections/meet-honey").then(mod => ({ default: mod.MeetHoney })), {
  loading: () => <div className="min-h-[300px]" />,
});

const CTA = dynamic(() => import("@/components/sections/cta").then(mod => ({ default: mod.CTA })), {
  loading: () => <div className="min-h-[200px]" />,
});

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

