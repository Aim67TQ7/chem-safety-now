
-- Remove the username column since it's causing conflicts and isn't needed
-- The contact_name field already stores this information
ALTER TABLE public.facilities DROP COLUMN IF EXISTS username;

-- Also remove the name column as it's redundant with facility_name
ALTER TABLE public.facilities DROP COLUMN IF EXISTS name;

-- Make sure the slug generation is more robust by adding a check constraint
-- to ensure slugs are properly formatted
ALTER TABLE public.facilities ADD CONSTRAINT facilities_slug_format 
CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 3);
