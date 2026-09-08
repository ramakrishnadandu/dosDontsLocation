-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'ANALYST', 'SUPPORT', 'USER');

-- CreateEnum
CREATE TYPE "BudgetLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EntityCategory" AS ENUM ('SHOPPING_MALL', 'MARKET', 'HOTEL', 'RESTAURANT', 'BANK', 'HOSPITAL', 'TOURIST_ATTRACTION', 'STORE', 'PHARMACY', 'AIRPORT', 'RAILWAY_STATION', 'CINEMA', 'ENTERTAINMENT_VENUE', 'UNIVERSITY', 'OFFICE', 'PUBLIC_PLACE', 'OTHER');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "ReviewAspect" AS ENUM ('PARKING', 'CLEANLINESS', 'STAFF', 'FOOD', 'PRICE', 'SERVICE', 'CROWDING', 'NOISE', 'LOCATION', 'ROOMS', 'ACCESSIBILITY', 'WAITING_TIME', 'SAFETY', 'AMBIENCE');

-- CreateEnum
CREATE TYPE "TimeWindow" AS ENUM ('recent', 'quarter', 'year', 'all_time');

-- CreateEnum
CREATE TYPE "VisitRecency" AS ENUM ('TODAY', 'THIS_WEEK', 'EARLIER');

