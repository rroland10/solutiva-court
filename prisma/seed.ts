import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { walletAddress: "0x1234567890123456789012345678901234567890" },
    update: {},
    create: {
      walletAddress: "0x1234567890123456789012345678901234567890",
      name: "John Doe",
      email: "john@example.com",
      trustScore: 87,
      avfBalance: 2847.5,
      isJuryMember: true,
    },
  });

  const juryMembers = await Promise.all(
    [
      { walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", name: "Alice Chen" },
      { walletAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", name: "Bob Martinez" },
      { walletAddress: "0xcccccccccccccccccccccccccccccccccccccccc", name: "Carol Singh" },
    ].map((member) =>
      prisma.user.upsert({
        where: { walletAddress: member.walletAddress },
        update: { isJuryMember: true },
        create: {
          ...member,
          trustScore: 75 + Math.floor(Math.random() * 20),
          avfBalance: 500 + Math.random() * 2000,
          isJuryMember: true,
        },
      })
    )
  );

  await prisma.vote.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.activity.deleteMany();

  const disputes = await Promise.all([
    prisma.dispute.create({
      data: {
        title: "Contract Breach - Case #1247",
        description:
          "Dispute regarding non-payment of services rendered. Plaintiff claims $5,000 in damages.",
        category: "CONTRACT",
        status: "ACTIVE",
        collateral: 100,
        defendantAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        plaintiffId: demoUser.id,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        aiSummary:
          "Strong evidence of contract breach. Plaintiff provided signed agreement and payment records.",
      },
    }),
    prisma.dispute.create({
      data: {
        title: "IP Violation - Case #1246",
        description:
          "Alleged copyright infringement of software code. Defendant denies claims.",
        category: "INTELLECTUAL",
        status: "PENDING",
        collateral: 250,
        defendantAddress: "0xdef1234567890abcdef1234567890abcdef123456",
        plaintiffId: demoUser.id,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.dispute.create({
      data: {
        title: "Service Quality - Case #1245",
        description:
          "Dispute over quality of web development services. Ruling: Partial refund awarded.",
        category: "SERVICE",
        status: "RESOLVED",
        resolutionOutcome: "plaintiff",
        collateral: 75,
        defendantAddress: "0x9876543210fedcba9876543210fedcba98765432",
        plaintiffId: demoUser.id,
        aiSummary: "Partial refund recommended based on deliverable quality assessment.",
      },
    }),
  ]);

  const activeDispute = disputes.find((d) => d.status === "ACTIVE");

  await prisma.vote.createMany({
    data: [
      {
        disputeId: activeDispute!.id,
        userId: juryMembers[0].id,
        choice: "plaintiff",
      },
      {
        disputeId: activeDispute!.id,
        userId: juryMembers[1].id,
        choice: "defendant",
      },
      {
        disputeId: activeDispute!.id,
        userId: juryMembers[2].id,
        choice: "plaintiff",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.activity.createMany({
    data: [
      {
        userId: demoUser.id,
        type: "resolved",
        title: `Dispute #${disputes[2].caseNumber} resolved`,
        metadata: {
          disputeId: disputes[2].id,
          caseNumber: disputes[2].caseNumber,
          resolutionOutcome: disputes[2].resolutionOutcome,
        },
      },
      {
        userId: juryMembers[0].id,
        type: "jury",
        title: "New jury member joined",
      },
      {
        userId: juryMembers[0].id,
        type: "vote",
        title: `Vote cast on Case #${activeDispute!.caseNumber}`,
        metadata: {
          disputeId: activeDispute!.id,
          caseNumber: activeDispute!.caseNumber,
          choice: "plaintiff",
        },
      },
      {
        userId: demoUser.id,
        type: "reward",
        title: "Rewards distributed",
      },
    ],
  });

  const activeDisputes = disputes.filter((d) => d.status === "ACTIVE").length;
  const resolved = disputes.filter((d) => d.status === "RESOLVED").length;
  const totalStaked = disputes.reduce((sum, d) => sum + d.collateral, 0);

  await prisma.platformStats.upsert({
    where: { id: "default" },
    update: {
      activeDisputes,
      juryMembers: juryMembers.length + 1,
      resolutionRate: Math.round((resolved / disputes.length) * 1000) / 10,
      totalStaked,
    },
    create: {
      id: "default",
      activeDisputes,
      juryMembers: juryMembers.length + 1,
      resolutionRate: Math.round((resolved / disputes.length) * 1000) / 10,
      totalStaked,
    },
  });

  console.log(`Seeded ${disputes.length} disputes, ${juryMembers.length + 1} jury members`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
