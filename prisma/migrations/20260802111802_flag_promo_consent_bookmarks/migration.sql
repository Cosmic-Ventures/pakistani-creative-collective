-- CreateEnum
CREATE TYPE "BookmarkType" AS ENUM ('PROFILE', 'POST');

-- AlterEnum
ALTER TYPE "CreativeStatus" ADD VALUE 'FLAGGED';

-- AlterTable
ALTER TABLE "Creative" ADD COLUMN     "promoConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BookmarkType" NOT NULL,
    "creativeId" TEXT,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_creativeId_key" ON "Bookmark"("userId", "creativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_postId_key" ON "Bookmark"("userId", "postId");

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

