import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch AV Fire Infrastructure page content
export async function GET() {
  try {
    let pageContent = await prisma.pageContent.findUnique({
      where: { pageSlug: "av-fire-infrastructure" }
    });

    if (pageContent && pageContent.content) {
      return NextResponse.json({ content: pageContent.content });
    }

    // Return default content if not in database
    const defaultContent = {
      hero: {
        title: "AV, Fire, Smart Infrastructure & Home Automation Solutions",
        subtitle: "Modern spaces need modern systems. From AV setups to fire safety to automation — we design environments that are intelligent, safe and effortlessly convenient.",
        tagline: "Classrooms → Offices → Homes → Industries — we install everything end-to-end.",
        buttons: [
          { text: "Explore Solutions", href: "#solutions", visible: true },
          { text: "Ask Honey (AI Help)", action: "honey", visible: true },
          { text: "Book Installation", href: "/contact", visible: true }
        ]
      },
      intro: {
        text: "Spaces today need more than just equipment — they need smart, integrated systems that communicate, secure and simplify everyday work. D.G.Yard provides complete Audio-Visual, Fire Protection, Smart Infrastructure, and Home/Office Automation solutions powered by expert planning, clean installation, and AI guidance through Honey. Whether it's projectors, hydrants, boom barriers, or voice-controlled smart homes — we build spaces that feel modern, efficient and safe."
      },
      serviceCategories: [
        {
          id: 1,
          title: "Audio-Visual Systems",
          description: "Better communication, more engagement, and modern presentation environments.",
          icon: "video",
          services: [
            { title: "Projectors (Normal & Laser)", description: "High-quality projection for classrooms, offices, and auditoriums" },
            { title: "Motorized & Manual Screens", description: "Professional projection screens for all environments" },
            { title: "Smart Interactive Boards", description: "Interactive whiteboards for engaging presentations" },
            { title: "Visualizers", description: "Document cameras for clear visual presentations" },
            { title: "PA & Professional Sound Systems", description: "Crystal clear audio for announcements and events" },
            { title: "Video Conferencing Systems", description: "Complete setup for remote meetings and collaboration" },
            { title: "Motorized Projector Lifts", description: "Automated projector mounting solutions" }
          ]
        },
        {
          id: 2,
          title: "Fire Safety Systems",
          description: "Reliable protection and industrial-grade compliance.",
          icon: "flame",
          services: [
            { title: "Automatic Sprinkler Systems", description: "Complete fire suppression systems" },
            { title: "Fire Hydrant Setup", description: "Emergency water supply systems" },
            { title: "Fire Safety Accessories", description: "Hoses, signage, alarms, and compliance equipment" },
            { title: "Compliance & Safety Checklist", description: "Full safety audit and compliance verification" }
          ]
        },
        {
          id: 3,
          title: "Smart Infrastructure Systems",
          description: "Safer movement, smooth entry management, and modernized facility infrastructure.",
          icon: "building",
          services: [
            { title: "Automatic Boom Barriers", description: "Automated gate control systems" },
            { title: "Flap Barriers / Turnstiles", description: "Access control for secure entry" },
            { title: "Solar Traffic Blinkers", description: "Solar-powered traffic safety lights" },
            { title: "Solar Road Studs", description: "Energy-efficient road marking systems" },
            { title: "Speed Breakers", description: "Rubber/PU/Plastic speed control solutions" },
            { title: "LED/LCD Display Systems", description: "Digital signage and information displays" },
            { title: "Complete Auditorium Setup", description: "Full AV and infrastructure for auditoriums" }
          ]
        },
        {
          id: 4,
          title: "Home & Office Automation",
          description: "Convenience, energy efficiency, security, and modern living.",
          icon: "home",
          services: [
            { title: "Smart Lighting Automation", description: "Control lights using Alexa, Google Home, apps, motion sensors & schedules" },
            { title: "Smart Fans & Appliances", description: "Operate fans, AC, TV through voice commands or mobile control" },
            { title: "Smart Plugs & Smart Switch Panels", description: "Convert any appliance into a smart, automated device" },
            { title: "Routine & Timer Automation", description: "Schedule lights, AC, appliances to turn on/off automatically" },
            { title: "Home Security Integration", description: "Smart door sensors, alarm systems, Wi-Fi locks, video doorbells" },
            { title: "Office Automation", description: "Meeting room automation, AV integration, routine-based control" }
          ]
        }
      ],
      packages: [
        {
          name: "Classroom Smart Pack",
          description: "Complete AV setup for classrooms",
          features: ["Projector", "Smart Board", "Sound System", "Visualizer"]
        },
        {
          name: "Conference AV Pack",
          description: "Professional meeting room setup",
          features: ["Video Conferencing", "Display Systems", "Audio Setup", "Smart Controls"]
        },
        {
          name: "Fire Safety Pack",
          description: "Complete fire protection",
          features: ["Sprinkler System", "Hydrant Setup", "Safety Accessories", "Compliance"]
        },
        {
          name: "Infrastructure Automation Pack",
          description: "Smart infrastructure solutions",
          features: ["Boom Barriers", "Access Control", "Traffic Systems", "Display Systems"]
        },
        {
          name: "Home Automation Starter Pack",
          description: "Essential smart home features",
          features: ["Smart Lighting", "Smart Switches", "Voice Control", "Mobile App"]
        },
        {
          name: "Office Automation Pro Pack",
          description: "Complete office automation",
          features: ["Meeting Room Automation", "AV Integration", "Smart Controls", "Routine Automation"]
        }
      ],
      faqs: [
        {
          question: "Do you provide smart home automation?",
          answer: "Yes — we offer complete Alexa and Google Home integration with smart lighting, appliances, security, and routine automation."
        },
        {
          question: "Can Honey help design my AV setup?",
          answer: "Yes — Honey can suggest projector placement, screen size, speaker positioning, and complete conference room layouts."
        },
        {
          question: "Do you install fire safety systems?",
          answer: "Yes — we provide complete fire sprinkler systems, hydrants, and all safety accessories with full compliance."
        },
        {
          question: "What smart automation options do you offer?",
          answer: "We offer smart lighting, fans, AC control, smart switches, Alexa/Google integration, security systems, and complete routine automation."
        }
      ],
      cta: {
        title: "Ready to Transform Your Space?",
        subtitle: "From AV to fire safety to smart automation — we handle everything.",
        buttons: [
          { text: "Book Installation", href: "/contact", visible: true },
          { text: "Ask Honey", action: "honey", visible: true },
          { text: "Get Quote", href: "/quotation", visible: true }
        ]
      }
    };

    return NextResponse.json({ content: defaultContent });
  } catch (error) {
    console.error("Error fetching AV Fire Infrastructure page content:", error);
    return NextResponse.json(
      { error: "Failed to fetch page content" },
      { status: 500 }
    );
  }
}

// POST - Update AV Fire Infrastructure page content
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { content } = await request.json();

    await prisma.pageContent.upsert({
      where: { pageSlug: "av-fire-infrastructure" },
      update: { content },
      create: {
        pageSlug: "av-fire-infrastructure",
        content,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating AV Fire Infrastructure page content:", error);
    return NextResponse.json(
      { error: "Failed to update page content" },
      { status: 500 }
    );
  }
}























