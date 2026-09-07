import { PrismaClient } from '@prisma/client';
import { rules } from '../src/seo/rules';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed SEO rules
  for (const rule of rules) {
    await prisma.seoRule.upsert({
      where: { code: rule.code },
      update: {},
      create: {
        code: rule.code,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        description: rule.name,
        recommendation: rule.evaluate({} as any)?.recommendation || 'Fix issue',
      }
    });
  }
  console.log('SEO rules seeded.');

  // Create a default org and user for development
  const testEmail = 'admin@seointelligence.local';
  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    const org = await prisma.organization.create({
      data: { name: 'Demo Organization' }
    });
    const hash = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: 'Demo Admin',
        passwordHash: hash,
        role: 'ADMIN',
        organizationId: org.id
      }
    });
    console.log('Demo user created: admin@seointelligence.local / password123');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
