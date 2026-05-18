/* eslint-disable no-console */
import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@skyservices.az";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed: user ${email} already exists — leaving alone.`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: "Owner",
      passwordHash: await hashPassword(password),
      role: UserRole.OWNER,
    },
  });
  console.log(`Seed: created OWNER ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
