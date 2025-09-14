-- Enable RLS on notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes table
CREATE POLICY "Users can view own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes (updated_at DESC);
