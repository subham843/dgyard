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
    heroImage: string | null;
    buttons: Array<{ text: string; href?: string; action?: string; visible: boolean }>;
  };
  intro: { text: string };
  serviceCategories: Array<{
    id: number;
    title: string;
    subtitle: string;
    features: string[];
    icon: string;
    visible: boolean;
  }>;
  honey: {
    enabled: boolean;
    title: string;
    description: string;
    buttonText: string;
    features: string[];
  };
  beforeAfter: Array<{
    id: number;
    title: string;
    beforeImage: string | null;
    afterImage: string | null;
    visible: boolean;
  }>;
  process: {
    title: string;
    steps: Array<{
      id: number;
      title: string;
      description: string;
    }>;
  };
  faqs: Array<{
    id: number;
    question: string;
    answer: string;
    visible: boolean;
  }>;
  cta: {
    title: string;
    subtitle: string;
    buttons: Array<{ text: string; href?: string; action?: string; visible: boolean }>;
  };
}

export function NetworkingITPageManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<PageContent | null>(null);
  const [activeTab, setActiveTab] = useState<"hero" | "intro" | "categories" | "honey" | "gallery" | "process" | "faq" | "cta">("hero");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/page-content/networking-it");
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
      const response = await fetch("/api/admin/page-content/networking-it", {
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
          <h1 className="text-3xl font-bold text-dark-blue mb-2">Networking & IT Page Management</h1>
          <p className="text-light-gray">Manage all content for the Networking & IT solutions page</p>
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
          { id: "honey", label: "AI Honey" },
          { id: "gallery", label: "Before/After Gallery" },
          { id: "process", label: "Process Section" },
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
            <Label>Hero Image</Label>
            <div className="flex gap-4 items-center">
              <Input
                type="text"
                placeholder="Image URL"
                value={content.hero.heroImage || ""}
                onChange={(e) => setContent({ ...content, hero: { ...content.hero, heroImage: e.target.value } })}
              />
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
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
                  placeholder="URL"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const buttons = [...content.hero.buttons];
                    buttons[idx].visible = !buttons[idx].visible;
                    setContent({ ...content, hero: { ...content.hero, buttons } });
                  }}
                >
                  {btn.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            ))}
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
              className="w-full px-3 py-2 border border-lavender-light rounded-md min-h-[150px]"
              rows={6}
            />
          </div>
        </div>
      )}

      {/* Service Categories Tab */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">Service Categories</h2>
            <Button variant="outline" size="sm" onClick={() => {
              const newId = Math.max(...content.serviceCategories.map(c => c.id), 0) + 1;
              setContent({
                ...content,
                serviceCategories: [...content.serviceCategories, {
                  id: newId,
                  title: "New Category",
                  subtitle: "Description",
                  features: [],
                  icon: "wifi",
                  visible: true
                }]
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          <div className="space-y-4">
            {content.serviceCategories.map((cat) => (
              <div key={cat.id} className="border border-lavender-light rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Input
                      value={cat.title}
                      onChange={(e) => {
                        const categories = content.serviceCategories.map(c => 
                          c.id === cat.id ? { ...c, title: e.target.value } : c
                        );
                        setContent({ ...content, serviceCategories: categories });
                      }}
                      className="mb-2"
                    />
                    <Input
                      value={cat.subtitle}
                      onChange={(e) => {
                        const categories = content.serviceCategories.map(c => 
                          c.id === cat.id ? { ...c, subtitle: e.target.value } : c
                        );
                        setContent({ ...content, serviceCategories: categories });
                      }}
                    />
                    <Input
                      value={cat.icon}
                      onChange={(e) => {
                        const categories = content.serviceCategories.map(c => 
                          c.id === cat.id ? { ...c, icon: e.target.value } : c
                        );
                        setContent({ ...content, serviceCategories: categories });
                      }}
                      className="mt-2"
                      placeholder="Icon name (wifi, cable, router, etc.)"
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const categories = content.serviceCategories.map(c => 
                          c.id === cat.id ? { ...c, visible: !c.visible } : c
                        );
                        setContent({ ...content, serviceCategories: categories });
                      }}
                    >
                      {cat.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setContent({
                        ...content,
                        serviceCategories: content.serviceCategories.filter(c => c.id !== cat.id)
                      });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Features (one per line)</Label>
                  <textarea
                    value={cat.features.join("\n")}
                    onChange={(e) => {
                      const categories = content.serviceCategories.map(c => 
                        c.id === cat.id ? { ...c, features: e.target.value.split("\n").filter(f => f.trim()) } : c
                      );
                      setContent({ ...content, serviceCategories: categories });
                    }}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md"
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honey Tab */}
      {activeTab === "honey" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6 space-y-4">
          <h2 className="text-xl font-bold text-dark-blue mb-4">AI Honey Section</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={content.honey.enabled}
              onChange={(e) => setContent({ ...content, honey: { ...content.honey, enabled: e.target.checked } })}
              className="w-4 h-4"
            />
            <Label>Enable Honey Section</Label>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={content.honey.title}
              onChange={(e) => setContent({ ...content, honey: { ...content.honey, title: e.target.value } })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={content.honey.description}
              onChange={(e) => setContent({ ...content, honey: { ...content.honey, description: e.target.value } })}
              className="w-full px-3 py-2 border border-lavender-light rounded-md"
              rows={3}
            />
          </div>
          <div>
            <Label>Button Text</Label>
            <Input
              value={content.honey.buttonText}
              onChange={(e) => setContent({ ...content, honey: { ...content.honey, buttonText: e.target.value } })}
            />
          </div>
          <div>
            <Label>Features (one per line)</Label>
            <textarea
              value={content.honey.features.join("\n")}
              onChange={(e) => setContent({ 
                ...content, 
                honey: { ...content.honey, features: e.target.value.split("\n").filter(f => f.trim()) } 
              })}
              className="w-full px-3 py-2 border border-lavender-light rounded-md"
              rows={5}
            />
          </div>
        </div>
      )}

      {/* Before/After Gallery Tab */}
      {activeTab === "gallery" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">Before/After Gallery</h2>
            <Button variant="outline" size="sm" onClick={() => {
              const newId = Math.max(...content.beforeAfter.map(b => b.id), 0) + 1;
              setContent({
                ...content,
                beforeAfter: [...content.beforeAfter, {
                  id: newId,
                  title: "New Comparison",
                  beforeImage: null,
                  afterImage: null,
                  visible: true
                }]
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Slider
            </Button>
          </div>
          <div className="space-y-4">
            {content.beforeAfter.map((item) => (
              <div key={item.id} className="border border-lavender-light rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const gallery = content.beforeAfter.map(g => 
                        g.id === item.id ? { ...g, title: e.target.value } : g
                      );
                      setContent({ ...content, beforeAfter: gallery });
                    }}
                    className="mb-2"
                  />
                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => {
                      const gallery = content.beforeAfter.map(g => 
                        g.id === item.id ? { ...g, visible: !g.visible } : g
                      );
                      setContent({ ...content, beforeAfter: gallery });
                    }}>
                      {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setContent({
                        ...content,
                        beforeAfter: content.beforeAfter.filter(g => g.id !== item.id)
                      });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Before Image</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={item.beforeImage || ""}
                        onChange={(e) => {
                          const gallery = content.beforeAfter.map(g => 
                            g.id === item.id ? { ...g, beforeImage: e.target.value } : g
                          );
                          setContent({ ...content, beforeAfter: gallery });
                        }}
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>After Image</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={item.afterImage || ""}
                        onChange={(e) => {
                          const gallery = content.beforeAfter.map(g => 
                            g.id === item.id ? { ...g, afterImage: e.target.value } : g
                          );
                          setContent({ ...content, beforeAfter: gallery });
                        }}
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Tab */}
      {activeTab === "process" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Process Section</h2>
          <div>
            <Label>Process Title</Label>
            <Input
              value={content.process.title}
              onChange={(e) => setContent({ ...content, process: { ...content.process, title: e.target.value } })}
              className="mb-4"
            />
          </div>
          <div className="space-y-4">
            {content.process.steps.map((step) => (
              <div key={step.id} className="border border-lavender-light rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Label className="text-sm">Step Title</Label>
                    <Input
                      value={step.title}
                      onChange={(e) => {
                        const steps = content.process.steps.map(s => 
                          s.id === step.id ? { ...s, title: e.target.value } : s
                        );
                        setContent({ ...content, process: { ...content.process, steps } });
                      }}
                      className="mb-2"
                    />
                    <Label className="text-sm">Step Description</Label>
                    <textarea
                      value={step.description}
                      onChange={(e) => {
                        const steps = content.process.steps.map(s => 
                          s.id === step.id ? { ...s, description: e.target.value } : s
                        );
                        setContent({ ...content, process: { ...content.process, steps } });
                      }}
                      className="w-full px-3 py-2 border border-lavender-light rounded-md"
                      rows={2}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setContent({
                      ...content,
                      process: {
                        ...content.process,
                        steps: content.process.steps.filter(s => s.id !== step.id)
                      }
                    });
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => {
              const newId = Math.max(...content.process.steps.map(s => s.id), 0) + 1;
              setContent({
                ...content,
                process: {
                  ...content.process,
                  steps: [...content.process.steps, {
                    id: newId,
                    title: "New Step",
                    description: "Description"
                  }]
                }
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">FAQs</h2>
            <Button variant="outline" size="sm" onClick={() => {
              const newId = Math.max(...content.faqs.map(f => f.id), 0) + 1;
              setContent({
                ...content,
                faqs: [...content.faqs, {
                  id: newId,
                  question: "New Question",
                  answer: "New Answer",
                  visible: true
                }]
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </div>
          <div className="space-y-4">
            {content.faqs.map((faq) => (
              <div key={faq.id} className="border border-lavender-light rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const faqs = content.faqs.map(f => 
                          f.id === faq.id ? { ...f, question: e.target.value } : f
                        );
                        setContent({ ...content, faqs });
                      }}
                      className="mb-2"
                      placeholder="Question"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const faqs = content.faqs.map(f => 
                          f.id === faq.id ? { ...f, answer: e.target.value } : f
                        );
                        setContent({ ...content, faqs });
                      }}
                      className="w-full px-3 py-2 border border-lavender-light rounded-md"
                      rows={3}
                      placeholder="Answer"
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const faqs = content.faqs.map(f => 
                          f.id === faq.id ? { ...f, visible: !f.visible } : f
                        );
                        setContent({ ...content, faqs });
                      }}
                    >
                      {faq.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setContent({
                        ...content,
                        faqs: content.faqs.filter(f => f.id !== faq.id)
                      });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const buttons = [...content.cta.buttons];
                    buttons[idx].visible = !buttons[idx].visible;
                    setContent({ ...content, cta: { ...content.cta, buttons } });
                  }}
                >
                  {btn.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

