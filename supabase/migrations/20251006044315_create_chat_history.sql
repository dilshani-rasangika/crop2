/*
  # Create Chat History Table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `message` (text) - The user's message
      - `response` (text) - The AI's response
      - `created_at` (timestamptz) - Timestamp when message was created
  
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for users to read their own chat history
    - Add policy for users to insert their own messages
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created_at 
  ON chat_messages(user_id, created_at DESC);