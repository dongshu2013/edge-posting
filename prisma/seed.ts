import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MY_ADDRESS = "0xA6Bf022bc8761937bEe6A435Fc12087760EC2196";
const OTHER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

const PAST_DATE = new Date("2024-03-01T23:59:59Z");
const FUTURE_DATE = new Date("2035-04-01T23:59:59Z");

const MOCK_USERS = [
  {
    address: "0xA6Bf022bc8761937bEe6A435Fc12087760EC2196",
    username: "Alice",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    bio: "Web3 Developer & AI Enthusiast",
  },
  {
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    username: "Bob",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    bio: "Blockchain Researcher",
  },
];

const MOCK_BUZZES = [
  {
    tweetLink: "https://twitter.com/user1/status/123456789",
    instructions:
      "Reply with your thoughts on the paper and mention one key takeaway",
    context: "New AI research paper discussion",
    credit: 0.05,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    totalReplies: 100,
    pricePerReply: 0.01,
  },
  {
    tweetLink: "https://twitter.com/user2/status/987654321",
    instructions:
      "Share your excitement about the game and ask a question about gameplay",
    context: "Web3 gaming announcement",
    credit: 0.1,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    totalReplies: 50,
    pricePerReply: 0.02,
  },
];

async function main() {
  // Clean up existing data
  await prisma.buzz.deleteMany();

  // 1. Ended campaigns by MY_ADDRESS
  await prisma.buzz.createMany({
    data: [
      {
        tweetLink: "https://x.com/XDevelopers/status/1861111969639481848",
        instructions:
          "Share your thoughts on how this could impact Ethereum scaling.",
        context:
          "Vitalik discusses new developments in Ethereum scaling solutions.",
        credit: 0.05,
        createdBy: MY_ADDRESS,
        deadline: PAST_DATE,
        createdAt: new Date("2024-02-28"),
        replyCount: 75,
        totalReplies: 100,
        isActive: false,
      },
      {
        tweetLink: "https://x.com/TheMoonCarl/status/1897566145458180332",
        instructions:
          "Discuss how AI could be integrated with web3 technologies.",
        context: "Interesting thread about AI and web3 intersection.",
        credit: 0.08,
        createdBy: MY_ADDRESS,
        deadline: PAST_DATE,
        createdAt: new Date("2024-02-27"),
        replyCount: 120,
        totalReplies: 150,
        isActive: false,
      },
    ],
  });

  // 2. Ongoing campaigns by MY_ADDRESS
  await prisma.buzz.createMany({
    data: [
      {
        tweetLink: "https://x.com/elonmusk/status/1897898972041117883",
        instructions:
          "Share your perspective on the future of decentralized social networks.",
        context: "Discussion about decentralized social media platforms.",
        credit: 0.1,
        createdBy: MY_ADDRESS,
        deadline: FUTURE_DATE,
        createdAt: new Date("2024-03-05"),
        replyCount: 25,
        totalReplies: 200,
        isActive: true,
      },
      {
        tweetLink: "https://x.com/AvalancheFDN/status/1898038071901274349",
        instructions:
          "Provide insights on how this could affect blockchain gaming.",
        context: "Thread about the future of gaming and blockchain.",
        credit: 0.15,
        createdBy: MY_ADDRESS,
        deadline: FUTURE_DATE,
        createdAt: new Date("2024-03-06"),
        replyCount: 15,
        totalReplies: 150,
        isActive: true,
      },
    ],
  });

  // 3. Ended campaigns by others
  await prisma.buzz.createMany({
    data: [
      {
        tweetLink: "https://x.com/XDevelopers/status/1861111969639481848",
        instructions:
          "Share your experience with similar blockchain applications.",
        context: "Discussion about practical blockchain applications.",
        credit: 0.07,
        createdBy: OTHER_ADDRESS,
        deadline: PAST_DATE,
        createdAt: new Date("2024-02-25"),
        replyCount: 90,
        totalReplies: 100,
        isActive: false,
      },
      {
        tweetLink: "https://x.com/TheMoonCarl/status/1897566145458180332",
        instructions:
          "Discuss potential improvements to the proposed solution.",
        context: "Thread about blockchain scalability solutions.",
        credit: 0.06,
        createdBy: OTHER_ADDRESS,
        deadline: PAST_DATE,
        createdAt: new Date("2024-02-26"),
        replyCount: 85,
        totalReplies: 100,
        isActive: false,
      },
    ],
  });

  // 4. Ongoing campaigns by others
  await prisma.buzz.createMany({
    data: [
      {
        tweetLink: "https://x.com/elonmusk/status/1897898972041117883",
        instructions:
          "Share your thoughts on the intersection of DeFi and traditional finance.",
        context: "Discussion about DeFi adoption and traditional finance.",
        credit: 0.12,
        createdBy: OTHER_ADDRESS,
        deadline: FUTURE_DATE,
        createdAt: new Date("2024-03-04"),
        replyCount: 45,
        totalReplies: 200,
        isActive: true,
      },
      {
        tweetLink: "https://x.com/AvalancheFDN/status/1898038071901274349",
        instructions: "Provide insights on potential privacy implications.",
        context: "Thread about privacy in blockchain networks.",
        credit: 0.09,
        createdBy: OTHER_ADDRESS,
        deadline: FUTURE_DATE,
        createdAt: new Date("2024-03-05"),
        replyCount: 30,
        totalReplies: 150,
        isActive: true,
      },
    ],
  });

  // 清理现有数据
  await prisma.transaction.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.buzz.deleteMany();
  await prisma.user.deleteMany();

  // 创建用户
  const users = await Promise.all(
    MOCK_USERS.map((user) =>
      prisma.user.upsert({
        where: { address: user.address },
        update: user,
        create: user,
      })
    )
  );

  // 创建 Buzzes
  const buzzes = await Promise.all(
    MOCK_BUZZES.map((buzz, index) =>
      prisma.buzz.create({
        data: {
          ...buzz,
          createdBy: users[index % users.length].address,
          user: {
            connect: {
              address: users[index % users.length].address,
            },
          },
        },
      })
    )
  );
  console.log(`Created ${users.length} users`);
  console.log(`Created ${buzzes.length} buzzes`);
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
