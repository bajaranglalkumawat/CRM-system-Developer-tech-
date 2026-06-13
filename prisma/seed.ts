import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_DATA = [
  {
    name: "Web Development",
    description: "Website design, development, and maintenance services",
    services: [
      { name: "Website Development", duration: "ONE_TIME" as const, amount: 25000 },
      { name: "Website Maintenance", duration: "TWELVE_MONTHS" as const, amount: 15000 },
      { name: "Landing Page", duration: "ONE_TIME" as const, amount: 8000 },
      { name: "Web Application", duration: "ONE_TIME" as const, amount: 50000 },
    ],
  },
  {
    name: "SEO",
    description: "Search engine optimization packages",
    services: [
      { name: "SEO Package 3 Months", duration: "THREE_MONTHS" as const, amount: 15000 },
      { name: "SEO Package 6 Months", duration: "SIX_MONTHS" as const, amount: 30000 },
      { name: "SEO Package 12 Months", duration: "TWELVE_MONTHS" as const, amount: 55000 },
    ],
  },
  {
    name: "Digital Marketing",
    description: "Social media, Google Ads, and Meta Ads management",
    services: [
      { name: "Social Media Marketing", duration: "THREE_MONTHS" as const, amount: 18000 },
      { name: "Google Ads", duration: "THREE_MONTHS" as const, amount: 20000 },
      { name: "Meta Ads", duration: "THREE_MONTHS" as const, amount: 18000 },
    ],
  },
  {
    name: "Monitoring",
    description: "Website and server uptime monitoring",
    services: [
      { name: "Website Monitoring", duration: "TWELVE_MONTHS" as const, amount: 6000 },
      { name: "Server Monitoring", duration: "TWELVE_MONTHS" as const, amount: 12000 },
    ],
  },
  {
    name: "Server Maintenance",
    description: "Server support and maintenance packages",
    services: [
      { name: "Server Support 3 Months", duration: "THREE_MONTHS" as const, amount: 12000 },
      { name: "Server Support 6 Months", duration: "SIX_MONTHS" as const, amount: 22000 },
      { name: "Server Support 12 Months", duration: "TWELVE_MONTHS" as const, amount: 40000 },
    ],
  },
  {
    name: "E-commerce Account Management",
    description: "Marketplace account management for Flipkart, Amazon, Meesho",
    services: [
      { name: "Flipkart Account Management", duration: "THREE_MONTHS" as const, amount: 15000 },
      { name: "Amazon Account Management", duration: "THREE_MONTHS" as const, amount: 25000 },
      { name: "Meesho Account Management", duration: "THREE_MONTHS" as const, amount: 12000 },
    ],
  },
  {
    name: "Photography",
    description: "Professional photography services",
    services: [
      { name: "Product Photography", duration: "ONE_TIME" as const, amount: 10000 },
      { name: "Business Photography", duration: "ONE_TIME" as const, amount: 15000 },
    ],
  },
  {
    name: "Videography",
    description: "Professional videography services",
    services: [
      { name: "Product Video", duration: "ONE_TIME" as const, amount: 12000 },
      { name: "Promotional Video", duration: "ONE_TIME" as const, amount: 25000 },
    ],
  },
];

async function main() {
  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@developertech.in";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, password: hashedPassword, name: "Admin", role: "ADMIN" },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log("Admin user already exists.");
  }

  // Seed service categories and services
  for (const cat of SEED_DATA) {
    const existing = await prisma.serviceCategory.findUnique({
      where: { name: cat.name },
    });

    if (existing) {
      console.log(`Category "${cat.name}" already exists, skipping.`);
      continue;
    }

    const category = await prisma.serviceCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
      },
    });

    for (const svc of cat.services) {
      await prisma.service.create({
        data: {
          name: svc.name,
          categoryId: category.id,
          duration: svc.duration,
          amount: svc.amount,
          taxPercent: 18,
        },
      });
    }

    console.log(`Category "${cat.name}" seeded with ${cat.services.length} services.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
