import * as LucideIcons from "lucide-react";
import { ComponentType } from "react";

/**
 * Get a Lucide icon component by name
 * @param iconName - The name of the icon (e.g., "Camera", "Shield", "Zap")
 * @returns The icon component or null if not found
 */
export function getIconByName(
  iconName: string
): ComponentType<{ className?: string; size?: number }> | null {
  if (!iconName) return null;

  // Normalize the icon name - capitalize first letter and remove spaces/special chars
  const normalizedName = iconName
    .trim()
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  // Try to find the icon in Lucide icons
  const IconComponent = (LucideIcons as any)[normalizedName];

  if (IconComponent && typeof IconComponent === "function") {
    return IconComponent as ComponentType<{
      className?: string;
      size?: number;
    }>;
  }

  // If not found, return null
  return null;
}

/**
 * Render an icon by name with fallback
 * @param iconName - The name of the icon
 * @param fallback - Fallback component to render if icon not found
 * @param className - CSS classes to apply
 * @param size - Icon size
 */
export function renderIcon(
  iconName: string | null | undefined,
  fallback: ComponentType<{ className?: string }>,
  className?: string,
  size?: number
) {
  if (!iconName) {
    const FallbackIcon = fallback;
    return <FallbackIcon className={className} size={size} />;
  }

  const IconComponent = getIconByName(iconName);

  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }

  // If icon not found, show fallback
  const FallbackIcon = fallback;
  return <FallbackIcon className={className} size={size} />;
}

