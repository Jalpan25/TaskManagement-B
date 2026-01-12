-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'TASK_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'PRIORITY_CHANGE';
ALTER TYPE "ActivityType" ADD VALUE 'TITLE_CHANGE';
ALTER TYPE "ActivityType" ADD VALUE 'DESCRIPTION_CHANGE';
ALTER TYPE "ActivityType" ADD VALUE 'COMMENT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'COMMENT_DELETED';
