import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seeds a minimal, demo-safe baseline: one super admin account (for
 * exercising the admin console/RBAC) and default feature flags. No real
 * personal data. Change ADMIN_PASSWORD in a non-demo environment.
 */
async function main() {
  const adminEmail = "admin@locaguide.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      displayName: "LocaGuide Admin",
      role: "SUPER_ADMIN",
    },
    update: {},
  });

  await prisma.featureFlag.createMany({
    data: [
      { key: "travel_mode", enabled: false, description: "Trip planner / tour mode (section 49)" },
      { key: "location_agent", enabled: false, description: "Conversational location agent (section 50)" },
      { key: "multi_tenant", enabled: false, description: "Enterprise multi-tenancy (section 51)" },
    ],
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
