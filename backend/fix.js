const fs = require('fs');
const path = require('path');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');
const searchString = 'model WhiteLabelSettings {';
const index = content.indexOf(searchString);
if (index !== -1) {
    content = content.substring(0, index);
}

content += `model WhiteLabelSettings {
  id               String       @id @default(uuid())
  organizationId   String       @unique
  companyName      String?
  logoUrl          String?
  primaryColor     String?
  website          String?
  footerText       String?
  contactEmail     String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  organization     Organization @relation("OrgWhiteLabel", fields: [organizationId], references: [id], onDelete: Cascade)
}

model Feedback {
  id             String       @id @default(uuid())
  organizationId String?
  userId         String?
  category       String
  message        String
  context        String?
  status         String       @default("NEW")
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  user           User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([userId])
  @@index([status])
}

model ProductEvent {
  id             String       @id @default(uuid())
  organizationId String?
  userId         String?
  projectId      String?
  event          String
  metadata       Json?
  createdAt      DateTime     @default(now())

  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  user           User?         @relation(fields: [userId], references: [id], onDelete: SetNull)
  project        Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([userId])
  @@index([projectId])
  @@index([event, createdAt])
}
`;
fs.writeFileSync(schemaPath, content);
