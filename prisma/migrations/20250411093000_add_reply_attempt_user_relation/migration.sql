-- AddForeignKey
ALTER TABLE "ReplyAttempt" ADD CONSTRAINT "ReplyAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
