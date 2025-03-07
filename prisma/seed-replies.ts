import { PrismaClient, ReplyStatus } from '@prisma/client';

const prisma = new PrismaClient();

const MY_ADDRESS = '0xA6Bf022bc8761937bEe6A435Fc12087760EC2196';
const OTHER_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const REPLY_LINK = 'https://x.com/sjpwa1/status/1897818839767040409';

const REPLY_TEXTS = [
  "This is a fascinating approach to blockchain integration. The potential impact on scalability is significant.",
  "Great analysis! I particularly appreciate how this could improve user experience while maintaining decentralization.",
  "Interesting perspective on DeFi adoption. Have you considered the regulatory implications?",
  "The integration with existing systems seems well thought out. Looking forward to seeing real-world implementations.",
  "This could be a game-changer for cross-chain interoperability. Excited to see how it develops!",
  "Smart contract optimization looks promising. Would love to see some benchmarks comparing performance.",
];

function getRandomText() {
  return REPLY_TEXTS[Math.floor(Math.random() * REPLY_TEXTS.length)];
}

async function main() {
  // First, get all existing buzzes
  const buzzes = await prisma.buzz.findMany({
    select: {
      id: true,
    },
  });

  if (buzzes.length === 0) {
    console.log('No buzzes found. Please run the main seed script first.');
    return;
  }

  // Clean up existing replies
  await prisma.reply.deleteMany();

  // Create replies for each buzz
  const replies = [];
  for (const buzz of buzzes) {
    // Add a PENDING reply from MY_ADDRESS
    replies.push({
      buzzId: buzz.id,
      replyLink: REPLY_LINK,
      text: getRandomText(),
      createdBy: MY_ADDRESS,
      status: ReplyStatus.PENDING,
      createdAt: new Date(),
    });

    // Add an APPROVED reply from OTHER_ADDRESS
    replies.push({
      buzzId: buzz.id,
      replyLink: REPLY_LINK,
      text: getRandomText(),
      createdBy: OTHER_ADDRESS,
      status: ReplyStatus.APPROVED,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });

    // Add a REJECTED reply from MY_ADDRESS
    replies.push({
      buzzId: buzz.id,
      replyLink: REPLY_LINK,
      text: getRandomText(),
      createdBy: MY_ADDRESS,
      status: ReplyStatus.REJECTED,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    });
  }

  // Insert all replies
  await prisma.reply.createMany({
    data: replies,
  });

  // Update buzz reply counts
  for (const buzz of buzzes) {
    const replyCount = await prisma.reply.count({
      where: {
        buzzId: buzz.id,
        status: ReplyStatus.PENDING,
      },
    });

    await prisma.buzz.update({
      where: { id: buzz.id },
      data: { replyCount },
    });
  }

  console.log(`Added ${replies.length} test replies to ${buzzes.length} buzzes!`);
}

main()
  .catch((e) => {
    console.error('Error seeding replies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 