"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Layers, FolderTree, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export function CategoryNestedView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [territoryCategories, setTerritoryCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [categoriesRes, subCategoriesRes, territoryCategoriesRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/subcategories"),
        fetch("/api/admin/territory-categories"),
      ]);

      const categoriesData = await categoriesRes.json();
      const subCategoriesData = await subCategoriesRes.json();
      const territoryCategoriesData = await territoryCategoriesRes.json();

      setCategories(categoriesData.categories || []);
      setSubCategories(subCategoriesData.subCategories || []);
      setTerritoryCategories(territoryCategoriesData.territoryCategories || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getSubCategoriesForCategory = (categoryId: string) => {
    return subCategories.filter((sc) => sc.categoryId === categoryId);
  };

  const getTerritoryCategoriesForCategory = (categoryId: string) => {
    return territoryCategories.filter((tc) =>
      tc.categories?.some((c: any) => c.categoryId === categoryId)
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-blue mb-2">
            Categories (Nested View)
          </h1>
          <p className="text-light-gray">
            View all categories with their subcategories and territory categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/categories">Manage Categories</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/subcategories">Manage Sub Categories</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/territory-categories">Manage Territory Categories</Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-lavender-light">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-16 h-16 text-light-gray mx-auto mb-4" />
            <p className="text-light-gray">No categories found</p>
          </div>
        ) : (
          <div className="divide-y divide-lavender-light">
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const categorySubCategories = getSubCategoriesForCategory(category.id);
              const categoryTerritoryCategories = getTerritoryCategoriesForCategory(category.id);

              return (
                <div key={category.id} className="p-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="text-light-gray hover:text-dark-blue"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div className="w-10 h-10 bg-lavender-light rounded flex items-center justify-center">
                        {category.icon ? (
                          <span className="text-lg">{category.icon}</span>
                        ) : (
                          <Layers className="w-5 h-5 text-light-gray" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-dark-blue">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-light-gray line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-light-gray">
                        <span>
                          {categorySubCategories.length} Sub Categories
                        </span>
                        <span>
                          {categoryTerritoryCategories.length} Territory Categories
                        </span>
                        <span>{category._count?.products || 0} Products</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          category.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {category.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <Link href={`/admin/categories?edit=${category.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 ml-8 space-y-4">
                      {/* Sub Categories */}
                      {categorySubCategories.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FolderTree className="w-4 h-4 text-primary-blue" />
                            <h4 className="font-semibold text-dark-blue">
                              Sub Categories ({categorySubCategories.length})
                            </h4>
                          </div>
                          <div className="ml-4 space-y-2">
                            {categorySubCategories.map((subCategory) => (
                              <div
                                key={subCategory.id}
                                className="flex items-center justify-between p-2 bg-lavender-soft rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    {subCategory.icon ? (
                                      <span className="text-sm">{subCategory.icon}</span>
                                    ) : (
                                      <FolderTree className="w-4 h-4 text-light-gray" />
                                    )}
                                  </div>
                                  <span className="text-sm text-dark-blue">
                                    {subCategory.name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                >
                                  <Link href={`/admin/subcategories?edit=${subCategory.id}`}>
                                    <Edit className="w-3 h-3" />
                                  </Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Territory Categories */}
                      {categoryTerritoryCategories.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-purple-gradient-to" />
                            <h4 className="font-semibold text-dark-blue">
                              Territory Categories ({categoryTerritoryCategories.length})
                            </h4>
                          </div>
                          <div className="ml-4 space-y-2">
                            {categoryTerritoryCategories.map((tc) => (
                              <div
                                key={tc.id}
                                className="flex items-center justify-between p-2 bg-lavender-soft rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-purple-gradient-to" />
                                  </div>
                                  <span className="text-sm text-dark-blue">
                                    {tc.name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                >
                                  <Link href={`/admin/territory-categories?edit=${tc.id}`}>
                                    <Edit className="w-3 h-3" />
                                  </Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty States */}
                      {categorySubCategories.length === 0 &&
                        categoryTerritoryCategories.length === 0 && (
                          <div className="text-sm text-light-gray ml-4">
                            No subcategories or territory categories
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}




















