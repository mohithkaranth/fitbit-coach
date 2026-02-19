-- CreateTable
CREATE TABLE "FitbitSyncState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitbitSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitbitSyncState_userId_key" ON "FitbitSyncState"("userId");
