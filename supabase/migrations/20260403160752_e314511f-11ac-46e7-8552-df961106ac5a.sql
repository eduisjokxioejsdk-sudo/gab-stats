
-- Create live_matches table
CREATE TABLE public.live_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE,
  match_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;

-- Public read access (coach views via share code)
CREATE POLICY "Anyone can view live matches"
  ON public.live_matches FOR SELECT
  USING (true);

-- Public insert (statistician creates match)
CREATE POLICY "Anyone can create live matches"
  ON public.live_matches FOR INSERT
  WITH CHECK (true);

-- Public update (statistician syncs data)
CREATE POLICY "Anyone can update live matches"
  ON public.live_matches FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_matches;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_live_matches_updated_at
  BEFORE UPDATE ON public.live_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
