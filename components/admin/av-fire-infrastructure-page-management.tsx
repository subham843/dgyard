"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Upload, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface PageContent {
  hero: {
    title: string;
    subtitle: string;
    tagline: string;
    buttons: Array<{ text: string; href?: string; action?: string; visible: boolean }>;
  };
  intro: { text: string };
  serviceCategories: Array<{
    id: number;
    title: string;
    description: string;
    icon: string;
    services: Array<{ title: string; description: string }>;
  }>;
  packages: Array<{
    name: string;
    description: string;
    features: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  cta: {
    title: string;
    subtitle: string;
    buttons: Array<{ text: string; href?: string; action?: string; visible: boolean }>;
  };
}

export function AVFireInfrastructurePageManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<PageContent | null>(null);
  const [activeTab, setActiveTab] = useState<"hero" | "intro" | "categories" | "packages" | "faq" | "cta">("hero");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/page-content/av-fire-infrastructure");
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load page content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/admin/page-content/av-fire-infrastructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        toast.success("Page content saved successfully!");
      } else {
        toast.error("Failed to save content");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-blue mb-2">AV, Fire & Smart Infrastructure Page Management</h1>
          <p className="text-light-gray">Manage all content for the AV, Fire & Smart Infrastructure service page</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary-blue">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-lavender-light overflow-x-auto pb-2">
        {[
          { id: "hero", label: "Hero Section" },
          { id: "intro", label: "Introduction" },
          { id: "categories", label: "Service Categories" },
          { id: "packages", label: "Packages" },
          { id: "faq", label: "FAQs" },
          { id: "cta", label: "Final CTA" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary-blue text-primary-blue"
                : "border-transparent text-light-gray hover:text-dark-blue"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Section Tab */}
      {activeTab === "hero" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6 space-y-4">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Hero Section</h2>
          <div>
            <Label>Hero Title</Label>
            <Input
              value={content.hero.title}
              onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input
              value={content.hero.subtitle}
              onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
            />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input
              value={content.hero.tagline}
              onChange={(e) => setContent({ ...content, hero: { ...content.hero, tagline: e.target.value } })}
            />
          </div>
          <div>
            <Label>Buttons</Label>
            {content.hero.buttons.map((btn, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <Input
                  value={btn.text}
                  onChange={(e) => {
                    const buttons = [...content.hero.buttons];
                    buttons[idx].text = e.target.value;
                    setContent({ ...content, hero: { ...content.hero, buttons } });
                  }}
                  placeholder="Button Text"
                />
                <Input
                  value={btn.href || ""}
                  onChange={(e) => {
                    const buttons = [...content.hero.buttons];
                    buttons[idx].href = e.target.value;
                    setContent({ ...content, hero: { ...content.hero, buttons } });
                  }}
                  placeholder="URL (or leave empty for action)"
                />
                <Input
                  value={btn.action || ""}
                  onChange={(e) => {
                    const buttons = [...content.hero.buttons];
                    buttons[idx].action = e.target.value;
                    setContent({ ...content, hero: { ...content.hero, buttons } });
                  }}
                  placeholder="Action (e.g., honey)"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const buttons = [...content.hero.buttons];
                    buttons[idx].visible = !buttons[idx].visible;
                    setContent({ ...content, hero: { ...content.hero, buttons } });
                  }}
                >
                  {buttons[idx].visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    const buttons = content.hero.buttons.filter((_, i) => i !== idx);
                    setContent({ ...content, hero: { ...content.hero, buttons } });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() => {
                const buttons = [...content.hero.buttons, { text: "New Button", visible: true }];
                setContent({ ...content, hero: { ...content.hero, buttons } });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Button
            </Button>
          </div>
        </div>
      )}

      {/* Intro Section Tab */}
      {activeTab === "intro" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Introduction Section</h2>
          <div>
            <Label>Intro Text</Label>
            <textarea
              value={content.intro.text}
              onChange={(e) => setContent({ ...content, intro: { text: e.target.value } })}
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Service Categories Tab */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">Service Categories</h2>
            <Button
              size="sm"
              onClick={() => {
                const categories = [...(content.serviceCategories || [])];
                categories.push({
                  id: categories.length + 1,
                  title: "New Category",
                  description: "Description",
                  icon: "video",
                  services: []
                });
                setContent({ ...content, serviceCategories: categories });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          
          {content.serviceCategories.map((category, catIdx) => (
            <div key={catIdx} className="border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Category {catIdx + 1}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const categories = content.serviceCategories.filter((_, i) => i !== catIdx);
                    setContent({ ...content, serviceCategories: categories });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <Label>Category Title</Label>
                <Input
                  value={category.title}
                  onChange={(e) => {
                    const categories = [...content.serviceCategories];
                    categories[catIdx].title = e.target.value;
                    setContent({ ...content, serviceCategories: categories });
                  }}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Input
                  value={category.description}
                  onChange={(e) => {
                    const categories = [...content.serviceCategories];
                    categories[catIdx].description = e.target.value;
                    setContent({ ...content, serviceCategories: categories });
                  }}
                />
              </div>
              
              <div>
                <Label>Icon Key</Label>
                <Input
                  value={category.icon}
                  onChange={(e) => {
                    const categories = [...content.serviceCategories];
                    categories[catIdx].icon = e.target.value;
                    setContent({ ...content, serviceCategories: categories });
                  }}
                  placeholder="video, flame, building, home"
                />
              </div>
              
              <div>
                <Label>Services</Label>
                {category.services.map((service, svcIdx) => (
                  <div key={svcIdx} className="flex gap-2 mb-2 p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <Input
                        value={service.title}
                        onChange={(e) => {
                          const categories = [...content.serviceCategories];
                          categories[catIdx].services[svcIdx].title = e.target.value;
                          setContent({ ...content, serviceCategories: categories });
                        }}
                        placeholder="Service Title"
                        className="mb-2"
                      />
                      <Input
                        value={service.description}
                        onChange={(e) => {
                          const categories = [...content.serviceCategories];
                          categories[catIdx].services[svcIdx].description = e.target.value;
                          setContent({ ...content, serviceCategories: categories });
                        }}
                        placeholder="Service Description"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        const categories = [...content.serviceCategories];
                        categories[catIdx].services = category.services.filter((_, i) => i !== svcIdx);
                        setContent({ ...content, serviceCategories: categories });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() => {
                    const categories = [...content.serviceCategories];
                    categories[catIdx].services.push({ title: "New Service", description: "Description" });
                    setContent({ ...content, serviceCategories: categories });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">Packages</h2>
            <Button
              size="sm"
              onClick={() => {
                const packages = [...(content.packages || [])];
                packages.push({
                  name: "New Package",
                  description: "Description",
                  features: []
                });
                setContent({ ...content, packages });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </div>
          
          {content.packages.map((pkg, pkgIdx) => (
            <div key={pkgIdx} className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Package {pkgIdx + 1}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const packages = content.packages.filter((_, i) => i !== pkgIdx);
                    setContent({ ...content, packages });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <Label>Package Name</Label>
                <Input
                  value={pkg.name}
                  onChange={(e) => {
                    const packages = [...content.packages];
                    packages[pkgIdx].name = e.target.value;
                    setContent({ ...content, packages });
                  }}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Input
                  value={pkg.description}
                  onChange={(e) => {
                    const packages = [...content.packages];
                    packages[pkgIdx].description = e.target.value;
                    setContent({ ...content, packages });
                  }}
                />
              </div>
              
              <div>
                <Label>Features (one per line)</Label>
                <textarea
                  value={pkg.features.join("\n")}
                  onChange={(e) => {
                    const packages = [...content.packages];
                    packages[pkgIdx].features = e.target.value.split("\n").filter(Boolean);
                    setContent({ ...content, packages });
                  }}
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md"
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">FAQs</h2>
            <Button
              size="sm"
              onClick={() => {
                const faqs = [...(content.faqs || [])];
                faqs.push({ question: "New Question?", answer: "Answer here" });
                setContent({ ...content, faqs });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </div>
          
          {content.faqs.map((faq, faqIdx) => (
            <div key={faqIdx} className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">FAQ {faqIdx + 1}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const faqs = content.faqs.filter((_, i) => i !== faqIdx);
                    setContent({ ...content, faqs });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <Label>Question</Label>
                <Input
                  value={faq.question}
                  onChange={(e) => {
                    const faqs = [...content.faqs];
                    faqs[faqIdx].question = e.target.value;
                    setContent({ ...content, faqs });
                  }}
                />
              </div>
              
              <div>
                <Label>Answer</Label>
                <textarea
                  value={faq.answer}
                  onChange={(e) => {
                    const faqs = [...content.faqs];
                    faqs[faqIdx].answer = e.target.value;
                    setContent({ ...content, faqs });
                  }}
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA Tab */}
      {activeTab === "cta" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6 space-y-4">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Final CTA Section</h2>
          <div>
            <Label>CTA Title</Label>
            <Input
              value={content.cta.title}
              onChange={(e) => setContent({ ...content, cta: { ...content.cta, title: e.target.value } })}
            />
          </div>
          <div>
            <Label>CTA Subtitle</Label>
            <Input
              value={content.cta.subtitle}
              onChange={(e) => setContent({ ...content, cta: { ...content.cta, subtitle: e.target.value } })}
            />
          </div>
          <div>
            <Label>Buttons</Label>
            {content.cta.buttons.map((btn, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <Input
                  value={btn.text}
                  onChange={(e) => {
                    const buttons = [...content.cta.buttons];
                    buttons[idx].text = e.target.value;
                    setContent({ ...content, cta: { ...content.cta, buttons } });
                  }}
                  placeholder="Button Text"
                />
                <Input
                  value={btn.href || ""}
                  onChange={(e) => {
                    const buttons = [...content.cta.buttons];
                    buttons[idx].href = e.target.value;
                    setContent({ ...content, cta: { ...content.cta, buttons } });
                  }}
                  placeholder="URL"
                />
                <Input
                  value={btn.action || ""}
                  onChange={(e) => {
                    const buttons = [...content.cta.buttons];
                    buttons[idx].action = e.target.value;
                    setContent({ ...content, cta: { ...content.cta, buttons } });
                  }}
                  placeholder="Action"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const buttons = [...content.cta.buttons];
                    buttons[idx].visible = !buttons[idx].visible;
                    setContent({ ...content, cta: { ...content.cta, buttons } });
                  }}
                >
                  {buttons[idx].visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    const buttons = content.cta.buttons.filter((_, i) => i !== idx);
                    setContent({ ...content, cta: { ...content.cta, buttons } });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() => {
                const buttons = [...content.cta.buttons, { text: "New Button", visible: true }];
                setContent({ ...content, cta: { ...content.cta, buttons } });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Button
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}











