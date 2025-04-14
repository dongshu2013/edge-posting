import { processUserReplyAttempt } from "@/utils/xUtils";
import dayjs from "dayjs";
import { prisma } from "@/lib/prisma";

class ReplyHandler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(private intervalMs: number = 5000) {}

  public start(): void {
    if (this.isRunning) {
      console.log("Interval handler is already running");
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.processWork();
    }, this.intervalMs);

    console.log("Interval handler started");
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log("Interval handler is not running");
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Interval handler stopped");
  }

  private async processWork(): Promise<void> {
    try {
      // Add your background processing logic here
      console.log("Processing background work...");
      const replyAttempts = await prisma.replyAttempt.findMany({
        where: {
          retryCount: {
            lt: 2,
          },
          updatedAt: {
            lt: dayjs().unix() - 60 * 5,
          },
        },
        include: {
          buzz: true,
          user: true,
        },
        take: 10,
      });

      for (const replyAttempt of replyAttempts) {
        processUserReplyAttempt(replyAttempt.id, replyAttempt.buzz, replyAttempt.user);
      }
    } catch (error) {
      console.error("Error in background processing:", error);
    }
  }
}

export const replyHandler = new ReplyHandler();
