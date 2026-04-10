-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('IMPAYES', 'ABSENCE', 'CANDIDATURE', 'PAIEMENT', 'SYSTEME');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "TypeNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_centreId_idx" ON "notifications"("centreId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
