-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "centerId" TEXT,
    "institutionId" TEXT,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "RecipientInstitution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Center" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CampaignCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignCenter_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignCenter_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RecipientInstitution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "centerId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "recipientInstitutionId" TEXT,
    "destinationCenterId" TEXT,
    "transferId" TEXT,
    "donorId" TEXT,
    "status" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "confirmedAt" DATETIME,
    "resolvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movement_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Movement_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Movement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Movement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Movement_recipientInstitutionId_fkey" FOREIGN KEY ("recipientInstitutionId") REFERENCES "RecipientInstitution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movement_destinationCenterId_fkey" FOREIGN KEY ("destinationCenterId") REFERENCES "Center" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movement_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movement_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "fromCenterId" TEXT NOT NULL,
    "toCenterId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transfer_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromCenterId_fkey" FOREIGN KEY ("fromCenterId") REFERENCES "Center" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toCenterId_fkey" FOREIGN KEY ("toCenterId") REFERENCES "Center" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "articleId" TEXT,
    "category" TEXT,
    "targetQty" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CampaignGoal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignGoal_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "userId" TEXT,
    "role" TEXT,
    "centerId" TEXT,
    "link" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_centerId_idx" ON "User"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Campaign_active_idx" ON "Campaign"("active");

-- CreateIndex
CREATE INDEX "Center_active_idx" ON "Center"("active");

-- CreateIndex
CREATE INDEX "CampaignCenter_centerId_idx" ON "CampaignCenter"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCenter_campaignId_centerId_key" ON "CampaignCenter"("campaignId", "centerId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_name_key" ON "Article"("name");

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");

-- CreateIndex
CREATE INDEX "Article_active_idx" ON "Article"("active");

-- CreateIndex
CREATE INDEX "RecipientInstitution_active_idx" ON "RecipientInstitution"("active");

-- CreateIndex
CREATE INDEX "Movement_campaignId_idx" ON "Movement"("campaignId");

-- CreateIndex
CREATE INDEX "Movement_centerId_idx" ON "Movement"("centerId");

-- CreateIndex
CREATE INDEX "Movement_articleId_idx" ON "Movement"("articleId");

-- CreateIndex
CREATE INDEX "Movement_type_idx" ON "Movement"("type");

-- CreateIndex
CREATE INDEX "Movement_createdAt_idx" ON "Movement"("createdAt");

-- CreateIndex
CREATE INDEX "Movement_status_idx" ON "Movement"("status");

-- CreateIndex
CREATE INDEX "Movement_transferId_idx" ON "Movement"("transferId");

-- CreateIndex
CREATE INDEX "Movement_centerId_campaignId_articleId_idx" ON "Movement"("centerId", "campaignId", "articleId");

-- CreateIndex
CREATE INDEX "Transfer_campaignId_idx" ON "Transfer"("campaignId");

-- CreateIndex
CREATE INDEX "Transfer_fromCenterId_idx" ON "Transfer"("fromCenterId");

-- CreateIndex
CREATE INDEX "Transfer_toCenterId_idx" ON "Transfer"("toCenterId");

-- CreateIndex
CREATE INDEX "InventoryItem_campaignId_idx" ON "InventoryItem"("campaignId");

-- CreateIndex
CREATE INDEX "InventoryItem_articleId_idx" ON "InventoryItem"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_centerId_campaignId_articleId_key" ON "InventoryItem"("centerId", "campaignId", "articleId");

-- CreateIndex
CREATE INDEX "CampaignGoal_campaignId_idx" ON "CampaignGoal"("campaignId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_role_idx" ON "Notification"("role");

-- CreateIndex
CREATE INDEX "Notification_centerId_idx" ON "Notification"("centerId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
