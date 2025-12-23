import { prisma } from "../lib/prisma";

const skills = [
  {
    title: "HD CCTV Fresh Installation",
    shortDescription: "Ability to install new HD CCTV systems including camera fixing, wiring, DVR and HDD setup.",
    order: 0,
  },
  {
    title: "HD CCTV Repair & Troubleshooting",
    shortDescription: "Experience in diagnosing and fixing issues in existing HD CCTV systems.",
    order: 1,
  },
  {
    title: "Camera Mounting & Angle Adjustment",
    shortDescription: "Proper camera placement and angle setting for maximum coverage.",
    order: 2,
  },
  {
    title: "DVR Installation & Configuration",
    shortDescription: "Setup and configuration of DVRs, recording modes, and playback.",
    order: 3,
  },
  {
    title: "HDD Installation & Recording Setup",
    shortDescription: "Installing CCTV-grade hard disks and configuring recording schedules.",
    order: 4,
  },
  {
    title: "Mobile Remote Viewing Setup",
    shortDescription: "Configuring mobile apps for live view and playback access.",
    order: 5,
  },
];

async function addHDCCTVSkills() {
  try {
    console.log("🔍 Looking for Service Domain: 'HD CCTV Systems'...");

    // Find the Service Domain by title
    const serviceDomain = await prisma.serviceDomain.findFirst({
      where: {
        title: "HD CCTV Systems",
      },
    });

    if (!serviceDomain) {
      console.error("❌ Service Domain 'HD CCTV Systems' not found!");
      console.log("\n📋 Available Service Domains:");
      const allDomains = await prisma.serviceDomain.findMany({
        select: { id: true, title: true },
      });
      allDomains.forEach((domain) => {
        console.log(`  - ${domain.title} (ID: ${domain.id})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found Service Domain: "${serviceDomain.title}" (ID: ${serviceDomain.id})`);
    console.log(`\n📝 Adding ${skills.length} skills...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const skill of skills) {
      try {
        // Check if skill already exists
        const existingSkill = await prisma.skill.findFirst({
          where: {
            title: skill.title,
            serviceDomainId: serviceDomain.id,
          },
        });

        if (existingSkill) {
          console.log(`⚠️  Skill "${skill.title}" already exists, skipping...`);
          continue;
        }

        const createdSkill = await prisma.skill.create({
          data: {
            title: skill.title,
            shortDescription: skill.shortDescription,
            serviceDomainId: serviceDomain.id,
            active: true,
            order: skill.order,
          },
        });

        console.log(`✅ Created: "${createdSkill.title}"`);
        successCount++;
      } catch (error: any) {
        if (error.code === "P2002") {
          console.log(`⚠️  Skill "${skill.title}" already exists (duplicate), skipping...`);
        } else {
          console.error(`❌ Error creating skill "${skill.title}":`, error.message);
          errorCount++;
        }
      }
    }

    console.log(`\n✨ Done! Successfully added ${successCount} skills.`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} errors occurred.`);
    }

    // Display all skills in the domain
    console.log(`\n📋 All skills in "${serviceDomain.title}":`);
    const allSkills = await prisma.skill.findMany({
      where: {
        serviceDomainId: serviceDomain.id,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        order: true,
        active: true,
      },
    });

    allSkills.forEach((skill, index) => {
      console.log(`  ${index + 1}. ${skill.title} (Order: ${skill.order}, Active: ${skill.active})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addHDCCTVSkills();











