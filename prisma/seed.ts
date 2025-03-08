import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const MY_ADDRESS = "0xA6Bf022bc8761937bEe6A435Fc12087760EC2196";
const OTHER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

const MOCK_USERS = [
  {
    address: MY_ADDRESS,
    username: "Alice",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    bio: "Web3 Developer & AI Enthusiast",
  },
  {
    address: OTHER_ADDRESS,
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
        where: { address: user.address },
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
        createdBy: MY_ADDRESS,
        deadline: new Date("2024-03-01"),
        createdAt: new Date("2024-02-28"),
        totalReplies: 100,
        replyCount: 0,
        isActive: false,
        user: { connect: { address: MY_ADDRESS } },
      },
    }),
    // 进行中的活动
    prisma.buzz.create({
      data: {
        tweetLink: "https://x.com/elonmusk/status/1897898972041117883",
        instructions: "Share your perspective on web3 social networks.",
        context: "Discussion about decentralized platforms.",
        credit: 0.1,
        createdBy: OTHER_ADDRESS,
        deadline: new Date("2035-04-01"),
        createdAt: new Date(),
        totalReplies: 150,
        replyCount: 0,
        isActive: true,
        user: { connect: { address: OTHER_ADDRESS } },
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
    createdBy: MY_ADDRESS,
    createdAt: new Date(),
  },
  {
    replyLink: "https://x.com/sjpwa1/status/1897818839767040409",
    text: "Great analysis! I particularly appreciate how this could improve user experience while maintaining decentralization.",
    status: "APPROVED",
    createdBy: OTHER_ADDRESS,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    replyLink: "https://x.com/sjpwa1/status/1897818839767040409",
    text: "Interesting perspective on DeFi adoption. Have you considered the regulatory implications?",
    status: "REJECTED",
    createdBy: MY_ADDRESS,
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
            address: replyData.createdBy,
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
          status: reply.status as "PENDING" | "APPROVED" | "REJECTED",
          createdBy: reply.createdBy,
          createdAt: reply.createdAt,
          buzz: { connect: { id: reply.buzzId } },
          user: reply.user,
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
