import { prisma } from "../lib/prisma";

const serviceDomainsData = [
  {
    title: "IP CCTV (UTP / LAN Based)",
    shortDescription: "Network-based CCTV systems using IP cameras, LAN cables, PoE switches, and NVRs.",
    skills: [
      {
        title: "IP CCTV Fresh Installation (LAN Based)",
        shortDescription: "Installing new IP CCTV systems using Cat5e/Cat6 cabling.",
        order: 0,
      },
      {
        title: "IP CCTV Repair & Maintenance (LAN)",
        shortDescription: "Troubleshooting camera offline, NVR, and network issues.",
        order: 1,
      },
      {
        title: "PoE Switch Installation & Configuration",
        shortDescription: "Setting up PoE switches to power and connect IP cameras.",
        order: 2,
      },
      {
        title: "NVR Installation & Configuration",
        shortDescription: "Configuring NVRs for IP camera recording and monitoring.",
        order: 3,
      },
      {
        title: "IP Addressing (Static / DHCP)",
        shortDescription: "Assigning and managing IP addresses for stable networking.",
        order: 4,
      },
      {
        title: "Router Configuration & Port Forwarding",
        shortDescription: "Enabling remote viewing through router and firewall settings.",
        order: 5,
      },
    ],
  },
  {
    title: "IP CCTV (Fiber Based)",
    shortDescription: "Advanced CCTV systems using fiber optic cable for long-distance and large-area surveillance.",
    skills: [
      {
        title: "Fiber-Based IP CCTV Installation",
        shortDescription: "Installing IP CCTV systems using fiber connectivity.",
        order: 0,
      },
      {
        title: "Fiber Cable Laying",
        shortDescription: "Laying fiber cables for CCTV and networking purposes.",
        order: 1,
      },
      {
        title: "Fiber Splicing & Termination",
        shortDescription: "Performing fiber jointing and termination work.",
        order: 2,
      },
      {
        title: "Media Converter / SFP Setup",
        shortDescription: "Configuring fiber-to-LAN devices and SFP modules.",
        order: 3,
      },
      {
        title: "Fiber CCTV Repair & Troubleshooting",
        shortDescription: "Fixing fiber link failures and signal loss issues.",
        order: 4,
      },
      {
        title: "Long-Distance CCTV Network Design",
        shortDescription: "Designing CCTV connectivity for large or multi-building sites.",
        order: 5,
      },
    ],
  },
  {
    title: "LAN Networking",
    shortDescription: "Local Area Network setup and support using structured cabling and networking devices.",
    skills: [
      {
        title: "LAN Fresh Installation",
        shortDescription: "Installing new LAN networks with structured cabling.",
        order: 0,
      },
      {
        title: "LAN Repair & Troubleshooting",
        shortDescription: "Fixing LAN cable faults, connectivity, and speed issues.",
        order: 1,
      },
      {
        title: "Cat5e / Cat6 Cable Laying",
        shortDescription: "Professional LAN cable routing and termination.",
        order: 2,
      },
      {
        title: "Switch Installation & Configuration",
        shortDescription: "Installing and configuring network switches.",
        order: 3,
      },
      {
        title: "Router Setup & Internet Configuration",
        shortDescription: "Configuring routers for wired and wireless internet.",
        order: 4,
      },
      {
        title: "Network Testing & Optimization",
        shortDescription: "Testing and optimizing LAN performance.",
        order: 5,
      },
    ],
  },
  {
    title: "Fiber Networking",
    shortDescription: "High-speed fiber optic networking for long-distance and high-bandwidth connectivity.",
    skills: [
      {
        title: "Fiber Networking Fresh Installation",
        shortDescription: "Installing new fiber network infrastructure.",
        order: 0,
      },
      {
        title: "Fiber Network Repair & Maintenance",
        shortDescription: "Troubleshooting and repairing fiber connectivity issues.",
        order: 1,
      },
      {
        title: "OTDR / Power Meter Testing",
        shortDescription: "Testing fiber signal strength and quality.",
        order: 2,
      },
      {
        title: "Fiber Fault Detection & Repair",
        shortDescription: "Identifying and fixing fiber cable breaks.",
        order: 3,
      },
      {
        title: "Core Switch / Media Converter Setup",
        shortDescription: "Configuring fiber network equipment.",
        order: 4,
      },
    ],
  },
  {
    title: "Computer & Laptop Systems",
    shortDescription: "Installation, repair, and support services for desktop and laptop computers.",
    skills: [
      {
        title: "Computer & Laptop Fresh Installation",
        shortDescription: "Setting up new computers with OS and drivers.",
        order: 0,
      },
      {
        title: "Computer & Laptop Repair",
        shortDescription: "Repairing hardware and software issues.",
        order: 1,
      },
      {
        title: "OS Installation (Windows / Linux)",
        shortDescription: "Installing and configuring operating systems.",
        order: 2,
      },
      {
        title: "Hardware Upgrade & Replacement",
        shortDescription: "RAM, SSD/HDD, motherboard, and PSU replacement.",
        order: 3,
      },
      {
        title: "Virus Removal & System Optimization",
        shortDescription: "Cleaning and optimizing slow or infected systems.",
        order: 4,
      },
    ],
  },
  {
    title: "Printer & Scanner Systems",
    shortDescription: "Installation and repair services for printers, scanners, and multifunction devices.",
    skills: [
      {
        title: "Printer Fresh Installation & Setup",
        shortDescription: "Installing printers and connecting them to systems or networks.",
        order: 0,
      },
      {
        title: "Printer Repair & Troubleshooting",
        shortDescription: "Fixing paper jam, print quality, and connectivity issues.",
        order: 1,
      },
      {
        title: "Network / Wi-Fi Printer Configuration",
        shortDescription: "Setting up printers on LAN or Wi-Fi networks.",
        order: 2,
      },
      {
        title: "Scanner Installation & Testing",
        shortDescription: "Installing and testing scanning devices.",
        order: 3,
      },
      {
        title: "Printer Sharing & Office Setup",
        shortDescription: "Configuring printers for multi-user environments.",
        order: 4,
      },
    ],
  },
];

