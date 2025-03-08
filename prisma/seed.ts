import { PrismaClient, ReplyStatus } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    uid: "user_01",
    email: "alice@example.com",
    username: "alice",
    nickname: "Alice",
    avatar: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.flaticon.com%2Ffree-icon%2Fuser_1077114",
    bio: "AI enthusiast and web3 developer",
    totalEarned: 0,
    balance: 0,
  },
  {
    uid: "user_02",
    email: "bob@example.com",
    username: "bob",
    nickname: "Bob",
    avatar: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.flaticon.com%2Ffree-icon%2Fuser_1077114",
    bio: "Crypto researcher and content creator",
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
  const createdUsers = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { uid: user.uid },
        update: {
          email: user.email,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio,
          totalEarned: user.totalEarned,
          balance: user.balance,
        },
        create: user,
      })
    )
  );
  console.log("Created", createdUsers.length, "users");
}

async function seedBuzzes() {
  await Promise.all([
    // Expired buzz
    prisma.buzz.create({
      data: {
        tweetLink: "https://x.com/elonmusk/status/1897898972041117883",
        instructions: "Share your thoughts on AI safety.",
        price: 0.1,
        createdBy: "user_01",
        deadline: new Date("2024-03-01T00:00:00.000Z"),
        createdAt: new Date("2024-02-28T17:06:18.067Z"),
        totalReplies: 100,
        replyCount: 0,
        isActive: false,
        isSettled: true,
      },
    }),
    // Active buzz
    prisma.buzz.create({
      data: {
        tweetLink: "https://x.com/elonmusk/status/1897898972041117883",
        instructions: "Share your perspective on web3 social networks.",
        price: 0.1,
        createdBy: "user_02",
        deadline: new Date("2035-04-01T00:00:00.000Z"),
        createdAt: new Date("2025-03-08T17:06:18.067Z"),
        totalReplies: 150,
        replyCount: 0,
        isActive: true,
        isSettled: false,
      },
    }),
  ]);
  console.log("Created buzzes");
}

async function seedReplies(buzzes: { id: string }[]) {
  const replies = [
    {
      replyLink: "https://x.com/user1/status/123456789",
      text: "Great initiative! I think AI safety is crucial for our future.",
      createdBy: "user_02",
      buzzId: buzzes[0].id,
      status: ReplyStatus.APPROVED,
    },
    {
      replyLink: "https://x.com/user2/status/987654321",
      text: "We need more discussions about responsible AI development.",
      createdBy: "user_01",
      buzzId: buzzes[0].id,
      status: ReplyStatus.APPROVED,
    },
  ];

  await prisma.reply.createMany({
    data: replies,
  });

  // Update reply count for the buzz
  await prisma.buzz.update({
    where: { id: buzzes[0].id },
    data: {
      replyCount: replies.length,
    },
  });

  console.log("Created replies");
}

async function main() {
  try {
    await cleanDatabase();
    await seedUsers();
    const buzzes = await prisma.buzz.findMany();
    if (buzzes.length > 0) {
      await seedReplies(buzzes);
    }
    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
