export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "D.G.Yard",
    url: process.env.APP_URL || "http://localhost:3000",
    logo: `${process.env.APP_URL || "http://localhost:3000"}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-98765-43210",
      contactType: "Customer Service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      "https://www.facebook.com/dgyard",
      "https://www.twitter.com/dgyard",
      "https://www.instagram.com/dgyard",
    ],
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  image?: string;
  sku?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      url: `${process.env.APP_URL || "http://localhost:3000"}/products/${product.sku}`,
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  provider: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: service.provider,
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOfferSchema(offer: {
  title: string;
  description: string;
  category: string;
  image?: string;
  discount?: number;
  originalPrice?: number;
  offerPrice?: number;
  validFrom?: string;
  validUntil?: string;
  ctaLink?: string;
}) {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: offer.title,
    description: offer.description,
    image: offer.image,
    category: offer.category === "CCTV" ? "Security Systems" : "Digital Marketing Services",
    priceSpecification: offer.offerPrice ? {
      "@type": "UnitPriceSpecification",
      priceCurrency: "INR",
      price: offer.offerPrice,
      ...(offer.originalPrice && {
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: offer.originalPrice,
        },
      }),
    } : undefined,
    ...(offer.discount && {
      discount: {
        "@type": "PriceSpecification",
        price: offer.discount,
        priceCurrency: "INR",
      },
    }),
    ...(offer.validFrom && {
      availabilityStarts: offer.validFrom,
    }),
    ...(offer.validUntil && {
      availabilityEnds: offer.validUntil,
    }),
    url: offer.ctaLink ? `${baseUrl}${offer.ctaLink}` : baseUrl,
    seller: {
      "@type": "Organization",
      name: "D.G.Yard",
    },
  };
}



















