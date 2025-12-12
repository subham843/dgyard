"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User, Search, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/lib/hooks/use-settings";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  // Default to dark text (light nav = false) for light backgrounds
  const [isLightNav, setIsLightNav] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { data: session, status } = useSession();
  const { settings } = useSettings();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch cart count
  const fetchCartCount = async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch("/api/cart");
        if (response.ok) {
          const data = await response.json();
          const totalItems = data.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
          setCartCount(totalItems);
        }
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    } else {
      setCartCount(0);
    }
  };

  // Fetch cart count on mount and when session changes
  useEffect(() => {
    fetchCartCount();
    
    // Listen for cart updates from other pages
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    
    window.addEventListener("cartUpdated", handleCartUpdate);
    
    // Poll for cart updates (every 30 seconds - further reduced for performance)
    const interval = setInterval(fetchCartCount, 30000);
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      clearInterval(interval);
    };
  }, [session]);

  // Handle navigation loading state
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Detect dark backgrounds behind navbar - Rebuilt for reliability
  useEffect(() => {
    const checkBackgroundColor = () => {
      if (!headerRef.current) return;

      try {
        const headerRect = headerRef.current.getBoundingClientRect();
        const headerBottomY = headerRect.bottom;
        const centerX = window.innerWidth / 2;
        const checkY = headerBottomY + 5;

        // Get element directly below the navbar
        const elementBelow = document.elementFromPoint(centerX, checkY);
        
        if (!elementBelow) {
          // Default to light background (dark text)
          setIsLightNav(false);
          return;
        }

        let currentElement: HTMLElement | null = elementBelow as HTMLElement;
        let foundDark = false;
        let foundLight = false;

        // Traverse up the DOM tree
        for (let i = 0; i < 15 && currentElement; i++) {
          const classList = currentElement.classList.toString();
          
          // Check for explicit dark background classes
          const darkPatterns = [
            'bg-slate-950', 'bg-slate-900', 'bg-slate-800',
            'bg-gray-900', 'bg-gray-800',
            'bg-black', 'bg-blue-950', 'bg-indigo-950',
            'from-slate-950', 'to-slate-950', 'via-slate-950',
            'from-gray-900', 'to-gray-900',
            'from-blue-950', 'to-indigo-950', 'via-blue-950', 'via-indigo-950'
          ];
          
          // Check for explicit light background classes
          const lightPatterns = [
            'bg-white', 'bg-gray-50', 'bg-gray-100',
            'from-white', 'to-white', 'via-white',
            'from-gray-50', 'to-gray-50', 'via-gray-50',
            'from-gray-100', 'to-gray-100'
          ];

          // Check class patterns
          if (darkPatterns.some(pattern => classList.includes(pattern))) {
            foundDark = true;
            break;
          }
          
          if (lightPatterns.some(pattern => classList.includes(pattern))) {
            foundLight = true;
            break;
          }

          // Check computed background color
          try {
            const computedStyle = window.getComputedStyle(currentElement);
            const bgColor = computedStyle.backgroundColor;
            const opacity = parseFloat(computedStyle.opacity);
            
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' && opacity > 0.1) {
              const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
              if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                const alpha = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
                const brightness = (r + g + b) / 3;
                
                // Dark background: brightness < 100
                if (brightness < 100 && alpha > 0.2) {
                  foundDark = true;
                  break;
                }
                // Light background: brightness > 200
                if (brightness > 200 && alpha > 0.2) {
                  foundLight = true;
                  break;
                }
              }
            }
          } catch (e) {
            // Continue if style check fails
          }

          currentElement = currentElement.parentElement;
        }

        // Set state based on what we found
        if (foundDark) {
          setIsLightNav(true); // White text for dark background
        } else if (foundLight) {
          setIsLightNav(false); // Dark text for light background
        } else {
          // Default to light background if uncertain
          setIsLightNav(false);
        }
      } catch (error) {
        // Default to light background on error
        setIsLightNav(false);
      }
    };

    // Run checks at multiple intervals
    checkBackgroundColor();
    
    const timeouts: NodeJS.Timeout[] = [];
    
    // Immediate checks
    timeouts.push(setTimeout(checkBackgroundColor, 50));
    timeouts.push(setTimeout(checkBackgroundColor, 150));
    timeouts.push(setTimeout(checkBackgroundColor, 300));
    
    // After DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        checkBackgroundColor();
        timeouts.push(setTimeout(checkBackgroundColor, 100));
        timeouts.push(setTimeout(checkBackgroundColor, 300));
      }, { once: true });
    } else {
      timeouts.push(setTimeout(checkBackgroundColor, 100));
      timeouts.push(setTimeout(checkBackgroundColor, 300));
    }
    
    // After window load
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        checkBackgroundColor();
        timeouts.push(setTimeout(checkBackgroundColor, 200));
      }, { once: true });
    }

    // Scroll handler - check on scroll
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkBackgroundColor, 50);
    };

    // Resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkBackgroundColor, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(scrollTimeout);
      clearTimeout(resizeTimeout);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname]);

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/solutions", label: "Solutions" },
    { href: "/quotation", label: "Get Quotation" },
    { href: "/services/book", label: "Book a Service" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const servicesDropdownItems = [
    { href: "/services/security-surveillance", label: "Security & Surveillance" },
    { href: "/services/networking-it", label: "Networking & IT Solutions" },
    { href: "/services/digital-marketing", label: "Digital Marketing & Branding" },
    { href: "/services/av-fire-infrastructure", label: "AV, Fire & Smart Infrastructure" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target as Node)) {
        setServicesDropdownOpen(false);
      }
    };

    if (servicesDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [servicesDropdownOpen]);

  const navItemClass = isLightNav 
    ? "text-white hover:text-gray-100" 
    : "text-gray-800 hover:text-gray-950";
  
  const navUnderlineClass = isLightNav
    ? "bg-white"
    : "bg-gray-800";
  
  const navBgHoverClass = isLightNav
    ? "bg-white/25"
    : "bg-gray-100/80";
  
  const navBorderClass = isLightNav
    ? "border-white/30 bg-white/10"
    : "border-gray-200 bg-gray-50/50";
  
  const brandTextClass = isLightNav
    ? "text-white group-hover:text-gray-200"
    : "text-gray-900 group-hover:text-gray-950";
  
  const brandTaglineClass = isLightNav
    ? "text-white/90 group-hover:text-white"
    : "text-gray-700 group-hover:text-gray-800";
  
  const headerBgClass = isLightNav
    ? "bg-gray-900/80 backdrop-blur-md border-white/20"
    : "bg-white/95 backdrop-blur-sm border-gray-200";
  
  const iconButtonClass = isLightNav
    ? "text-white hover:text-gray-100 hover:bg-white/25 border-white/30 hover:border-white/60 hover:scale-110"
    : "text-gray-800 hover:text-gray-950 hover:bg-gray-100 border-transparent hover:border-gray-300 hover:scale-110";

  return (
    <header 
      ref={headerRef}
      className={`sticky top-0 z-[100] w-full border-b-2 ${headerBgClass} shadow-md transition-all duration-300`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Site Name Only (No Logo) */}
          <Link href="/" prefetch={true} className="flex items-center group">
            <div className="flex flex-col transition-transform duration-300 ease-in-out group-hover:scale-105">
              <span className={`font-serif font-bold text-xl tracking-wide transition-colors duration-300 ${brandTextClass}`}>
                {settings?.siteName || "D.G.Yard"}
              </span>
              <span className={`text-xs hidden sm:block font-serif italic transition-colors duration-300 ${brandTaglineClass}`}>
                {settings?.siteTagline || "Digital | Secure | Smart Living"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Classical Style */}
          <nav className={`hidden md:flex items-center gap-1 border rounded-lg px-2 py-1 transition-all ${navBorderClass}`}>
            {/* Regular Links */}
            {navLinks.slice(0, 2).map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setIsNavigating(true)}
                  className={`relative px-4 py-2 text-sm font-serif font-medium transition-all duration-300 ease-in-out group ${navItemClass} ${
                    isActive ? "font-semibold" : ""
                  }`}
                >
                  <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">{link.label}</span>
                  {/* Active underline - always visible when active */}
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${navUnderlineClass} transform ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  } transition-transform duration-300 ease-out origin-left rounded-full`}></span>
                  {/* Background hover/active effect */}
                  <span className={`absolute inset-0 ${navBgHoverClass} rounded-md ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-all duration-300 ease-in-out`}></span>
                </Link>
              );
            })}

            {/* Services Dropdown */}
            <div ref={servicesDropdownRef} className="relative">
              {(() => {
                const isServiceActive = servicesDropdownItems.some(item => 
                  pathname === item.href || pathname?.startsWith(item.href)
                );
                return (
                  <div
                    className={`relative px-4 py-2 text-sm font-serif font-medium transition-all duration-300 ease-in-out group cursor-pointer flex items-center gap-1 ${navItemClass} ${
                      servicesDropdownOpen || isServiceActive ? "opacity-100" : ""
                    } ${isServiceActive ? "font-semibold" : ""}`}
                    onMouseEnter={() => setServicesDropdownOpen(true)}
                    onMouseLeave={() => setServicesDropdownOpen(false)}
                  >
                    <div className="relative z-10 flex items-center gap-1 transition-transform duration-300 group-hover:scale-105">
                      Services
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ease-in-out ${servicesDropdownOpen ? "rotate-180" : "group-hover:rotate-90"}`} />
                    </div>
                    {/* Active underline - always visible when service is active */}
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${navUnderlineClass} transform ${
                      isServiceActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    } transition-transform duration-300 ease-out origin-left rounded-full`}></span>
                    {/* Background hover/active effect */}
                    <span className={`absolute inset-0 ${navBgHoverClass} rounded-md ${
                      isServiceActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } transition-all duration-300 ease-in-out`}></span>
                  </div>
                );
              })()}

              {/* Dropdown Menu */}
              <AnimatePresence>
                {servicesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => setServicesDropdownOpen(true)}
                    onMouseLeave={() => setServicesDropdownOpen(false)}
                    className={`absolute top-full left-0 mt-2 w-64 rounded-lg border-2 shadow-xl z-50 ${
                      isLightNav
                        ? "border-white/30 bg-gray-900/95 backdrop-blur-md"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="py-2">
                      {servicesDropdownItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            onClick={() => {
                              setServicesDropdownOpen(false);
                              setIsNavigating(true);
                            }}
                            className={`block px-4 py-3 text-sm font-serif font-medium transition-all duration-300 ease-in-out rounded-md ${
                              isLightNav
                                ? `text-white hover:text-gray-200 hover:bg-white/15 hover:translate-x-1 ${isActive ? "bg-white/20 font-semibold" : ""}`
                                : `text-gray-800 hover:text-gray-900 hover:bg-gray-50 hover:translate-x-1 ${isActive ? "bg-gray-100 font-semibold" : ""}`
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Other Links */}
            {navLinks.slice(2).map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setIsNavigating(true)}
                  className={`relative px-4 py-2 text-sm font-serif font-medium transition-all duration-300 ease-in-out group ${navItemClass} ${
                    isActive ? "font-semibold" : ""
                  }`}
                >
                  <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">{link.label}</span>
                  {/* Active underline - always visible when active */}
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${navUnderlineClass} transform ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  } transition-transform duration-300 ease-out origin-left rounded-full`}></span>
                  {/* Background hover/active effect */}
                  <span className={`absolute inset-0 ${navBgHoverClass} rounded-md ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-all duration-300 ease-in-out`}></span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions - Classical Style */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`hidden sm:flex border rounded-md transition-all ${iconButtonClass}`}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`relative border rounded-md transition-all ${iconButtonClass}`}
              asChild
            >
              <Link href="/cart" prefetch={false}>
              <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center font-serif font-bold border-2 ${
                    isLightNav 
                      ? "bg-white text-gray-900 border-gray-900" 
                      : "bg-gray-900 text-white border-white"
                  }`}>
                    {cartCount > 99 ? "99+" : cartCount}
              </span>
                )}
              </Link>
            </Button>
            {/* Only show auth buttons when session status is determined (not loading) */}
            {status === "loading" ? null : session ? (
              <div className={`flex items-center gap-2 border-l pl-3 transition-colors ${
                isLightNav ? "border-white/30" : "border-gray-300"
              }`}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`border rounded-md transition-all ${iconButtonClass}`}
                asChild
              >
                <Link href="/dashboard">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Logout"
                  className={`border rounded-md transition-all ${iconButtonClass}`}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className={`hidden sm:flex items-center gap-2 border-l pl-3 transition-colors ${
                isLightNav ? "border-white/30" : "border-gray-300"
              }`}>
                <Button 
                  variant="outline" 
                  asChild 
                  className={`font-serif rounded-md transition-all ${
                    isLightNav
                      ? "text-white hover:text-gray-200 border-white/50 hover:border-white/70 bg-white/10 hover:bg-white/20"
                      : "text-gray-800 hover:text-gray-900 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                  }`}
                >
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className={`font-serif rounded-md shadow-md transition-all ${
                    isLightNav
                      ? "bg-white text-gray-900 hover:bg-gray-200 border-2 border-white hover:border-gray-300"
                      : "bg-gray-900 hover:bg-gray-800 text-white border-2 border-gray-900 hover:border-gray-800"
                  }`}
                >
                  <Link href="/auth/signup" prefetch={false}>Sign Up</Link>
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden border rounded-md transition-all ${iconButtonClass}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Classical Style */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-t-2 shadow-lg transition-all ${
              isLightNav
                ? "border-white/20 bg-gray-900/95 backdrop-blur-md"
                : "border-gray-200 bg-white"
            }`}
          >
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {/* Regular Links */}
              {navLinks.slice(0, 2).map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsNavigating(true);
                    }}
                    className={`block py-3 px-4 text-sm font-serif font-medium rounded-md border-l-2 transition-all duration-300 ease-in-out ${
                      isActive
                        ? isLightNav
                          ? "text-white bg-white/20 border-white/50 font-semibold"
                          : "text-gray-900 bg-gray-100 border-gray-400 font-semibold"
                        : isLightNav
                          ? "text-white hover:text-gray-100 hover:bg-white/15 hover:border-white/50 hover:translate-x-1 border-transparent"
                          : "text-gray-800 hover:text-gray-950 hover:bg-gray-50 hover:border-gray-400 hover:translate-x-1 border-transparent"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Services with Mobile Dropdown */}
              <div>
                <button
                  onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                  className={`w-full flex items-center justify-between py-3 px-4 text-sm font-serif font-medium rounded-md border-l-2 border-transparent transition-all duration-300 ease-in-out ${
                    isLightNav
                      ? "text-white hover:text-gray-100 hover:bg-white/15 hover:border-white/50 hover:translate-x-1"
                      : "text-gray-800 hover:text-gray-950 hover:bg-gray-50 hover:border-gray-400 hover:translate-x-1"
                  }`}
                >
                  <span>Services</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${servicesDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {servicesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 mt-1 space-y-1"
                    >
                      {servicesDropdownItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setServicesDropdownOpen(false);
                              setIsNavigating(true);
                            }}
                            className={`block py-2 px-4 text-sm font-serif font-medium rounded-md border-l-2 transition-all ${
                              isActive
                                ? isLightNav
                                  ? "text-white bg-white/20 border-white/50 font-semibold"
                                  : "text-gray-900 bg-gray-100 border-gray-400 font-semibold"
                                : isLightNav
                                  ? "text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/50 border-transparent"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-400 border-transparent"
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other Links */}
              {navLinks.slice(2).map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsNavigating(true);
                    }}
                    className={`block py-3 px-4 text-sm font-serif font-medium rounded-md border-l-2 transition-all duration-300 ease-in-out ${
                      isActive
                        ? isLightNav
                          ? "text-white bg-white/20 border-white/50 font-semibold"
                          : "text-gray-900 bg-gray-100 border-gray-400 font-semibold"
                        : isLightNav
                          ? "text-white hover:text-gray-100 hover:bg-white/15 hover:border-white/50 hover:translate-x-1 border-transparent"
                          : "text-gray-800 hover:text-gray-950 hover:bg-gray-50 hover:border-gray-400 hover:translate-x-1 border-transparent"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/cart"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsNavigating(true);
                }}
                className={`block py-3 px-4 text-sm font-serif font-medium rounded-md border-l-2 transition-all flex items-center gap-2 ${
                  pathname === "/cart"
                    ? isLightNav
                      ? "text-white bg-white/20 border-white/50 font-semibold"
                      : "text-gray-900 bg-gray-100 border-gray-400 font-semibold"
                    : isLightNav
                      ? "text-white hover:text-gray-200 hover:bg-white/10 hover:border-white/50 border-transparent"
                      : "text-gray-800 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-400 border-transparent"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
                {cartCount > 0 && (
                  <span className={`ml-auto text-xs rounded-full px-2 py-0.5 font-serif font-bold border-2 ${
                    isLightNav
                      ? "bg-white text-gray-900 border-gray-900"
                      : "bg-gray-900 text-white border-white"
                  }`}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              {status === "loading" ? null : session ? (
                <div className={`pt-4 space-y-2 border-t-2 transition-colors ${
                  isLightNav ? "border-white/20" : "border-gray-200"
                }`}>
                  <Button 
                    variant="outline" 
                    className={`w-full font-serif transition-all ${
                      isLightNav
                        ? "border-white/50 hover:border-white/70 bg-white/10 hover:bg-white/20 text-white hover:text-gray-200"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    asChild
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full font-serif"
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className={`pt-4 space-y-2 border-t-2 transition-colors ${
                  isLightNav ? "border-white/20" : "border-gray-200"
                }`}>
                  <Button 
                    variant="outline" 
                    className={`w-full font-serif transition-all ${
                      isLightNav
                        ? "border-white/50 hover:border-white/70 bg-white/10 hover:bg-white/20 text-white hover:text-gray-200"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    asChild
                  >
                    <Link href="/auth/signin" prefetch={false}>Sign In</Link>
                  </Button>
                  <Button 
                    className={`w-full font-serif border-2 transition-all ${
                      isLightNav
                        ? "bg-white text-gray-900 hover:bg-gray-200 border-white hover:border-gray-300"
                        : "bg-gray-900 hover:bg-gray-800 text-white border-gray-900"
                    }`}
                    asChild
                  >
                    <Link href="/auth/signup" prefetch={false}>Sign Up</Link>
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}