-- CreateEnum
CREATE TYPE "OpinionStatus" AS ENUM ('ACTIVE', 'EDITED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_HIDDEN', 'APPEALED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'REPORT');

-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'LIMITED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('FACT', 'REVIEW_SIGNAL', 'COMMUNITY_OPINION', 'AI_INTERPRETATION');

-- CreateEnum
CREATE TYPE "RecommendationCategory" AS ENUM ('DO', 'CONSIDER', 'WATCH', 'MUST_SEE', 'SPENDING', 'PRODUCTS', 'GENERAL_TIPS', 'HEALTH_AWARE');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('COMMUNITY_OPINION', 'MEDIA', 'PRODUCT_REVIEW', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationCaseStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED_APPROVED', 'RESOLVED_REJECTED', 'APPEALED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'ADMIN_ACTION', 'MODERATION_ACTION', 'PROVIDER_CONFIG_CHANGE', 'AI_CONFIG_CHANGE', 'POLICY_CHANGE', 'DATA_DELETION', 'DATA_EXPORT', 'SECURITY_EVENT');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "userId" TEXT NOT NULL,
    "budgetLevel" "BudgetLevel",
    "travelingWithFamily" BOOLEAN,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessibilityRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietaryPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "category" "EntityCategory" NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sourceProvider" TEXT NOT NULL,
    "sourceProviderId" TEXT NOT NULL,
    "isDemoData" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceProvider" TEXT NOT NULL,
    "sourceReviewId" TEXT NOT NULL,
    "authorDisplayName" TEXT,
    "rating" DOUBLE PRECISION,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfReviewId" TEXT,
    "overallSentiment" "Sentiment",
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_aspects" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "aspect" "ReviewAspect" NOT NULL,
    "positiveMentions" INTEGER NOT NULL,
    "negativeMentions" INTEGER NOT NULL,
    "neutralMentions" INTEGER NOT NULL,
    "totalMentions" INTEGER NOT NULL,
    "timeWindow" "TimeWindow" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_aspects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_opinions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "pros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "valueForMoney" INTEGER,
    "cleanliness" INTEGER,
    "parking" INTEGER,
    "accessibility" INTEGER,
    "familyFriendliness" INTEGER,
    "foodExperience" INTEGER,
    "shoppingExperience" INTEGER,
    "serviceExperience" INTEGER,
    "safetyAwareness" TEXT,
    "visitRecency" "VisitRecency",
    "verifiedVisit" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "status" "OpinionStatus" NOT NULL DEFAULT 'ACTIVE',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "community_opinions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opinionId" TEXT NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "reportReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "visitRecency" "VisitRecency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "uploaderUserId" TEXT NOT NULL,
    "opinionId" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "availability" "ProductAvailability" NOT NULL DEFAULT 'UNKNOWN',
    "seller" TEXT,
    "source" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "warranty" TEXT,
    "returnInformation" TEXT,
    "isDemoData" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "quality" INTEGER,
    "value" INTEGER,
    "durability" INTEGER,
    "pros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "body" TEXT,
    "wouldBuyAgain" BOOLEAN,
    "alternativeSuggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "currency" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT,
    "entityId" TEXT NOT NULL,
    "category" "RecommendationCategory" NOT NULL,
    "recommendation" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "reason" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "modelVersion" TEXT,
    "promptTemplateVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_requests" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestPurpose" TEXT NOT NULL,
    "userId" TEXT,
    "entityId" TEXT,
    "promptTemplateVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_responses" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "tokensPrompt" INTEGER NOT NULL,
    "tokensCompletion" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "succeeded" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_cases" (
    "id" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "ModerationCaseStatus" NOT NULL DEFAULT 'OPEN',
    "spamScore" DOUBLE PRECISION,
    "signals" JSONB,
    "assignedModeratorId" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "result" "AuditResult" NOT NULL,
    "requestId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "policies" (
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "entities_category_idx" ON "entities"("category");

-- CreateIndex
CREATE INDEX "entities_tenantId_idx" ON "entities"("tenantId");

-- CreateIndex
CREATE INDEX "reviews_entityId_idx" ON "reviews"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_sourceProvider_sourceReviewId_key" ON "reviews"("sourceProvider", "sourceReviewId");

-- CreateIndex
CREATE INDEX "review_aspects_entityId_aspect_timeWindow_idx" ON "review_aspects"("entityId", "aspect", "timeWindow");

-- CreateIndex
CREATE INDEX "community_opinions_entityId_status_moderationStatus_idx" ON "community_opinions"("entityId", "status", "moderationStatus");

-- CreateIndex
CREATE INDEX "community_opinions_userId_idx" ON "community_opinions"("userId");

-- CreateIndex
CREATE INDEX "community_votes_opinionId_idx" ON "community_votes"("opinionId");

-- CreateIndex
CREATE UNIQUE INDEX "community_votes_userId_opinionId_voteType_key" ON "community_votes"("userId", "opinionId", "voteType");

-- CreateIndex
CREATE INDEX "check_ins_entityId_idx" ON "check_ins"("entityId");

-- CreateIndex
CREATE INDEX "check_ins_userId_idx" ON "check_ins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "products_source_sourceProductId_key" ON "products"("source", "sourceProductId");

-- CreateIndex
CREATE INDEX "product_reviews_productId_idx" ON "product_reviews"("productId");

-- CreateIndex
CREATE INDEX "deals_productId_validUntil_idx" ON "deals"("productId", "validUntil");

-- CreateIndex
CREATE INDEX "recommendations_entityId_idx" ON "recommendations"("entityId");

-- CreateIndex
CREATE INDEX "evidence_entityId_category_idx" ON "evidence"("entityId", "category");

-- CreateIndex
CREATE INDEX "ai_requests_provider_createdAt_idx" ON "ai_requests"("provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_responses_requestId_key" ON "ai_responses"("requestId");

-- CreateIndex
CREATE INDEX "reports_targetType_targetId_idx" ON "reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_cases_targetType_targetId_idx" ON "moderation_cases"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_cases_status_idx" ON "moderation_cases"("status");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_aspects" ADD CONSTRAINT "review_aspects_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_opinions" ADD CONSTRAINT "community_opinions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_opinions" ADD CONSTRAINT "community_opinions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_votes" ADD CONSTRAINT "community_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_votes" ADD CONSTRAINT "community_votes_opinionId_fkey" FOREIGN KEY ("opinionId") REFERENCES "community_opinions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_opinionId_fkey" FOREIGN KEY ("opinionId") REFERENCES "community_opinions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_responses" ADD CONSTRAINT "ai_responses_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ai_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
