import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  storeConversation,
  findSimilarConversations,
  getBestResponseFromKnowledge,
  learnPattern,
  categorizeQuestion,
} from "@/lib/ai-learning";
import { getVoiceFriendlyResponse } from "@/lib/voice-utils";

// Helper function to list available models (for debugging)
async function listAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];
      console.log("📋 Available models:", models.slice(0, 10).join(", "));
      return models;
    } else {
      const errorText = await response.text();
      console.error("❌ Failed to list models:", errorText.substring(0, 200));
      return [];
    }
  } catch (error: any) {
    console.error("⚠️ Could not list available models:", error?.message);
    return [];
  }
}

// Helper function to try a model
async function tryModel(genAI: GoogleGenerativeAI, modelName: string, prompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const errorDetails = error?.response?.data || error?.error || {};
    console.error(`❌ Model ${modelName} failed:`, {
      message: errorMessage.substring(0, 200),
      details: JSON.stringify(errorDetails).substring(0, 200),
      code: error?.code,
      status: error?.status
    });
    return null;
  }
}

// Google GenAI integration (optional - falls back to rule-based if not available)
async function getGoogleGenAIResponse(message: string, context: string, language: "en-IN" | "hi-IN", userName: string | null, userRole?: string, currentPath?: string) {
  const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
  
  if (!googleApiKey) {
    console.log("⚠️ Google GenAI API key not found");
    return null; // Fallback to rule-based
  }

  console.log("🔑 Google GenAI API key found, attempting to use Google GenAI...");

  // List available models on first attempt (for debugging)
  let availableModels: string[] = [];
  if (process.env.NODE_ENV === "development") {
    availableModels = await listAvailableModels(googleApiKey);
  }

    // Check if user is on digital marketing page
    const isDigitalMarketingPage = currentPath?.includes("/services/digital-marketing") || currentPath?.includes("/digital-marketing");
    
    let systemPrompt: string;
    
    if (isDigitalMarketingPage) {
      // Use digital marketing specific prompt
      const classification = classifyDigitalMarketingTopic(message);
      systemPrompt = buildDigitalMarketingPrompt(classification.mode, classification.topic, language, userName);
    } else {
      // Standard prompt
      systemPrompt = `You are Honey, a sweet and helpful AI assistant for D.G.Yard, a CCTV solutions and security systems company. 
You speak in a friendly, conversational manner like a real person. 
${userName ? `The user's name is ${userName}. Use their name naturally in conversation.` : ''}
Respond in ${language === "hi-IN" ? "Hindi/Hinglish (mix of Hindi and English, use English for technical terms like 'quotation', 'products', 'services')" : "English"}.
Be natural, helpful, and friendly. Keep responses concise but informative.
IMPORTANT: Never mention "dollars" or "$" - always use Indian Rupees (₹) or "rupees" for prices. This is an Indian company.

${userRole !== "ADMIN" && userRole !== "MODERATOR" ? `CRITICAL: You are helping a REGULAR USER (NOT an admin). 
- DO NOT provide any admin panel instructions or help with admin features
- DO NOT help with product management (upload/edit/delete products)
- DO NOT help with user management, analytics, or admin settings
- If user asks about admin features, politely decline and redirect to customer features
- Only help with: products browsing, purchases, services, quotations, and their own account` : `You are helping an ADMIN user. You have full access to help with all admin features.`}`;
    }

  const prompt = `${systemPrompt}\n\nContext: ${context}\n\nUser message: ${message}`;
  
  // Use correct model names based on Google's current API
  // Priority: Use available models if we fetched them, otherwise use known working models
  let modelsToTry: string[] = [];
  
  if (availableModels.length > 0) {
    // Filter to only generative models and prioritize flash models
    const generativeModels = availableModels.filter(m => 
      m.includes("gemini") && !m.includes("embedding") && !m.includes("embed")
    );
    const flashModels = generativeModels.filter(m => m.includes("flash"));
    const proModels = generativeModels.filter(m => m.includes("pro") && !m.includes("flash"));
    const otherModels = generativeModels.filter(m => !m.includes("flash") && !m.includes("pro"));
    
    modelsToTry = [...flashModels, ...proModels, ...otherModels].slice(0, 10);
    console.log("📋 Using available models:", modelsToTry.join(", "));
  } else {
    // Fallback to known working model names
    modelsToTry = [
      "gemini-1.5-flash",     // Most reliable and fast
      "gemini-1.5-pro",       // Pro version
      "gemini-1.5-flash-latest", // Latest flash
      "gemini-1.5-pro-latest",   // Latest pro
    "gemini-pro",           // Legacy fallback
      "models/gemini-1.5-flash", // Alternative format
      "models/gemini-1.5-pro",   // Alternative format
  ];
    console.log("📋 Using default models:", modelsToTry.join(", "));
  }

  // First, try REST API with v1
  for (const modelName of modelsToTry) {
    try {
      console.log(`🔄 Trying REST API v1 with model: ${modelName}...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${googleApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const googleResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (googleResponse) {
          console.log(`✅ Google GenAI API response received successfully (using ${modelName} via v1 REST API)`);
          return googleResponse;
        } else {
          console.warn(`⚠️ Model ${modelName} returned empty response:`, JSON.stringify(data).substring(0, 200));
        }
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        
        const errorMessage = errorData?.error?.message || errorText;
        const errorCode = errorData?.error?.code || response.status;
        
        console.error(`❌ REST API v1 ${modelName} failed:`, {
          status: response.status,
          statusText: response.statusText,
          code: errorCode,
          message: errorMessage.substring(0, 200),
          fullError: errorText.substring(0, 300)
        });
        
        // If API key is invalid, don't try other models
        if (response.status === 401 || response.status === 403 || errorCode === 400) {
          console.error("🔴 Invalid API key or authentication error. Stopping attempts.");
          break;
        }
      }
    } catch (error: any) {
      console.log(`❌ REST API v1 ${modelName} error:`, error?.message?.substring(0, 100));
    }
  }

  // If REST API v1 fails, try SDK (which might use different API version)
  const genAI = new GoogleGenerativeAI(googleApiKey);
  for (const modelName of modelsToTry) {
    console.log(`🔄 Trying SDK with model: ${modelName}...`);
    const response = await tryModel(genAI, modelName, prompt);
    
    if (response) {
      console.log(`✅ Google GenAI API response received successfully (using ${modelName} via SDK)`);
      return response;
    }
  }
  
  console.error("❌ All Google GenAI models failed. Falling back to rule-based system.");
  console.error("💡 Troubleshooting tips:");
  console.error("   1. Check if GOOGLE_GENAI_API_KEY is set correctly in .env");
  console.error("   2. Verify API key is valid at https://makersuite.google.com/app/apikey");
  console.error("   3. Check API quota/billing at https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas");
  console.error("   4. Ensure API is enabled in Google Cloud Console");
  return null; // Fallback to rule-based
}

