-- CreateTable
CREATE TABLE "User" (
    "uid" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputation" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_reputation_idx" ON "User"("reputation");

-- AddForeignKey
ALTER TABLE "Buzz" ADD CONSTRAINT "Buzz_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
