-- Fix RLS Policy for grammar_introductions Table
-- This script checks and fixes the Row Level Security policy that's causing 406 errors

-- First, check if the table exists and what RLS policies it has
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'grammar_introductions';

-- Drop existing policy if it's causing issues
DROP POLICY IF EXISTS "Allow authenticated users to read grammar introductions" ON public.grammar_introductions;

-- Create a proper RLS policy that allows authenticated users to read
CREATE POLICY "Allow authenticated users to read grammar introductions"
ON public.grammar_introductions
FOR SELECT
TO authenticated
USING (true);

-- Also allow public access if needed (for unauthenticated users)
CREATE POLICY "Allow public read access to grammar introductions"
ON public.grammar_introductions
FOR SELECT
TO anon
USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'grammar_introductions';

-- Test query to verify access (replace UUID with actual topic_id)
-- SELECT * FROM grammar_introductions WHERE topic_id = '951ce3b2-0cb0-40ea-90a2-2f6a5564b70e';
