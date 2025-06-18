
-- First, let's ensure we have a way to get subscription tier information with facilities
-- We need to check if there are any subscription tiers in the database and create a view for easier querying

-- Create a view that joins facilities with their subscription data (if any)
CREATE OR REPLACE VIEW admin_facility_overview AS
SELECT 
    f.id,
    f.slug,
    f.facility_name,
    f.contact_name,
    f.email,
    f.address,
    f.logo_url,
    f.created_at,
    f.updated_at,
    s.status as subscription_status,
    st.name as subscription_tier,
    st.monthly_price,
    st.lookup_limit,
    s.current_lookups,
    s.lookup_reset_date,
    fqr.facility_url,
    fqr.qr_code_url
FROM facilities f
LEFT JOIN subscriptions s ON f.user_id = s.user_id
LEFT JOIN subscription_tiers st ON s.tier_id = st.id
LEFT JOIN facility_qr_codes fqr ON f.id = fqr.facility_id
ORDER BY f.created_at DESC;

-- Allow public read access to this view for admin purposes
GRANT SELECT ON admin_facility_overview TO anon;
