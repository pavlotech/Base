-- CreateTable
CREATE TABLE "cached_contexts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contextId" TEXT NOT NULL,
    "cacheName" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "cached_contexts_contextId_key" ON "cached_contexts"("contextId");
