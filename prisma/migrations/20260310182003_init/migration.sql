-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "prospectName" TEXT NOT NULL,
    "prospectCompany" TEXT NOT NULL,
    "prospectEmail" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Book a Call',
    "ctaUrl" TEXT,
    "notes" TEXT,
    "sitePreviewUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ViewEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "duration" INTEGER,
    CONSTRAINT "ViewEvent_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");

-- CreateIndex
CREATE INDEX "ViewEvent_videoId_idx" ON "ViewEvent"("videoId");
