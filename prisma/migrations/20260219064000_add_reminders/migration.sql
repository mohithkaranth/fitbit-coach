-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "message" TEXT,
    "dayKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reminder_subjectKey_idx" ON "Reminder"("subjectKey");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_subjectKey_kind_dayKey_key" ON "Reminder"("subjectKey", "kind", "dayKey");
