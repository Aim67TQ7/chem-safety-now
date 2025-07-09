-- Fix RLS policies to support facility-only access without user authentication

-- Drop the restrictive policy on facility_audit_trail
DROP POLICY IF EXISTS "facility_audit_trail_read" ON public.facility_audit_trail;

-- Create new policy that allows reading audit trail for any facility
CREATE POLICY "facility_audit_trail_public_read" 
ON public.facility_audit_trail 
FOR SELECT 
USING (true);

-- Update insert policy to allow system logging without user requirement
DROP POLICY IF EXISTS "audit_trail_edge_function_access" ON public.facility_audit_trail;
CREATE POLICY "facility_audit_trail_public_insert" 
ON public.facility_audit_trail 
FOR INSERT 
WITH CHECK (true);

-- Fix qr_code_interactions table to allow public access for facility operations
CREATE POLICY "qr_code_interactions_public_read" 
ON public.qr_code_interactions 
FOR SELECT 
USING (true);

CREATE POLICY "qr_code_interactions_public_insert" 
ON public.qr_code_interactions 
FOR INSERT 
WITH CHECK (true);

-- Fix sds_interactions table to allow public access for facility operations  
CREATE POLICY "sds_interactions_public_read" 
ON public.sds_interactions 
FOR SELECT 
USING (true);

CREATE POLICY "sds_interactions_public_insert" 
ON public.sds_interactions 
FOR INSERT 
WITH CHECK (true);

-- Fix ai_conversations table to allow facility-based operations
CREATE POLICY "ai_conversations_public_read" 
ON public.ai_conversations 
FOR SELECT 
USING (true);

CREATE POLICY "ai_conversations_public_insert" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (true);

-- Fix label_generations table to allow facility-based operations
CREATE POLICY "label_generations_public_read" 
ON public.label_generations 
FOR SELECT 
USING (true);

CREATE POLICY "label_generations_public_insert" 
ON public.label_generations 
FOR INSERT 
WITH CHECK (true);