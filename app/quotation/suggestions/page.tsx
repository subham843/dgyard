"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Eye, 
  Loader2, 
  Sparkles, 
  Camera, 
  HardDrive, 
  Zap, 
  CheckCircle2,
  Circle,
  Phone,
  CreditCard,
  Package,
  X,
  Check,
  ShoppingBag,
  Download
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  images: string[];
  brand: {
    id: string;
    name: string;
    logo?: string;
  };
  categoryRelation: {
    id: string;
    name: string;
  };
  subCategory?: {
    id: string;
    name: string;
  };
}

interface SelectedProduct extends Product {
  quantity: number;
}

interface Suggestions {
  indoorCameras: Product[];
  outdoorCameras: Product[];
  recordingDevices: Product[];
  hddStorage: Product[];
  powerSupply: Product[];
  accessories: any[];
}

export default function SuggestionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [suggestions, setSuggestions] = useState<Suggestions>({
    indoorCameras: [],
    outdoorCameras: [],
    recordingDevices: [],
    hddStorage: [],
    powerSupply: [],
    accessories: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [showCart, setShowCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [territoryCategories, setTerritoryCategories] = useState<any[]>([]);

  // Get filter params from URL
  const brandId = searchParams.get("brandId");
  const categoryId = searchParams.get("categoryId");
  const territoryCategoryId = searchParams.get("territoryCategoryId");
  const indoorCount = searchParams.get("indoorCount");
  const outdoorCount = searchParams.get("outdoorCount");

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;
    selectedProducts.forEach((product) => {
      total += product.price * product.quantity;
    });
    return total;
  }, [selectedProducts]);

  const totalItems = useMemo(() => {
    let count = 0;
    selectedProducts.forEach((product) => {
      count += product.quantity;
    });
    return count;
  }, [selectedProducts]);

  // Fetch brands, categories, and territory categories for display
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, categoriesRes, territoryRes] = await Promise.all([
          fetch("/api/quotation/brands"),
          fetch("/api/quotation/categories"),
          fetch("/api/quotation/territory-categories"),
        ]);

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData.brands || []);
        }
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }
        if (territoryRes.ok) {
          const territoryData = await territoryRes.json();
          setTerritoryCategories(territoryData.territoryCategories || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Fetch suggestions based on quotation parameters
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (brandId) params.append("brandId", brandId);
        if (categoryId) params.append("categoryId", categoryId);
        if (territoryCategoryId) params.append("territoryCategoryId", territoryCategoryId);
        if (indoorCount) params.append("indoorCount", indoorCount);
        if (outdoorCount) params.append("outdoorCount", outdoorCount);
        const hddId = searchParams.get("hddTerritoryCategoryId");
        const recordingDays = searchParams.get("recordingDays");
        const wiringMeters = searchParams.get("wiringMeters");
        if (hddId) params.append("hddTerritoryCategoryId", hddId);
        if (recordingDays) params.append("recordingDays", recordingDays);
        if (wiringMeters) params.append("wiringMeters", wiringMeters);

        const response = await fetch(`/api/quotation/suggestions?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || {
            indoorCameras: [],
            outdoorCameras: [],
            recordingDevices: [],
            hddStorage: [],
            powerSupply: [],
            accessories: [],
          });
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (brandId && categoryId && territoryCategoryId) {
      fetchSuggestions();
    } else {
      setLoading(false);
    }
  }, [brandId, categoryId, territoryCategoryId, indoorCount, outdoorCount, searchParams]);

  const selectedBrand = brands.find((b) => b.id === brandId);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedResolution = territoryCategories.find((tc) => tc.id === territoryCategoryId);

  // Get auto quantity based on product category
  // Only indoor and outdoor cameras get auto quantity, all other products get quantity 1
  const getAutoQuantity = (product: Product, category: string): number => {
    // Only for "Indoor Cameras" section
    if (category === "Indoor Cameras" && indoorCount) {
      const count = parseInt(indoorCount);
      return count > 0 ? count : 1;
    }
    // Only for "Outdoor Cameras" section
    if (category === "Outdoor Cameras" && outdoorCount) {
      const count = parseInt(outdoorCount);
      return count > 0 ? count : 1;
    }
    // All other products (Recording Devices, HDD, Power Supply, etc.) get quantity 1
    return 1;
  };

  // Toggle product selection with auto quantity
  const toggleProduct = (product: Product, category: string) => {
    // Check current state before update
    const isCurrentlySelected = selectedProducts.has(product.id);
    
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(product.id)) {
        newMap.delete(product.id);
      } else {
        const autoQuantity = getAutoQuantity(product, category);
        newMap.set(product.id, { ...product, quantity: autoQuantity });
      }
      return newMap;
    });

    // Show toast once after state update
    if (isCurrentlySelected) {
      toast.success(`${product.name} removed from selection`);
    } else {
      const autoQuantity = getAutoQuantity(product, category);
      toast.success(`${product.name} added to selection (Qty: ${autoQuantity})`);
    }
  };

  // Update quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      const product = newMap.get(productId);
      if (product) {
        newMap.set(productId, { ...product, quantity });
      }
      return newMap;
    });
  };

  // Remove product
  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      const product = newMap.get(productId);
      if (product) {
        newMap.delete(productId);
        toast.success(`${product.name} removed`);
      }
      return newMap;
    });
  };

  // Handle actions
  const handleAddToCart = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    // Check if user is logged in
    if (status === "unauthenticated" || !session) {
      toast.error("Please login to add items to cart");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setAddingToCart(true);
    try {
      // First, get current cart to check existing items
      const cartResponse = await fetch("/api/cart");
      const cartData = await cartResponse.ok ? await cartResponse.json() : { items: [] };
      const existingCartItems = cartData.items || [];

      // Add each product to cart
      const products = Array.from(selectedProducts.values());
      let successCount = 0;
      let errorCount = 0;

      for (const product of products) {
        try {
          // Check if product already exists in cart
          const existingItem = existingCartItems.find((item: any) => item.productId === product.id);
          
          if (existingItem) {
            // Update existing item with new quantity (replace, not add)
            const updateResponse = await fetch("/api/cart", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                itemId: existingItem.id,
                quantity: product.quantity, // Replace with new quantity
              }),
            });

            if (updateResponse.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            // Add new item to cart
            const response = await fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId: product.id,
                quantity: product.quantity,
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          }
        } catch (error) {
          console.error(`Error adding ${product.name} to cart:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} item(s) added to cart!`);
        // Trigger cart count update in header
        window.dispatchEvent(new Event("cartUpdated"));
        // Optionally redirect to cart page
        // router.push("/cart");
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} item(s) failed to add to cart`);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add items to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCheckout = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    // Check if user is logged in
    if (status === "unauthenticated" || !session) {
      toast.error("Please login to checkout");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setAddingToCart(true);
    try {
      // First, get current cart to check existing items
      const cartResponse = await fetch("/api/cart");
      const cartData = await cartResponse.ok ? await cartResponse.json() : { items: [] };
      const existingCartItems = cartData.items || [];

      // Add all products to cart
      const products = Array.from(selectedProducts.values());
      let successCount = 0;

      for (const product of products) {
        try {
          // Check if product already exists in cart
          const existingItem = existingCartItems.find((item: any) => item.productId === product.id);
          
          if (existingItem) {
            // Update existing item with new quantity (replace, not add)
            const updateResponse = await fetch("/api/cart", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                itemId: existingItem.id,
                quantity: product.quantity, // Replace with new quantity
              }),
            });

            if (updateResponse.ok) {
              successCount++;
            }
          } else {
            // Add new item to cart
            const response = await fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId: product.id,
                quantity: product.quantity,
              }),
            });

            if (response.ok) {
              successCount++;
            }
          }
        } catch (error) {
          console.error(`Error adding ${product.name} to cart:`, error);
        }
      }

      if (successCount > 0) {
        toast.success("Items added to cart, redirecting to checkout...");
        // Trigger cart count update in header
        window.dispatchEvent(new Event("cartUpdated"));
        // Redirect to checkout page
        router.push("/checkout");
      } else {
        toast.error("Failed to add items to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to proceed to checkout");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContactSales = () => {
    router.push("/contact?type=sales&products=" + Array.from(selectedProducts.keys()).join(","));
  };

  const handleDownloadQuotation = () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }
    
    // Prepare quotation data with quantities
    const quotationData = {
      products: Array.from(selectedProducts.values()).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        total: product.price * product.quantity,
      })),
      totalPrice: totalPrice,
      totalItems: totalItems,
      quotationParams: {
        brandId,
        categoryId,
        territoryCategoryId,
        indoorCount,
        outdoorCount,
      }
    };
    
    toast.success("Downloading quotation...");
    // Download quotation logic here
    // You can generate PDF or export data
    console.log("Quotation Data:", quotationData);
  };

  const handleSelectAll = (products: Product[], category: string) => {
    const newMap = new Map(selectedProducts);
    products.forEach((product) => {
      if (!newMap.has(product.id)) {
        const autoQuantity = getAutoQuantity(product, category);
        newMap.set(product.id, { ...product, quantity: autoQuantity });
      }
    });
    setSelectedProducts(newMap);
    toast.success(`All ${products.length} products selected`);
  };

  const handleDeselectAll = (products: Product[]) => {
    const newMap = new Map(selectedProducts);
    products.forEach((product) => {
      newMap.delete(product.id);
    });
    setSelectedProducts(newMap);
    toast.success("All products deselected");
  };

  const ProductCard = ({ product, index, category }: { product: Product; index: number; category: string }) => {
    const isSelected = selectedProducts.has(product.id);
    const selectedProduct = selectedProducts.get(product.id);
    const quantity = selectedProduct?.quantity || 1;

    return (
      <motion.div
        key={product.id}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          delay: index * 0.05,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        whileHover={{ y: -5, scale: 1.02 }}
        className={`relative bg-white rounded-3xl overflow-hidden border-2 transition-all duration-300 group ${
          isSelected 
            ? "border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30" 
            : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
        }`}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-4 left-4 z-10">
          <motion.button
            onClick={() => toggleProduct(product, category)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isSelected
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                : "bg-white/90 backdrop-blur-sm text-gray-400 hover:bg-white hover:text-blue-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isSelected ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Circle className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Product Image */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          >
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingCart className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </motion.div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Discount Badge */}
          {product.comparePrice && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
            >
              {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
            </motion.div>
          )}
          
          {/* Brand Logo */}
          {product.brand?.logo && (
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-lg">
              <Image
                src={product.brand.logo}
                alt={product.brand.name}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          )}

          {/* Selected Badge */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg"
            >
              <Check className="w-3 h-3" />
              Selected
            </motion.div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="mb-3">
            <p className="text-xs font-medium text-blue-600 mb-1.5 uppercase tracking-wide">
              {product.categoryRelation?.name}
            </p>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Quantity Selector (if selected) */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex items-center gap-2"
            >
              <span className="text-sm text-gray-600">Quantity:</span>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="px-3 py-1 hover:bg-gray-100 transition-colors rounded-l-lg"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1 font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="px-3 py-1 hover:bg-gray-100 transition-colors rounded-r-lg"
                >
                  +
                </button>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-2 hover:border-blue-500 hover:text-blue-500 transition-all"
              asChild
            >
              <Link href={`/products/${product.slug || product.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </Link>
            </Button>
            <Button
              className={`flex-1 transition-all ${
                isSelected
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => toggleProduct(product, category)}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Selected
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Select
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  const ProductSection = ({ 
    title, 
    icon: Icon, 
    products, 
    color
  }: { 
    title: string; 
    icon: any; 
    products: Product[]; 
    color: string;
  }) => {
    if (products.length === 0) return null;

    const allSelected = products.every(p => selectedProducts.has(p.id));
    const someSelected = products.some(p => selectedProducts.has(p.id));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 bg-gradient-to-br ${color} rounded-2xl shadow-lg`}
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {products.length} product{products.length > 1 ? 's' : ''} available
                {someSelected && (
                  <span className="ml-2 text-blue-600 font-semibold">
                    • {products.filter(p => selectedProducts.has(p.id)).length} selected
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!allSelected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(products, title)}
                className="text-xs"
              >
                Select All
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeselectAll(products)}
                className="text-xs"
              >
                Deselect All
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              index={index}
              category={title}
            />
          ))}
        </div>
      </motion.div>
    );
  };

  const totalProducts = 
    suggestions.indoorCameras.length +
    suggestions.outdoorCameras.length +
    suggestions.recordingDevices.length +
    suggestions.hddStorage.length +
    suggestions.powerSupply.length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8 pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotation
            </Button>

            <div className="flex items-center gap-4 mb-6">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-4 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl shadow-xl"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Product Suggestions
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Based on your quotation requirements • {totalProducts} products found
                  {totalItems > 0 && (
                    <span className="ml-2 font-semibold text-blue-600">
                      • {totalItems} item{totalItems > 1 ? 's' : ''} selected
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Selected Filters */}
            {(selectedBrand || selectedCategory || selectedResolution) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-gray-200/50 mb-6"
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Requirements:</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedBrand && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-xl text-sm font-medium shadow-sm"
                    >
                      Brand: {selectedBrand.name}
                    </motion.div>
                  )}
                  {selectedCategory && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-xl text-sm font-medium shadow-sm"
                    >
                      Type: {selectedCategory.name}
                    </motion.div>
                  )}
                  {selectedResolution && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-xl text-sm font-medium shadow-sm"
                    >
                      Resolution: {selectedResolution.name}
                    </motion.div>
                  )}
                  {indoorCount && parseInt(indoorCount) > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-700 rounded-xl text-sm font-medium shadow-sm"
                    >
                      Indoor: {indoorCount}
                    </motion.div>
                  )}
                  {outdoorCount && parseInt(outdoorCount) > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 rounded-xl text-sm font-medium shadow-sm"
                    >
                      Outdoor: {outdoorCount}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Products Sections */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Loader2 className="w-16 h-16 text-blue-600 mx-auto" />
                </motion.div>
                <p className="text-lg font-semibold text-gray-700">Loading suggestions...</p>
              </div>
            </div>
          ) : totalProducts > 0 ? (
            <>
              <ProductSection
                title="Indoor Cameras"
                icon={Camera}
                products={suggestions.indoorCameras}
                color="from-cyan-500 to-blue-500"
              />
              <ProductSection
                title="Outdoor Cameras"
                icon={Camera}
                products={suggestions.outdoorCameras}
                color="from-orange-500 to-red-500"
              />
              <ProductSection
                title="Recording Devices (DVR/NVR)"
                icon={HardDrive}
                products={suggestions.recordingDevices}
                color="from-purple-500 to-pink-500"
              />
              <ProductSection
                title="HDD Storage"
                icon={HardDrive}
                products={suggestions.hddStorage}
                color="from-indigo-500 to-purple-500"
              />
              <ProductSection
                title="Power Supply"
                icon={Zap}
                products={suggestions.powerSupply}
                color="from-yellow-500 to-orange-500"
              />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching your requirements.
              </p>
              <Button onClick={() => router.push("/quotation")}>
                Update Quotation
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <AnimatePresence>
        {selectedProducts.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-gray-200 shadow-2xl z-50"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-xl font-bold text-gray-900">{totalItems}</p>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-gray-300" />
                  <div>
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mr-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleDownloadQuotation}
                    className="border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white hover:border-purple-600 transition-all"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Quotation
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleContactSales}
                    className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-600 transition-all"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Contact Sales
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCheckout}
                    disabled={addingToCart}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50 mr-12 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Checkout
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
