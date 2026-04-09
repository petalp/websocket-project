/*
  Warnings:

  - The primary key for the `commentary` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `commentary` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `matches` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `matches` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `match_id` on the `commentary` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "commentary" DROP CONSTRAINT "commentary_match_id_fkey";

-- AlterTable
ALTER TABLE "commentary" DROP CONSTRAINT "commentary_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "match_id",
ADD COLUMN     "match_id" INTEGER NOT NULL,
ADD CONSTRAINT "commentary_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "matches" DROP CONSTRAINT "matches_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "commentary_match_id_key" ON "commentary"("match_id");

-- CreateIndex
CREATE INDEX "idx_commentary_match_id" ON "commentary"("match_id");

-- CreateIndex
CREATE INDEX "idx_commentary_match_minute" ON "commentary"("match_id", "minute");

-- CreateIndex
CREATE INDEX "idx_commentary_match_event_type" ON "commentary"("match_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "commentary_match_id_minute_sequence_key" ON "commentary"("match_id", "minute", "sequence");

-- AddForeignKey
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
