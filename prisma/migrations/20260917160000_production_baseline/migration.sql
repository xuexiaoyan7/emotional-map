CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "ReactionKind" AS ENUM ('FELT_THIS', 'HUG', 'BEEN_THERE');

CREATE TABLE "User" (
    "id" TEXT NOT NULL, "phone" TEXT, "email" TEXT, "displayName" TEXT,
    "publicSlug" TEXT, "avatarUrl" TEXT, "handle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL, "userId" TEXT, "email" TEXT NOT NULL, "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL, "consumedAt" TIMESTAMP(3), "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
    "id" TEXT NOT NULL, "placeName" TEXT NOT NULL, "city" TEXT NOT NULL, "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION, "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Emotion" (
    "id" TEXT NOT NULL, "canonicalName" TEXT NOT NULL, "category" TEXT, "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Emotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Memory" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "photoUrl" TEXT NOT NULL, "photoMetadata" JSONB,
    "locationId" TEXT NOT NULL, "capturedAt" TIMESTAMP(3), "story" TEXT NOT NULL DEFAULT '',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoryEmotion" (
    "memoryId" TEXT NOT NULL, "emotionId" TEXT NOT NULL, "intensity" INTEGER NOT NULL, "customExpression" TEXT,
    CONSTRAINT "MemoryEmotion_pkey" PRIMARY KEY ("memoryId", "emotionId")
);

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL, "memoryId" TEXT NOT NULL, "userId" TEXT NOT NULL, "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Like" (
    "id" TEXT NOT NULL, "memoryId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL, "memoryId" TEXT NOT NULL, "userId" TEXT NOT NULL, "kind" "ReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_publicSlug_key" ON "User"("publicSlug");
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
CREATE INDEX "EmailOtp_email_createdAt_idx" ON "EmailOtp"("email", "createdAt");
CREATE INDEX "EmailOtp_expiresAt_idx" ON "EmailOtp"("expiresAt");
CREATE INDEX "Memory_userId_createdAt_idx" ON "Memory"("userId", "createdAt");
CREATE INDEX "Memory_visibility_createdAt_idx" ON "Memory"("visibility", "createdAt");
CREATE INDEX "Memory_locationId_capturedAt_idx" ON "Memory"("locationId", "capturedAt");
CREATE INDEX "Location_city_country_idx" ON "Location"("city", "country");
CREATE UNIQUE INDEX "Emotion_canonicalName_key" ON "Emotion"("canonicalName");
CREATE INDEX "Comment_memoryId_createdAt_idx" ON "Comment"("memoryId", "createdAt");
CREATE UNIQUE INDEX "Like_memoryId_userId_key" ON "Like"("memoryId", "userId");
CREATE UNIQUE INDEX "Reaction_memoryId_userId_kind_key" ON "Reaction"("memoryId", "userId", "kind");

ALTER TABLE "EmailOtp" ADD CONSTRAINT "EmailOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MemoryEmotion" ADD CONSTRAINT "MemoryEmotion_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryEmotion" ADD CONSTRAINT "MemoryEmotion_emotionId_fkey" FOREIGN KEY ("emotionId") REFERENCES "Emotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
