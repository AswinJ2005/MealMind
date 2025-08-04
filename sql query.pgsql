-- Updated Schema: allows for users without an email address (e.g., phone sign-in)

CREATE TABLE "users" (
  "firebase_uid" VARCHAR(128) PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE,  -- <<< CHANGE IS HERE: Removed NOT NULL
  "display_name" VARCHAR(100),
  "age" INT,
  "weight_kg" DECIMAL(5, 2),
  "height_cm" DECIMAL(5, 2),
  "activity_level" VARCHAR(50), 
  "fitness_goal" VARCHAR(50),  
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN "users"."firebase_uid" IS 'Primary Key, Unique ID from Firebase Authentication.';
COMMENT ON COLUMN "users"."weight_kg" IS 'User weight in kilograms.';
COMMENT ON COLUMN "users"."height_cm" IS 'User height in centimeters.';
COMMENT ON COLUMN "users"."email" IS 'User email, UNIQUE but can be NULL for phone auth users.';
""""