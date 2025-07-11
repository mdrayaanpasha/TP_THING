-- CreateEnum
CREATE TYPE "theraphyType" AS ENUM ('MESSAGE', 'VIDEO_CALL');

-- AlterTable
ALTER TABLE "Therapy" ADD COLUMN     "therapyType" "theraphyType" NOT NULL DEFAULT 'MESSAGE';
