-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "gameLengthMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roundWinners" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Match_startedAt_idx" ON "Match"("startedAt");
