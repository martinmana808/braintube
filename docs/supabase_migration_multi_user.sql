-- Migration to fix multi-tenancy unique constraint errors
-- This allows multiple users to add the same YouTube channel and have their own video metadata.

-- 1. Fix the channels table
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_pkey;
ALTER TABLE channels ADD PRIMARY KEY (id, user_id);

-- 2. Fix the video_metadata table
ALTER TABLE video_metadata DROP CONSTRAINT IF EXISTS video_metadata_pkey;
ALTER TABLE video_metadata ADD PRIMARY KEY (video_id, user_id);

-- Note: If you encounter an error dropping the constraint because it's referenced by a foreign key,
-- you will need to drop the foreign key first, update the primary key, and then recreate the foreign key.
-- (However, based on the application schema, this should execute successfully).
