import { PrismaClient, ReplyStatus } from "@prisma/client";
import { randomUUID } from "crypto";

// Create a new PrismaClient instance with the production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:MXuayHEjJacgYvUleSzoQlHSBNEwLEzk@postgres-mjt6.railway.internal:5432/edge",
    },
  },
});

// User IDs
const userIds = [
  "0vfCtg69CQOaigET62k2Tlt0e4r2", // Real Firebase user
  "user_01", // Seed user
  "user_02", // Seed user
];

// Sample users data
const users = [
  {
    uid: userIds[0],
    email: "real.user@example.com",
    username: "Real User",
    nickname: "RealUser",
    avatar: "https://www.google.com/favicon.ico",
    bio: "I am a real user with a Firebase account",
    totalEarned: 100,
    balance: 50,
    createdAt: new Date("2024-01-01"),
  },
  {
    uid: userIds[1],
    email: "user1@example.com",
    username: "User One",
    nickname: "User1",
    avatar: "https://www.google.com/favicon.ico",
    bio: "I am the first seed user",
    totalEarned: 200,
    balance: 100,
    createdAt: new Date("2024-01-02"),
  },
  {
    uid: userIds[2],
    email: "user2@example.com",
    username: "User Two",
    nickname: "User2",
    avatar: "https://www.google.com/favicon.ico",
    bio: "I am the second seed user",
    totalEarned: 300,
    balance: 150,
    createdAt: new Date("2024-01-03"),
  },
];

// Sample tweet links
const tweetLinks = [
  "https://x.com/elonmusk/status/1897898972041117883",
  "https://x.com/naval/status/1002103360646823936",
  "https://x.com/sama/status/1589661435104284672",
  "https://x.com/paulg/status/1589661435104284672",
  "https://x.com/balajis/status/1589661435104284672",
  "https://x.com/jack/status/1589661435104284672",
];

// Sample instructions
const instructions = [
  "Share your thoughts on AI safety.",
  "Provide a thoughtful response about decentralization.",
  "Comment on the future of technology.",
  "Discuss the implications of this tweet for startups.",
  "Give your perspective on blockchain technology.",
  "Respond with insights about social media's impact.",
];

// Sample reply texts
const replyTexts = [
  "I think this is a fascinating perspective. The intersection of AI and human creativity will define our future.",
  "Decentralization is key to building resilient systems. This tweet highlights important considerations.",
  "The pace of technological change is accelerating. We need thoughtful approaches to governance.",
  "Startups should focus on solving real problems. This tweet points to an underserved market.",
  "Blockchain technology enables new forms of coordination. The implications are profound.",
  "Social media has transformed how we communicate. We need to be mindful of both benefits and drawbacks.",
  "This is a thought-provoking take. I appreciate the nuanced perspective on complex issues.",
  "Innovation happens at the edges. This tweet captures the essence of breakthrough thinking.",
  "The future is already here, just unevenly distributed. This tweet shows where to look.",
  "Building in public creates accountability and community. This approach has clear advantages.",
];

async function cleanDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.buzz.deleteMany();
  await prisma.user.deleteMany();
  // Clean up additional tables added in schema
  await prisma.referral.deleteMany();
  await prisma.userBalance.deleteMany();
  await prisma.userWithdrawRequest.deleteMany();
  await prisma.userApiKey.deleteMany();
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
  const buzzes = [];

  // Create 2 buzzes for each user (1 expired, 1 active)
  for (const userId of userIds) {
    // Expired buzz
    buzzes.push(
      prisma.buzz.create({
        data: {
          tweetLink: tweetLinks[Math.floor(Math.random() * tweetLinks.length)],
          instructions:
            instructions[Math.floor(Math.random() * instructions.length)],
          createdBy: userId,
          deadline: new Date("2023-12-31"), // Expired
          createdAt: new Date("2023-11-01"),
          replyCount: Math.floor(Math.random() * 50),
          isActive: false,
          isSettled: true,
          // Added fields required by the schema
          tokenAmount: "0.1",
          paymentToken: "BNB",
          customTokenAddress: "0x0000000000000000000000000000000000000000",
          tokenDecimals: 18,
          transactionHash: `0x${randomUUID().replace(/-/g, '')}` // Generate a unique transaction hash
        },
      })
    );

    // Active buzz
    buzzes.push(
      prisma.buzz.create({
        data: {
          tweetLink: tweetLinks[Math.floor(Math.random() * tweetLinks.length)],
          instructions:
            instructions[Math.floor(Math.random() * instructions.length)],
          createdBy: userId,
          deadline: new Date("2035-12-31"), // Far in the future
          createdAt: new Date(),
          replyCount: Math.floor(Math.random() * 30),
          isActive: true,
          isSettled: false,
          // Added fields required by the schema
          tokenAmount: "0.2",
          paymentToken: "BNB",
          customTokenAddress: "0x0000000000000000000000000000000000000000",
          tokenDecimals: 18,
          transactionHash: `0x${randomUUID().replace(/-/g, '')}` // Generate a unique transaction hash
        },
      })
    );
  }

  const createdBuzzes = await Promise.all(buzzes);
  console.log("Created", createdBuzzes.length, "buzzes");
  return createdBuzzes;
}

