"use client";

import { useEffect } from "react";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Immediate fix on page load - remove any stuck overlays
    const fixOverlays = () => {
      // Remove all black overlays that don't have dialog content
      const overlays = document.querySelectorAll(
        'div[class*="fixed"][class*="inset-0"], [data-radix-dialog-overlay]'
      );
      
      overlays.forEach((overlay) => {
        const element = overlay as HTMLElement;
        const style = window.getComputedStyle(element);
        const bgColor = style.backgroundColor;
        
        // Check if it's a black overlay
        if (bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgba(0, 0, 0')) {
          const hasContent = element.querySelector('[role="dialog"], [data-radix-dialog-content], form, [class*="DialogContent"]');
          if (!hasContent) {
            console.log("Removing stuck overlay on page load");
            element.remove();
          }
        }
      });
    };

    // Run immediately
    fixOverlays();
    
    // Run after a short delay
    setTimeout(fixOverlays, 500);
    setTimeout(fixOverlays, 1000);
  }, []);

  return <>{children}</>;
}











