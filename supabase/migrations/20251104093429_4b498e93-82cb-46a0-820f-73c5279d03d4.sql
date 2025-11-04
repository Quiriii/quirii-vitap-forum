-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create replies table for admin responses
CREATE TABLE public.complaint_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaint_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for replies
CREATE POLICY "Anyone can view replies"
ON public.complaint_replies
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert replies"
ON public.complaint_replies
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update replies"
ON public.complaint_replies
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete replies"
ON public.complaint_replies
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update complaints RLS to allow admin access
DROP POLICY IF EXISTS "Users can view complaints in their hostel or common sections" ON public.complaints;

CREATE POLICY "Users can view accessible complaints"
ON public.complaints
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  (category = ANY (ARRAY['AB1'::text, 'AB2'::text, 'CB'::text, 'Sports'::text, 'Examinations'::text, 'Others'::text])) OR
  (category = (SELECT profiles.hostel FROM profiles WHERE profiles.id = auth.uid()))
);

-- Allow admins to update complaint status
CREATE POLICY "Admins can update complaint status"
ON public.complaints
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin user (password will be set via auth)
-- Note: The actual user creation with password needs to be done via Supabase Auth API