async function seedReplies(buzzes: { id: string }[]) {
  const replies = [];

  // Create 5-10 replies for each buzz
  for (const buzz of buzzes) {
    const replyCount = 5 + Math.floor(Math.random() * 6); // 5-10 replies

    for (let i = 0; i < replyCount; i++) {
      // Randomly select a user who didn't create the buzz
      const buzzCreator = await prisma.buzz.findUnique({
        where: { id: buzz.id },
        select: { createdBy: true },
      });

      const availableUsers = userIds.filter(
        (id) => id !== buzzCreator?.createdBy
      );
      const replyCreator =
        availableUsers[Math.floor(Math.random() * availableUsers.length)];

      // Random status with higher probability for APPROVED
      const statusOptions: ReplyStatus[] = [
        "PENDING",
        "APPROVED",
        "APPROVED",
        "APPROVED",
        "REJECTED",
      ] as ReplyStatus[];
      const status =
        statusOptions[Math.floor(Math.random() * statusOptions.length)];

      replies.push(
        prisma.reply.create({
          data: {
            buzzId: buzz.id,
            text: replyTexts[Math.floor(Math.random() * replyTexts.length)],
            replyLink: `https://x.com/user/status/${randomUUID()}`,
            createdBy: replyCreator,
            status: status,
            createdAt: new Date(
              Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
            ), // Random date in the last 30 days
          },
        })
      );
    }
  }

  const createdReplies = await Promise.all(replies);
  console.log("Created", createdReplies.length, "replies");
}

async function seedTransactions(buzzes: { id: string }[]) {
  const transactions = [];

  // Create transactions for each buzz
  for (const buzz of buzzes) {
    const buzzDetails = await prisma.buzz.findUnique({
      where: { id: buzz.id },
      include: { replies: true },
    });

    if (!buzzDetails) continue;

    // Create a BURN transaction for the buzz creator
    transactions.push(
      prisma.transaction.create({
        data: {
          amount: -parseFloat(buzzDetails.tokenAmount) * 100, // Convert from tokenAmount to amount
          type: "BURN",
          status: "COMPLETED",
          createdAt: buzzDetails.createdAt,
          fromAddress: buzzDetails.createdBy,
          toAddress: "0x0000000000000000000000000000000000000000", // Burn address
          buzzId: buzz.id,
        },
      })
    );

    // Create REWARD transactions for approved replies
    for (const reply of buzzDetails.replies) {
      if (reply.status === "APPROVED") {
        transactions.push(
          prisma.transaction.create({
            data: {
              amount: parseFloat(buzzDetails.tokenAmount),
              type: "REWARD",
              status: "COMPLETED",
              createdAt: reply.createdAt,
              fromAddress: "0x0000000000000000000000000000000000000000", // System address
              toAddress: reply.createdBy,
              buzzId: buzz.id,
              replyId: reply.id,
            },
          })
        );
      }
    }
  }

  const createdTransactions = await Promise.all(transactions);
  console.log("Created", createdTransactions.length, "transactions");
}

async function main() {
  try {
    console.log("Starting database initialization for production...");
    console.log("Using database URL: postgresql://postgres:MXuayHEjJacgYvUleSzoQlHSBNEwLEzk@postgres-mjt6.railway.internal:5432/edge");
    
    // First run database migrations if needed
    console.log("Running database migrations...");
    // This step might be handled separately with Prisma CLI
    
    await cleanDatabase();
    await seedUsers();
    const buzzes = await seedBuzzes();
    await seedReplies(buzzes);
    await seedTransactions(buzzes);
    
    console.log("Production database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing production database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
