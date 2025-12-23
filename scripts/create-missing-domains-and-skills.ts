import { prisma } from "../lib/prisma";

const missingDomains = [
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

async function createMissingDomainsAndSkills() {
  try {
    console.log("🔍 Checking existing Service Domains and Sub-Categories...\n");

    // Get all existing domains
    const existingDomains = await prisma.serviceDomain.findMany({
      select: { id: true, title: true },
    });

    // Get all sub-categories to find a suitable one
    const subCategories = await prisma.serviceSubCategory.findMany({
      include: {
        serviceCategory: {
          select: { id: true, title: true },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    console.log(`📋 Found ${subCategories.length} Service Sub-Categories:\n`);
    subCategories.forEach((sub, index) => {
      console.log(`   ${index + 1}. "${sub.title}" (Category: ${sub.serviceCategory.title})`);
    });

    // Find a suitable sub-category - try to find one related to networking/IT
    let suitableSubCategory = subCategories.find((sub) =>
      sub.title.toLowerCase().includes("networking") ||
      sub.title.toLowerCase().includes("it") ||
      sub.title.toLowerCase().includes("computer") ||
      sub.title.toLowerCase().includes("system")
    );

    // If not found, use the first one
    if (!suitableSubCategory && subCategories.length > 0) {
      suitableSubCategory = subCategories[0];
    }

    if (!suitableSubCategory) {
      console.error("\n❌ No Service Sub-Categories found!");
      console.log("   Please create at least one Service Sub-Category first through the admin panel.");
      process.exit(1);
    }

    console.log(`\n✅ Using Sub-Category: "${suitableSubCategory.title}" (ID: ${suitableSubCategory.id})`);
    console.log(`   Category: "${suitableSubCategory.serviceCategory.title}"\n`);

    let domainsCreated = 0;
    let totalSkillsAdded = 0;

    for (const domainData of missingDomains) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔍 Processing: "${domainData.title}"`);
      console.log(`${"=".repeat(60)}`);

      // Check if domain already exists
      const existingDomain = existingDomains.find(
        (d) => d.title.toLowerCase() === domainData.title.toLowerCase()
      );

      if (existingDomain) {
        console.log(`✅ Domain already exists: "${existingDomain.title}" (ID: ${existingDomain.id})`);
        console.log(`   Adding skills to existing domain...\n`);
        
        let skillsAdded = 0;
        for (const skill of domainData.skills) {
          try {
            const existingSkill = await prisma.skill.findFirst({
              where: {
                title: skill.title,
                serviceDomainId: existingDomain.id,
              },
            });

            if (existingSkill) {
              console.log(`   ⚠️  "${skill.title}" - already exists, skipping...`);
              continue;
            }

            await prisma.skill.create({
              data: {
                title: skill.title,
                shortDescription: skill.shortDescription,
                serviceDomainId: existingDomain.id,
                active: true,
                order: skill.order,
              },
            });

            console.log(`   ✅ "${skill.title}"`);
            skillsAdded++;
          } catch (error: any) {
            if (error.code === "P2002") {
              console.log(`   ⚠️  "${skill.title}" - duplicate, skipping...`);
            } else {
              console.error(`   ❌ Error: ${error.message}`);
            }
          }
        }
        totalSkillsAdded += skillsAdded;
        console.log(`\n   📊 Added ${skillsAdded} skills`);
        continue;
      }

      // Create new domain
      try {
        console.log(`📝 Creating new Service Domain...`);
        
        const newDomain = await prisma.serviceDomain.create({
          data: {
            title: domainData.title,
            shortDescription: domainData.shortDescription,
            active: true,
            order: 0,
            serviceSubCategories: {
              create: {
                serviceSubCategoryId: suitableSubCategory!.id,
              },
            },
          },
        });

        console.log(`✅ Created: "${newDomain.title}" (ID: ${newDomain.id})`);
        domainsCreated++;

        // Add skills
        console.log(`\n📝 Adding ${domainData.skills.length} skills...\n`);
        let skillsAdded = 0;

        for (const skill of domainData.skills) {
          try {
            const createdSkill = await prisma.skill.create({
              data: {
                title: skill.title,
                shortDescription: skill.shortDescription,
                serviceDomainId: newDomain.id,
                active: true,
                order: skill.order,
              },
            });

            console.log(`   ✅ "${createdSkill.title}"`);
            skillsAdded++;
          } catch (error: any) {
            if (error.code === "P2002") {
              console.log(`   ⚠️  "${skill.title}" - duplicate, skipping...`);
            } else {
              console.error(`   ❌ Error: ${error.message}`);
            }
          }
        }

        totalSkillsAdded += skillsAdded;
        console.log(`\n   📊 Added ${skillsAdded} skills`);
      } catch (error: any) {
        if (error.code === "P2002") {
          console.log(`⚠️  Domain "${domainData.title}" already exists (duplicate constraint)`);
          // Try to find it and add skills
          const foundDomain = await prisma.serviceDomain.findFirst({
            where: { title: domainData.title },
          });
          if (foundDomain) {
            console.log(`   Found existing domain, adding skills...`);
            // Add skills logic here
          }
        } else {
          console.error(`❌ Error creating domain: ${error.message}`);
        }
      }
    }

    // Summary
    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`✨ SUMMARY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📦 Service Domains created: ${domainsCreated}`);
    console.log(`📝 Total skills added: ${totalSkillsAdded}`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingDomainsAndSkills();











