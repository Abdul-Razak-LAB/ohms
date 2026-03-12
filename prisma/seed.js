const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  const homeId = "home_seed_1";
  const adminUserId = "user_admin_1";
  const caregiverUserId = "user_caregiver_1";
  const childId = "child_seed_1";
  const donationId = "donation_seed_1";
  const auditId = "audit_seed_1";

  await prisma.home.upsert({
    where: { code: "HOME-SEED-1" },
    update: { name: "Hope Home", timezone: "UTC" },
    create: {
      id: homeId,
      code: "HOME-SEED-1",
      name: "Hope Home",
      timezone: "UTC"
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@ohms.local" },
    update: { fullName: "Admin User", passwordHash: "seed_hash_admin" },
    create: {
      id: adminUserId,
      email: "admin@ohms.local",
      fullName: "Admin User",
      passwordHash: "seed_hash_admin"
    }
  });

  await prisma.user.upsert({
    where: { email: "caregiver@ohms.local" },
    update: { fullName: "Caregiver User", passwordHash: "seed_hash_caregiver" },
    create: {
      id: caregiverUserId,
      email: "caregiver@ohms.local",
      fullName: "Caregiver User",
      passwordHash: "seed_hash_caregiver"
    }
  });

  await prisma.homeMembership.upsert({
    where: {
      homeId_userId: {
        homeId,
        userId: adminUserId
      }
    },
    update: { role: "administrator", isActive: true },
    create: {
      homeId,
      userId: adminUserId,
      role: "administrator",
      isActive: true
    }
  });

  await prisma.homeMembership.upsert({
    where: {
      homeId_userId: {
        homeId,
        userId: caregiverUserId
      }
    },
    update: { role: "caregiver", isActive: true },
    create: {
      homeId,
      userId: caregiverUserId,
      role: "caregiver",
      isActive: true
    }
  });

  await prisma.child.upsert({
    where: { id: childId },
    update: {
      firstName: "Jane",
      lastName: "Doe",
      status: "active"
    },
    create: {
      id: childId,
      homeId,
      firstName: "Jane",
      lastName: "Doe",
      status: "active"
    }
  });

  await prisma.donor.upsert({
    where: { id: "donor_seed_1" },
    update: { name: "Seed Donor" },
    create: {
      id: "donor_seed_1",
      homeId,
      name: "Seed Donor",
      email: "donor@ohms.local"
    }
  });

  await prisma.donation.upsert({
    where: { id: donationId },
    update: { amountCents: 100000 },
    create: {
      id: donationId,
      homeId,
      donorId: "donor_seed_1",
      amountCents: 100000,
      currency: "USD",
      receivedAt: new Date("2026-01-01T00:00:00.000Z")
    }
  });

  await prisma.audit.upsert({
    where: { id: auditId },
    update: { status: "in_progress" },
    create: {
      id: auditId,
      homeId,
      templateId: "template_seed_1",
      periodStart: new Date("2026-01-01T00:00:00.000Z"),
      periodEnd: new Date("2026-01-31T23:59:59.000Z"),
      status: "in_progress"
    }
  });

  await prisma.device.upsert({
    where: {
      homeId_deviceUid: {
        homeId,
        deviceUid: "device_seed_1"
      }
    },
    update: { lastSeenAt: new Date() },
    create: {
      id: "device_seed_1",
      homeId,
      userId: caregiverUserId,
      deviceUid: "device_seed_1",
      lastSeenAt: new Date()
    }
  });

  await prisma.event.upsert({
    where: {
      homeId_idempotencyKey: {
        homeId,
        idempotencyKey: "seed_event_child_registered"
      }
    },
    update: {},
    create: {
      homeId,
      aggregateType: "child",
      aggregateId: childId,
      eventType: "CHILD_REGISTERED",
      payload: {
        childId,
        firstName: "Jane",
        lastName: "Doe"
      },
      actorUserId: adminUserId,
      idempotencyKey: "seed_event_child_registered",
      prevHash: null,
      hash: "seed-hash-1"
    }
  });

  console.log("Seed fixtures applied successfully");
}

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