async function addServiceDomainsAndSkills() {
  try {
    console.log("🚀 Starting to add Service Domains and Skills...\n");

    // Get all existing service domains to check
    const existingDomains = await prisma.serviceDomain.findMany({
      select: { id: true, title: true },
    });

    console.log(`📋 Found ${existingDomains.length} existing Service Domains in database.\n`);

    let domainsProcessed = 0;
    let domainsCreated = 0;
    let domainsFound = 0;
    let totalSkillsAdded = 0;
    let totalSkillsSkipped = 0;

    for (const domainData of serviceDomainsData) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔍 Processing: "${domainData.title}"`);
      console.log(`${"=".repeat(60)}`);

      // Check if domain exists
      let serviceDomain = existingDomains.find(
        (d) => d.title.toLowerCase() === domainData.title.toLowerCase()
      );

      if (!serviceDomain) {
        // Try to find by partial match
        serviceDomain = existingDomains.find((d) =>
          d.title.toLowerCase().includes(domainData.title.toLowerCase()) ||
          domainData.title.toLowerCase().includes(d.title.toLowerCase())
        );
      }

      if (serviceDomain) {
        console.log(`✅ Found existing Service Domain: "${serviceDomain.title}" (ID: ${serviceDomain.id})`);
        domainsFound++;
      } else {
        console.log(`⚠️  Service Domain "${domainData.title}" not found.`);
        console.log(`   Note: Service Domains need to be associated with Service Sub-Categories.`);
        console.log(`   Please create this domain through the admin panel first, or provide the sub-category ID.`);
        console.log(`   Skipping skills for this domain...\n`);
        domainsProcessed++;
        continue;
      }

      // Add skills to the domain
      console.log(`\n📝 Adding ${domainData.skills.length} skills...\n`);

      let skillsAdded = 0;
      let skillsSkipped = 0;

      for (const skill of domainData.skills) {
        try {
          // Check if skill already exists
          const existingSkill = await prisma.skill.findFirst({
            where: {
              title: skill.title,
              serviceDomainId: serviceDomain!.id,
            },
          });

          if (existingSkill) {
            console.log(`   ⚠️  "${skill.title}" - already exists, skipping...`);
            skillsSkipped++;
            continue;
          }

          const createdSkill = await prisma.skill.create({
            data: {
              title: skill.title,
              shortDescription: skill.shortDescription,
              serviceDomainId: serviceDomain!.id,
              active: true,
              order: skill.order,
            },
          });

          console.log(`   ✅ "${createdSkill.title}"`);
          skillsAdded++;
        } catch (error: any) {
          if (error.code === "P2002") {
            console.log(`   ⚠️  "${skill.title}" - duplicate constraint, skipping...`);
            skillsSkipped++;
          } else {
            console.error(`   ❌ Error creating skill "${skill.title}":`, error.message);
          }
        }
      }

      console.log(`\n   📊 Skills: ${skillsAdded} added, ${skillsSkipped} skipped`);
      totalSkillsAdded += skillsAdded;
      totalSkillsSkipped += skillsSkipped;
      domainsProcessed++;
    }

    // Summary
    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`✨ SUMMARY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📦 Service Domains processed: ${domainsProcessed}`);
    console.log(`   ✅ Found: ${domainsFound}`);
    console.log(`   ⚠️  Not found: ${domainsProcessed - domainsFound}`);
    console.log(`\n📝 Skills:`);
    console.log(`   ✅ Added: ${totalSkillsAdded}`);
    console.log(`   ⚠️  Skipped: ${totalSkillsSkipped}`);
    console.log(`   📊 Total: ${totalSkillsAdded + totalSkillsSkipped}`);

    // Show all domains and their skill counts
    console.log(`\n📋 Final Status - All Service Domains with Skills:`);
    const allDomains = await prisma.serviceDomain.findMany({
      where: {
        title: {
          in: serviceDomainsData.map((d) => d.title),
        },
      },
      include: {
        _count: {
          select: { skills: true },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    for (const domain of allDomains) {
      const domainData = serviceDomainsData.find((d) => d.title === domain.title);
      const expectedSkills = domainData?.skills.length || 0;
      console.log(`   • ${domain.title}: ${domain._count.skills} skills (expected: ${expectedSkills})`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addServiceDomainsAndSkills();











