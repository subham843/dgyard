"use client";

import { ComponentType } from "react";
import * as LucideIcons from "lucide-react";

interface IconRendererProps {
  iconName?: string | null;
  fallback: ComponentType<{ className?: string; size?: number }>;
  className?: string;
  size?: number;
}

/**
 * Renders an icon by name from Lucide React icons
 * @param iconName - The name of the icon (e.g., "Camera", "Shield", "Zap")
 * @param fallback - Fallback icon component to show if icon not found
 * @param className - CSS classes to apply
 * @param size - Icon size in pixels
 */
export function IconRenderer({
  iconName,
  fallback: FallbackIcon,
  className = "w-6 h-6",
  size,
}: IconRendererProps) {
  if (!iconName || !iconName.trim()) {
    return <FallbackIcon className={className} size={size} />;
  }

  const trimmedName = iconName.trim();
  
  // Try different variations of the icon name
  const variations = [
    // Exact match (e.g., "Camera")
    trimmedName,
    // PascalCase (e.g., "Camera", "HardDrive")
    trimmedName
      .split(/[\s\-_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(""),
    // First letter uppercase (e.g., "Camera")
    trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase(),
    // All uppercase then convert to PascalCase (e.g., "CAMERA" -> "Camera")
    trimmedName.toLowerCase()
      .split(/[\s\-_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(""),
  ];

  // Try to find the icon using different variations
  for (const variation of variations) {
    // Try the exact variation
    let IconComponent = (LucideIcons as any)[variation] as ComponentType<{
      className?: string;
      size?: number;
    }>;

    // If not found, try with "Icon" suffix (some icons might have this)
    if (!IconComponent || typeof IconComponent !== "function") {
      IconComponent = (LucideIcons as any)[`${variation}Icon`] as ComponentType<{
        className?: string;
        size?: number;
      }>;
    }

    // If found and valid, render it
    if (IconComponent && typeof IconComponent === "function") {
      return <IconComponent className={className} size={size} />;
    }
  }

  // If icon not found, show fallback
  return <FallbackIcon className={className} size={size} />;
}

