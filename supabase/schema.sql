-- RTA Life Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table - stores daily schedule items
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- in minutes
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  category TEXT CHECK (category IN ('work', 'family', 'personal', 'health', 'errand')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User context table - stores family structure, resources, routines
CREATE TABLE IF NOT EXISTS user_context (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  family_structure JSONB DEFAULT '{"members": []}',
  resources JSONB DEFAULT '{"vehicles": [], "nearby_facilities": [], "support_network": []}',
  routines JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{"timezone": "Asia/Tokyo", "language": "en", "notification_style": "detailed"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history table (optional - for conversation persistence)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  schedule_update JSONB, -- Store the schedule update if any
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- User context policies
CREATE POLICY "Users can view their own context" ON user_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own context" ON user_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own context" ON user_context
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view their own messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_context_updated_at
  BEFORE UPDATE ON user_context
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
