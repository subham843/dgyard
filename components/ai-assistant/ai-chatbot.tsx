"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Minimize2, Maximize2, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX, Settings } from "lucide-react";
import { HoneyIcon } from "./honey-icon";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  showCTAs?: boolean; // Whether to show CTA buttons for this message
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Namaste! I'm Honey. How can I help you today? I can help you with product selection, service booking, price calculations, quotations, or any questions about the website.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState<"en-IN" | "hi-IN">("en-IN");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isFromVoiceInput, setIsFromVoiceInput] = useState(false);
  const [permissionInstructions, setPermissionInstructions] = useState("");
  const [voiceSettings, setVoiceSettings] = useState<{
    aiVoiceName?: string;
    aiVoiceLang?: string;
    aiVoiceRate?: number;
    aiVoicePitch?: number;
    aiVoiceVolume?: number;
    aiVoiceURI?: string;
  } | null>(null);
  // Use ref to always have latest voiceSettings in speakText
  const voiceSettingsRef = useRef<{
    aiVoiceName?: string;
    aiVoiceLang?: string;
    aiVoiceRate?: number;
    aiVoicePitch?: number;
    aiVoiceVolume?: number;
    aiVoiceURI?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Load voice settings from API
  useEffect(() => {
    const loadVoiceSettings = async () => {
      try {
        // Use public API endpoint with caching
        const response = await fetch("/api/settings", {
          next: { revalidate: 300 }, // Cache for 5 minutes
        });
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            const settings = {
              aiVoiceName: data.settings.aiVoiceName,
              aiVoiceLang: data.settings.aiVoiceLang,
              aiVoiceRate: data.settings.aiVoiceRate,
              aiVoicePitch: data.settings.aiVoicePitch,
              aiVoiceVolume: data.settings.aiVoiceVolume,
              aiVoiceURI: data.settings.aiVoiceURI,
            };
            setVoiceSettings(settings);
            // Also update ref so speakText always has latest settings
            voiceSettingsRef.current = settings;
            console.log("✅ Voice settings loaded from API:", {
              name: settings.aiVoiceName,
              lang: settings.aiVoiceLang,
              rate: settings.aiVoiceRate,
              pitch: settings.aiVoicePitch,
              volume: settings.aiVoiceVolume,
              uri: settings.aiVoiceURI,
            });
          } else {
            console.log("⚠️ No settings found in API response");
          }
        } else {
          console.error("❌ Failed to load voice settings:", response.status);
        }
      } catch (error) {
        console.error("❌ Error loading voice settings:", error);
      }
    };
    loadVoiceSettings();
    
    // Reload settings every 5 minutes to get latest changes from admin panel (reduced frequency)
    const interval = setInterval(loadVoiceSettings, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Detect language from text (Hindi, English, or Hinglish)
  const detectLanguage = (text: string): "en-IN" | "hi-IN" => {
    if (!text || text.trim().length === 0) {
      return "en-IN"; // Default to English
    }

    const lowerText = text.toLowerCase();
    
    // Hindi Unicode range: \u0900-\u097F
    const hindiRegex = /[\u0900-\u097F]/;
    const hasHindi = hindiRegex.test(text);
    
    // Common Hindi words in Romanized form (English script)
    const romanizedHindiWords = [
      'kaisi', 'kaise', 'kaun', 'kya', 'kab', 'kahan', 'kyon', 'kis', 'kisne', 'kisko',
      'ho', 'hai', 'hain', 'hoga', 'hogi', 'honge', 'tha', 'thi', 'the',
      'mein', 'se', 'ko', 'ka', 'ki', 'ke', 'par', 'aur', 'ya', 'bhi', 'nahi', 'na',
      'karta', 'karti', 'karte', 'kar', 'kara', 'kari', 'kiya', 'kiye',
      'chahiye', 'chahiye', 'chahie', 'hona', 'hone', 'honi',
      'aap', 'tum', 'main', 'hum', 'wo', 'ye', 'unhe', 'unko',
      'service', 'services', 'sabhi', 'sab', 'kitna', 'kitne', 'kitni',
      'provide', 'karta', 'karti', 'karte', 'deta', 'deti', 'dete'
    ];
    
    // Check for Romanized Hindi words
    const hasRomanizedHindi = romanizedHindiWords.some(word => 
      lowerText.includes(word) || 
      new RegExp(`\\b${word}\\b`).test(lowerText)
    );
    
    // Count Hindi and English characters
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.replace(/[^a-zA-Z\u0900-\u097F]/g, '').length;

    // If Hindi Unicode characters present
    if (hasHindi && totalChars > 0) {
      const hindiPercentage = (hindiChars / totalChars) * 100;
      if (hindiPercentage > 10 || hindiChars > 2) {
        console.log("✅ Detected Hindi (Unicode):", { hindiChars, totalChars, hindiPercentage, text: text.substring(0, 50) });
        return "hi-IN";
      }
    }
    
    // If Romanized Hindi words detected, consider it Hindi/Hinglish
    if (hasRomanizedHindi) {
      console.log("✅ Detected Hindi/Hinglish (Romanized):", { text: text.substring(0, 50), matchedWords: romanizedHindiWords.filter(w => lowerText.includes(w)) });
      return "hi-IN";
    }

    // Default to English
    console.log("❌ Detected English:", { text: text.substring(0, 50) });
    return "en-IN";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Check authentication and profile completion
  const checkAuthBeforeOpen = async (onSuccess: () => void) => {
    if (sessionStatus === "loading") {
      setCheckingAuth(true);
      return;
    }

    if (sessionStatus === "unauthenticated" || !session?.user?.id) {
      // Redirect to login with callback
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    // Check profile completion
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        const profileComplete = !!(user?.name && user?.email && user?.phone);
        const phoneVerified = user?.phoneVerified === true;

        if (!profileComplete) {
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=complete`);
          return;
        }

        if (!phoneVerified) {
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=verify-phone`);
          return;
        }

        // All checks passed
        setUserProfile(user);
        onSuccess();
      } else {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Listen for openHoneyChat events from inline helpers
  useEffect(() => {
    const handleOpenChat = async (event: CustomEvent) => {
      // Check auth before opening
      await checkAuthBeforeOpen(() => {
        setIsOpen(true);
        setIsMinimized(false);
        if (event.detail?.message) {
          const message = event.detail.message;
          setInput(message);
          // Auto send after a short delay
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              // Trigger send
              const sendEvent = new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                bubbles: true,
              });
              inputRef.current.dispatchEvent(sendEvent);
              // Also directly send if input is set
              if (message && !isLoading) {
                sendMessageDirectly(message);
              }
            }
          }, 500);
        }
      });
    };

    window.addEventListener("openHoneyChat", handleOpenChat as EventListener);
    return () => {
      window.removeEventListener("openHoneyChat", handleOpenChat as EventListener);
    };
  }, [isLoading, sessionStatus, session, pathname, router]);

  // Check microphone permission
  const checkMicrophonePermission = async () => {
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
        return result.state;
      } catch (error) {
        console.error("Permission check error:", error);
        return "prompt";
      }
    }
    return "prompt";
  };

  // Open browser settings for microphone permission
  const openMicrophoneSettings = async () => {
    // Show instructions based on browser
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = "";
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (userAgent.includes("chrome") || userAgent.includes("chromium")) {
      if (isMobile) {
        instructions = "Mobile Chrome:\n1. Tap the three dots (⋮) in address bar\n2. Tap 'Site settings'\n3. Tap 'Microphone'\n4. Select 'Allow'";
      } else {
        instructions = "Desktop Chrome:\n1. Click the lock icon (🔒) in address bar\n2. Click 'Site settings'\n3. Find 'Microphone' section\n4. Select 'Allow'";
      }
    } else if (userAgent.includes("firefox")) {
      if (isMobile) {
        instructions = "Mobile Firefox:\n1. Tap the lock icon in address bar\n2. Tap 'Permissions'\n3. Tap 'Microphone'\n4. Select 'Allow'";
      } else {
        instructions = "Desktop Firefox:\n1. Click the lock icon (🔒) in address bar\n2. Click 'Permissions'\n3. Find 'Microphone'\n4. Select 'Allow'";
      }
    } else if (userAgent.includes("safari")) {
      instructions = "Safari:\n1. Go to Safari menu\n2. Preferences → Websites\n3. Select 'Microphone'\n4. Set to 'Allow' for this site";
    } else if (userAgent.includes("edge")) {
      if (isMobile) {
        instructions = "Mobile Edge:\n1. Tap the lock icon in address bar\n2. Tap 'Permissions'\n3. Tap 'Microphone'\n4. Select 'Allow'";
      } else {
        instructions = "Desktop Edge:\n1. Click the lock icon (🔒) in address bar\n2. Click 'Permissions'\n3. Find 'Microphone'\n4. Select 'Allow'";
      }
    } else {
      instructions = "Please go to browser settings and enable microphone permission for this site";
    }

    setPermissionInstructions(instructions);

    // Try to request permission first - this will trigger browser's permission prompt
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted, stop the stream
      stream.getTracks().forEach(track => track.stop());
      setShowPermissionDialog(false);
      toast.success("Microphone permission granted! You can now use voice input.");
      return;
    } catch (error: any) {
      // Permission denied or not available
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        // Show dialog with instructions
        // On mobile, user MUST click button to trigger permission (no auto-retry)
        setShowPermissionDialog(true);
      } else {
        toast.error("Could not access microphone. Please check your browser settings.");
      }
    }
  };

  // Retry permission request - MUST be called from user interaction (button click) for mobile
  const retryPermissionRequest = async (event?: React.MouseEvent | React.TouchEvent) => {
    // Don't prevent default - let browser handle naturally for mobile
    // Mobile browsers need the native event to trigger permission
    
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Microphone access is not supported in this browser. Please use Chrome, Firefox, or Safari.");
      return;
    }

    console.log("Requesting microphone permission from button click...");

    try {
      // Use simple audio constraint - works better on mobile browsers (Android/iOS)
      // Complex constraints might fail on some mobile browsers
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log("Microphone permission granted!");
      
      // Permission granted, stop the stream immediately
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      
      setShowPermissionDialog(false);
      toast.success("Microphone permission granted! You can now use voice input.");
      
      // Try to start recognition if it was requested
      if (recognitionRef.current && !isListening) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error("Error starting recognition:", err);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error("Permission request error:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        // Permission still denied
        toast.error("Permission denied. Please look for the browser permission prompt at the top of your screen and tap 'Allow', or follow the manual steps below.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        toast.error("Microphone is being used by another application. Please close other apps using the microphone.");
      } else if (error.name === "OverconstrainedError") {
        // Try with even simpler constraint
        try {
          console.log("Retrying with simpler constraint...");
          const simpleStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          simpleStream.getTracks().forEach(track => track.stop());
          setShowPermissionDialog(false);
          toast.success("Microphone permission granted!");
        } catch (retryError: any) {
          toast.error("Could not access microphone. Please check your browser settings.");
        }
      } else {
        console.error("Microphone permission error details:", {
          name: error.name,
          message: error.message,
          constraint: error.constraint
        });
        toast.error(`Could not access microphone. ${error.message || error.name}. Please check your browser settings.`);
      }
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = detectedLanguage;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          
          // Detect language from transcript and update recognition language
          const detectedLang = detectLanguage(transcript);
          setDetectedLanguage(detectedLang);
          if (recognition) {
            recognition.lang = detectedLang;
          }
          
          // Mark as voice input
          setIsFromVoiceInput(true);
          
          // Auto send after recognition (mark as voice input)
          setTimeout(() => {
            sendMessageDirectly(transcript, true);
          }, 500);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          
          // Check if mobile
          const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          // Handle permission-related errors
          if (event.error === "not-allowed" || event.error === "audio-capture" || event.error === "service-not-allowed") {
            // Permission denied
            if (isMobileDevice) {
              // On mobile, don't show dialog - browser prompt already appeared
              toast.error("Microphone permission denied. Please allow microphone access in browser settings.");
            } else {
              // On desktop, show permission dialog
              console.log("Permission denied, opening permission dialog...");
              openMicrophoneSettings();
            }
          } else if (event.error === "no-speech") {
            // No speech detected - this is normal, don't show error
            console.log("No speech detected");
          } else if (event.error === "network") {
            toast.error("Network error. Please check your internet connection.");
          } else if (event.error === "aborted") {
            // User stopped or aborted - don't show error
            console.log("Recognition aborted by user");
          } else {
            console.error("Speech recognition error:", event.error);
            // For unknown errors, check if it's permission-related
            if (event.error?.toString().toLowerCase().includes("permission") || 
                event.error?.toString().toLowerCase().includes("not allowed") ||
                event.error?.toString().toLowerCase().includes("denied")) {
              if (isMobileDevice) {
                toast.error("Microphone permission denied. Please allow microphone access in browser settings.");
              } else {
                openMicrophoneSettings();
              }
            } else {
              toast.error("Speech recognition error. Please try again.");
            }
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    // Initialize Text-to-Speech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [detectedLanguage]);

  // Load voices when available
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        // Voices may not be immediately available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          synthRef.current = window.speechSynthesis;
        }
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Speak response with human-like Indian female voice (Google Assistant style)
  const speakText = (text: string, lang: "en-IN" | "hi-IN" = detectedLanguage) => {
    if (!synthRef.current || !text || text.trim().length === 0) return;

    // Stop any ongoing speech
    synthRef.current.cancel();
    
    // Get latest voice settings from ref (always current)
    const currentVoiceSettings = voiceSettingsRef.current || voiceSettings;

    // Clean text - remove any remaining emojis/symbols (extra safety)
    let cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/[🔷🔑✅❌⚠️📋🔄🤖🧠💡📝📊📈📉🎯🚀💼🛠️📹⭐🌟✨💫🔥💯🎉🎊👏🙌👍👎]/g, '')
      .replace(/\*\*/g, '') // Remove markdown
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .trim();

    if (!cleanText || cleanText.length === 0) {
      console.log("⚠️ Text is empty after cleaning, skipping speech");
      return;
    }

    // Fix "Honey" pronunciation - make it sound natural
    cleanText = cleanText.replace(/\bHoney\b/gi, 'Honey'); // Keep as is but ensure proper pronunciation
    // Add slight pause before "Honey" for natural flow
    cleanText = cleanText.replace(/\bI'm Honey\b/gi, "I'm Honey");
    cleanText = cleanText.replace(/\bHoney\b/g, 'Honey'); // Natural pronunciation

    // Improve text for natural speech (add pauses, fix abbreviations)
    cleanText = cleanText
      .replace(/\.\s+/g, '. ') // Natural pauses after periods
      .replace(/,\s+/g, ', ') // Natural pauses after commas
      .replace(/\?\s+/g, '? ') // Natural pauses after questions
      .replace(/!\s+/g, '! ') // Natural pauses after exclamations
      .replace(/\n+/g, '. ') // Convert newlines to pauses
      .replace(/\s+/g, ' '); // Remove extra spaces

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Use settings from admin panel if available (from ref first, then state)
    const settingsLang = currentVoiceSettings?.aiVoiceLang || lang;
    utterance.lang = settingsLang;
    
    // Use voice parameters from settings if available
    utterance.rate = currentVoiceSettings?.aiVoiceRate ?? 1.0;
    utterance.pitch = currentVoiceSettings?.aiVoicePitch ?? 1.0;
    utterance.volume = currentVoiceSettings?.aiVoiceVolume ?? 1.0;
    
    // Add natural pauses for better flow
    utterance.onboundary = (event) => {
      // Natural speech boundaries
    };

    // Get all available voices
    const voices = synthRef.current.getVoices();
    
    // Priority order for voice selection (humanized Indian female voice - Google Assistant style)
    let selectedVoice = null;
    
    console.log("🔊 Available voices:", voices.map(v => `${v.name} (${v.lang})`).slice(0, 10));
    
    // 0. FIRST PRIORITY: Use voice from admin settings if set
    console.log("🎯 Current voiceSettings:", {
      fromRef: voiceSettingsRef.current,
      fromState: voiceSettings,
      aiVoiceName: currentVoiceSettings?.aiVoiceName,
      aiVoiceURI: currentVoiceSettings?.aiVoiceURI,
      aiVoiceLang: currentVoiceSettings?.aiVoiceLang,
      hasSettings: !!currentVoiceSettings
    });
    
    if (currentVoiceSettings?.aiVoiceName || currentVoiceSettings?.aiVoiceURI) {
      console.log("🔍 Looking for voice from settings:", {
        name: currentVoiceSettings.aiVoiceName,
        uri: currentVoiceSettings.aiVoiceURI,
        lang: currentVoiceSettings.aiVoiceLang,
        totalAvailableVoices: voices.length,
        availableVoices: voices.map(v => `${v.name} (${v.lang})`).slice(0, 20)
      });
      
      // Try exact match first (by name) - case sensitive
      if (currentVoiceSettings.aiVoiceName) {
        selectedVoice = voices.find(
          (voice) => voice.name === currentVoiceSettings.aiVoiceName
        );
        if (selectedVoice) {
          console.log("✅ Found exact match by name:", selectedVoice.name, "| URI:", selectedVoice.voiceURI);
        } else {
          console.log("❌ Exact name match not found:", currentVoiceSettings.aiVoiceName);
        }
      }
      
      // Try exact match by URI
      if (!selectedVoice && currentVoiceSettings.aiVoiceURI) {
        selectedVoice = voices.find(
          (voice) => voice.voiceURI === currentVoiceSettings.aiVoiceURI
        );
        if (selectedVoice) {
          console.log("✅ Found exact match by URI:", selectedVoice.name, "| URI:", selectedVoice.voiceURI);
        } else {
          console.log("❌ Exact URI match not found:", currentVoiceSettings.aiVoiceURI);
        }
      }
      
      // If exact match not found, try case-insensitive match
      if (!selectedVoice && currentVoiceSettings.aiVoiceName) {
        const searchName = currentVoiceSettings.aiVoiceName.toLowerCase().trim();
        selectedVoice = voices.find(
          (voice) => voice.name.toLowerCase().trim() === searchName
        );
        if (selectedVoice) {
          console.log("✅ Found case-insensitive match:", selectedVoice.name);
        }
      }
      
      // If exact match not found, try partial match (for cases like "Google हिन्दी")
      if (!selectedVoice && currentVoiceSettings.aiVoiceName) {
        const searchName = currentVoiceSettings.aiVoiceName.toLowerCase().trim();
        // Try to find voice that contains the search name or vice versa
        selectedVoice = voices.find(
          (voice) => {
            const voiceName = voice.name.toLowerCase().trim();
            return voiceName === searchName || 
                   voiceName.includes(searchName) || 
                   searchName.includes(voiceName) ||
                   // For "Google हिन्दी", also try matching "google" and "hindi"
                   (searchName.includes("google") && voiceName.includes("google") && (searchName.includes("hindi") || searchName.includes("हिन्दी") || voiceName.includes("hindi"))) ||
                   (searchName.includes("हिन्दी") && (voiceName.includes("hindi") || voiceName.includes("हिन्दी"))) ||
                   // Match first word if it's a common pattern
                   (searchName.split(/\s+/)[0].length > 3 && voiceName.includes(searchName.split(/\s+/)[0]));
          }
        );
        if (selectedVoice) {
          console.log("✅ Found partial match:", selectedVoice.name);
        }
      }
      
      // If still not found, try by language and name keywords
      if (!selectedVoice && currentVoiceSettings.aiVoiceLang && currentVoiceSettings.aiVoiceName) {
        const searchName = currentVoiceSettings.aiVoiceName.toLowerCase();
        const keywords = searchName.split(/\s+|[-_]/).filter(k => k.length > 2);
        const settingsLang = currentVoiceSettings.aiVoiceLang;
        console.log("🔍 Trying language + keyword match:", { keywords, settingsLang });
        selectedVoice = voices.find(
          (voice) => {
            const voiceName = voice.name.toLowerCase();
            const matchesLang = voice.lang === settingsLang || 
                               voice.lang.includes(settingsLang!) ||
                               settingsLang!.includes(voice.lang) ||
                               voice.lang.startsWith(settingsLang!.split('-')[0]);
            const matchesKeyword = keywords.length > 0 && keywords.some(k => voiceName.includes(k));
            return matchesLang && matchesKeyword &&
                   (!voice.name.toLowerCase().includes("male")) &&
                   (!voice.name.toLowerCase().includes("heera"));
          }
        );
        if (selectedVoice) {
          console.log("✅ Found by language and keyword:", selectedVoice.name);
        }
      }
      
      // If still not found, try by language only (for Hindi, find any Hindi voice)
      if (!selectedVoice && currentVoiceSettings.aiVoiceLang) {
        const settingsLang = currentVoiceSettings.aiVoiceLang;
        console.log("🔍 Trying language-only match:", settingsLang);
        selectedVoice = voices.find(
          (voice) =>
            (voice.lang === settingsLang || 
             voice.lang.includes(settingsLang!) ||
             settingsLang!.includes(voice.lang) ||
             voice.lang.startsWith(settingsLang!.split('-')[0])) &&
            (!voice.name.toLowerCase().includes("male")) &&
            (!voice.name.toLowerCase().includes("heera"))
        );
        if (selectedVoice) {
          console.log("✅ Found by language only:", selectedVoice.name);
        }
      }
      
      // For Hindi, if still not found, try to find ANY Hindi voice (including male, we'll exclude later)
      if (!selectedVoice && currentVoiceSettings.aiVoiceLang && currentVoiceSettings.aiVoiceLang.includes("hi")) {
        console.log("🔍 Trying any Hindi voice match");
        selectedVoice = voices.find(
          (voice) =>
            (voice.lang.includes("hi") || voice.lang.includes("HI")) &&
            (!voice.name.toLowerCase().includes("heera"))
        );
        if (selectedVoice) {
          console.log("✅ Found any Hindi voice:", selectedVoice.name);
        }
      }
      
      if (selectedVoice) {
        console.log("✅✅✅ USING VOICE FROM SETTINGS:", selectedVoice.name, "| Language:", selectedVoice.lang, "| URI:", selectedVoice.voiceURI);
      } else {
        console.error("❌❌❌ Voice from settings NOT FOUND:", {
          requestedName: currentVoiceSettings.aiVoiceName,
          requestedURI: currentVoiceSettings.aiVoiceURI,
          requestedLang: currentVoiceSettings.aiVoiceLang,
          availableVoices: voices.map(v => ({ name: v.name, lang: v.lang, uri: v.voiceURI }))
        }, "| Falling back to auto-selection");
      }
    } else {
      console.log("⚠️ No voice settings found - using auto-selection");
    }
    
    // Auto-selection fallback: Only run if no voice was selected from settings
    if (!selectedVoice) {
      // 1. Try to find Google Neural voices (most human-like, Google Assistant style)
      // EXCLUDE Heera - too slow and weird
      selectedVoice = voices.find(
        (voice) =>
          (voice.lang.startsWith(lang) || voice.lang.includes("IN")) &&
          (voice.name.toLowerCase().includes("neural") || 
           voice.name.toLowerCase().includes("premium") ||
           voice.name.toLowerCase().includes("enhanced")) &&
          (!voice.name.toLowerCase().includes("heera")) && // Exclude Heera
          (voice.name.toLowerCase().includes("female") || 
           voice.name.toLowerCase().includes("woman") ||
           voice.name.toLowerCase().includes("india") ||
           voice.name.toLowerCase().includes("indian") ||
           !voice.name.toLowerCase().includes("male"))
      );
      
      // 2. Try to find Microsoft Neural voices (also very human-like)
      // EXCLUDE Heera - too slow and weird
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            (voice.lang.startsWith(lang) || voice.lang.includes("IN")) &&
            (voice.name.toLowerCase().includes("zira") || // Microsoft female voice
             voice.name.toLowerCase().includes("neural") ||
             voice.name.toLowerCase().includes("premium")) &&
            (!voice.name.toLowerCase().includes("heera")) && // Exclude Heera
            (voice.name.toLowerCase().includes("female") || 
             !voice.name.toLowerCase().includes("male"))
        );
      }
      
      // 3. Try to find Amazon Polly voices (if available - very natural)
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            (voice.lang.startsWith(lang) || voice.lang.includes("IN")) &&
            (voice.name.toLowerCase().includes("polly") ||
             voice.name.toLowerCase().includes("amazon")) &&
            (voice.name.toLowerCase().includes("female") || 
             !voice.name.toLowerCase().includes("male"))
        );
      }
      
      // 4. Try to find Indian female voices by name (sweet, natural voices)
      // EXCLUDE Heera - too slow and weird
      if (!selectedVoice) {
        const preferredNames = [
          'neerja', 'priya', 'kavya', 'swara', 'ananya', 'aditi',
          'geeta', 'meera', 'radha', 'sita', 'lata', 'asha'
        ];
        selectedVoice = voices.find(
          (voice) =>
            (voice.lang.startsWith(lang) || voice.lang.includes("IN")) &&
            preferredNames.some(name => voice.name.toLowerCase().includes(name)) &&
            (!voice.name.toLowerCase().includes("male")) &&
            (!voice.name.toLowerCase().includes("heera")) // Exclude Heera
        );
      }
      
      // 5. Try any female voice with Indian accent (EXCLUDE Heera)
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            (voice.lang.startsWith(lang) || voice.lang.includes("IN")) &&
            (voice.name.toLowerCase().includes("female") || 
             voice.name.toLowerCase().includes("woman") ||
             voice.name.toLowerCase().includes("girl")) &&
            (!voice.name.toLowerCase().includes("male")) &&
            (!voice.name.toLowerCase().includes("heera")) && // Exclude Heera
            (voice.name.toLowerCase().includes("india") || 
             voice.name.toLowerCase().includes("indian") || 
             voice.lang.includes("IN"))
        );
      }
      
      // 6. Try any Indian language female voice (EXCLUDE Heera)
      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => 
          (voice.lang.startsWith(lang) || voice.lang.includes("IN")) &&
          (!voice.name.toLowerCase().includes("male")) &&
          (!voice.name.toLowerCase().includes("heera")) // Exclude Heera
        );
      }
      
      // 7. Try any neural/premium voice (most human-like)
      // EXCLUDE Heera - too slow and weird
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            (voice.lang.startsWith(lang) || voice.lang.includes("en") || voice.lang.includes("hi")) &&
            (voice.name.toLowerCase().includes("neural") || 
             voice.name.toLowerCase().includes("premium") ||
             voice.name.toLowerCase().includes("enhanced")) &&
            (!voice.name.toLowerCase().includes("male")) &&
            (!voice.name.toLowerCase().includes("heera")) // Exclude Heera
        );
      }
      
      // 8. Fallback to any female voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices.find((voice) => 
          (voice.lang.includes("en") || voice.lang.includes("hi")) &&
          (!voice.name.toLowerCase().includes("male"))
        ) || voices.find(v => !v.name.toLowerCase().includes("male")) || voices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log("🎤 Using voice:", selectedVoice.name, "| Language:", selectedVoice.lang, "| Rate:", utterance.rate, "| Pitch:", utterance.pitch);
    } else {
      console.log("⚠️ No suitable voice found, using default");
    }

    // Add event listeners for better control
    utterance.onstart = () => {
      console.log("🔊 Speech started");
    };
    
    utterance.onend = () => {
      console.log("🔇 Speech ended");
    };
    
    utterance.onerror = (event) => {
      console.error("❌ Speech error:", event);
    };

    synthRef.current.speak(utterance);
  };

  // Start voice recognition
  const startListening = async () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // On mobile, directly request permission (will trigger browser's native prompt)
    // On desktop, check permission status first
    if (!isMobile) {
      try {
        if (navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
          console.log("Permission status:", permissionStatus.state);
          if (permissionStatus.state === "denied") {
            // Permission already denied - show dialog with instructions
            console.log("Permission already denied, showing dialog...");
            openMicrophoneSettings();
            return;
          }
        }
      } catch (permError) {
        // Permission API not available - continue with getUserMedia
        console.log("Permission API not available, using getUserMedia...");
      }
    }

    try {
      // Check for HTTPS (required for getUserMedia on mobile)
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      if (!isSecureContext && isMobile) {
        toast.error("Microphone access requires HTTPS connection. Please use a secure connection.");
        return;
      }

      // Request microphone permission first
      // This will trigger browser's native permission prompt on mobile
      let getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
      
      console.log("Checking for getUserMedia API...");
      console.log("navigator.mediaDevices:", !!navigator.mediaDevices);
      console.log("navigator.mediaDevices?.getUserMedia:", !!(navigator.mediaDevices?.getUserMedia));
      console.log("User Agent:", navigator.userAgent);
      console.log("Is Secure Context:", isSecureContext);
      
      // Check for modern API first (preferred for all modern browsers including Android Chrome)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("Using navigator.mediaDevices.getUserMedia");
        getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      } 
      // Fallback to older API (for older browsers)
      else if ((navigator as any).getUserMedia) {
        console.log("Using navigator.getUserMedia (legacy)");
        getUserMedia = (constraints: MediaStreamConstraints) => {
          return new Promise((resolve, reject) => {
            (navigator as any).getUserMedia(constraints, resolve, reject);
          });
        };
      }
      // Fallback to webkit prefix (for some mobile browsers)
      else if ((navigator as any).webkitGetUserMedia) {
        console.log("Using navigator.webkitGetUserMedia (webkit)");
        getUserMedia = (constraints: MediaStreamConstraints) => {
          return new Promise((resolve, reject) => {
            (navigator as any).webkitGetUserMedia(constraints, resolve, reject);
          });
        };
      }
      // Fallback to moz prefix (for Firefox)
      else if ((navigator as any).mozGetUserMedia) {
        console.log("Using navigator.mozGetUserMedia (moz)");
        getUserMedia = (constraints: MediaStreamConstraints) => {
          return new Promise((resolve, reject) => {
            (navigator as any).mozGetUserMedia(constraints, resolve, reject);
          });
        };
      }
      else {
        console.error("getUserMedia not available. mediaDevices:", !!navigator.mediaDevices);
        console.error("Available navigator properties:", Object.keys(navigator).filter(k => k.toLowerCase().includes('media') || k.toLowerCase().includes('user')));
        
        // On mobile, provide more helpful error
        if (isMobile) {
          if (!isSecureContext) {
            toast.error("Microphone access requires HTTPS. Please use a secure connection (https://).");
          } else {
            toast.error("Microphone access not available. Please ensure you're using Chrome, Firefox, or Safari browser.");
          }
        } else {
          toast.error("Microphone access is not supported in this browser. Please use Chrome, Firefox, or Safari.");
        }
        return;
      }

      console.log("Requesting microphone permission (will trigger browser prompt on mobile)...");

      // Request microphone permission - this will show browser's native prompt
      const stream = await getUserMedia({ audio: true });
      
      // Permission granted, stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });

      console.log("Microphone permission granted, starting recognition...");

      // Update recognition language and start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.lang = detectedLanguage;
        recognitionRef.current.start();
      }
    } catch (error: any) {
      console.error("Error in startListening:", error);
      
      // On mobile, if permission is denied, don't show dialog - browser prompt already appeared
      // On desktop, show dialog with instructions
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        if (isMobile) {
          // On mobile, browser prompt already appeared, just show a toast
          toast.error("Microphone permission denied. Please allow microphone access in browser settings.");
        } else {
          // On desktop, show dialog with instructions
          console.log("Permission denied, showing dialog with instructions...");
          openMicrophoneSettings();
        }
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        toast.error("Microphone is being used by another application. Please close other apps using the microphone.");
      } else {
        // For other errors, try to start recognition anyway (some browsers allow it)
        console.log("Trying to start recognition despite error...");
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (recognitionError: any) {
            console.error("Recognition start error:", recognitionError);
            // If recognition fails with permission error
            if (recognitionError.name === "not-allowed" || 
                recognitionError.message?.includes("not allowed") ||
                recognitionError.message?.includes("permission") ||
                recognitionError.error === "not-allowed" ||
                recognitionError.error === "audio-capture") {
              if (isMobile) {
                // On mobile, don't show dialog - browser prompt already appeared
                toast.error("Microphone permission denied. Please allow microphone access in browser settings.");
              } else {
                // On desktop, show dialog
                openMicrophoneSettings();
              }
            } else {
              toast.error("Could not start voice recognition. Please try again.");
            }
          }
        } else {
          toast.error("Could not start voice recognition. Please check microphone permissions.");
        }
      }
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Handle voice commands for quotation and shopping
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Quotation commands
    if (lowerCommand.includes("quotation") || lowerCommand.includes("quote") || lowerCommand.includes("क्वोटेशन") || lowerCommand.includes("कीमत")) {
      window.location.href = "/quotation";
      return "Opening quotation page for you...";
    }
    
    // Shopping/Products commands
    if (lowerCommand.includes("shop") || lowerCommand.includes("product") || lowerCommand.includes("buy") || lowerCommand.includes("खरीद") || lowerCommand.includes("उत्पाद")) {
      window.location.href = "/shop";
      return "Opening products page for you...";
    }
    
    // Cart commands
    if (lowerCommand.includes("cart") || lowerCommand.includes("basket") || lowerCommand.includes("टोकरी")) {
      window.location.href = "/cart";
      return "Opening your cart...";
    }
    
    return null;
  };

  const sendMessageDirectly = async (messageText: string, fromVoice: boolean = false) => {
    if (!messageText.trim() || isLoading) return;

    // Detect language from user message
    const detectedLang = detectLanguage(messageText.trim());
    setDetectedLanguage(detectedLang);
    console.log("Detected language:", detectedLang, "from text:", messageText.trim());
    
    // Track if this is from voice input
    const wasFromVoice = fromVoice || isFromVoiceInput;
    setIsFromVoiceInput(false); // Reset flag

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          language: detectedLang, // Send detected language to API
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            userRole: session?.user?.role || "USER",
            currentPath: pathname,
            userId: session?.user?.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      console.log("📥 API Response received:", {
        source: data.source || "unknown",
        response: data.response?.substring(0, 100),
        voiceText: data.voiceText?.substring(0, 100),
        detectedLang,
        hasHindi: /[\u0900-\u097F]/.test(data.response || "")
      });
      
      // Log which API is being used
      if (data.source === "openai") {
        console.log("🤖 ✅ Using OpenAI API for response");
      } else if (data.source === "google-genai") {
        console.log("🔷 ✅ Using Google GenAI API for response");
      } else {
        console.log("📝 ✅ Using rule-based system for response");
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Detect language from response for audio
      const responseLang = detectLanguage(assistantMessage.content);
      console.log("🔊 Audio language detected:", responseLang, "for response:", assistantMessage.content.substring(0, 50));
      
      // Speak the response ONLY if it came from voice input
      // Use voiceText (cleaned, without emojis/symbols) for TTS
      if (wasFromVoice && isVoiceEnabled) {
        const textToSpeak = data.voiceText || assistantMessage.content;
        speakText(textToSpeak, responseLang);
      }
      
      // Check for voice commands
      const commandResponse = handleVoiceCommand(messageText);
      if (commandResponse && wasFromVoice) {
        speakText(commandResponse, detectedLang);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Detect language from user message
    const detectedLang = detectLanguage(input.trim());
    setDetectedLanguage(detectedLang);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          language: detectedLang, // Send detected language to API
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            userRole: session?.user?.role || "USER",
            currentPath: pathname,
            userId: session?.user?.id,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle auth errors with redirect
        if (response.status === 401 || response.status === 403) {
          if (errorData.redirect) {
            router.push(errorData.redirect);
            toast.error(errorData.message || "Authentication required");
            setIsLoading(false);
            return;
          }
        }
        
        throw new Error(errorData.message || "Failed to get response");
      }

      const data = await response.json();
      
      // Detect if we should show CTAs (networking page, AV Fire page, digital marketing page, or related message)
      const isNetworkingPage = pathname?.includes("/services/networking-it") || pathname?.includes("/networking-it") || pathname?.includes("/networking");
      const isAVFirePage = pathname?.includes("/services/av-fire-infrastructure") || pathname?.includes("/av-fire-infrastructure") || pathname?.includes("/av-fire");
      const isDigitalMarketingPage = pathname?.includes("/services/digital-marketing") || pathname?.includes("/digital-marketing");
      const showCTAs = isNetworkingPage || 
                       isAVFirePage ||
                       isDigitalMarketingPage ||
                       data.response?.toLowerCase().includes("d.g.yard") ||
                       data.response?.toLowerCase().includes("book") ||
                       data.response?.toLowerCase().includes("appointment") ||
                       data.response?.toLowerCase().includes("call");
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
        showCTAs: showCTAs || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Don't speak for text input - only for voice input
      // Text input doesn't need audio replay
      // voiceText is available in data.voiceText if needed in future
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCTAClick = async (ctaType: "appointment" | "call" | "quote") => {
    try {
      // Capture lead
      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: ctaType,
          source: "honey_chat",
          page: pathname,
          userId: session?.user?.id,
          context: messages.slice(-3).map(m => m.content).join(" "),
        }),
      });

      if (response.ok) {
        toast.success("Thank you! Our team will contact you shortly.");
        
        // Add a follow-up message
        const followUpMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: ctaType === "appointment" 
            ? "Great! I've noted your appointment request. Our team will contact you soon to schedule a convenient time."
            : ctaType === "call"
            ? "Perfect! I've shared your request with our team. They'll call you shortly."
            : "Excellent! I've submitted your quote request. Our experts will prepare a customized plan for you.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, followUpMessage]);
      } else {
        // Even if API fails, show user-friendly message and redirect
        if (ctaType === "appointment") {
          router.push("/contact?type=appointment");
        } else if (ctaType === "call") {
          router.push("/contact?type=call");
        } else {
          router.push("/contact?type=quote");
        }
      }
    } catch (error) {
      console.error("Error capturing lead:", error);
      // Redirect to contact page as fallback
      if (ctaType === "appointment") {
        router.push("/contact?type=appointment");
      } else if (ctaType === "call") {
        router.push("/contact?type=call");
      } else {
        router.push("/contact?type=quote");
      }
    }
  };

  return (
    <>
      {/* Floating Chat Button - Above WhatsApp - Classical Style with Animation */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
            className="fixed bottom-[160px] right-6 z-50 sm:bottom-[176px]"
          >
            <motion.button
              onClick={() => checkAuthBeforeOpen(() => setIsOpen(true))}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gray-900 hover:bg-gray-800 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group border-2 border-gray-700 hover:border-gray-600 relative"
              title="Chat with Honey"
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
            >
                <HoneyIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              
              {/* Sparkle Effect */}
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-[160px] right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden sm:bottom-[176px] ${
              isMinimized 
                ? "h-16 w-80 sm:w-80" 
                : "h-[calc(100vh-200px)] max-h-[600px] w-[calc(100vw-3rem)] max-w-[384px] sm:w-96"
            } flex flex-col transition-all duration-300`}
          >
            {/* Header - Classical Style */}
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between border-b-2 border-gray-700">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="p-2 bg-gray-800 rounded-lg border border-gray-700"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <div>
                  <h3 className="font-serif font-bold text-sm">Honey</h3>
                  <p className="text-xs text-gray-300 font-serif">Namaste! How can I help you?</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center flex-shrink-0">
                          <HoneyIcon className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-gray-800 text-white border-2 border-gray-700"
                            : "bg-white text-gray-900 border-2 border-gray-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {/* CTA Buttons for assistant messages */}
                        {message.role === "assistant" && message.showCTAs && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleCTAClick("appointment")}
                              className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-serif font-bold"
                            >
                              Book Appointment
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCTAClick("call")}
                              className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-xs font-serif font-bold"
                            >
                              Call D.G.Yard
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCTAClick("quote")}
                              className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-xs font-serif font-bold"
                            >
                              Request Quote
                            </Button>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-700">
                            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                        <HoneyIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white rounded-xl px-4 py-2 border-2 border-gray-200">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  {/* Voice Control */}
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                      className="h-7 px-2"
                      title={isVoiceEnabled ? "Disable voice" : "Enable voice"}
                    >
                      {isVoiceEnabled ? (
                        <Volume2 className="w-3 h-3" />
                      ) : (
                        <VolumeX className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message in English or Hindi..."
                      disabled={isLoading || isListening}
                      className="flex-1"
                    />
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      variant={isListening ? "destructive" : "outline"}
                      className={isListening ? "animate-pulse" : ""}
                      title={isListening ? "Stop listening" : "Start voice input"}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="bg-gray-900 hover:bg-gray-800 text-white border-2 border-gray-900 hover:border-gray-800"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Honey • Free Support • Voice Enabled
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Dialog - Auto-opens when permission denied */}
      <Dialog open={showPermissionDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPermissionDialog(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Microphone Permission Required
            </DialogTitle>
            <DialogDescription className="pt-2">
              Please allow microphone access. <strong>Click the button below</strong> to trigger the browser permission prompt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">📱 Mobile Browser Instructions:</p>
              <p className="text-xs text-blue-800 mb-3">
                On mobile browsers, you <strong>must click the "Request Permission" button below</strong> to show the permission prompt. After clicking, the browser will ask for microphone access - please tap <strong>"Allow"</strong>.
              </p>
              <p className="text-xs text-blue-700 font-semibold">
                ⚠️ The permission prompt will only appear after you click the button (required for mobile):
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Manual Steps:</p>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans">
                {permissionInstructions}
              </pre>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPermissionDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                // Don't prevent default - let browser handle naturally
                retryPermissionRequest(e);
              }}
              onTouchEnd={(e) => {
                // For mobile touch events - use onTouchEnd for better compatibility
                retryPermissionRequest(e as any);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-base shadow-lg active:scale-95 transition-transform"
              autoFocus
              type="button"
            >
              <Mic className="w-5 h-5 mr-2" />
              Tap Here to Show Permission Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