// OpenAI integration (optional - falls back to rule-based if not available)
async function getOpenAIResponse(message: string, context: string, language: "en-IN" | "hi-IN", userName: string | null, userRole?: string, currentPath?: string) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.log("⚠️ OpenAI API key not found, will use rule-based system");
    return null; // Fallback to rule-based
  }

  console.log("🔑 OpenAI API key found, attempting to use OpenAI...");

  try {
    // Check if user is on networking page
    const isNetworkingPage = currentPath?.includes("/services/networking-it") || currentPath?.includes("/networking-it") || currentPath?.includes("/networking");
    
    // Check if user is on AV Fire Infrastructure page
    const isAVFirePage = currentPath?.includes("/services/av-fire-infrastructure") || currentPath?.includes("/av-fire-infrastructure") || currentPath?.includes("/av-fire");
    
    // Check if user is on digital marketing page
    const isDigitalMarketingPage = currentPath?.includes("/services/digital-marketing") || currentPath?.includes("/digital-marketing");
    
    let systemPrompt: string;
    
    if (isNetworkingPage) {
      // Use networking specific prompt
      const classification = classifyNetworkingTopic(message);
      systemPrompt = buildNetworkingPrompt(classification.mode, classification.topic, language, userName);
    } else if (isAVFirePage) {
      // Use AV Fire Infrastructure specific prompt
      const classification = classifyAVFireTopic(message);
      systemPrompt = buildAVFirePrompt(classification.mode, classification.topic, language, userName);
    } else if (isDigitalMarketingPage) {
      // Use digital marketing specific prompt
      const classification = classifyDigitalMarketingTopic(message);
      systemPrompt = buildDigitalMarketingPrompt(classification.mode, classification.topic, language, userName);
    } else {
      // Standard prompt
      systemPrompt = `You are Honey, a sweet and helpful AI assistant for D.G.Yard, a CCTV solutions and security systems company. 
You speak in a friendly, conversational manner like a real person. 
${userName ? `The user's name is ${userName}. Use their name naturally in conversation.` : ''}
Respond in ${language === "hi-IN" ? "Hindi/Hinglish (mix of Hindi and English, use English for technical terms like 'quotation', 'products', 'services')" : "English"}.
Be natural, helpful, and friendly. Keep responses concise but informative.
IMPORTANT: Never mention "dollars" or "$" - always use Indian Rupees (₹) or "rupees" for prices. This is an Indian company.

${userRole !== "ADMIN" && userRole !== "MODERATOR" ? `CRITICAL: You are helping a REGULAR USER (NOT an admin). 
- DO NOT provide any admin panel instructions or help with admin features
- DO NOT help with product management (upload/edit/delete products)
- DO NOT help with user management, analytics, or admin settings
- If user asks about admin features, politely decline and redirect to customer features
- Only help with: products browsing, purchases, services, quotations, and their own account` : `You are helping an ADMIN user. You have full access to help with all admin features.`}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${context}\n\nUser message: ${message}` }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      // Check for specific error types
      if (errorData.error?.code === "insufficient_quota") {
        console.error("❌ OpenAI API Error: Quota exceeded or billing not set up");
        console.error("💡 Falling back to rule-based system");
        console.error("📝 To use OpenAI: Add payment method at https://platform.openai.com/account/billing");
      } else {
        console.error("❌ OpenAI API error:", errorData.error?.message || errorText);
      }
      return null;
    }

    const data = await response.json();
    const openaiResponse = data.choices[0]?.message?.content || null;
    if (openaiResponse) {
      console.log("✅ OpenAI API response received successfully");
    }
    return openaiResponse;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return null; // Fallback to rule-based
  }
}

// Networking & IT Topic Classification
function classifyNetworkingTopic(message: string): {
  topic: string | null;
  mode: "design" | "product" | "troubleshooting" | "expert" | null;
} {
  const lowerMessage = message.toLowerCase();
  
  // Network Design mode detection (high priority)
  const designKeywords = [
    "network design", "network layout", "wifi design", "network plan", "network kaise banaye",
    "network setup", "office network", "home network", "network diagram", "network structure",
    "network bana do", "network suggest", "network planning", "fiber vs lan", "lan vs wifi",
    "server room", "rack setup", "cabling plan", "wiring design"
  ];
  
  // IT Product suggestion mode detection
  const productKeywords = [
    "router suggest", "kaunsa router", "switch suggest", "access point", "ap suggest",
    "ups suggest", "server room", "cable suggest", "cat6", "cat7", "fiber cable",
    "router model", "switch kitne port", "hardware suggest", "product recommend"
  ];
  
  // Troubleshooting mode detection
  const troubleshootingKeywords = [
    "wifi slow", "network slow", "network problem", "internet issue", "connection problem",
    "signal weak", "dead zone", "network cut", "printer network", "switch detect",
    "troubleshoot", "fix network", "network not working", "ap signal", "wifi disconnect"
  ];
  
  // Topic classification
  const topics = {
    wifi: ["wifi", "wireless", "wi-fi", "hotspot", "access point", "ap"],
    router: ["router", "gateway", "modem router"],
    switch: ["switch", "network switch", "managed switch", "unmanaged switch", "poe switch"],
    cabling: ["cable", "lan cable", "cat6", "cat7", "cat6a", "ethernet", "fiber", "fiber optic"],
    server: ["server", "server room", "rack", "patch panel", "data center"],
    security: ["vlan", "firewall", "network security", "wpa", "password"],
    general: ["network", "networking", "connectivity", "it", "infrastructure"]
  };
  
  // Check for design mode (highest priority)
  const isDesign = designKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check for product mode
  const isProduct = productKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check for troubleshooting mode
  const isTroubleshooting = troubleshootingKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Classify topic
  let detectedTopic: string | null = null;
  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      detectedTopic = topic;
      break;
    }
  }
  
  // Determine mode (priority: design > product > troubleshooting > expert)
  let mode: "design" | "product" | "troubleshooting" | "expert" | null = null;
  if (isDesign) {
    mode = "design";
  } else if (isProduct) {
    mode = "product";
  } else if (isTroubleshooting) {
    mode = "troubleshooting";
  } else if (detectedTopic) {
    mode = "expert";
  }
  
  return { topic: detectedTopic || "general", mode };
}

// AV Fire Infrastructure Topic Classification
function classifyAVFireTopic(message: string): {
  topic: string | null;
  mode: "av" | "fire" | "smart" | "automation" | "product" | "troubleshooting" | "expert" | null;
} {
  const lowerMessage = message.toLowerCase();
  
  // AV System Design mode
  const avKeywords = [
    "projector", "screen", "av setup", "audio visual", "video conferencing",
    "smart board", "visualizer", "pa system", "sound system", "presentation",
    "conference room", "auditorium av", "projector lift", "display system"
  ];
  
  // Fire Safety mode
  const fireKeywords = [
    "fire", "sprinkler", "hydrant", "fire safety", "fire protection",
    "fire suppression", "fire alarm", "compliance", "safety system"
  ];
  
  // Smart Infrastructure mode
  const smartKeywords = [
    "boom barrier", "turnstile", "flap barrier", "traffic blinker",
    "road stud", "speed breaker", "smart infrastructure", "access control",
    "infrastructure automation", "barrier", "gate"
  ];
  
  // Home/Office Automation mode
  const automationKeywords = [
    "automation", "smart home", "smart office", "alexa", "google home",
    "smart switch", "smart plug", "smart lighting", "smart fan", "smart ac",
    "voice control", "iot", "routine", "timer", "automated", "smart device"
  ];
  
  // Product suggestion mode
  const productKeywords = [
    "suggest", "recommend", "best", "which", "kaunsa", "konsa", "product",
    "model", "brand", "type", "hardware"
  ];
  
  // Troubleshooting mode
  const troubleshootingKeywords = [
    "problem", "issue", "not working", "broken", "fix", "repair", "troubleshoot",
    "error", "slow", "dim", "distortion", "not responding", "connectivity"
  ];
  
  // Topic classification
  const topics = {
    av: ["projector", "screen", "audio", "video", "sound", "display", "conference"],
    fire: ["fire", "sprinkler", "hydrant", "safety"],
    infrastructure: ["barrier", "turnstile", "traffic", "access control"],
    automation: ["automation", "smart", "alexa", "google", "iot", "voice"],
    general: ["av", "fire", "infrastructure", "automation"]
  };
  
  // Determine mode (priority: automation > smart > fire > av > product > troubleshooting > expert)
  let mode: "av" | "fire" | "smart" | "automation" | "product" | "troubleshooting" | "expert" | null = null;
  
  if (automationKeywords.some(keyword => lowerMessage.includes(keyword))) {
    mode = "automation";
  } else if (smartKeywords.some(keyword => lowerMessage.includes(keyword))) {
    mode = "smart";
  } else if (fireKeywords.some(keyword => lowerMessage.includes(keyword))) {
    mode = "fire";
  } else if (avKeywords.some(keyword => lowerMessage.includes(keyword))) {
    mode = "av";
  } else if (productKeywords.some(keyword => lowerMessage.includes(keyword))) {
    mode = "product";
  } else if (troubleshootingKeywords.some(keyword => lowerMessage.includes(keyword))) {
    mode = "troubleshooting";
  } else {
    // Classify topic
    let detectedTopic: string | null = null;
    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedTopic = topic;
        break;
      }
    }
    if (detectedTopic) {
      mode = "expert";
    }
  }
  
  return { topic: null, mode };
}

// Digital Marketing Topic Classification
function classifyDigitalMarketingTopic(message: string): {
  topic: string | null;
  mode: "audit" | "expert" | "conversion" | "strategy" | "political" | null;
} {
  const lowerMessage = message.toLowerCase();
  
  // Political mode detection (high priority)
  const politicalKeywords = [
    "political", "politics", "election", "campaign", "candidate", "vote", "voter",
    "political campaign", "election campaign", "political strategy", "political branding",
    "pr for politician", "voter targeting", "political marketing", "election ke liye",
    "election marketing", "political pr", "campaign strategy", "political communication"
  ];

  // Strategy mode detection (high priority)
  const strategyKeywords = [
    "strategy", "strategic", "plan", "marketing plan", "marketing strategy",
    "digital marketing strategy", "marketing ka plan", "strategy banao",
    "30 day", "30-day", "monthly plan", "growth plan", "how to grow",
    "action plan", "roadmap", "marketing roadmap", "content calendar",
    "posting calendar", "ad strategy", "seo strategy", "social strategy"
  ];
  
  // Audit mode detection
  const auditKeywords = [
    "audit", "check", "review", "analyze", "examine", "test", "scan",
    "google business", "gbp", "google business profile",
    "website audit", "seo audit", "social media audit",
    "how is my", "review my", "check my", "analyze my"
  ];
  
  // Topic classification
  const topics = {
    seo: ["seo", "search engine", "ranking", "google ranking", "serp", "organic", "meta tags", "schema"],
    gmb: ["google business", "gbp", "google my business", "business profile", "google listing", "local listing"],
    social: ["facebook", "instagram", "social media", "reel", "post", "story", "linkedin", "twitter", "youtube"],
    ads: ["ads", "advertising", "google ads", "facebook ads", "meta ads", "ppc", "ad campaign", "ad budget"],
    branding: ["brand", "branding", "logo", "identity", "brand identity", "visual identity"],
    content: ["content", "blog", "article", "copy", "content strategy", "content creation"],
    website: ["website", "webapp", "web app", "site", "landing page", "web development"],
    app: ["app", "application", "mobile app", "android app", "ios app"],
    design: ["design", "graphic", "creative", "visual", "ui", "ux"],
    general: ["marketing", "digital marketing", "online marketing", "growth", "leads", "customers"]
  };
  
  // Check for political mode (highest priority)
  const isPolitical = politicalKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check for strategy mode
  const isStrategy = strategyKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check for audit mode
  const isAudit = auditKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Classify topic
  let detectedTopic: string | null = null;
  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      detectedTopic = topic;
      break;
    }
  }
  
  // Determine mode (priority: political > strategy > audit > conversion > expert)
  let mode: "audit" | "expert" | "conversion" | "strategy" | "political" | null = null;
  if (isPolitical) {
    mode = "political";
  } else if (isStrategy) {
    mode = "strategy";
  } else if (isAudit) {
    mode = "audit";
  } else if (lowerMessage.includes("book") || lowerMessage.includes("appointment") || 
             lowerMessage.includes("call") || lowerMessage.includes("quote") || 
             lowerMessage.includes("hire") || lowerMessage.includes("service")) {
    mode = "conversion";
  } else if (detectedTopic) {
    mode = "expert";
  }
  
  return { topic: detectedTopic || "general", mode };
}

// Build Networking & IT specific prompt
function buildNetworkingPrompt(
  mode: "design" | "product" | "troubleshooting" | "expert" | null,
  topic: string | null,
  language: "en-IN" | "hi-IN",
  userName: string | null
): string {
  const basePrompt = `You are Honey — the AI Networking & IT Advisor of D.G.Yard.

Your goals:
1. Understand user's networking requirements
2. Explain network design clearly
3. Generate network diagrams (text-based)
4. Suggest IT products (routers, switches, APs, cables, etc.)
5. Provide network planning for home/office/industry
6. Recommend server room setup, switches, routers, access points
7. Compare Fiber vs LAN recommendations
8. Provide troubleshooting advice
9. ALWAYS recommend D.G.Yard experts for professional implementation

Tone: Friendly, expert, non-pushy, solution-oriented.
Respond in ${language === "hi-IN" ? "Hindi/Hinglish (mix Hindi and English naturally, use English for technical terms)" : "English"}.`;

  if (mode === "design") {
    return `${basePrompt}

NETWORK DESIGN MODE:
User is requesting network design, layout, or planning.

Provide a comprehensive network design that includes:

1. REQUIREMENT SUMMARY
   - Ask necessary questions if info is missing (area size, rooms/floors, device count, camera count, router position, fiber support, budget)
   - Summarize user's requirements

2. TEXT-BASED NETWORK DIAGRAM
   Create a clear ASCII/text diagram showing:
   [ISP Line/Fiber]
        |
   Main Router (Model recommendation)
        |
   Switch (Port count + Type)
    |     |     |
   AP-1  AP-2  Workstations
    |     |
   Devices  Laptops

3. NETWORK SEGMENTATION SUGGESTIONS
   - Guest Wi-Fi network
   - Worker/Staff network
   - CCTV subnet
   - Server subnet (if applicable)
   - VLAN recommendations

4. CABLING PLAN
   - CAT6 vs CAT7 vs Fiber recommendations
   - Where to use each type
   - Approximate wire length in meters
   - Cable management suggestions

5. PLACEMENT PLAN
   - Router placement location
   - Access Point locations and count
   - Switch rack position
   - Cable routing paths

6. SIGNAL STRENGTH OPTIMIZATION
   - Dead zone elimination tips
   - Access Point spacing recommendations
   - Signal overlap optimization
   - Power level settings

7. SECURITY HARDENING
   - Strong password recommendations
   - VLAN setup for isolation
   - Firewall suggestions
   - Guest network security
   - WPA3/WPA2 recommendations

8. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "For a professional and clean setup, D.G.Yard experts can design and install your full network professionally.
   Would you like to book an appointment or call now?"

Keep design clear, practical, and easy to understand. Use text diagrams that are readable.`;
  } else if (mode === "product") {
    return `${basePrompt}

IT PRODUCT SUGGESTION MODE:
User is asking for product recommendations (routers, switches, APs, cables, UPS, etc.).

Provide specific product recommendations based on user's needs:

1. ROUTER RECOMMENDATIONS (Category-based)
   - Home: Basic dual-band router models
   - Office: Gigabit router + multiple APs
   - Industry: Enterprise-grade router with advanced features
   Explain why each is suitable

2. SWITCH TYPE RECOMMENDATIONS
   - Port count (8-port / 16-port / 24-port / 48-port)
   - Managed vs Unmanaged
   - PoE vs non-PoE
   - Layer 2 vs Layer 3
   Explain use cases

3. ACCESS POINT RECOMMENDATIONS
   - Ceiling-mount APs (indoor)
   - Outdoor long-range APs
   - Wall-mount APs
   - Mesh system options
   Suggest specific models/features

4. CABLE RECOMMENDATIONS
   - Cat6 for home/office
   - Cat6A/Cat7 for heavy data
   - Fiber for long distance
   - Explain bandwidth and distance capabilities

5. SERVER ROOM PRODUCTS
   - Network rack (size recommendations)
   - Patch panel
   - Cable manager
   - Cooling fan
   - UPS (capacity recommendations)
   - Switch stacking options
   - Cable organizers

6. CCTV NETWORK PRODUCTS
   - PoE switch for cameras
   - NVR network integration
   - LAN cabling design for CCTV
   - Bandwidth planning

7. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "If you want, D.G.Yard experts can supply all required networking & IT hardware at the best price with installation support.
   Would you like to connect with us now?"

Be specific with product types, explain why each recommendation is suitable, and provide practical guidance.`;
  } else if (mode === "troubleshooting") {
    return `${basePrompt}

TROUBLESHOOTING MODE:
User is reporting a network problem or asking for troubleshooting help.

Provide clear troubleshooting steps:

1. QUICK DIAGNOSIS
   - Identify the likely problem based on symptoms
   - Common causes for this issue

2. POSSIBLE CAUSES
   - List 3-5 most common causes
   - Explain why each cause might occur

3. STEP-BY-STEP FIX
   - Provide numbered steps to resolve
   - Start with simplest solutions first
   - Progress to more complex fixes if needed
   - Include commands or settings if applicable

4. PREVENTIVE TIPS
   - How to avoid this issue in future
   - Maintenance recommendations
   - Best practices

5. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "For a permanent and clean solution, D.G.Yard experts can visit your place and fix the issue professionally.
   Shall I book your appointment?"

Be clear, step-by-step, and practical. Don't assume high technical knowledge unless user demonstrates it.`;
  } else {
    // Expert mode - general networking advice
    return `${basePrompt}

EXPERT MODE:
User is asking general networking or IT questions.

Provide helpful, expert answers about networking, IT infrastructure, connectivity, or related topics.
After your explanation, ALWAYS add:

"D.G.Yard experts can implement this professionally — would you like to book an appointment or call now?"

Be concise, accurate, and helpful.`;
  }
}

