import { Metadata } from "next";
import { ProductDetail } from "@/components/products/product-detail";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { generateProductSchema } from "@/lib/schema-markup";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    
    if (!id) {
      return {
        title: "Product Not Found - D.G.Yard",
        description: "The requested product could not be found.",
      };
    }

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Try to find by slug first (most common case), then by ID
    let product = null;
    
    if (!isValidObjectId) {
      // If not a valid ObjectId, it's likely a slug
      product = await prisma.product.findUnique({
        where: { slug: id },
      });
    } else {
      // If it's a valid ObjectId, try both ID and slug
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { id },
            { slug: id },
          ],
        },
      });
    }

  if (!product) {
    return {
        title: "Product Not Found - D.G.Yard",
        description: "The requested product could not be found.",
    };
  }

  return {
    title: `${product.name} - D.G.Yard`,
    description: product.description,
  };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Product - D.G.Yard",
      description: "View our product details",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;

    if (!id) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <a href="/products" className="text-primary-blue hover:underline">
              Back to Products
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Try to find by slug first (most common case), then by ID
    let product = null;
    
    if (!isValidObjectId) {
      // If not a valid ObjectId, it's likely a slug
      product = await prisma.product.findUnique({
        where: { slug: id },
      });
    } else {
      // If it's a valid ObjectId, try both ID and slug
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { id },
            { slug: id },
          ],
        },
      });
    }

    if (!product) {
      return (
        <>
          <Header />
          <main className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
              <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
              <a href="/products" className="text-primary-blue hover:underline">
                Back to Products
              </a>
            </div>
          </main>
          <Footer />
        </>
      );
    }

  const schema = generateProductSchema({
    name: product.name,
    description: product.description,
    price: product.price,
    sku: product.sku || undefined,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <ProductDetail product={product} />
      </main>
      <Footer />
    </>
  );
  } catch (error: any) {
    console.error("Error fetching product:", error);
    console.error("Error details:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Product</h1>
            <p className="text-gray-600 mb-4">
              Something went wrong while loading the product.
              {process.env.NODE_ENV === "development" && error?.message && (
                <span className="block mt-2 text-sm text-red-600">{error.message}</span>
              )}
            </p>
            <a href="/products" className="text-primary-blue hover:underline">
              Back to Products
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }
}

