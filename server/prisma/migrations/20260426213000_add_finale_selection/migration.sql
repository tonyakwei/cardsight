ALTER TABLE "games"
ADD COLUMN "finale_outcome" TEXT,
ADD COLUMN "finale_clause_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
