/*
  Warnings:

  - You are about to drop the column `action` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTo` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Task` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STATUS_CHANGE', 'ASSIGNMENT_CHANGE', 'DUE_DATE_CHANGE', 'COMMENT_ADDED');

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_createdBy_fkey";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "action",
ADD COLUMN     "createdById" INTEGER NOT NULL,
ADD COLUMN     "newValue" TEXT,
ADD COLUMN     "oldValue" TEXT,
ADD COLUMN     "type" "ActivityType" NOT NULL;

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "userId",
ADD COLUMN     "authorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "createdBy",
ADD COLUMN     "createdById" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignedTo",
DROP COLUMN "createdBy",
ADD COLUMN     "assignedToId" INTEGER,
ADD COLUMN     "createdById" INTEGER NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "dueDate" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
