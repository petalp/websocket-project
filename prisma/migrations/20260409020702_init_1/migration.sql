-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('scheduled', 'live', 'finished');

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "status" "match_status" NOT NULL DEFAULT 'scheduled',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "home_score" INTEGER NOT NULL DEFAULT 0,
    "away_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentary" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor" TEXT,
    "team" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commentary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commentary_match_id_key" ON "commentary"("match_id");

-- CreateIndex
CREATE INDEX "idx_commentary_match_id" ON "commentary"("match_id");

-- CreateIndex
CREATE INDEX "idx_commentary_match_minute" ON "commentary"("match_id", "minute");

-- CreateIndex
CREATE INDEX "idx_commentary_match_event_type" ON "commentary"("match_id", "event_type");

-- CreateIndex
CREATE INDEX "idx_commentary_created_at" ON "commentary"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "commentary_match_id_minute_sequence_key" ON "commentary"("match_id", "minute", "sequence");

-- AddForeignKey
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
