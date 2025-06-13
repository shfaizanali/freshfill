-- Drop existing policies first
DROP POLICY IF EXISTS "user_self_access" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "user_self_access"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow new users to be created during signup (no auth required for insert)
CREATE POLICY "Allow signup insert"
ON public.users
FOR INSERT
WITH CHECK (true);

-- Allow users to update their own data
CREATE POLICY "user_self_update"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 