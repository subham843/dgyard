"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

// Lightweight loading fallback
function PageTransitionLoader() {
  return null; // No loader for instant transitions
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Suspense fallback={<PageTransitionLoader />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          style={{ willChange: "opacity" }} // Optimize for GPU
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}