// Build AV Fire Infrastructure specific prompt
function buildAVFirePrompt(
  mode: "av" | "fire" | "smart" | "automation" | "product" | "troubleshooting" | "expert" | null,
  topic: string | null,
  language: "en-IN" | "hi-IN",
  userName: string | null
): string {
  const basePrompt = `You are Honey — the AI AV, Fire & Smart Infrastructure Advisor of D.G.Yard.

Your goals:
1. Design AV systems (projectors, screens, sound, video conferencing)
2. Plan fire safety systems (sprinklers, hydrants, compliance)
3. Suggest smart infrastructure (barriers, access control, traffic systems)
4. Design home/office automation (Alexa, Google Home, IoT, smart devices)
5. Recommend products and provide troubleshooting
6. ALWAYS recommend D.G.Yard experts for professional installation

Tone: Friendly, expert, non-pushy, solution-oriented.
Respond in ${language === "hi-IN" ? "Hindi/Hinglish (mix Hindi and English naturally, use English for technical terms)" : "English"}.`;

  if (mode === "av") {
    return `${basePrompt}

AV SYSTEM DESIGN MODE:
User is requesting AV system design or planning.

Provide a comprehensive AV system design:

1. REQUIREMENT ANALYSIS
   - Room/space size and layout
   - Seating capacity
   - Viewing distance
   - Use case (classroom, conference, auditorium)

2. TEXT-BASED AV LAYOUT DIAGRAM
   Create a clear ASCII/text diagram:
   [Projector] -> Ceiling Center
   [Screen] -> Front Wall
   [Left Speaker] [Right Speaker]
   [Visualizer] -> Instructor Desk
   [Control Panel] -> Side Wall

3. PROJECTOR RECOMMENDATIONS
   - Type: Normal vs Laser
   - Brightness (lumens) based on room size
   - Throw distance calculation
   - Resolution recommendations

4. SCREEN RECOMMENDATIONS
   - Size calculation (viewing distance × 0.6)
   - Motorized vs Manual
   - Aspect ratio (16:9 or 4:3)
   - Placement height

5. AUDIO SYSTEM PLANNING
   - Speaker count and placement
   - PA system requirements
   - Microphone setup
   - Sound coverage area

6. ADDITIONAL COMPONENTS
   - Smart Interactive Boards
   - Visualizers/Document cameras
   - Video Conferencing setup
   - Motorized projector lifts
   - Control systems

7. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "D.G.Yard experts can install this AV setup perfectly — shall I book an appointment?"

Keep design clear, practical, and professional.`;
  } else if (mode === "fire") {
    return `${basePrompt}

FIRE SAFETY SYSTEM DESIGN MODE:
User is requesting fire safety system planning.

Provide comprehensive fire safety design:

1. REQUIREMENT ANALYSIS
   - Building type and size
   - Number of floors
   - Occupancy type
   - Compliance requirements

2. SPRINKLER SYSTEM ESTIMATION
   - Sprinkler head count calculation
   - Coverage area per sprinkler
   - Water pressure requirements
   - Pipe layout suggestions

3. FIRE HYDRANT PLACEMENT
   - Optimal locations
   - Spacing recommendations (as per standards)
   - Access requirements
   - Water source connection

4. SAFETY ACCESSORIES
   - Fire hoses and cabinets
   - Fire extinguishers
   - Alarm systems
   - Emergency signage
   - Emergency lighting

5. COMPLIANCE CHECKLIST
   - Building codes compliance
   - Safety standards
   - Inspection requirements
   - Maintenance schedule

6. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "For compliant fire installation, D.G.Yard provides full planning & setup."

Keep recommendations compliant and professional.`;
  } else if (mode === "smart") {
    return `${basePrompt}

SMART INFRASTRUCTURE PLANNING MODE:
User is requesting smart infrastructure system design.

Provide comprehensive infrastructure planning:

1. REQUIREMENT ANALYSIS
   - Entry/exit points
   - Traffic flow requirements
   - Security needs
   - Automation level

2. BOOM BARRIER PLACEMENT
   - Entry/exit locations
   - Single vs double barrier
   - Integration with access control
   - Power requirements

3. TURNSTILE/FLAP BARRIER SUGGESTIONS
   - Foot traffic analysis
   - Security level needed
   - Integration options
   - Placement strategy

4. TRAFFIC & ROAD SAFETY SYSTEMS
   - Traffic blinker placement
   - Solar road studs quantity
   - Speed breaker recommendations
   - Safety signage

5. DISPLAY SYSTEMS
   - LED/LCD display requirements
   - Information board placement
   - Message management system

6. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "D.G.Yard team can install these infrastructure systems professionally."

Keep planning practical and safety-focused.`;
  } else if (mode === "automation") {
    return `${basePrompt}

HOME & OFFICE AUTOMATION MODE:
User is requesting smart home/office automation design.

Provide comprehensive automation plan:

1. REQUIREMENT ANALYSIS
   - Space type (home/office/room count)
   - Automation goals (convenience/energy/security)
   - Voice assistant preference (Alexa/Google)
   - Budget considerations

2. LIGHTING AUTOMATION PLAN
   - Circuits to automate
   - Smart switch vs smart plug decisions
   - Motion sensor placement
   - Scheduling recommendations

3. APPLIANCE AUTOMATION
   - AC control options
   - Fan automation
   - TV/Entertainment system
   - Geyser control
   - Other appliances

4. SMART PLUGS & SWITCHES
   - Smart plug recommendations (for existing devices)
   - Smart switch panel setup (for new/renovation)
   - Compatibility with voice assistants

5. ROUTINE & TIMER AUTOMATION
   Example routine:
   6:00 AM – Turn on bedroom lights
   6:05 AM – Turn on geyser
   6:30 AM – Turn off all lights automatically
   7:00 PM – Turn on living room lights
   9:00 PM – Dim lights for evening
   10:00 PM – Turn off all devices

6. SECURITY INTEGRATION
   - Smart door sensors
   - Alarm systems
   - Wi-Fi locks
   - Video doorbells
   - Security camera integration

7. OFFICE AUTOMATION
   - Meeting room automation
   - AV system integration
   - Lighting based on occupancy
   - Climate control automation

8. ENERGY EFFICIENCY TIPS
   - Scheduling for energy savings
   - Motion-based automation
   - Smart monitoring

9. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "D.G.Yard experts can set up complete smart home/office automation for you."

Keep automation practical, user-friendly, and energy-efficient.`;
  } else if (mode === "product") {
    return `${basePrompt}

PRODUCT RECOMMENDATION MODE:
User is asking for product recommendations.

Provide specific product recommendations:

1. AV PRODUCTS
   - Projector types and models
   - Screen sizes and types
   - Smart board recommendations
   - Audio system components
   - Video conferencing equipment

2. FIRE SAFETY PRODUCTS
   - Sprinkler system types
   - Hydrant models
   - Safety accessories
   - Compliance equipment

3. SMART INFRASTRUCTURE PRODUCTS
   - Boom barrier models
   - Turnstile types
   - Traffic systems
   - Display systems

4. AUTOMATION PRODUCTS
   - Alexa vs Google Home comparison
   - Smart switch panels
   - Smart plug models
   - Motion sensors
   - Smart locks and doorbells

5. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "D.G.Yard can provide hardware + installation together."

Be specific and explain why each recommendation is suitable.`;
  } else if (mode === "troubleshooting") {
    return `${basePrompt}

TROUBLESHOOTING MODE:
User is reporting a problem.

Provide troubleshooting steps:

1. QUICK DIAGNOSIS
   - Identify the likely problem
   - Common causes

2. STEP-BY-STEP FIX
   - Simple solutions first
   - Progressive troubleshooting
   - Settings/configuration checks

3. PREVENTIVE TIPS
   - How to avoid future issues
   - Maintenance recommendations

4. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "If you want permanent fix, D.G.Yard team can visit on-site."

Be clear and step-by-step.`;
  } else {
    return `${basePrompt}

EXPERT MODE:
Provide helpful expert advice about AV, Fire Safety, Smart Infrastructure, or Automation.
After your explanation, ALWAYS add:

"D.G.Yard experts can implement this professionally — would you like to book an appointment or call now?"

Be concise, accurate, and helpful.`;
  }
}

