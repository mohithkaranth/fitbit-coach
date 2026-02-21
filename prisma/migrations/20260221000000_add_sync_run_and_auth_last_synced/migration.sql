ALTER TABLE "FitbitAuth"
ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SyncRun_userId_ranAt_idx" ON "SyncRun"("userId", "ranAt");
