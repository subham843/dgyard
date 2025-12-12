import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = "subham@dgyard.com";
  const name = "Subham";
  const password = "Subham@1994"; // Note: Password is handled by NextAuth

  try {
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update to admin if not already
      if (existingUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "ADMIN" },
        });
        console.log("✅ User updated to ADMIN!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
      } else {
        console.log("✅ Admin user already exists!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
      }
      return;
    }

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: "+91 9999999999",
        role: "ADMIN",
      },
    });

    console.log("✅ Super Admin user created successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Name:     ${name}`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔗 Login at: http://localhost:3000/auth/signin");
    console.log("🔗 Admin Panel: http://localhost:3000/admin");
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    if (error.code === "P2002") {
      console.error("Email already exists. User will be updated to ADMIN on next run.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();




















