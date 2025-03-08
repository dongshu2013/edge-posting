import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Mock Firebase UIDs
const MOCK_USERS = [
  {
    uid: "user1", // Mock Firebase UID for first user
    email: "alice@example.com",
    username: "Alice",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    bio: "Web3 Developer & AI Enthusiast",
  },
  {
    uid: "user2", // Mock Firebase UID for second user
    email: "bob@example.com",
    username: "Bob",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    bio: "Blockchain Researcher",
  },
];

async function cleanDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.buzz.deleteMany();
  await prisma.user.deleteMany();
  console.log("Database cleaned");
}

async function seedUsers() {
  const users = await Promise.all(
    MOCK_USERS.map((user) =>
      prisma.user.upsert({
        where: { uid: user.uid },
        update: user,
        create: user,
      })
    )
  );
  console.log(`Created ${users.length} users`);
  return users;
}

async function seedBuzzes() {
  const buzzes = await Promise.all([
    // Expired buzz
    prisma.buzz.create({
      data: {
        tweetLink: "https://x.com/XDevelopers/status/1861111969639481848",
        instructions:
          "Share your thoughts on how this could impact Ethereum scaling.",
        context:
          "Vitalik discusses new developments in Ethereum scaling solutions.",
        credit: 0.05,
        createdBy: MOCK_USERS[0].uid,
        deadline: new Date("2024-03-01"),
        createdAt: new Date("2024-02-28"),
        totalReplies: 100,
        replyCount: 0,
        isActive: false,
        user: {
          connect: { uid: MOCK_USERS[0].uid }
        },
      },
    }),
    // Active buzz
    prisma.buzz.create({
      data: {
        tweetLink: "https://x.com/elonmusk/status/1897898972041117883",
        instructions: "Share your perspective on web3 social networks.",
        context: "Discussion about decentralized platforms.",
        credit: 0.1,
        createdBy: MOCK_USERS[1].uid,
        deadline: new Date("2035-04-01"),
        createdAt: new Date(),
        totalReplies: 150,
        replyCount: 0,
        isActive: true,
        user: {
          connect: { uid: MOCK_USERS[1].uid }
        },
      },
    }),
  ]);

  console.log(`Created ${buzzes.length} buzzes`);
  return buzzes;
}

const MOCK_REPLIES = [
  {
    replyLink: "https://x.com/sjpwa1/status/1897818839767040409",
    text: "This is a fascinating approach to blockchain integration. The potential impact on scalability is significant.",
    status: "PENDING",
    createdBy: MOCK_USERS[0].uid,
    createdAt: new Date(),
  },
  {
    replyLink: "https://x.com/sjpwa1/status/1897818839767040409",
    text: "Great analysis! I particularly appreciate how this could improve user experience while maintaining decentralization.",
    status: "APPROVED",
    createdBy: MOCK_USERS[1].uid,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    replyLink: "https://x.com/sjpwa1/status/1897818839767040409",
    text: "Interesting perspective on DeFi adoption. Have you considered the regulatory implications?",
    status: "REJECTED",
    createdBy: MOCK_USERS[0].uid,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

async function seedReplies(buzzes: { id: string }[]) {
  const replies = [];

  for (const buzz of buzzes) {
    for (const replyData of MOCK_REPLIES) {
      replies.push({
        ...replyData,
        buzzId: buzz.id,
      });
    }
  }

  const createdReplies = await Promise.all(
    replies.map((reply) =>
      prisma.reply.create({
        data: {
          replyLink: reply.replyLink,
          text: reply.text,
          status: reply.status as "PENDING" | "APPROVED" | "REJECTED",
          createdBy: reply.createdBy,
          createdAt: reply.createdAt,
          buzz: { connect: { id: reply.buzzId } },
          user: { connect: { uid: reply.createdBy } },
        },
      })
    )
  );

  // Update buzz reply counts
  for (const buzz of buzzes) {
    const replyCount = await prisma.reply.count({
      where: {
        buzzId: buzz.id,
        status: "PENDING",
      },
    });

    await prisma.buzz.update({
      where: { id: buzz.id },
      data: { replyCount },
    });
  }

  console.log(`Created ${createdReplies.length} replies`);
  return createdReplies;
}

async function main() {
  await cleanDatabase();
  await seedUsers();
  const buzzes = await seedBuzzes();
  await seedReplies(buzzes);
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
