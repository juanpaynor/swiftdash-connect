-- AI Companion Tables

-- Meeting Transcripts (stores real-time transcript messages)
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  speaker_id TEXT,
  speaker_name TEXT,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting ON meeting_transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_timestamp ON meeting_transcripts(timestamp);

-- Meeting Summaries (stores AI-generated summaries)
CREATE TABLE IF NOT EXISTS meeting_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  key_points TEXT[],
  action_items JSONB DEFAULT '[]'::jsonb, -- [{text, assignee, completed}]
  decisions TEXT[],
  full_transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_summaries_meeting ON meeting_summaries(meeting_id);

-- Enable RLS
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_transcripts
CREATE POLICY "Users can view transcripts from their organization meetings"
  ON meeting_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      INNER JOIN users u ON u.default_organization_id = m.organization_id
      WHERE m.id = meeting_transcripts.meeting_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert transcripts"
  ON meeting_transcripts FOR INSERT
  WITH CHECK (true);

-- RLS Policies for meeting_summaries
CREATE POLICY "Users can view summaries from their organization meetings"
  ON meeting_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      INNER JOIN users u ON u.default_organization_id = m.organization_id
      WHERE m.id = meeting_summaries.meeting_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage summaries"
  ON meeting_summaries FOR ALL
  WITH CHECK (true);
