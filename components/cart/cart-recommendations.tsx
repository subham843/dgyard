"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
  brand?: { name: string };
  categoryRelation?: { name: string };
  reason?: string;
}

export function CartRecommendations() {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    const fetchRecommendations = async () => {
      try {
        const response = await fetch("/api/cart/recommendations");
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [session]);

  if (!session || loading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Recommended for You
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/products/${product.slug || product.id}`}>
                <div className="relative h-48 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <ShoppingCart className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {product.reason && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                      {product.reason}
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">
                    {product.brand?.name || "Product"}
                  </p>
                  <Link href={`/products/${product.slug || product.id}`}>
                    <h4 className="font-semibold text-sm text-gray-900 hover:text-purple-600 transition-colors line-clamp-2">
                      {product.name}
                    </h4>
                  </Link>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <Button size="sm" asChild>
                    <Link href={`/products/${product.slug || product.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}












