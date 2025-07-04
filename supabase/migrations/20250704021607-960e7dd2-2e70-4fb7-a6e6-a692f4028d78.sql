-- Assign facilities to Robert Clausing based on email patterns
INSERT INTO facility_sales_assignments (facility_id, sales_rep_id, is_primary)
SELECT 
  f.id,
  '79b70722-8b45-49ee-bb06-9d04ce1c4e78'::uuid,
  true
FROM facilities f
WHERE (
  f.email ILIKE '%rclausing%' OR 
  f.email ILIKE '%robert.clausing%' OR 
  f.email ILIKE '%robert.agcorp%'
)
AND f.id NOT IN (
  SELECT facility_id FROM facility_sales_assignments
);