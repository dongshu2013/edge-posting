-- CreateTable
CREATE TABLE "Kol" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "avatar" TEXT NOT NULL,
    "twitterUsername" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "followers" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,

    CONSTRAINT "Kol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kol_userId_key" ON "Kol"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Kol_twitterUsername_key" ON "Kol"("twitterUsername");

-- AddForeignKey
ALTER TABLE "Kol" ADD CONSTRAINT "Kol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
