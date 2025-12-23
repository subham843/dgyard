"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Search, Filter, Edit, Eye, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Link from "next/link";

export function DealerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products?limit=100");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === "all" || 
      (filter === "active" && product.active) ||
      (filter === "inactive" && !product.active);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
            <p className="text-sm text-gray-600 mt-1">
              Browse and manage available products for your business
            </p>
          </div>
          <Button
            onClick={() => toast.info("Product creation feature will be available soon. Contact admin to add products.")}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Request Product Addition
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search products by name, SKU, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              onClick={() => setFilter("active")}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={filter === "inactive" ? "default" : "outline"}
              onClick={() => setFilter("inactive")}
              size="sm"
            >
              Inactive
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium mb-2">
            {searchQuery || filter !== "all" 
              ? "No products found matching your criteria" 
              : "No products available"
            }
          </p>
          <p className="text-sm text-gray-500">
            {searchQuery || filter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Products will appear here once they are added to the catalog"
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {product.name}
                      </h3>
                      {!product.active && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    {product.sku && (
                      <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                    )}
                  </div>
                </div>

                {product.images && product.images.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-square">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description || "No description available"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₹{product.price?.toLocaleString("en-IN") || "N/A"}
                    </p>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{product.comparePrice.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/products/${product.slug || product.id}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {product.brand && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Brand: <span className="font-medium text-gray-700">{product.brand.name}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Product Management
                </p>
                <p className="text-xs text-blue-700">
                  To add or modify products, please contact the admin. You can view and browse all available products here.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
