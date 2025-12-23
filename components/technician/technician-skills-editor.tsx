"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Award, Loader2, Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TechnicianSkillsEditorProps {
  skillsData: {
    serviceCategories: any[];
    serviceSubCategories: any[];
    serviceDomains: any[];
    skills: any[];
  };
  selectedSkills: Array<{skillId: string; skillTitle: string; level: string}>;
  setSelectedSkills: (skills: Array<{skillId: string; skillTitle: string; level: string}>) => void;
  selectedServiceCategories: string[];
  setSelectedServiceCategories: (categories: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function TechnicianSkillsEditor({
  skillsData,
  selectedSkills,
  setSelectedSkills,
  selectedServiceCategories,
  setSelectedServiceCategories,
  onSubmit,
  loading,
}: TechnicianSkillsEditorProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [serviceDomains, setServiceDomains] = useState<any[]>([]);
  const [domainSkills, setDomainSkills] = useState<any[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    fetchServiceDomains();
  }, []);

  const fetchServiceDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await fetch("/api/technician/domains");
      if (response.ok) {
        const data = await response.json();
        setServiceDomains(data.serviceDomains || []);
      }
    } catch (error) {
      console.error("Error fetching service domains:", error);
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleDomainChange = async (domainId: string) => {
    setSelectedDomain(domainId);
    setDomainSkills([]);
    if (domainId) {
      try {
        setLoadingSkills(true);
        const response = await fetch(`/api/jobs/skills?serviceDomainId=${domainId}`);
        if (response.ok) {
          const data = await response.json();
          setDomainSkills(data.skills || []);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoadingSkills(false);
      }
    }
  };

  const addSkill = (skill: any) => {
    if (!selectedSkills.find(s => s.skillId === skill.id)) {
      setSelectedSkills([
        ...selectedSkills,
        { skillId: skill.id, skillTitle: skill.title, level: "BEGINNER" }
      ]);
    }
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter(s => s.skillId !== skillId));
  };

  const updateSkillLevel = (skillId: string, level: string) => {
    setSelectedSkills(selectedSkills.map(s => 
      s.skillId === skillId ? { ...s, level } : s
    ));
  };


  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Primary Skills */}
      <div>
        <Label>Primary Skills *</Label>
        <p className="text-sm text-gray-600 mb-4">Select service domain and add skills with proficiency level</p>
        
        {/* Skill Selection */}
        <div className="mb-4 space-y-4">
          <div>
            <Label>Service Domain *</Label>
            <Select value={selectedDomain} onValueChange={handleDomainChange} disabled={loadingDomains}>
              <SelectTrigger>
                <SelectValue placeholder={loadingDomains ? "Loading domains..." : "Select service domain"} />
              </SelectTrigger>
              <SelectContent>
                {serviceDomains.map((domain: any) => (
                  <SelectItem key={domain.id} value={domain.id}>{domain.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {loadingSkills && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Loading skills...</span>
            </div>
          )}
          
          {selectedDomain && !loadingSkills && domainSkills.length > 0 && (
            <div className="border rounded-lg p-4">
              <Label className="mb-2 block">Available Skills</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {domainSkills.map((skill: any) => (
                  <div key={skill.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span>{skill.title}</span>
                    {selectedSkills.find(s => s.skillId === skill.id) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSkill(skill.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addSkill(skill)}
                        style={{ backgroundColor: '#3A59FF' }}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedDomain && !loadingSkills && domainSkills.length === 0 && (
            <div className="border rounded-lg p-4 text-center text-gray-500">
              No skills available for this domain
            </div>
          )}
        </div>

        {/* Selected Skills List */}
        {selectedSkills.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <Label>Your Skills</Label>
            {selectedSkills.map((skill) => (
              <div key={skill.skillId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{skill.skillTitle}</p>
                  <Select
                    value={skill.level}
                    onValueChange={(level) => updateSkillLevel(skill.skillId, level)}
                  >
                    <SelectTrigger className="w-40 mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSkill(skill.skillId)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading || selectedSkills.length === 0}
        className="w-full"
        style={{ backgroundColor: '#3A59FF' }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Skills
          </>
        )}
      </Button>
    </form>
  );
}