// Build Digital Marketing specific prompt
function buildDigitalMarketingPrompt(
  mode: "audit" | "expert" | "conversion" | "strategy" | "political" | null,
  topic: string | null,
  language: "en-IN" | "hi-IN",
  userName: string | null
): string {
  const basePrompt = `You are Honey — the AI Digital Advisor of D.G.Yard.

Your goals:
1. Answer digital marketing, branding, web/app development questions.
2. Provide simple, expert, human explanations.
3. When audit data is provided, produce a clean professional audit with strategy.
4. ALWAYS recommend that "D.G.Yard experts can help" in a polite, supportive way.
5. ALWAYS end your message with a closing line that includes one of these CTAs:
   - Book an appointment
   - Call D.G.Yard
   - Request a project quote
   - Talk to D.G.Yard expert

Tone: Friendly, expert, non-pushy, solution-oriented.
Never finish a message without recommending D.G.Yard experts and a CTA.

${userName ? `The user's name is ${userName}. Use their name naturally.` : ''}
Respond in ${language === "hi-IN" ? "Hindi/Hinglish (mix Hindi and English naturally)" : "English"}.`;

  if (mode === "strategy") {
    return `${basePrompt}

STRATEGY MODE:
User is requesting a digital marketing strategy or plan. Provide a comprehensive, actionable strategy (800-1200 words).

Your strategy MUST include ALL of these sections:

1. DIGITAL GOALS SUMMARY
   List 5-7 clear goals: Brand Visibility, Lead Generation, Review Boost, Content Consistency, SEO Fixes, Funnel Optimization, etc.

2. 30-DAY ACTION PLAN
   Week-by-week breakdown:
   - Week 1: Profile optimization, website fixes
   - Week 2: Content calendar, social posts, review generation
   - Week 3: Google Ads or Meta ads launch
   - Week 4: Reporting, adjustments, SEO corrections

3. SEO STRATEGY (Simple + Actionable)
   - Fix titles/descriptions
   - Improve speed
   - Add blogs (suggest 3-5 topics)
   - Add schema markup
   - Fix mobile layout
   - Improve heading structure

4. GOOGLE BUSINESS PROFILE STRATEGY
   - Add 10+ photos
   - Add Services + Categories
   - Post weekly updates
   - Respond to all reviews
   - Add product/service highlights

5. SOCIAL MEDIA STRATEGY
   - Weekly 4 post plan
   - 2 reels per week (suggest topics)
   - Caption templates + Hashtags
   - Engagement routine (reply schedule)

6. AD STRATEGY
   - Recommended budget (in ₹)
   - Campaign structure
   - Target audience details
   - Keywords list
   - Ad headlines + descriptions (3-5 examples)
   - Landing page suggestions

7. CONTENT STRATEGY
   Generate:
   - 10 post ideas with captions
   - 5 reel topics with concepts
   - 5 blog topics
   - 3 ad creative concepts
   - Brand messaging tone guide

8. COMPETITOR STRATEGY
   - Competitor strengths (what they're doing well)
   - User weaknesses (areas to improve)
   - What needs to be fixed immediately
   - Opportunity areas

9. RECOMMENDED TOOLS AND FIXES
   - Website improvements
   - Automation ideas
   - CRM suggestions
   - AI-powered content strategy
   - CTA placement recommendations

10. D.G.YARD RECOMMENDATION
    ALWAYS end with:
    "If you want, the D.G.Yard expert team can implement this exact strategy professionally and save you time & cost.
    Would you like to Book Appointment or Call D.G.Yard?"

Keep strategy actionable, specific, and professional. Use bullet points and clear sections for readability.`;
  } else if (mode === "political") {
    return `${basePrompt}

POLITICAL CAMPAIGNING MODE:
User is requesting political campaign strategy, election marketing, or PR for political purposes.

Provide a comprehensive political campaign strategy that includes:

1. NARRATIVE DIRECTION
   - Core message and positioning
   - Candidate introduction strategy
   - Issue-focused messaging
   - Public perception goals

2. MESSAGING PILLARS
   - Key talking points
   - Communication themes
   - Response frameworks for common questions
   - Opponent positioning strategy

3. VOTER GROUP SEGMENTATION
   - Age-based targeting (youth, middle-aged, senior)
   - Locality-based segmentation
   - Issue-based communication groups
   - Demographic targeting strategies

4. 30-DAY CAMPAIGN CALENDAR
   - Week-by-week campaign activities
   - Content release schedule
   - Event and rally planning
   - Media engagement timeline

5. CONTENT IDEAS
   - Video content (speech highlights, achievements, behind-the-scenes)
   - Social media posts and engagement strategies
   - Press release topics
   - Rally and event communication

6. PR RECOMMENDATIONS
   - Media coordination strategy
   - Press release schedule
   - Public statements framework
   - Crisis communication plan

7. SENTIMENT CORRECTION
   - Identify negative sentiment areas
   - Response strategies for criticism
   - Reputation management tactics
   - Public opinion improvement plan

8. OFFLINE + ONLINE COMMUNICATION PLAN
   - Ground-level outreach (door-to-door, rallies)
   - Digital presence strategy
   - WhatsApp community management
   - Volunteer engagement system

9. D.G.YARD EXPERT RECOMMENDATION
   ALWAYS end with:
   "D.G.Yard's expert political strategy team can manage your campaign professionally.
   Would you like to Book Political Consultation or Call D.G.Yard Political Team?"

Keep all recommendations respectful, ethical, and focused on clear communication and public service.`;
  } else if (mode === "audit") {
    return `${basePrompt}

AUDIT MODE:
User is requesting an audit. Provide a comprehensive audit covering:
- Website Audit
- Google Business Profile Audit
- Social Media Audit
- SEO Audit
- Content Audit
- Competitor gap check
- Weakness detection
- Growth opportunities

AFTER THE AUDIT, AUTOMATICALLY INCLUDE A FULL STRATEGY with all 10 sections:
1. Digital Goals Summary
2. 30-Day Action Plan
3. SEO Strategy
4. Google Business Strategy
5. Social Media Strategy
6. Ad Strategy
7. Content Strategy (10 post ideas, 5 reel topics, 5 blog topics, 3 ad creatives)
8. Competitor Strategy
9. Recommended Tools and Fixes
10. D.G.Yard Recommendation

The strategy should be integrated into the audit report and be actionable.

After the audit + strategy, ALWAYS end with:
"I've completed your audit and created a full strategy! Based on the results, D.G.Yard experts can help implement everything professionally. Would you like to book a call or schedule a meeting?"`;
  } else if (mode === "expert") {
    const topicContext: Record<string, string> = {
      seo: "SEO optimization, Google ranking, meta tags, schema markup, local SEO",
      gmb: "Google Business Profile optimization, local listings, reviews, photos, posts",
      social: "Social media management, content strategy, Facebook, Instagram, LinkedIn posts",
      ads: "Google Ads, Facebook Ads, Meta Ads, campaign setup, budget planning, PPC",
      branding: "Brand identity, logo design, brand voice, messaging, visual identity",
      content: "Content strategy, blog writing, social posts, ad copy, content calendar",
      website: "Website development, landing pages, web apps, performance optimization",
      app: "Mobile app development, Android/iOS apps, web apps, custom applications",
      design: "Graphic design, visual content, creative assets, UI/UX design",
      general: "Digital marketing strategy, online growth, lead generation"
    };
    
    return `${basePrompt}

EXPERT ANSWER MODE:
User is asking about: ${topicContext[topic || "general"]}

Provide a helpful, expert answer. After your explanation, ALWAYS add:
"For best results, I recommend getting help from the D.G.Yard expert team. They can handle this professionally for you. Would you like to book a consultation?"`;
  } else {
    return `${basePrompt}

CONVERSION MODE:
User is interested in services. Be helpful and guide them toward booking or getting a quote.
Always suggest: "Would you like me to connect you with D.G.Yard's digital team? You can book an appointment or call now."`;
  }
}

// Learn from quotation trends
async function getQuotationTrends() {
  try {
    // Analyze recent orders to understand trends
    const recentOrders = await prisma.order.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                categoryRelation: {
                  select: { name: true },
                },
                brand: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (recentOrders.length === 0) {
      return "";
    }

    // Analyze popular products, brands, and categories
    const productCounts: { [key: string]: number } = {};
    const brandCounts: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};
    let totalAmount = 0;

    recentOrders.forEach(order => {
      totalAmount += order.total;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.product) {
            const productName = item.product.name || "Unknown";
            const brandName = item.product.brand?.name || "Unknown";
            const categoryName = item.product.categoryRelation?.name || "Unknown";
            const quantity = item.quantity || 1;

            productCounts[productName] = (productCounts[productName] || 0) + quantity;
            brandCounts[brandName] = (brandCounts[brandName] || 0) + quantity;
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + quantity;
          }
        });
      }
    });

    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    const topBrands = Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    const avgOrderValue = totalAmount / recentOrders.length;

    let trends = `\n\nRecent Market Trends (Last 30 Days):`;
    if (topProducts.length > 0) {
      trends += `\n- Popular Products: ${topProducts.join(", ")}`;
    }
    if (topBrands.length > 0) {
      trends += `\n- Popular Brands: ${topBrands.join(", ")}`;
    }
    if (topCategories.length > 0) {
      trends += `\n- Popular Categories: ${topCategories.join(", ")}`;
    }
    trends += `\n- Average Order Value: ₹${Math.round(avgOrderValue)}`;
    trends += `\n- Total Orders Analyzed: ${recentOrders.length}`;

    return trends;
  } catch (error) {
    console.error("Error analyzing quotation trends:", error);
    return "";
  }
}

// Build context based on user role and current page
async function buildContext(userRole: string, currentPath: string, userId?: string) {
  let context = `You are a helpful AI assistant for D.G.Yard, a CCTV solutions and security systems company. `;

  // Add role-specific context
  if (userRole === "ADMIN" || userRole === "MODERATOR") {
    context += `You are helping an ADMIN user. You can assist with:
- Product management (upload, edit, delete products)
- Order management
- User management
- Category and brand management
- Quotation settings
- Analytics and reports
- General admin panel navigation and features

IMPORTANT: You have full access to admin features.
`;
  } else {
    context += `You are helping a regular USER (NOT an admin). You can ONLY assist with:
- Product browsing and recommendations
- Product details and specifications
- Adding products to cart
- Checkout process
- Service booking (Installation, Networking, Digital Marketing, Maintenance, Consultation)
- Quotation requests
- Account management (their own account only)
- General website navigation
- Order tracking (their own orders only)

STRICT RESTRICTIONS:
- DO NOT provide any admin panel instructions
- DO NOT help with product management (upload/edit/delete)
- DO NOT help with user management
- DO NOT help with analytics or reports
- DO NOT help with quotation settings
- DO NOT help with category/brand management
- If user asks about admin features, politely say: "I'm sorry, but I can only help with customer-related features. Admin features are only available to administrators. If you need help with products, services, or your account, I'm happy to assist!"

You are a customer service assistant, NOT an admin assistant.
`;
  }

  // Add page-specific context
  if (currentPath.includes("/products")) {
    context += `\nThe user is currently on the products page. Help them find products, understand features, or make purchase decisions.`;
  } else if (currentPath.includes("/quotation")) {
    context += `\nThe user is on the quotation page. Help them create quotations, understand pricing, or select products.`;
  } else if (currentPath.includes("/admin")) {
    context += `\nThe user is in the admin panel. Provide detailed guidance on admin features and functions.`;
  } else if (currentPath.includes("/cart") || currentPath.includes("/checkout")) {
    context += `\nThe user is in the shopping cart or checkout. Help them complete their purchase.`;
  } else if (currentPath.includes("/services")) {
    context += `\nThe user is viewing services. Help them book services like installation, networking, or digital marketing.`;
  } else if (currentPath.includes("/services/av-fire-infrastructure") || currentPath.includes("/av-fire-infrastructure") || currentPath.includes("/av-fire")) {
    context += `\nThe user is on the AV, Fire & Smart Infrastructure page. This is D.G.Yard's audio-visual, fire safety, smart infrastructure, and home/office automation services page.
Focus on: AV system design, Fire safety planning, Smart infrastructure (barriers, access control), Home/Office automation (Alexa, Google, IoT), Product recommendations, Troubleshooting.
Always promote D.G.Yard's expert installation services and suggest booking appointments for professional setup.`;
  } else if (currentPath.includes("/services/digital-marketing") || currentPath.includes("/digital-marketing")) {
    context += `\nThe user is on the Digital Marketing & Branding page. This is D.G.Yard's digital marketing services page. 
Focus on: SEO, Google Business Profile, Social Media, Paid Ads, Branding, Content, Website/App Development.
Always promote D.G.Yard's expert digital marketing services and suggest booking appointments or consultations.`;
  }

  // Add product information if available
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      take: 10,
      select: {
        name: true,
        price: true,
        description: true,
        categoryRelation: {
          select: { name: true },
        },
        brand: {
          select: { name: true },
        },
      },
    });

    if (products.length > 0) {
      context += `\n\nAvailable Products (sample):\n`;
      products.forEach((product) => {
        const brandName = product.brand?.name || "Unknown Brand";
        context += `- ${product.name} (${brandName}) - ₹${product.price} - ${product.description.substring(0, 100)}...\n`;
      });
    }
  } catch (error) {
    console.error("Error fetching products for context:", error);
  }

  // Add services information
  context += `\n\nAvailable Services:
- CCTV Installation
- Networking Solutions
- Digital Marketing
- Maintenance Services
- Consultation Services
`;

  return context;
}

