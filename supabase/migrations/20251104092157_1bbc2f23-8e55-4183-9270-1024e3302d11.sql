-- Create profiles table with hostel assignment
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  registration_number text NOT NULL UNIQUE,
  hostel text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create complaints table
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  is_anonymous boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Complaints policies
CREATE POLICY "Users can view complaints in their hostel or common sections"
  ON public.complaints FOR SELECT
  USING (
    category IN ('AB1', 'AB2', 'CB', 'Sports', 'Examinations', 'Others')
    OR category = (SELECT hostel FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own complaints"
  ON public.complaints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own complaints"
  ON public.complaints FOR DELETE
  USING (auth.uid() = user_id);

-- Create votes table
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, complaint_id)
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Votes policies
CREATE POLICY "Users can view all votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update complaint vote counts
CREATE OR REPLACE FUNCTION public.update_complaint_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.complaints
    SET 
      upvotes = (SELECT COUNT(*) FROM public.votes WHERE complaint_id = NEW.complaint_id AND vote_type = 'up'),
      downvotes = (SELECT COUNT(*) FROM public.votes WHERE complaint_id = NEW.complaint_id AND vote_type = 'down'),
      updated_at = now()
    WHERE id = NEW.complaint_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.complaints
    SET 
      upvotes = (SELECT COUNT(*) FROM public.votes WHERE complaint_id = OLD.complaint_id AND vote_type = 'up'),
      downvotes = (SELECT COUNT(*) FROM public.votes WHERE complaint_id = OLD.complaint_id AND vote_type = 'down'),
      updated_at = now()
    WHERE id = OLD.complaint_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for vote updates
CREATE TRIGGER update_complaint_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.update_complaint_votes();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for complaints updated_at
CREATE TRIGGER handle_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for complaint images
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true);

-- Storage policies
CREATE POLICY "Anyone can view complaint images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complaint-images');

CREATE POLICY "Authenticated users can upload complaint images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );