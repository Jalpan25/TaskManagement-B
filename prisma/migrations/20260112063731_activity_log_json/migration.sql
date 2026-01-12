/*
  Warnings:

  - The `newValue` column on the `ActivityLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `oldValue` column on the `ActivityLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "newValue",
ADD COLUMN     "newValue" JSONB,
DROP COLUMN "oldValue",
ADD COLUMN     "oldValue" JSONB;
