-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "abilityCasts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "firstDeaths" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "firstKills" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TrainingCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingCompletion_userId_completedAt_idx" ON "TrainingCompletion"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCompletion_userId_drillId_day_key" ON "TrainingCompletion"("userId", "drillId", "day");

-- AddForeignKey
ALTER TABLE "TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
