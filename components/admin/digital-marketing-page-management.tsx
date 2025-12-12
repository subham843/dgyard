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
  services: Array<{
    id: number;
    title: string;
    description: string;
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
  auditSteps: Array<{
    id: number;
    title: string;
    description: string;
  }>;
  deliverables: string[];
  packages: Array<{
    id: number;
    title: string;
    features: string[];
    visible: boolean;
  }>;
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

export function DigitalMarketingPageManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<PageContent | null>(null);
  const [activeTab, setActiveTab] = useState<"hero" | "intro" | "services" | "political" | "honey" | "audit" | "deliverables" | "packages" | "faq" | "cta">("hero");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/page-content/digital-marketing");
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
      const response = await fetch("/api/admin/page-content/digital-marketing", {
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
          <h1 className="text-3xl font-bold text-dark-blue mb-2">Digital Marketing & Branding Page Management</h1>
          <p className="text-light-gray">Manage all content for the Digital Marketing & Branding service page</p>
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
          { id: "services", label: "Services" },
          { id: "political", label: "Political Campaigning" },
          { id: "honey", label: "AI Honey" },
          { id: "audit", label: "Audit Steps" },
          { id: "deliverables", label: "Deliverables" },
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
                    buttons[idx].action = e.target.value || undefined;
                    setContent({ ...content, hero: { ...content.hero, buttons } });
                  }}
                  placeholder="Action (e.g., 'audit')"
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

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">Services</h2>
            <Button variant="outline" size="sm" onClick={() => {
              const newId = Math.max(...content.services.map(s => s.id), 0) + 1;
              setContent({
                ...content,
                services: [...content.services, {
                  id: newId,
                  title: "New Service",
                  description: "Description",
                  icon: "palette",
                  visible: true
                }]
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
          <div className="space-y-4">
            {content.services.map((service) => (
              <div key={service.id} className="border border-lavender-light rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Input
                      value={service.title}
                      onChange={(e) => {
                        const services = content.services.map(s => 
                          s.id === service.id ? { ...s, title: e.target.value } : s
                        );
                        setContent({ ...content, services });
                      }}
                      className="mb-2"
                    />
                    <textarea
                      value={service.description}
                      onChange={(e) => {
                        const services = content.services.map(s => 
                          s.id === service.id ? { ...s, description: e.target.value } : s
                        );
                        setContent({ ...content, services });
                      }}
                      className="w-full px-3 py-2 border border-lavender-light rounded-md"
                      rows={2}
                    />
                    <Input
                      value={service.icon}
                      onChange={(e) => {
                        const services = content.services.map(s => 
                          s.id === service.id ? { ...s, icon: e.target.value } : s
                        );
                        setContent({ ...content, services });
                      }}
                      className="mt-2"
                      placeholder="Icon name (palette, share, map, trending, pen, star, chart)"
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const services = content.services.map(s => 
                          s.id === service.id ? { ...s, visible: !s.visible } : s
                        );
                        setContent({ ...content, services });
                      }}
                    >
                      {service.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setContent({
                        ...content,
                        services: content.services.filter(s => s.id !== service.id)
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

      {/* Political Campaigning Tab */}
      {activeTab === "political" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark-blue">Political Campaigning Section</h2>
            <div className="flex items-center gap-2">
              <Label>Enable Section</Label>
              <input
                type="checkbox"
                checked={(content as any).political?.enabled !== false}
                onChange={(e) => {
                  setContent({
                    ...content,
                    political: {
                      ...((content as any).political || {}),
                      enabled: e.target.checked,
                    } as any,
                  });
                }}
                className="w-5 h-5"
              />
            </div>
          </div>
          
          <div>
            <Label>Section Title</Label>
            <Input
              value={(content as any).political?.title || ""}
              onChange={(e) => {
                setContent({
                  ...content,
                  political: {
                    ...((content as any).political || {}),
                    title: e.target.value,
                  } as any,
                });
              }}
              placeholder="We Are Also Experts in Political Campaigning & PR"
            />
          </div>
          
          <div>
            <Label>Subtitle</Label>
            <Input
              value={(content as any).political?.subtitle || ""}
              onChange={(e) => {
                setContent({
                  ...content,
                  political: {
                    ...((content as any).political || {}),
                    subtitle: e.target.value,
                  } as any,
                });
              }}
              placeholder="Strategic election campaigns built with clarity, influence and strong public messaging."
            />
          </div>
          
          <div>
            <Label>Description</Label>
            <textarea
              value={(content as any).political?.description || ""}
              onChange={(e) => {
                setContent({
                  ...content,
                  political: {
                    ...((content as any).political || {}),
                    description: e.target.value,
                  } as any,
                });
              }}
              placeholder="D.G.Yard has been actively involved in political communication..."
              className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Political Offerings</Label>
              <Button
                size="sm"
                onClick={() => {
                  const offerings = [...((content as any).political?.offerings || [])];
                  offerings.push({
                    icon: "megaphone",
                    title: "New Offering",
                    items: []
                  });
                  setContent({
                    ...content,
                    political: {
                      ...((content as any).political || {}),
                      offerings,
                    } as any,
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Offering
              </Button>
            </div>
            
            {((content as any).political?.offerings || []).map((offering: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Offering {idx + 1}</h4>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const offerings = [...((content as any).political?.offerings || [])];
                      offerings.splice(idx, 1);
                      setContent({
                        ...content,
                        political: {
                          ...((content as any).political || {}),
                          offerings,
                        } as any,
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <Label>Icon (key)</Label>
                  <Input
                    value={offering.icon || ""}
                    onChange={(e) => {
                      const offerings = [...((content as any).political?.offerings || [])];
                      offerings[idx].icon = e.target.value;
                      setContent({
                        ...content,
                        political: {
                          ...((content as any).political || {}),
                          offerings,
                        } as any,
                      });
                    }}
                    placeholder="megaphone, target, message-circle, etc."
                  />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={offering.title || ""}
                    onChange={(e) => {
                      const offerings = [...((content as any).political?.offerings || [])];
                      offerings[idx].title = e.target.value;
                      setContent({
                        ...content,
                        political: {
                          ...((content as any).political || {}),
                          offerings,
                        } as any,
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Items (one per line)</Label>
                  <textarea
                    value={(offering.items || []).join("\n")}
                    onChange={(e) => {
                      const offerings = [...((content as any).political?.offerings || [])];
                      offerings[idx].items = e.target.value.split("\n").filter(Boolean);
                      setContent({
                        ...content,
                        political: {
                          ...((content as any).political || {}),
                          offerings,
                        } as any,
                      });
                    }}
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md"
                    placeholder="Item 1&#10;Item 2&#10;Item 3"
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
              rows={4}
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

      {/* Audit Steps Tab */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Audit Steps</h2>
          <div className="space-y-4">
            {content.auditSteps.map((step) => (
              <div key={step.id} className="border border-lavender-light rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Label className="text-sm">Step Title</Label>
                    <Input
                      value={step.title}
                      onChange={(e) => {
                        const steps = content.auditSteps.map(s => 
                          s.id === step.id ? { ...s, title: e.target.value } : s
                        );
                        setContent({ ...content, auditSteps: steps });
                      }}
                      className="mb-2"
                    />
                    <Label className="text-sm">Step Description</Label>
                    <textarea
                      value={step.description}
                      onChange={(e) => {
                        const steps = content.auditSteps.map(s => 
                          s.id === step.id ? { ...s, description: e.target.value } : s
                        );
                        setContent({ ...content, auditSteps: steps });
                      }}
                      className="w-full px-3 py-2 border border-lavender-light rounded-md"
                      rows={2}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setContent({
                      ...content,
                      auditSteps: content.auditSteps.filter(s => s.id !== step.id)
                    });
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => {
              const newId = Math.max(...content.auditSteps.map(s => s.id), 0) + 1;
              setContent({
                ...content,
                auditSteps: [...content.auditSteps, {
                  id: newId,
                  title: "New Step",
                  description: "Description"
                }]
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </div>
      )}

      {/* Deliverables Tab */}
      {activeTab === "deliverables" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Deliverables</h2>
          <div>
            <Label>Deliverables (one per line)</Label>
            <textarea
              value={content.deliverables.join("\n")}
              onChange={(e) => setContent({ 
                ...content, 
                deliverables: e.target.value.split("\n").filter(d => d.trim()) 
              })}
              className="w-full px-3 py-2 border border-lavender-light rounded-md min-h-[300px]"
              rows={10}
            />
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <div className="bg-white rounded-lg border border-lavender-light p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-blue">Packages</h2>
            <Button variant="outline" size="sm" onClick={() => {
              const newId = Math.max(...content.packages.map(p => p.id), 0) + 1;
              setContent({
                ...content,
                packages: [...content.packages, {
                  id: newId,
                  title: "New Package",
                  features: [],
                  visible: true
                }]
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </div>
          <div className="space-y-4">
            {content.packages.map((pkg) => (
              <div key={pkg.id} className="border border-lavender-light rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Input
                      value={pkg.title}
                      onChange={(e) => {
                        const packages = content.packages.map(p => 
                          p.id === pkg.id ? { ...p, title: e.target.value } : p
                        );
                        setContent({ ...content, packages });
                      }}
                      className="mb-2"
                    />
                    <Label className="text-sm">Features (one per line)</Label>
                    <textarea
                      value={pkg.features.join("\n")}
                      onChange={(e) => {
                        const packages = content.packages.map(p => 
                          p.id === pkg.id ? { ...p, features: e.target.value.split("\n").filter(f => f.trim()) } : p
                        );
                        setContent({ ...content, packages });
                      }}
                      className="w-full px-3 py-2 border border-lavender-light rounded-md"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const packages = content.packages.map(p => 
                          p.id === pkg.id ? { ...p, visible: !p.visible } : p
                        );
                        setContent({ ...content, packages });
                      }}
                    >
                      {pkg.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setContent({
                        ...content,
                        packages: content.packages.filter(p => p.id !== pkg.id)
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
                <Input
                  value={btn.action || ""}
                  onChange={(e) => {
                    const buttons = [...content.cta.buttons];
                    buttons[idx].action = e.target.value || undefined;
                    setContent({ ...content, cta: { ...content.cta, buttons } });
                  }}
                  placeholder="Action (e.g., 'audit')"
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