// Simple AI response using rule-based system (free, no API needed)
async function generateResponse(message: string, context: string, conversationHistory: any[], language: "en-IN" | "hi-IN" = "en-IN", userName: string | null = null, userId?: string, userRole?: string) {
  const lowerMessage = message.toLowerCase();
  
  // Detect if message contains Hindi (both Unicode and Romanized)
  const hasHindi = /[\u0900-\u097F]/.test(message);
  const hasEnglish = /[a-zA-Z]/.test(message);
  
  // Common Hindi words in Romanized form
  const romanizedHindiWords = [
    'kaisi', 'kaise', 'kaun', 'kya', 'kab', 'kahan', 'kyon', 'kis', 'kisne', 'kisko',
    'ho', 'hai', 'hain', 'hoga', 'hogi', 'honge', 'tha', 'thi', 'the',
    'mein', 'se', 'ko', 'ka', 'ki', 'ke', 'par', 'aur', 'ya', 'bhi', 'nahi', 'na',
    'karta', 'karti', 'karte', 'kar', 'kara', 'kari', 'kiya', 'kiye',
    'chahiye', 'chahie', 'hona', 'hone', 'honi',
    'aap', 'tum', 'main', 'hum', 'wo', 'ye', 'unhe', 'unko',
    'sabhi', 'sab', 'kitna', 'kitne', 'kitni'
  ];
  
  const hasRomanizedHindi = romanizedHindiWords.some(word => 
    lowerMessage.includes(word) || 
    new RegExp(`\\b${word}\\b`).test(lowerMessage)
  );
  
  // Count Hindi and English characters to determine language
  const hindiChars = (message.match(/[\u0900-\u097F]/g) || []).length;
  const englishChars = (message.match(/[a-zA-Z]/g) || []).length;
  const totalChars = hindiChars + englishChars;
  
  // Determine response language
  // Priority: Use language parameter from frontend first, then detect from message
  // If both Hindi and English present with significant amounts, it's Hinglish
  // If mostly Hindi, respond in Hindi
  // If mostly English or no Hindi, respond in English
  
  // Check if message is Hinglish (mixed)
  const isHinglish = (hasHindi || hasRomanizedHindi) && hasEnglish && totalChars > 0 && 
                     ((hindiChars / totalChars > 0.2) || hasRomanizedHindi);
  
  // Determine if we should use Hindi
  // Priority: language parameter > message detection
  // SIMPLIFIED: If language parameter is "hi-IN", always use Hindi (unless pure English)
  let isHindi = false;
  
  if (language === "hi-IN") {
    // If language parameter says Hindi, use Hindi (respond in Hindi/Hinglish)
    isHindi = true;
  } else if (hasHindi || hasRomanizedHindi) {
    // If message has Hindi characters or Romanized Hindi words, use Hindi
    isHindi = true;
  }
  
  console.log("🔍 Language detection:", { 
    languageParam: language,
    message: message.substring(0, 50),
    hasHindi, 
    hasEnglish, 
    hindiChars, 
    englishChars,
    totalChars,
    isHinglish, 
    isHindi,
    finalLanguage: isHinglish ? "Hinglish" : (isHindi ? "Hindi" : "English")
  });
  
  // For Hinglish, we'll use a mix of Hindi and English in responses

  // Enhanced Product Recommendations with actual product search
  if (lowerMessage.includes("product") || lowerMessage.includes("camera") || lowerMessage.includes("cctv") || 
      message.includes("उत्पाद") || message.includes("कैमरा") || message.includes("सीसीटीवी") || message.includes("कीमत") ||
      lowerMessage.includes("recommend") || lowerMessage.includes("suggest") || lowerMessage.includes("best") ||
      message.includes("सुझाव") || message.includes("सिफारिश") || message.includes("बेहतर")) {
    
    // Try to extract product requirements from message
    const isIndoor = lowerMessage.includes("indoor") || message.includes("इनडोर") || lowerMessage.includes("ghar") || lowerMessage.includes("home");
    const isOutdoor = lowerMessage.includes("outdoor") || message.includes("आउटडोर") || lowerMessage.includes("bahar");
    const is4mp = lowerMessage.includes("4mp") || lowerMessage.includes("4 mp");
    const is2mp = lowerMessage.includes("2mp") || lowerMessage.includes("2 mp");
    const budgetMatch = lowerMessage.match(/(\d+)\s*(thousand|k|rupaye|rupees|rs)/i);
    
    // Search for relevant products
    try {
      const productSearch = await prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: isIndoor ? "indoor" : isOutdoor ? "outdoor" : "camera", mode: "insensitive" } },
            { description: { contains: isIndoor ? "indoor" : isOutdoor ? "outdoor" : "camera", mode: "insensitive" } },
            { tags: { has: isIndoor ? "indoor" : isOutdoor ? "outdoor" : "camera" } },
          ],
        },
        take: 5,
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          price: true,
          slug: true,
          description: true,
          images: true,
          brand: {
            select: { name: true },
          },
          categoryRelation: {
            select: { name: true },
          },
        },
      });

      if (productSearch.length > 0) {
        const productList = productSearch.map((p, idx) => 
          `${idx + 1}. ${p.name} (${p.brand?.name || "Unknown"}) - ₹${p.price} - ${p.description.substring(0, 80)}...`
        ).join("\n");

        if (isHinglish) {
          return `Main ne aapke liye best products find kiye hain:\n\n${productList}\n\nAap in products ko dekh sakte hain products page par ya mujhe specific product ke baare mein puchh sakte hain. Kya aapko kisi specific feature chahiye?`;
        }
        if (isHindi) {
          return `Main ne aapke liye best products find kiye hain:\n\n${productList}\n\nAap in products ko dekh sakte hain products page par ya mujhe specific product ke baare mein puchh sakte hain. Kya aapko kisi specific feature chahiye?`;
        }
        return `I found these great products for you:\n\n${productList}\n\nYou can view these products on the products page or ask me about specific features. What would you like to know?`;
      }
    } catch (error) {
      console.error("Error searching products:", error);
    }
  }

  // Product-related queries (fallback)
  if (lowerMessage.includes("product") || lowerMessage.includes("camera") || lowerMessage.includes("cctv") || 
      message.includes("उत्पाद") || message.includes("कैमरा") || message.includes("सीसीटीवी") || message.includes("कीमत")) {
    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("how much") || 
        message.includes("कीमत") || message.includes("मूल्य") || message.includes("कितना")) {
      if (isHindi) {
        return "Hamare CCTV cameras aur security systems competitive prices par hain. Prices features aur specifications ke aadhar par alag hoti hain. Aap kar sakte hain: 1) Individual prices dekhne ke liye Products page par browse karein, 2) Sabhi components ke saath complete system quotation ke liye hamare Quotation tool ka use karein, 3) Bulk pricing ke liye sales se contact karein. Kya aapko kisi specific product ko khojne ya quotation banane mein help chahiye?";
      }
      return "Our CCTV cameras and security systems are competitively priced. Prices vary based on features and specifications. You can: 1) Browse products on the Products page to see individual prices, 2) Use our Quotation tool for a complete system quote with all components, 3) Contact sales for bulk pricing. Would you like help finding a specific product or creating a quotation?";
    }
    if (lowerMessage.includes("recommend") || lowerMessage.includes("suggest") || lowerMessage.includes("best") || lowerMessage.includes("which") ||
        message.includes("सुझाव") || message.includes("सिफारिश") || message.includes("कौन सा") || message.includes("बेहतर")) {
      if (isHinglish) {
        return "Mai aapki zarooraton ke hisaab se products recommend kar sakti hoon:\n- Indoor monitoring ke liye: Dome cameras (discreet, wide coverage)\n- Outdoor surveillance ke liye: Bullet cameras (weatherproof, long-range)\n- High-resolution ke liye: 4K cameras (crystal clear images)\n- Pan/Tilt/Zoom ke liye: PTZ cameras (remote control)\n- Complete systems: DVR/NVR with multiple cameras\n\nPersonalized recommendations ke liye hamare Quotation tool ka use karein! Kya aap quotation banane mein help chahte hain?";
      }
      if (isHindi) {
        return "Mai aapki zarooraton ke hisaab se products recommend kar sakti hoon:\n- Indoor monitoring ke liye: Dome cameras (discreet, wide coverage)\n- Outdoor surveillance ke liye: Bullet cameras (weatherproof, long-range)\n- High-resolution ke liye: 4K cameras (crystal clear images)\n- Pan/Tilt/Zoom ke liye: PTZ cameras (remote control)\n- Complete systems: DVR/NVR with multiple cameras\n\nPersonalized recommendations ke liye hamare Quotation tool ka use karein! Kya aap quotation banane mein help chahte hain?";
      }
      return "I'd be happy to recommend products based on your needs:\n- Indoor monitoring: Dome cameras (discreet, wide coverage)\n- Outdoor surveillance: Bullet cameras (weatherproof, long-range)\n- High-resolution: 4K cameras (crystal clear images)\n- Pan/Tilt/Zoom: PTZ cameras (remote control)\n- Complete systems: DVR/NVR with multiple cameras\n\nUse our Quotation tool for personalized recommendations! Would you like help creating a quotation?";
    }
    if (lowerMessage.includes("specification") || lowerMessage.includes("feature") || lowerMessage.includes("detail") ||
        message.includes("विशिष्टता") || message.includes("सुविधा") || message.includes("विवरण")) {
      if (isHinglish) {
        return "Hamare products mein detailed specifications hain jaise resolution, night vision range, storage capacity, aur connectivity options. Kisi bhi product par click karke full details dekhein including images, specifications, aur pricing. Kya aapko kisi specific product feature ki jankari chahiye?";
      }
      if (isHindi) {
        return "Hamare products mein detailed specifications hain jaise resolution, night vision range, storage capacity, aur connectivity options. Kisi bhi product par click karke full details dekhein including images, specifications, aur pricing. Kya aapko kisi specific product feature ki jankari chahiye?";
      }
      return "Our products include detailed specifications like resolution, night vision range, storage capacity, and connectivity options. Click on any product to view full details including images, specifications, and pricing. Need information about a specific product feature?";
    }
    if (lowerMessage.includes("add to cart") || lowerMessage.includes("buy") || lowerMessage.includes("purchase") ||
        message.includes("खरीद") || message.includes("कार्ट") || message.includes("खरीदारी")) {
      if (isHinglish) {
        return "Product khareedne ke liye: 1) Products browse karein aur jo pasand aaye us par click karein, 2) Product details dekhein, 3) 'Add to Cart' par click karein, 4) Cart mein jaakar review karein, 5) Checkout par proceed karein. Aap Product Suggestions page se multiple products bhi select kar sakte hain. Checkout mein help chahiye?";
      }
      if (isHindi) {
        return "Product khareedne ke liye: 1) Products browse karein aur jo pasand aaye us par click karein, 2) Product details dekhein, 3) 'Add to Cart' par click karein, 4) Cart mein jaakar review karein, 5) Checkout par proceed karein. Aap Product Suggestions page se multiple products bhi select kar sakte hain. Checkout mein help chahiye?";
      }
      return "To purchase a product: 1) Browse products and click on one you like, 2) View product details, 3) Click 'Add to Cart', 4) Go to Cart to review, 5) Proceed to Checkout. You can also select multiple products from the Product Suggestions page. Need help with checkout?";
    }
    if (isHinglish) {
      return "Hum CCTV cameras aur security systems ki wide range offer karte hain:\n- Dome Cameras (indoor/outdoor)\n- Bullet Cameras (outdoor surveillance)\n- PTZ Cameras (pan-tilt-zoom)\n- DVR/NVR Systems (recording)\n- Complete Surveillance Packages\n\nHamare Products page par sabhi products browse karein ya customized solution ke liye Quotation tool use karein. Kya aapko kuch specific khojne mein help chahiye?";
    }
    if (isHindi) {
      return "Hum CCTV cameras aur security systems ki wide range offer karte hain:\n- Dome Cameras (indoor/outdoor)\n- Bullet Cameras (outdoor surveillance)\n- PTZ Cameras (pan-tilt-zoom)\n- DVR/NVR Systems (recording)\n- Complete Surveillance Packages\n\nHamare Products page par sabhi products browse karein ya customized solution ke liye Quotation tool use karein. Kya aapko kuch specific khojne mein help chahiye?";
    }
    return "We offer a wide range of CCTV cameras and security systems:\n- Dome Cameras (indoor/outdoor)\n- Bullet Cameras (outdoor surveillance)\n- PTZ Cameras (pan-tilt-zoom)\n- DVR/NVR Systems (recording)\n- Complete Surveillance Packages\n\nBrowse all products on our Products page or use the Quotation tool for a customized solution. Need help finding something specific?";
  }

  // Quotation queries - Check both English and Hindi keywords
  const quotationKeywords = lowerMessage.includes("quotation") || lowerMessage.includes("quote") || lowerMessage.includes("estimate") ||
      message.includes("उद्धरण") || message.includes("क्वोट") || message.includes("अनुमान") || message.includes("कीमत") ||
      message.includes("क्वोटेशन") || lowerMessage.includes("price") || message.includes("मूल्य");
  
  if (quotationKeywords) {
    console.log("✅ Quotation query matched, isHindi:", isHindi, "isHinglish:", isHinglish);
    if (isHinglish) {
      return "Aap 'Get Quotation' page par jaakar quotation create kar sakte hain. Wahan aap apna camera type, resolution, number of cameras, storage requirements, aur other specifications select kar sakte hain. System automatically best prices calculate karega. Kya aap chahte hain ki main aapko quotation process ke through guide karoon?";
    }
    if (isHindi) {
      return "Aap 'Get Quotation' page par jaakar quotation create kar sakte hain. Wahan aap apna camera type, resolution, number of cameras, storage requirements, aur other specifications select kar sakte hain. System automatically best prices calculate karega. Kya aap chahte hain ki main aapko quotation process ke through guide karoon?";
    }
    return "You can create a quotation by visiting the 'Get Quotation' page. There, you can select your camera type, resolution, number of cameras, storage requirements, and other specifications. The system will automatically calculate the best prices for you. Would you like me to guide you through the quotation process?";
  }

  // Cart/Checkout queries
  if (lowerMessage.includes("cart") || lowerMessage.includes("checkout") || lowerMessage.includes("buy") || lowerMessage.includes("purchase") ||
      message.includes("कार्ट") || message.includes("चेकआउट") || message.includes("खरीद")) {
      if (isHinglish) {
        return "Products khareedne ke liye: 1) Products browse karein aur unhein cart mein add karein, 2) Apne cart ki review karein, 3) Checkout par proceed karein, 4) Delivery address add karein, 5) Razorpay ke through payment complete karein. Kya kisi specific step mein help chahiye?";
      }
      if (isHindi) {
        return "Products khareedne ke liye: 1) Products browse karein aur unhein cart mein add karein, 2) Apne cart ki review karein, 3) Checkout par proceed karein, 4) Delivery address add karein, 5) Razorpay ke through payment complete karein. Kya kisi specific step mein help chahiye?";
      }
    return "To purchase products: 1) Browse products and add them to your cart, 2) Review your cart, 3) Proceed to checkout, 4) Add delivery address, 5) Complete payment via Razorpay. Need help with any specific step?";
  }

  // Service queries - Check for service-related keywords in Hindi/Romanized
  const serviceKeywords = lowerMessage.includes("service") || lowerMessage.includes("installation") || lowerMessage.includes("booking") ||
      message.includes("सेवा") || message.includes("इंस्टॉलेशन") || message.includes("बुकिंग") ||
      lowerMessage.includes("kaun kaun se") || lowerMessage.includes("provide") || lowerMessage.includes("karta") ||
      lowerMessage.includes("sabhi") || (lowerMessage.includes("services") && (lowerMessage.includes("kaun") || lowerMessage.includes("kya")));
  
  if (serviceKeywords) {
    console.log("✅ Service query matched, isHindi:", isHindi, "isHinglish:", isHinglish, "language:", language);
      if (isHinglish) {
        return "Hum kai services offer karte hain: CCTV Installation, Networking Solutions, Digital Marketing, Maintenance, aur Consultation. Aap Services page se koi bhi service book kar sakte hain. Kya aap kisi specific service ki booking mein help chahte hain?";
      }
      if (isHindi) {
        return "Hum kai services offer karte hain: CCTV Installation, Networking Solutions, Digital Marketing, Maintenance, aur Consultation. Aap Services page se koi bhi service book kar sakte hain. Kya aap kisi specific service ki booking mein help chahte hain?";
      }
    return "We offer several services: CCTV Installation, Networking Solutions, Digital Marketing, Maintenance, and Consultation. You can book any service from the Services page. Would you like help booking a specific service?";
  }

  // Admin queries - Product Management (ONLY for admins)
  if (lowerMessage.includes("upload product") || lowerMessage.includes("add product") || lowerMessage.includes("create product")) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      return "To upload/add a product: 1) Go to Admin Panel > Products, 2) Click 'Add New Product', 3) Fill in product details (name, description, price, images), 4) Select brand and category, 5) Set stock and other settings, 6) Click Save. Need help with any specific field?";
    } else {
      if (isHinglish || isHindi) {
        return "Maaf kijiye, main sirf customer-related features mein help kar sakti hoon. Product management admin ke liye hai. Agar aapko products dekhne, khareedne, ya quotation banane mein help chahiye, to main aapki help kar sakti hoon!";
      }
      return "I'm sorry, but I can only help with customer-related features. Product management is only available to administrators. If you need help with browsing products, making purchases, or creating quotations, I'm happy to assist!";
    }
  }
  
  if (lowerMessage.includes("edit product") || lowerMessage.includes("update product") || lowerMessage.includes("modify product")) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      return "To edit a product: 1) Go to Admin Panel > Products, 2) Find the product you want to edit, 3) Click the Edit button, 4) Update the fields you want to change, 5) Click Save. You can update price, description, images, stock, and other details.";
    } else {
      if (isHinglish || isHindi) {
        return "Maaf kijiye, product editing admin ke liye hai. Mai aapki help products dekhne, khareedne, ya quotation banane mein kar sakti hoon!";
      }
      return "I'm sorry, but product editing is only available to administrators. I can help you with browsing products, making purchases, or creating quotations!";
    }
  }
  
  if (lowerMessage.includes("delete product") || lowerMessage.includes("remove product")) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      return "To delete a product: 1) Go to Admin Panel > Products, 2) Find the product, 3) Click Delete button, 4) Confirm deletion. Note: This action cannot be undone. Consider deactivating the product instead if you want to hide it temporarily.";
    } else {
      if (isHinglish || isHindi) {
        return "Maaf kijiye, product deletion admin ke liye hai. Mai aapki help products dekhne ya khareedne mein kar sakti hoon!";
      }
      return "I'm sorry, but product deletion is only available to administrators. I can help you with browsing or purchasing products!";
    }
  }

  // Admin queries - Order Management
  // Order Tracking & Status (for users)
  if ((lowerMessage.includes("order") && (lowerMessage.includes("status") || lowerMessage.includes("track") || lowerMessage.includes("kab") || lowerMessage.includes("deliver"))) ||
      message.includes("ऑर्डर") || message.includes("स्टेटस") || message.includes("ट्रैक")) {
    
    // Try to extract order number
    const orderNumberMatch = message.match(/order[#\s]*([A-Z0-9]+)/i) || message.match(/#([A-Z0-9]+)/);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : null;
    
    if (orderNumber && userId) {
      try {
        const order = await prisma.order.findUnique({
          where: { orderNumber },
          include: {
            items: {
              include: {
                product: {
                  select: { name: true },
                },
              },
            },
          },
        });

        if (order && order.userId === userId) {
          const statusMap: { [key: string]: string } = {
            PENDING: "Processing mein hai",
            CONFIRMED: "Confirm ho gaya hai",
            PROCESSING: "Process ho raha hai",
            SHIPPED: "Ship ho gaya hai",
            DELIVERED: "Deliver ho gaya hai",
            CANCELLED: "Cancel ho gaya hai",
          };

          if (isHinglish || isHindi) {
            return `Aapka order #${order.orderNumber} ${statusMap[order.status] || order.status}.\n\nTotal Amount: ₹${order.total}\nPayment Status: ${order.paymentStatus === "PAID" ? "Paid" : "Pending"}\n\nKya aapko aur details chahiye?`;
          }
          return `Your order #${order.orderNumber} is ${order.status}.\n\nTotal Amount: ₹${order.total}\nPayment Status: ${order.paymentStatus}\n\nNeed more details?`;
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    }

    if (isHinglish || isHindi) {
      return "Order status check karne ke liye: 1) Dashboard mein jao, 2) Orders section mein jao, 3) Apne orders ki list dekho. Agar aapko specific order number hai, to mujhe batao, main check kar sakti hoon!";
    }
    return "To check order status: 1) Go to Dashboard, 2) Navigate to Orders section, 3) View your order list. If you have a specific order number, let me know and I can check it!";
  }

  // Order Management (for admins)
  if (lowerMessage.includes("order") && (lowerMessage.includes("manage") || lowerMessage.includes("view") || lowerMessage.includes("admin"))) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      return "To manage orders: 1) Go to Admin Panel > Orders, 2) View all orders with their status, 3) Click on an order to see details, 4) Update order status (Pending, Confirmed, Processing, Shipped, Delivered), 5) Track payments and shipping. Need help with a specific order?";
    }
  }

  // Admin queries - User Management (ONLY for admins)
  if (lowerMessage.includes("user") && (lowerMessage.includes("manage") || lowerMessage.includes("view") || lowerMessage.includes("admin"))) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      return "To manage users: 1) Go to Admin Panel > Users, 2) View all registered users, 3) See user details, orders, and activity, 4) Change user roles (USER, ADMIN, MODERATOR), 5) View user statistics. What would you like to do with users?";
    } else {
      if (isHinglish || isHindi) {
        return "Maaf kijiye, user management admin ke liye hai. Mai aapki help apne account ko manage karne, products dekhne, ya quotation banane mein kar sakti hoon!";
      }
      return "I'm sorry, but user management is only available to administrators. I can help you manage your own account, browse products, or create quotations!";
    }
  }

  // Admin queries - Category/Brand Management (ONLY for admins)
  if ((lowerMessage.includes("category") || lowerMessage.includes("brand")) && 
      (lowerMessage.includes("add") || lowerMessage.includes("create") || lowerMessage.includes("manage") || lowerMessage.includes("edit") || lowerMessage.includes("delete"))) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      if (lowerMessage.includes("add") || lowerMessage.includes("create")) {
        return "To add a category/brand: 1) Go to Admin Panel > Categories or Brands, 2) Click 'Add New', 3) Enter name, slug, description, 4) Upload logo/icon (for brands), 5) Set active status, 6) Save. Categories help organize products, and brands help customers find products by manufacturer.";
      }
      return "Categories and Brands help organize products. You can manage them from Admin Panel > Categories or Brands. You can add, edit, or deactivate categories and brands. Need help with a specific action?";
    } else {
      if (isHinglish || isHindi) {
        return "Maaf kijiye, category/brand management admin ke liye hai. Mai aapki help products browse karne, categories dekhne, ya quotation banane mein kar sakti hoon!";
      }
      return "I'm sorry, but category/brand management is only available to administrators. I can help you browse products by category or create quotations!";
    }
  }

  // Admin queries - Quotation Settings (ONLY for admins)
  if (lowerMessage.includes("quotation") && (lowerMessage.includes("setting") || lowerMessage.includes("config"))) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      return "Quotation settings help calculate prices automatically. You can configure: 1) HDD settings (storage requirements), 2) Recording device settings (DVR/NVR), 3) Power supply settings, 4) Wiring and installation costs, 5) Accessories. Go to Admin Panel > Quotation Settings to manage these. Which setting do you need help with?";
    } else {
      if (isHinglish || isHindi) {
        return "Maaf kijiye, quotation settings admin ke liye hai. Mai aapki help quotation create karne mein kar sakti hoon - aap 'Get Quotation' page par jaakar quotation bana sakte hain!";
      }
      return "I'm sorry, but quotation settings are only available to administrators. I can help you create a quotation - you can visit the 'Get Quotation' page to create one!";
    }
  }

  // Admin Product Addition Helper
  if ((lowerMessage.includes("product") && (lowerMessage.includes("add") || lowerMessage.includes("create") || lowerMessage.includes("new"))) ||
      (lowerMessage.includes("add") && lowerMessage.includes("product"))) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      if (isHinglish || isHindi) {
        return `Mai aapki help kar sakti hoon product add karne mein:\n\n1. **Product Name**: SEO-friendly name suggest kar sakti hoon\n2. **Description**: Detailed description generate kar sakti hoon\n3. **Category**: Best category suggest kar sakti hoon\n4. **Tags**: Relevant tags suggest kar sakti hoon\n5. **Price Range**: Market analysis ke hisaab se price suggest kar sakti hoon\n\nAap mujhe product details share karein, main aapko suggestions dunga!\n\nExample: "Mujhe CP Plus 4MP camera add karni hai outdoor ke liye"`;
      }
      return `I can help you add products:\n\n1. **Product Name**: I can suggest SEO-friendly names\n2. **Description**: I can generate detailed descriptions\n3. **Category**: I can suggest the best category\n4. **Tags**: I can suggest relevant tags\n5. **Price Range**: I can suggest prices based on market analysis\n\nShare product details with me, and I'll give you suggestions!\n\nExample: "I want to add a CP Plus 4MP outdoor camera"`;
    }
  }

  // Admin queries - Analytics with AI Insights
  if (lowerMessage.includes("analytics") || lowerMessage.includes("report") || lowerMessage.includes("statistic") ||
      lowerMessage.includes("sales") || lowerMessage.includes("revenue") || lowerMessage.includes("insights")) {
    
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      // Note: Analytics fetch requires proper session handling
      // For now, provide guidance to use Admin Panel
      if (isHinglish || isHindi) {
        return "Analytics ke liye Admin Panel > Analytics page par jao. Wahan aap dekh sakte hain:\n\n1. Sales Statistics (total orders, revenue)\n2. Popular Products (top sellers)\n3. Popular Brands\n4. Order Trends\n5. Peak Hours\n6. AI Insights aur Recommendations\n\nAgar specific data chahiye, to mujhe batao!";
      }
      return "Go to Admin Panel > Analytics page for detailed analytics. You can see:\n\n1. Sales Statistics (total orders, revenue)\n2. Popular Products (top sellers)\n3. Popular Brands\n4. Order Trends\n5. Peak Hours\n6. AI Insights and Recommendations\n\nIf you need specific data, let me know!";
    }
    
    // Fallback for non-admin users
    if (isHinglish || isHindi) {
      return "Analytics sirf admins ke liye available hai. Agar aap admin hain, to Admin Panel mein jao.";
    }
    return "Analytics is only available for admins. If you're an admin, go to Admin Panel.";
  }

  // Legacy analytics response (kept for compatibility)
  if (lowerMessage.includes("analytics") || lowerMessage.includes("report") || lowerMessage.includes("statistic")) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      try {
        // Direct database query for analytics (simpler approach)
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const totalOrders = await prisma.order.count();
        const ordersLast30Days = await prisma.order.count({
          where: { createdAt: { gte: last30Days } },
        });
        
        const revenueData = await prisma.order.aggregate({
          where: { createdAt: { gte: last30Days } },
          _sum: { total: true },
        });

        const avgOrderValue = ordersLast30Days > 0 
          ? (revenueData._sum.total || 0) / ordersLast30Days 
          : 0;

        if (isHinglish || isHindi) {
          return `📊 **Quick Analytics:**\n\n- Total Orders: ${totalOrders}\n- Last 30 Days Orders: ${ordersLast30Days}\n- Last 30 Days Revenue: ₹${Math.round(revenueData._sum.total || 0)}\n- Average Order Value: ₹${Math.round(avgOrderValue)}\n\nDetailed analytics Admin Panel > Analytics mein dekh sakte hain!`;
        }
        return `📊 **Quick Analytics:**\n\n- Total Orders: ${totalOrders}\n- Last 30 Days Orders: ${ordersLast30Days}\n- Last 30 Days Revenue: ₹${Math.round(revenueData._sum.total || 0)}\n- Average Order Value: ₹${Math.round(avgOrderValue)}\n\nView detailed analytics in Admin Panel > Analytics!`;
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }

      // Fallback response
      if (isHinglish || isHindi) {
        return "View analytics from Admin Panel > Analytics. Aap dekh sakte hain: 1) Sales statistics, 2) Order trends, 3) Product performance, 4) User activity, 5) Revenue reports. Ye insights aapko data-driven decisions lene mein help karenge.";
      }
      return "View analytics from Admin Panel > Analytics. You can see: 1) Sales statistics, 2) Order trends, 3) Product performance, 4) User activity, 5) Revenue reports. These insights help you make data-driven decisions for your business.";
    }
  }

  // General Admin queries (ONLY for admins)
  if (lowerMessage.includes("admin") && (lowerMessage.includes("panel") || lowerMessage.includes("dashboard") || lowerMessage.includes("manage"))) {
    if (userRole === "ADMIN" || userRole === "MODERATOR") {
      return "As an admin, you can manage:\n1) Products - Add, edit, delete products\n2) Orders - View and update order status\n3) Users - Manage user accounts and roles\n4) Categories & Brands - Organize product catalog\n5) Quotation Settings - Configure pricing rules\n6) Analytics - View business insights\n7) Settings - Configure website settings\n\nWhich feature would you like help with?";
    } else {
      if (isHinglish || isHindi) {
        return "Maaf kijiye, admin panel sirf administrators ke liye hai. Mai aapki help products dekhne, khareedne, services book karne, ya quotation banane mein kar sakti hoon!";
      }
      return "I'm sorry, but the admin panel is only available to administrators. I can help you with browsing products, making purchases, booking services, or creating quotations!";
    }
  }

  // Account queries
  if (lowerMessage.includes("account") || lowerMessage.includes("profile") || lowerMessage.includes("login") || lowerMessage.includes("sign") ||
      message.includes("खाता") || message.includes("प्रोफ़ाइल") || message.includes("लॉगिन")) {
    if (isHinglish) {
      return "आप Dashboard से अपने account को manage कर सकते हैं। अपनी profile update करें, addresses add करें, order history देखें, और अपनी settings manage करें। क्या आपको अपने account में कुछ specific में help चाहिए?";
    }
    if (isHindi) {
      return "आप डैशबोर्ड से अपने खाते को प्रबंधित कर सकते हैं। अपनी प्रोफ़ाइल अपडेट करें, पते जोड़ें, ऑर्डर इतिहास देखें, और अपनी सेटिंग्स प्रबंधित करें। क्या आपको अपने खाते में कुछ विशिष्ट में मदद चाहिए?";
    }
    return "You can manage your account from the Dashboard. Update your profile, add addresses, view order history, and manage your settings. Need help with something specific in your account?";
  }

  // General help
  if (lowerMessage.includes("help") || lowerMessage.includes("how") || lowerMessage.includes("what") ||
      message.includes("मदद") || message.includes("कैसे") || message.includes("क्या")) {
      if (userRole === "ADMIN" || userRole === "MODERATOR") {
        if (isHinglish) {
          return "Mai yahan help ke liye hoon! Mai aapki assist kar sakti hoon:\n- Products find karne aur khareedne mein\n- Quotations create karne mein\n- Services book karne mein\n- Website navigate karne mein\n- Admin panel features (products, orders, users, analytics manage karne mein)\n\nAap kismein help chahte hain?";
        }
        if (isHindi) {
          return "Mai yahan help ke liye hoon! Mai aapki assist kar sakti hoon:\n- Products find karne aur khareedne mein\n- Quotations create karne mein\n- Services book karne mein\n- Website navigate karne mein\n- Admin panel features (products, orders, users, analytics manage karne mein)\n\nAap kismein help chahte hain?";
        }
        return "I'm here to help! I can assist you with:\n- Finding and purchasing products\n- Creating quotations\n- Booking services\n- Navigating the website\n- Admin panel features (managing products, orders, users, analytics)\n\nWhat would you like help with?";
      } else {
        if (isHinglish) {
          return "Mai yahan help ke liye hoon! Mai aapki assist kar sakti hoon:\n- Products find karne aur khareedne mein\n- Quotations create karne mein\n- Services book karne mein\n- Website navigate karne mein\n- Apne account ko manage karne mein\n\nAap kismein help chahte hain?";
        }
        if (isHindi) {
          return "Mai yahan help ke liye hoon! Mai aapki assist kar sakti hoon:\n- Products find karne aur khareedne mein\n- Quotations create karne mein\n- Services book karne mein\n- Website navigate karne mein\n- Apne account ko manage karne mein\n\nAap kismein help chahte hain?";
        }
        return "I'm here to help! I can assist you with:\n- Finding and purchasing products\n- Creating quotations\n- Booking services\n- Navigating the website\n- Managing your account\n\nWhat would you like help with?";
      }
  }

  // D.G.Yard Company Information queries
  if (lowerMessage.includes("d.g.yard") || lowerMessage.includes("dgyard") || lowerMessage.includes("d g yard") ||
      lowerMessage.includes("company") || lowerMessage.includes("about") || 
      message.includes("कंपनी") || message.includes("के बारे") || message.includes("बारे में") ||
      lowerMessage.includes("kya hai") || lowerMessage.includes("kya hain") || lowerMessage.includes("kya ho")) {
    console.log("✅ Company query matched, isHindi:", isHindi, "isHinglish:", isHinglish, "language:", language);
    if (isHinglish) {
      return "D.G.Yard ek leading CCTV solutions aur security systems company hai. Hum provide karte hain:\n\n📹 Products:\n- CCTV Cameras (Dome, Bullet, PTZ)\n- DVR/NVR Systems\n- Complete Surveillance Packages\n- Accessories aur Components\n\n🛠️ Services:\n- CCTV Installation\n- Networking Solutions\n- Digital Marketing\n- Maintenance Services\n- Consultation Services\n\n💼 Company Details:\n- Professional CCTV solutions provider\n- Quality products at competitive prices\n- Expert installation aur support\n- Complete security system solutions\n\nAap quotation create kar sakte hain, products browse kar sakte hain, ya services book kar sakte hain. Mai aapki kaise help kar sakti hoon?";
    }
    if (isHindi) {
      return "D.G.Yard ek leading CCTV solutions aur security systems company hai. Hum provide karte hain:\n\n📹 Products:\n- CCTV Cameras (Dome, Bullet, PTZ)\n- DVR/NVR Systems\n- Complete Surveillance Packages\n- Accessories aur Components\n\n🛠️ Services:\n- CCTV Installation\n- Networking Solutions\n- Digital Marketing\n- Maintenance Services\n- Consultation Services\n\n💼 Company Details:\n- Professional CCTV solutions provider\n- Quality products at competitive prices\n- Expert installation aur support\n- Complete security system solutions\n\nAap quotation create kar sakte hain, products browse kar sakte hain, ya services book kar sakte hain. Mai aapki kaise help kar sakti hoon?";
    }
    return "D.G.Yard is a leading CCTV solutions and security systems company. We provide:\n\n📹 Products:\n- CCTV Cameras (Dome, Bullet, PTZ)\n- DVR/NVR Systems\n- Complete Surveillance Packages\n- Accessories and Components\n\n🛠️ Services:\n- CCTV Installation\n- Networking Solutions\n- Digital Marketing\n- Maintenance Services\n- Consultation Services\n\n💼 Company Details:\n- Professional CCTV solutions provider\n- Quality products at competitive prices\n- Expert installation and support\n- Complete security system solutions\n\nYou can create quotations, browse products, or book services. How can I help you?";
  }

  // Greeting - Check for greetings in English, Hindi, and Romanized Hindi
  const greetingKeywords = lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") || 
      lowerMessage.includes("namaste") || lowerMessage.includes("namaskar") ||
      lowerMessage.includes("kaisi") || lowerMessage.includes("kaise") || lowerMessage.includes("kaisa") ||
      (lowerMessage.includes("ho") && (lowerMessage.includes("kaisi") || lowerMessage.includes("kaise")));
  
  if (greetingKeywords) {
    console.log("✅ Greeting query matched, isHindi:", isHindi, "isHinglish:", isHinglish, "language:", language);
    if (isHinglish) {
      return "Namaste! Mai Honey hoon. Mai aapki CCTV solutions, product selection, service booking, price calculations, quotations, ya website ke baare mein kisi bhi question mein help kar sakti hoon. Mai aapki kaise assist kar sakti hoon?";
    }
    if (isHindi) {
      return "Namaste! Mai Honey hoon. Mai aapki CCTV solutions, product selection, service booking, price calculations, quotations, ya website ke baare mein kisi bhi question mein help kar sakti hoon. Mai aapki kaise assist kar sakti hoon?";
    }
    return "Namaste! I'm Honey. I can help you with product selection, service booking, price calculations, quotations, or any questions about our CCTV solutions. How can I assist you today?";
  }

  // Default response
    if (isHinglish) {
      return "Mai samajh gayi ki aap " + message + " ke baare mein puch rahe hain. Mai aapki help kar sakti hoon. Kya aap aur details de sakte hain? Mai products, services, quotations, account management, ya general website navigation mein assist kar sakti hoon.";
    }
    if (isHindi) {
      return "Mai samajh gayi ki aap " + message + " ke baare mein puch rahe hain. Mai aapki help kar sakti hoon. Kya aap aur details de sakte hain? Mai products, services, quotations, account management, ya general website navigation mein assist kar sakti hoon.";
    }
  return "I understand you're asking about: " + message + ". Let me help you with that. Could you provide more details? I can assist with products, services, quotations, account management, or general website navigation.";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required",
          message: "Please login to use AI features",
          redirect: "/auth/signin"
        },
        { status: 401 }
      );
    }

    // Check profile completion and phone verification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "User not found",
          redirect: "/auth/signin"
        },
        { status: 401 }
      );
    }

    // Check profile completion
    const profileComplete = !!(user.name && user.email && user.phone);
    if (!profileComplete) {
      return NextResponse.json(
        { 
          error: "Profile incomplete",
          message: "Please complete your profile to use AI features",
          redirect: "/dashboard/profile?action=complete"
        },
        { status: 403 }
      );
    }

    // Check phone verification
    if (!user.phoneVerified) {
      return NextResponse.json(
        { 
          error: "Phone not verified",
          message: "Please verify your phone number to use AI features",
          redirect: "/dashboard/profile?action=verify-phone"
        },
        { status: 403 }
      );
    }

    const { message, conversationHistory, context: clientContext, language } = await request.json();

    // Get user name from session or context
    const userName = session?.user?.name || clientContext?.userName || null;

    console.log("📨 API Request received:", {
      message: message?.substring(0, 50),
      language,
      hasLanguage: !!language,
      userName
    });

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build context
    const userRole = session?.user?.role || clientContext?.userRole || "USER";
    const currentPath = clientContext?.currentPath || "/";
    let context = await buildContext(userRole, currentPath, session?.user?.id);
    
    // Add quotation trends to context
    const trends = await getQuotationTrends();
    context += trends;

    // Check if this is a digital marketing page and classify topic
  const isDigitalMarketingPage = currentPath?.includes("/services/digital-marketing") || currentPath?.includes("/digital-marketing");
  let classification: { topic: string | null; mode: "audit" | "expert" | "conversion" | "strategy" | "political" | null } | null = null;
  
  if (isDigitalMarketingPage) {
    classification = classifyDigitalMarketingTopic(message);
    console.log("📊 Digital Marketing Classification:", classification);
  }
  
  // Handle political mode in rule-based system
  if (isDigitalMarketingPage && classification?.mode === "political") {
    const isHindi = language === "hi-IN" || /[\u0900-\u097F]/.test(message);
    
    if (isHindi) {
      const responseText = `मैं आपके लिए एक comprehensive political campaign strategy तैयार कर रही हूँ:

**1. NARRATIVE DIRECTION**
• Core message और positioning define करें
• Candidate introduction strategy
• Issue-focused messaging
• Public perception goals

**2. MESSAGING PILLARS**
• Key talking points
• Communication themes
• Common questions के लिए response frameworks
• Opponent positioning strategy

**3. VOTER GROUP SEGMENTATION**
• Age-based targeting (youth, middle-aged, senior)
• Locality-based segmentation
• Issue-based communication groups
• Demographic targeting

**4. 30-DAY CAMPAIGN CALENDAR**
Week 1: Candidate introduction, issue highlights
Week 2: Social media content, rallies, public meetings
Week 3: Media engagement, press releases, voter outreach
Week 4: Final push, voter mobilization, last-minute messaging

**5. CONTENT IDEAS**
• Video content: Speech highlights, achievements, behind-the-scenes
• Social media posts और engagement strategies
• Press release topics
• Rally और event communication

**6. PR RECOMMENDATIONS**
• Media coordination strategy
• Press release schedule
• Public statements framework
• Crisis communication plan

**7. SENTIMENT CORRECTION**
• Negative sentiment areas identify करें
• Criticism के लिए response strategies
• Reputation management tactics
• Public opinion improvement plan

**8. OFFLINE + ONLINE COMMUNICATION PLAN**
• Ground-level outreach (door-to-door, rallies)
• Digital presence strategy
• WhatsApp community management
• Volunteer engagement system

**9. D.G.YARD EXPERT RECOMMENDATION**
D.G.Yard की expert political strategy team आपके campaign को professionally manage कर सकती है।

क्या आप Book Political Consultation या Call D.G.Yard Political Team करना चाहेंगे?`;
    }
    
    return `I'm preparing a comprehensive political campaign strategy for you:

**1. NARRATIVE DIRECTION**
• Define core message and positioning
• Candidate introduction strategy
• Issue-focused messaging
• Public perception goals

**2. MESSAGING PILLARS**
• Key talking points
• Communication themes
• Response frameworks for common questions
• Opponent positioning strategy

**3. VOTER GROUP SEGMENTATION**
• Age-based targeting (youth, middle-aged, senior)
• Locality-based segmentation
• Issue-based communication groups
• Demographic targeting strategies

**4. 30-DAY CAMPAIGN CALENDAR**
Week 1: Candidate introduction, issue highlights
Week 2: Social media content, rallies, public meetings
Week 3: Media engagement, press releases, voter outreach
Week 4: Final push, voter mobilization, last-minute messaging

**5. CONTENT IDEAS**
• Video content: Speech highlights, achievements, behind-the-scenes
• Social media posts and engagement strategies
• Press release topics
• Rally and event communication

**6. PR RECOMMENDATIONS**
• Media coordination strategy
• Press release schedule
• Public statements framework
• Crisis communication plan

**7. SENTIMENT CORRECTION**
• Identify negative sentiment areas
• Response strategies for criticism
• Reputation management tactics
• Public opinion improvement plan

**8. OFFLINE + ONLINE COMMUNICATION PLAN**
• Ground-level outreach (door-to-door, rallies)
• Digital presence strategy
• WhatsApp community management
• Volunteer engagement system

**9. D.G.YARD EXPERT RECOMMENDATION**
D.G.Yard's expert political strategy team can manage your campaign professionally.

Would you like to Book Political Consultation or Call D.G.Yard Political Team?`;
    const voiceResponse = getVoiceFriendlyResponse(responseText, "en-IN");
    return NextResponse.json({
      response: voiceResponse.text,
      voiceText: voiceResponse.voiceText,
      context: "Honey",
      source: "rule-based",
      conversationId: null,
    });
  }
  
  // Generate response using priority order: Knowledge Base -> OpenAI -> Google GenAI -> Rule-based
    const responseLanguage = language || "en-IN";
    console.log("🔤 Generating response with language:", responseLanguage);
    
    let response: string | null = null;
    let responseSource = "rule-based"; // Default
    
    // Priority 0: Try Knowledge Base first (self-learned responses)
    if (!response) {
      response = await getBestResponseFromKnowledge(message, userRole);
      if (response) {
        console.log("🧠 ✅ Using Knowledge Base response (self-learned)");
        responseSource = "knowledge-base";
      }
    }
    
    // Priority 1: Try OpenAI first (if available)
    if (!response) {
      response = await getOpenAIResponse(message, context, responseLanguage, userName, userRole, currentPath);
      if (response) {
        console.log("🤖 ✅ Using OpenAI response successfully");
        responseSource = "openai";
      }
    }
    
    // Priority 2: Try Google GenAI if OpenAI failed (if available)
    if (!response) {
      response = await getGoogleGenAIResponse(message, context, responseLanguage, userName, userRole, currentPath);
      if (response) {
        console.log("🔷 ✅ Using Google GenAI response successfully");
        responseSource = "google-genai";
      }
    }
    
    // Priority 3: Fallback to rule-based system if both AI providers failed
    if (!response) {
      console.log("📝 Using rule-based system (AI providers not available, failed, or quota exceeded)");
      response = await generateResponse(message, context, conversationHistory || [], responseLanguage, userName, session?.user?.id, userRole, currentPath);
      responseSource = "rule-based";
    }
    
    // Ensure response is not null
    if (!response) {
      response = "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
      responseSource = "rule-based";
    }
    
    // Store conversation for learning (async, don't wait)
    storeConversation(
      session?.user?.id,
      userRole,
      message,
      response,
      responseSource,
      responseLanguage,
      context,
      currentPath
    ).catch(err => console.error("Error storing conversation:", err));

    // Learn from this interaction (ALL sources - external AI responses are high quality!)
    const category = categorizeQuestion(message, context);
    // External AI responses (OpenAI/Google GenAI) are high quality - learn from them!
    // Knowledge base and rule-based are also good
    const isSuccess = responseSource === "openai" || 
                     responseSource === "google-genai" || 
                     responseSource === "knowledge-base" || 
                     responseSource === "rule-based";
    learnPattern(
      "response-pattern",
      message.substring(0, 100),
      response.substring(0, 100),
      category,
      userRole,
      isSuccess
    ).catch(err => console.error("Error learning pattern:", err));
    
    console.log("✅ Response generated:", {
      source: responseSource,
      language: responseLanguage,
      responseLength: response.length,
      responsePreview: response.substring(0, 100),
      hasHindi: /[\u0900-\u097F]/.test(response)
    });

    // Get conversation ID for feedback (we'll need to fetch it)
    let conversationId: string | null = null;
    try {
      const storedConv = await prisma.aIConversation.findFirst({
        where: {
          userId: session?.user?.id || undefined,
          message: { contains: message.substring(0, 50) },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      conversationId = storedConv?.id || null;
    } catch (err) {
      console.error("Error fetching conversation ID:", err);
    }

    // Format response for voice (remove emojis, symbols, format for TTS)
    const voiceResponse = getVoiceFriendlyResponse(response, responseLanguage);

    return NextResponse.json({
      response: voiceResponse.text, // Original text for display
      voiceText: voiceResponse.voiceText, // Clean text for voice/TTS
      context: "Honey",
      source: responseSource, // Include source in response
      conversationId, // Include for feedback
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { error: "Failed to process message", response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}

