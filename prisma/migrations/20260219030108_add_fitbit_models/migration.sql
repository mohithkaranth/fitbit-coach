-- CreateTable
CREATE TABLE "FitbitAuth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fitbitUserId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitbitAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitbitWorkout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fitbitLogId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "activityName" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "steps" INTEGER,
    "distance" DOUBLE PRECISION,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitbitWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitbitDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "steps" INTEGER,
    "activeMinutes" INTEGER,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitbitDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitbitAuth_userId_key" ON "FitbitAuth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FitbitWorkout_fitbitLogId_key" ON "FitbitWorkout"("fitbitLogId");

-- CreateIndex
CREATE UNIQUE INDEX "FitbitDaily_userId_date_key" ON "FitbitDaily"("userId", "date");
