import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const MY_UID = "user_01";
const OTHER_UID = "user_02";

const MOCK_USERS = [
  {
    uid: MY_UID,
    email: "alice@example.com",
    username: "alice",
    nickname: "Alice",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    bio: "Web3 Developer & AI Enthusiast",
    totalEarned: 0,
    balance: 0,
  },
  {
    uid: OTHER_UID,
    email: "bob@example.com",
    username: "bob",
    nickname: "Bob",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    bio: "Blockchain Researcher",
    totalEarned: 0,
    balance: 0,
  },
];

async function cleanDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.withdrawal.deleteMany();
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
    // 已结束的活动
    prisma.buzz.create({
      data: {
        tweetLink: "https://x.com/XDevelopers/status/1861111969639481848",
        instructions:
          "Share your thoughts on how this could impact Ethereum scaling.",
        context:
          "Vitalik discusses new developments in Ethereum scaling solutions.",
        credit: 0.05,
        createdBy: MY_UID,
        deadline: new Date("2024-03-01"),
        createdAt: new Date("2024-02-28"),
        totalReplies: 100,
        replyCount: 0,
        isActive: false,
        isSettled: true,
      },
    }),
    // 进行中的活动
    prisma.buzz.create({
      data: {
        tweetLink: "https://x.com/elonmusk/status/1897898972041117883",
        instructions: "Share your perspective on web3 social networks.",
        context: "Discussion about decentralized platforms.",
        credit: 0.1,
        createdBy: OTHER_UID,
        deadline: new Date("2035-04-01"),
        createdAt: new Date(),
        totalReplies: 150,
        replyCount: 0,
        isActive: true,
        isSettled: false,
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
    createdBy: MY_UID,
    createdAt: new Date(),
  },
  {
    replyLink: "https://x.com/sjpwa1/status/1897818839767040409",
    text: "Great analysis! I particularly appreciate how this could improve user experience while maintaining decentralization.",
    status: "APPROVED",
    createdBy: OTHER_UID,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    replyLink: "https://x.com/sjpwa1/status/1897818839767040409",
    text: "Interesting perspective on DeFi adoption. Have you considered the regulatory implications?",
    status: "REJECTED",
    createdBy: MY_UID,
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
        user: {
          connect: {
            uid: replyData.createdBy,
          },
        },
      });
    }
  }

  const createdReplies = await Promise.all(
    replies.map((reply) =>
      prisma.reply.create({
        data: {
          replyLink: reply.replyLink,
          text: reply.text,
          createdBy: reply.createdBy,
          createdAt: reply.createdAt,
          buzzId: reply.buzzId,
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
