-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
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
    "mediaConvertJobId" TEXT,
    "mp4S3Key" TEXT,
    "transcodeStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Video" ("createdAt", "ctaLabel", "ctaUrl", "id", "notes", "prospectCompany", "prospectEmail", "prospectName", "s3Key", "sitePreviewUrl", "slug", "status", "thumbnailUrl", "updatedAt", "videoUrl", "viewCount") SELECT "createdAt", "ctaLabel", "ctaUrl", "id", "notes", "prospectCompany", "prospectEmail", "prospectName", "s3Key", "sitePreviewUrl", "slug", "status", "thumbnailUrl", "updatedAt", "videoUrl", "viewCount" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
