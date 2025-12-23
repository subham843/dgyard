"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { Search, Filter, Grid, List, Camera, X, SlidersHorizontal, Sparkles, ArrowRight, Heart, Star, ShoppingBag, ChevronDown, Check, Clock, Bot, Tag, Award, TrendingUp, MessageCircle, HelpCircle, Phone, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";
import { HeroBanner } from "@/components/shop/hero-banner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Product Image Component with proper error handling
const ProductImage = ({ 
  src, 
  alt, 
  fill = false, 
  width, 
  height, 
  className = "",
  sizes
}: { 
  src: string | null | undefined; 
  alt: string; 
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false); // Reset error when src changes
  }, [src]);

  if (!src || imageError) {
    if (fill) {
      return (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}>
          <Camera className="w-12 h-12 text-gray-300" />
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className}`} style={{ width, height }}>
        <Camera className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  // Check if this is a local upload path that might not exist
  const isLocalUpload = src && src.startsWith('/uploads');
  
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        loading="lazy"
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        unoptimized={isLocalUpload} // Skip optimization for local uploads to prevent 404 errors
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      unoptimized={isLocalUpload} // Skip optimization for local uploads to prevent 404 errors
      onError={() => {
        setImageError(true);
      }}
    />
  );
};

export function ProductListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);
  const [sortBy, setSortBy] = useState("newest");
  const [brands, setBrands] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [comparedProducts, setComparedProducts] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [shopPageDeals, setShopPageDeals] = useState<any[]>([]);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Fetch categories, brands, and recommendations
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchBrands = async () => {
      try {
        const response = await fetch("/api/brands");
        const data = await response.json();
        if (data.brands) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };

    const fetchRecommended = async () => {
      try {
        const response = await fetch("/api/products?featured=true&limit=6");
        const data = await response.json();
        if (data.products) {
          setRecommendedProducts(data.products);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    const loadRecentlyViewed = () => {
      const viewed = localStorage.getItem("recentlyViewed");
      if (viewed) {
        try {
          setRecentlyViewed(JSON.parse(viewed).slice(0, 6));
        } catch (e) {
          console.error("Error loading recently viewed:", e);
        }
      }
    };

    const fetchShopPageDeals = async () => {
      try {
        // Fetch active featured offers for shop page (max 3)
        const response = await fetch("/api/offers?active=true&featured=true");
        const data = await response.json();
        if (data.offers && data.offers.length > 0) {
          setShopPageDeals(data.offers.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching shop page deals:", error);
      }
    };

    fetchCategories();
    fetchBrands();
    fetchRecommended();
    loadRecentlyViewed();
    fetchShopPageDeals();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categorySlug, search, page, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categorySlug) params.append("category", categorySlug);
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("limit", "12");
      
      // Sort parameter
      if (sortBy) {
        params.append("sort", sortBy);
      }

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      let fetchedProducts = data.products || [];
      
      // Client-side sorting if API doesn't support it
      if (sortBy === "price-low") {
        fetchedProducts.sort((a: any, b: any) => a.price - b.price);
      } else if (sortBy === "price-high") {
        fetchedProducts.sort((a: any, b: any) => b.price - a.price);
      } else if (sortBy === "newest") {
        fetchedProducts.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
      
      setProducts(fetchedProducts);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalProducts(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    if (categorySlug) params.append("category", categorySlug);
    if (search) params.append("search", search);
      router.push(`/shop?${params.toString()}`);
    fetchProducts();
  };

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    setPage(1);
    const params = new URLSearchParams();
    if (slug) params.append("category", slug);
    if (search) params.append("search", search);
    router.push(`/shop?${params.toString()}`);
  };

  const clearFilters = () => {
    setCategorySlug("");
    setSearch("");
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setPage(1);
    router.push("/shop");
    fetchProducts();
  };

  const handleAddToRecentlyViewed = (product: any) => {
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    const updated = [product, ...viewed.filter((p: any) => p.id !== product.id)].slice(0, 10);
    localStorage.setItem("recentlyViewed", JSON.stringify(updated));
    setRecentlyViewed(updated.slice(0, 6));
  };

  const handleCompareToggle = (productId: string) => {
    if (comparedProducts.includes(productId)) {
      setComparedProducts(comparedProducts.filter(id => id !== productId));
    } else if (comparedProducts.length < 3) {
      setComparedProducts([...comparedProducts, productId]);
    } else {
      // Replace oldest with new one
      setComparedProducts([...comparedProducts.slice(1), productId]);
    }
  };

  return (
    <div ref={ref} className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        {/* Advanced Filters Sidebar - Mobile Toggle */}
        <div className="lg:hidden mb-6">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-serif"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters & Sort"}
          </Button>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-8">
          {/* Advanced Filters Sidebar - Desktop */}
          <AnimatePresence>
            {(showFilters || isDesktop) && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`${
                  isDesktop ? "block" : showFilters ? "block" : "hidden"
                } w-full lg:w-80 flex-shrink-0`}
              >
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-serif font-bold text-gray-900">Filters</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-sm font-serif"
                      >
                        Clear All
                      </Button>
                      {!isDesktop && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowFilters(false)}
                          className="lg:hidden"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <Label className="font-serif font-semibold text-gray-900 mb-3 block">
                      Price Range
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="font-serif"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="font-serif"
                      />
                    </div>
                  </div>

                  {/* Brand Filter */}
                  {brands.length > 0 && (
                    <div className="mb-6">
                      <Label className="font-serif font-semibold text-gray-900 mb-3 block">
                        Brands
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map((brand) => (
                          <label
                            key={brand.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand.slug)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBrands([...selectedBrands, brand.slug]);
                                } else {
                                  setSelectedBrands(selectedBrands.filter(b => b !== brand.slug));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-serif text-gray-700">{brand.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Camera Resolution */}
                  <div className="mb-6">
                    <Label className="font-serif font-semibold text-gray-900 mb-3 block">
                      Resolution
                    </Label>
                    <div className="space-y-2">
                      {["2MP", "4MP", "5MP", "8MP"].map((res) => (
                        <label key={res} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm font-serif text-gray-700">{res}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Camera Type */}
                  <div className="mb-6">
                    <Label className="font-serif font-semibold text-gray-900 mb-3 block">
                      Camera Type
                    </Label>
                    <div className="space-y-2">
                      {["Dome", "Bullet", "PTZ", "Wireless"].map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm font-serif text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* AI Features */}
                  <div className="mb-6">
                    <Label className="font-serif font-semibold text-gray-900 mb-3 block">
                      AI Features
                    </Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm font-serif text-gray-700">Honey Recommended</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm font-serif text-gray-700">Popular Picks</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm font-serif text-gray-700">Best for Home</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm font-serif text-gray-700">Best for Offices</span>
                      </label>
                    </div>
                  </div>

                  {/* Warranty Filter */}
                  <div>
                    <Label className="font-serif font-semibold text-gray-900 mb-3 block">
                      Warranty
                    </Label>
                    <div className="space-y-2">
                      {["1 Year", "2 Years", "3+ Years"].map((warranty) => (
                        <label key={warranty} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm font-serif text-gray-700">{warranty}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
        {/* Hero Banner */}
        <HeroBanner
          title="Shop the Best in Security & Tech"
          subtitle="Discover top-quality products designed for your home, office, and industry."
          ctaText1="Shop Now"
          ctaLink1="/shop"
          ctaText2="View Offers"
          ctaLink2="/shop?featured=true"
          countdown="Offer ends in 48 hours"
        />


        {/* AI Helper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
      <InlineAIHelper
        context="selecting products"
        suggestions={[
          "Which camera is best for indoor?",
          "What's the difference between dome and bullet cameras?",
          "Help me choose the right resolution",
          "What products fit my budget?"
        ]}
        position="top"
      />
        </motion.div>

        {/* Search and Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mb-8 space-y-6"
        >
          <div className="mb-6">
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Filter Your Search</h3>
            <p className="text-gray-600 font-serif">Refine products by price, brand, features, and more.</p>
            <div className="w-24 h-1 bg-gray-900 mt-4"></div>
          </div>
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
                placeholder="Search products, brands, or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-32 py-6 text-base font-serif border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:ring-0 bg-white shadow-sm"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-900 hover:bg-gray-800 text-white font-serif rounded-md px-6"
              >
                Search
              </Button>
          </div>
        </form>

          {/* Category Filters & View Toggle */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <Button
                variant="outline"
                onClick={clearFilters}
                className={`font-serif border-2 rounded-md transition-all ${
                  !categorySlug && !search
                    ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                All Products
              </Button>
          {categories.map((cat) => (
            <Button
                  key={cat.id}
                  variant="outline"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`font-serif border-2 rounded-md transition-all ${
                    categorySlug === cat.slug
                      ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
            </Button>
          ))}
        </div>

            {/* Sort & View Toggle & Results Count */}
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm text-gray-600 font-serif hidden sm:block">
                {totalProducts} {totalProducts === 1 ? "product" : "products"} found
              </p>
              
              {/* Sort Options */}
              <div className="flex flex-col gap-2">
                <div className="text-sm font-serif font-semibold text-gray-700">Sort Products</div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] font-serif border-2 border-gray-300">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">New Arrivals</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                    <SelectItem value="featured">Honey Pick (AI)</SelectItem>
                    <SelectItem value="popular">Best Selling</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 font-serif">View items by popularity, price, or newest arrivals.</p>
              </div>

              <div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg p-1 bg-white">
            <Button
                  variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
                  className={`rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "hover:bg-gray-100"
                  }`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
                  variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
                  className={`rounded-md transition-all ${
                    viewMode === "list"
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "hover:bg-gray-100"
                  }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

          {/* Active Filters */}
          {(categorySlug || search) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-serif text-gray-600">Active filters:</span>
              {categorySlug && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-serif"
                >
                  <span>{categories.find(c => c.slug === categorySlug)?.name || categorySlug}</span>
                  <button
                    onClick={() => handleCategoryChange("")}
                    className="hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
              {search && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-serif"
                >
                  <span>"{search}"</span>
                  <button
                    onClick={() => {
                      setSearch("");
                      const params = new URLSearchParams();
                      if (categorySlug) params.append("category", categorySlug);
                      router.push(`/shop?${params.toString()}`);
                    }}
                    className="hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Smart Category Navigation */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.65 }}
            className="mb-12"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Browse by Category</h3>
              <p className="text-gray-600 font-serif">Find exactly what you need — organized for quick and easy shopping.</p>
              <div className="w-24 h-1 bg-gray-900 mt-4"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className="group"
                >
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-900 transition-all hover:shadow-lg text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                      <Tag className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-sm font-serif font-semibold text-gray-900 group-hover:text-gray-700">
                      {cat.name}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Brands Slider */}
        {brands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7 }}
            className="mb-12"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Award className="w-6 h-6 text-gray-700" />
                Shop by Brand
              </h3>
              <p className="text-gray-600 font-serif">Trusted brands that deliver performance and durability.</p>
              <div className="w-24 h-1 bg-gray-900 mt-4"></div>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/shop?brand=${brand.slug}`}
                  className="flex-shrink-0 group"
                >
                  <div className="w-32 h-20 bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center hover:border-gray-900 transition-all hover:shadow-lg">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={100}
                        height={60}
                        className="object-contain max-h-12 opacity-70 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <span className="text-sm font-serif font-semibold text-gray-700">{brand.name}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

      {/* Products Grid/List */}
      <div className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.75 }}
          className="mb-6"
        >
          <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">All Products</h3>
          <p className="text-gray-600 font-serif">High-quality, reliable tech — selected for every type of space.</p>
          <div className="w-24 h-1 bg-gray-900 mt-4"></div>
        </motion.div>
      
      {loading ? (
          <div className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}>
          {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border-2 border-gray-200 p-6 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 md:py-24"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Camera className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 font-serif mb-6">Try adjusting your filters or search terms</p>
            <Button
              onClick={clearFilters}
              className="bg-gray-900 hover:bg-gray-800 text-white font-serif"
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group relative"
              >
                <Link 
                  href={`/products/${product.id}`}
                  onClick={() => handleAddToRecentlyViewed(product)}
                >
                  <div className="relative bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-gray-900 shadow-md hover:shadow-2xl transition-all duration-500 h-full flex flex-col hover:-translate-y-2">
                    {/* Top Accent Bar */}
                    <div className="h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent"
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                          delay: index * 0.3,
                        }}
                      />
                    </div>

                    {/* Product Image */}
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {/* Discount Badge */}
                  {product.comparePrice && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-serif font-bold shadow-lg">
                      {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                    </div>
                  )}

                      {/* Featured Badge */}
                      {product.featured && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-serif font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </div>
                      )}

                      {/* Honey AI Badge - Show separately from Featured */}
                      {product.featured && (
                        <div className="absolute bottom-3 left-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-serif font-bold flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          Honey Pick
                        </div>
                      )}

                      {/* Compare Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCompareToggle(product.id);
                        }}
                        className={`absolute top-3 left-3 p-2 rounded-full transition-all ${
                          comparedProducts.includes(product.id)
                            ? "bg-blue-500 text-white"
                            : "bg-white/90 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                </div>

                    {/* Product Info */}
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-xs text-gray-500 font-serif mb-2 uppercase tracking-wide">
                        {product.category || "Product"}
                      </p>
                      <h3 className="text-lg font-serif font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                  </h3>
                      
                      {/* Short Spec Line */}
                      {product.description && (
                        <p className="text-xs text-gray-600 font-serif mb-3 line-clamp-1">
                          {product.description.length > 50 
                            ? product.description.substring(0, 50) + "..." 
                            : product.description}
                        </p>
                      )}
                      
                      {/* Price */}
                      <div className="flex items-center gap-3 mb-4 mt-auto">
                        <span className="text-2xl font-serif font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.comparePrice && (
                          <span className="text-lg text-gray-400 line-through font-serif">
                        {formatPrice(product.comparePrice)}
                      </span>
                    )}
                  </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < 4
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(4.0)</span>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-gray-700 font-serif font-semibold text-sm group-hover:text-gray-900 transition-colors">
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <Button
                          size="sm"
                          className="bg-gray-900 hover:bg-gray-800 text-white font-serif"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Add to cart logic here
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-full -mr-8 -mt-8" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
                initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-900 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 hover:-translate-y-1">
                    {/* Product Image */}
                    <div className="relative w-full md:w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-serif mb-2 uppercase tracking-wide">
                          {product.category || "Product"}
                        </p>
                        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-gray-600 font-serif mb-4 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                          <span className="text-3xl font-serif font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.comparePrice && (
                            <span className="text-xl text-gray-400 line-through font-serif">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </div>
                        <div className="flex items-center gap-2 text-gray-700 font-serif font-semibold group-hover:text-gray-900 transition-colors">
                          <span>View Details</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center items-center gap-2 mt-12 flex-wrap"
          >
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
              className="font-serif border-2 border-gray-300 hover:border-gray-900 disabled:opacity-50"
          >
            Previous
          </Button>
            {[...Array(Math.min(totalPages, 10))].map((_, i) => {
              const pageNum = i + 1;
              if (totalPages > 10) {
                // Show first, last, and pages around current
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 2 && pageNum <= page + 2)) {
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      onClick={() => setPage(pageNum)}
                      className={`font-serif border-2 ${
                        page === pageNum
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-300 hover:border-gray-900"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                }
                return null;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  onClick={() => setPage(pageNum)}
                  className={`font-serif border-2 ${
                    page === pageNum
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 hover:border-gray-900"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="font-serif border-2 border-gray-300 hover:border-gray-900 disabled:opacity-50"
            >
              Next
            </Button>
          </motion.div>
        )}
      </div>

        {/* AI Recommendations Section */}
        {recommendedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.9 }}
            className="mt-16 mb-12"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-serif font-bold text-gray-900">Honey's Smart Picks for You</h3>
              </div>
              <p className="text-gray-600 font-serif">AI-recommended products based on quality, value, and performance.</p>
              <div className="w-24 h-1 bg-gray-900 mt-4"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 p-4 transition-all hover:shadow-lg">
                    <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        width={100}
                        height={100}
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <h4 className="text-sm font-serif font-semibold text-gray-900 line-clamp-2 mb-2">{product.name}</h4>
                    <p className="text-lg font-serif font-bold text-gray-900">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1 }}
            className="mt-16 mb-12"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Recently Viewed Items</h3>
              <p className="text-gray-600 font-serif">Pick up right where you left off.</p>
              <div className="w-24 h-1 bg-gray-900 mt-4"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentlyViewed.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-900 p-4 transition-all hover:shadow-lg">
                    <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        width={100}
                        height={100}
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <h4 className="text-sm font-serif font-semibold text-gray-900 line-clamp-2 mb-2">{product.name}</h4>
                    <p className="text-lg font-serif font-bold text-gray-900">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comparison Tool - Fixed Button */}
        {comparedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Button
              onClick={() => setShowComparison(!showComparison)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-serif shadow-lg rounded-full px-6"
            >
              Compare ({comparedProducts.length})
            </Button>
          </motion.div>
        )}

        {/* Comparison Modal */}
        <AnimatePresence>
          {showComparison && comparedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowComparison(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Compare Products</h3>
                    <p className="text-gray-600 font-serif text-sm">See the differences clearly and choose the perfect fit.</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowComparison(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left p-4 font-serif font-bold text-gray-900">Features</th>
                        {products.filter(p => comparedProducts.includes(p.id)).map((product) => (
                          <th key={product.id} className="text-center p-4 font-serif font-semibold text-gray-900 min-w-[200px]">
                            <div className="flex flex-col items-center gap-2">
                              <ProductImage
                                src={product.image}
                                alt={product.name}
                                width={80}
                                height={80}
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <span>{product.name}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompareToggle(product.id)}
                                className="mt-2"
                              >
                                Remove
                              </Button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 font-serif font-semibold text-gray-700">Price</td>
                        {products.filter(p => comparedProducts.includes(p.id)).map((product) => (
                          <td key={product.id} className="p-4 text-center font-serif">
                            {formatPrice(product.price)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 font-serif font-semibold text-gray-700">Category</td>
                        {products.filter(p => comparedProducts.includes(p.id)).map((product) => (
                          <td key={product.id} className="p-4 text-center font-serif">
                            {product.category}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 font-serif font-semibold text-gray-700">Warranty</td>
                        {products.filter(p => comparedProducts.includes(p.id)).map((product) => (
                          <td key={product.id} className="p-4 text-center font-serif">
                            1 Year
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => setShowComparison(false)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-serif"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setComparedProducts([]);
                      setShowComparison(false);
                    }}
                    variant="outline"
                    className="font-serif"
                  >
                    Clear Comparison
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

          {/* Deals & Offers Zone */}
          {shopPageDeals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
              className="mb-12"
            >
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                      Today's Top Deals
                    </h3>
                    <p className="text-gray-600 font-serif">Limited-time offers on cameras, networking, and more.</p>
                  </div>
                  {shopPageDeals[0]?.validUntil && (
                    <div className="flex items-center gap-2 text-red-600 font-serif font-bold">
                      <Clock className="w-5 h-5" />
                      <span>
                        Ends in: {(() => {
                          const endDate = new Date(shopPageDeals[0].validUntil);
                          const now = new Date();
                          const diff = endDate.getTime() - now.getTime();
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}:${minutes.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {shopPageDeals.map((deal, index) => (
                    <Link
                      key={deal.id}
                      href={deal.ctaLink || "/shop"}
                      className="group"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.9 + index * 0.1 }}
                        className="bg-white rounded-lg border-2 border-red-200 hover:border-red-400 p-4 transition-all hover:shadow-lg"
                      >
                        <h4 className="font-serif font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                          {deal.title}
                        </h4>
                        <p className="text-gray-600 text-sm font-serif mb-2 line-clamp-2">
                          {deal.description}
                        </p>
                        {deal.discount ? (
                          <p className="text-2xl font-serif font-bold text-red-600">
                            {deal.discount}% OFF
                          </p>
                        ) : deal.offerPrice && deal.originalPrice ? (
                          <div>
                            <p className="text-2xl font-serif font-bold text-red-600">
                              {formatPrice(deal.offerPrice)}
                            </p>
                            <p className="text-sm text-gray-400 line-through">
                              {formatPrice(deal.originalPrice)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg font-serif font-bold text-red-600">
                            {deal.ctaText || "View Offer"}
                          </p>
                        )}
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* FAQ Section */}
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.1 }}
          className="mt-16 mb-12"
        >
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-gray-700" />
                Frequently Asked Questions
              </h3>
              <p className="text-gray-600 font-serif">Get clear answers to common product and service queries.</p>
              <div className="w-24 h-1 bg-gray-900 mt-4"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-serif font-semibold text-gray-900 mb-2">Do products include installation?</h4>
                <p className="text-gray-600 font-serif text-sm">Yes, professional installation services are available for all products. Contact us for details.</p>
              </div>
              <div>
                <h4 className="font-serif font-semibold text-gray-900 mb-2">What is the warranty?</h4>
                <p className="text-gray-600 font-serif text-sm">All products come with manufacturer warranty. Extended warranty options available.</p>
              </div>
              <div>
                <h4 className="font-serif font-semibold text-gray-900 mb-2">Do you offer COD?</h4>
                <p className="text-gray-600 font-serif text-sm">Yes, Cash on Delivery is available for select locations. Check at checkout.</p>
              </div>
              <div>
                <h4 className="font-serif font-semibold text-gray-900 mb-2">How long does delivery take?</h4>
                <p className="text-gray-600 font-serif text-sm">Standard delivery: 3-5 business days. Express delivery available for urgent orders.</p>
              </div>
            </div>
          </div>
        </motion.div>

          {/* Customer Support CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
            className="mt-16 mb-12"
          >
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl border-2 border-gray-200 p-8 md:p-12 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block mb-4"
              >
                <MessageCircle className="w-12 h-12 text-yellow-400 mx-auto" />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">Need Help?</h3>
              <p className="text-gray-200 font-serif mb-6 max-w-2xl mx-auto">
                Chat with Honey or connect with our support team instantly.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => {
                    const event = new CustomEvent("openHoneyChat");
                    window.dispatchEvent(event);
                  }}
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-serif font-bold"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Chat with Honey
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                >
                  <Link href="/contact" className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}
