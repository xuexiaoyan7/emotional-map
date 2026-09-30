-- A nullable field preserves each existing map's current title until its owner
-- chooses a custom name in Settings.
ALTER TABLE "User" ADD COLUMN "mapName" TEXT;
