import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch Networking & IT page content
export async function GET() {
  try {
    // Try to fetch from database
    let pageContent = await prisma.pageContent.findUnique({
      where: { pageSlug: "networking-it" }
    });

    if (pageContent && pageContent.content) {
      return NextResponse.json({ content: pageContent.content });
    }

    // Return default content if not in database
    const defaultContent = {
      hero: {
        title: "Networking & IT Solutions",
        subtitle: "Fast, stable and professionally structured connectivity for homes, offices, institutions & industries.",
        tagline: "Smooth connectivity, clean design, and effortless performance.",
        heroImage: null,
        buttons: [
          { text: "Plan My Network", href: "/quotation", visible: true },
          { text: "Book Technician Visit", href: "/services/book", visible: true },
          { text: "Ask Honey (AI Help)", action: "chat", visible: true }
        ]
      },
      intro: {
        text: "A great network is the backbone of any business, school, or home.\n\nWe design networks that are fast, stable, secure and neatly organized — with clean cabling, proper device placement and long-term support.\n\nFrom Wi-Fi planning to enterprise-level IT setups, D.G.Yard builds systems that work flawlessly."
      },
      serviceCategories: [
        {
          id: 1,
          title: "🌐 Wi-Fi Planning & Optimization",
          subtitle: "Strong, stable wireless coverage for homes, offices & institutions.",
          features: ["Placement planning", "Heatmap-based layout", "Dead-zone removal"],
          icon: "wifi",
          visible: true
        },
        {
          id: 2,
          title: "🧩 LAN / Fiber / Structured Cabling",
          subtitle: "Clean and organized cabling that lasts for years.",
          features: ["Fiber cabling", "Cat6/Cat7 cabling", "Patch panel setup"],
          icon: "cable",
          visible: true
        },
        {
          id: 3,
          title: "🔌 Routers, Switches & Enterprise Setup",
          subtitle: "Professional-grade configuration for fast performance.",
          features: ["VLAN setup", "Server room setup", "Rack organization"],
          icon: "router",
          visible: true
        },
        {
          id: 4,
          title: "🖥 IT Systems & Devices",
          subtitle: "Complete device solutions for offices & institutions.",
          features: ["Laptops & desktops", "LED/LCD TVs", "Monitors & accessories"],
          icon: "monitor",
          visible: true
        },
        {
          id: 5,
          title: "🏫 Classroom & Institutional Setup",
          subtitle: "Tools for teaching, training & smart learning.",
          features: ["Display boards", "Writing boards", "Information boards", "Teaching equipment"],
          icon: "school",
          visible: true
        },
        {
          id: 6,
          title: "🎥 Video Conferencing & Auditorium Networking",
          subtitle: "Smooth communication for meetings, events & presentations.",
          features: ["Web conferencing", "Projector connectivity", "Full auditorium network"],
          icon: "video",
          visible: true
        }
      ],
      honey: {
        enabled: true,
        title: "💡 Let Honey Help You Build the Perfect Network",
        description: "Honey — our AI assistant — gives quick, smart recommendations based on your space and requirements.",
        buttonText: "→ Ask Honey for Network Suggestions",
        features: [
          "Wi-Fi coverage planning",
          "Device placement suggestions",
          "Required router type",
          "LAN/Fiber cable length estimation",
          "Switch configuration suggestions",
          "Server rack planning",
          "IT equipment selection",
          "Office/classroom setup guidance"
        ]
      },
      beforeAfter: [
        {
          id: 1,
          title: "Messy wiring → Clean structured cabling",
          beforeImage: null,
          afterImage: null,
          visible: true
        },
        {
          id: 2,
          title: "Unorganized rack → Professionally arranged rack",
          beforeImage: null,
          afterImage: null,
          visible: true
        }
      ],
      process: {
        title: "How We Work",
        steps: [
          {
            id: 1,
            title: "We Understand Your Space",
            description: "We survey and note coverage, cabling and router placement."
          },
          {
            id: 2,
            title: "We Suggest the Right Plan",
            description: "Clear, honest recommendations based on your usage and budget."
          },
          {
            id: 3,
            title: "We Install & Optimize Everything",
            description: "Clean cabling, proper signal strength, stable connections."
          }
        ]
      },
      faqs: [
        {
          id: 1,
          question: "Router ka best placement kya hota hai?",
          answer: "Honey aapke space ke hisab se instantly suggest kar sakti hai.",
          visible: true
        },
        {
          id: 2,
          question: "LAN vs Wi-Fi?",
          answer: "Wi-Fi easy, LAN more stable.",
          visible: true
        },
        {
          id: 3,
          question: "Fiber kab use karna chahiye?",
          answer: "Large areas, high speed, long-distance connectivity.",
          visible: true
        },
        {
          id: 4,
          question: "Installation time?",
          answer: "Most setups take 2–6 hours depending on size.",
          visible: true
        }
      ],
      cta: {
        title: "Ready To Build a Better Network?",
        subtitle: "Get a customized layout, clean installation, and AI-powered recommendations.",
        buttons: [
          { text: "Plan My Network", href: "/quotation", visible: true },
          { text: "Get a Quote", href: "/quotation", visible: true },
          { text: "Ask Honey", action: "chat", visible: true }
        ]
      }
    };

    return NextResponse.json({ content: defaultContent });
  } catch (error) {
    console.error("Error fetching page content:", error);
    return NextResponse.json(
      { error: "Failed to fetch page content" },
      { status: 500 }
    );
  }
}

// POST - Update Networking & IT page content
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Store in database
    await prisma.pageContent.upsert({
      where: { pageSlug: "networking-it" },
      update: {
        content: data.content,
        updatedAt: new Date()
      },
      create: {
        pageSlug: "networking-it",
        content: data.content
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Page content updated successfully" 
    });
  } catch (error) {
    console.error("Error updating page content:", error);
    return NextResponse.json(
      { error: "Failed to update page content" },
      { status: 500 }
    );
  }
}

