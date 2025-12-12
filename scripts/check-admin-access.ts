import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminAccess() {
  try {
    console.log("🔍 Checking admin access...\n");

    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (users.length === 0) {
      console.log("❌ No users found in database!");
      console.log("\n📝 To create an admin user:");
      console.log("   npm run create-admin");
      return;
    }

    console.log(`📊 Total users: ${users.length}\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("User List:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    users.forEach((user, index) => {
      const roleIcon = user.role === "ADMIN" ? "👑" : user.role === "MODERATOR" ? "🔧" : "👤";
      console.log(`${index + 1}. ${roleIcon} ${user.name || "No Name"}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log("");
    });

    const adminUsers = users.filter((u) => u.role === "ADMIN");

    if (adminUsers.length === 0) {
      console.log("⚠️  NO ADMIN USERS FOUND!\n");
      console.log("📝 To create an admin user, run:");
      console.log("   npm run create-admin\n");
      console.log("📝 Or update an existing user to ADMIN:");
      console.log("   Update the user's role in the database to 'ADMIN'");
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      adminUsers.forEach((admin) => {
        console.log(`   👑 ${admin.name || "No Name"} (${admin.email})`);
      });
      console.log("\n🔗 Admin Panel: http://localhost:3000/admin");
      console.log("🔗 Login: http://localhost:3000/auth/signin\n");
    }
  } catch (error: any) {
    console.error("❌ Error checking admin access:", error.message);
    console.error("\n💡 Make sure:");
    console.error("   1. Database is connected");
    console.error("   2. Prisma client is generated (npm run db:generate)");
    console.error("   3. Environment variables are set correctly");
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminAccess();

