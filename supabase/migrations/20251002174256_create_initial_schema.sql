/*
  # Initial Schema for Agricultural App

  ## Overview
  This migration creates the foundational database structure for an agricultural mobile app
  that provides weather forecasting and AI-powered crop recommendations.

  ## New Tables
  
  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact number
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. `farms`
  Farm/land information for each user
  - `id` (uuid, primary key) - Unique farm identifier
  - `user_id` (uuid, foreign key) - Owner reference
  - `name` (text) - Farm name
  - `location` (text) - Farm location/address
  - `latitude` (decimal) - GPS coordinates
  - `longitude` (decimal) - GPS coordinates
  - `area_size` (decimal) - Farm size in acres/hectares
  - `soil_type` (text) - Type of soil
  - `created_at` (timestamptz) - Record creation time

  ### 3. `crops`
  Information about crops being grown
  - `id` (uuid, primary key) - Unique crop record identifier
  - `farm_id` (uuid, foreign key) - Farm reference
  - `crop_type` (text) - Type of crop (e.g., wheat, rice, corn)
  - `variety` (text) - Specific variety/cultivar
  - `planting_date` (date) - When crop was planted
  - `expected_harvest_date` (date) - Projected harvest date
  - `current_stage` (text) - Growth stage
  - `area_planted` (decimal) - Area in acres/hectares
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 4. `weather_preferences`
  User's weather alert preferences
  - `id` (uuid, primary key) - Unique preference identifier
  - `user_id` (uuid, foreign key) - User reference
  - `min_temp_alert` (decimal) - Minimum temperature threshold
  - `max_temp_alert` (decimal) - Maximum temperature threshold
  - `rain_alert` (boolean) - Enable rain alerts
  - `frost_alert` (boolean) - Enable frost alerts
  - `wind_alert` (boolean) - Enable wind alerts
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 5. `recommendations`
  AI-generated crop recommendations history
  - `id` (uuid, primary key) - Unique recommendation identifier
  - `user_id` (uuid, foreign key) - User reference
  - `farm_id` (uuid, foreign key) - Farm reference
  - `crop_type` (text) - Recommended crop
  - `recommendation_text` (text) - Detailed recommendation
  - `confidence_score` (decimal) - AI confidence level (0-1)
  - `weather_context` (jsonb) - Weather data used for recommendation
  - `created_at` (timestamptz) - When recommendation was generated

  ### 6. `seasonal_reminders`
  Custom and automatic reminders for farming activities
  - `id` (uuid, primary key) - Unique reminder identifier
  - `user_id` (uuid, foreign key) - User reference
  - `crop_id` (uuid, foreign key, optional) - Related crop
  - `title` (text) - Reminder title
  - `description` (text) - Detailed description
  - `reminder_date` (date) - When to remind
  - `is_completed` (boolean) - Completion status
  - `created_at` (timestamptz) - Record creation time

  ## Security
  
  All tables have Row Level Security (RLS) enabled with the following policies:
  
  - **SELECT**: Authenticated users can view their own data
  - **INSERT**: Authenticated users can create their own records
  - **UPDATE**: Authenticated users can update their own records
  - **DELETE**: Authenticated users can delete their own records
  
  ## Important Notes
  
  1. All timestamps use `timestamptz` for timezone awareness
  2. Foreign keys ensure referential integrity
  3. Default values prevent null issues for critical fields
  4. JSONB used for flexible weather context storage
  5. Decimal types for precise numeric measurements
*/

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Farm',
  location text DEFAULT '',
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  area_size decimal(10, 2) DEFAULT 0,
  soil_type text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own farms"
  ON farms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own farms"
  ON farms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farms"
  ON farms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own farms"
  ON farms FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Crops table
CREATE TABLE IF NOT EXISTS crops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_type text NOT NULL DEFAULT '',
  variety text DEFAULT '',
  planting_date date,
  expected_harvest_date date,
  current_stage text DEFAULT 'planning',
  area_planted decimal(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view crops from own farms"
  ON crops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create crops for own farms"
  ON crops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update crops from own farms"
  ON crops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete crops from own farms"
  ON crops FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = crops.farm_id
      AND farms.user_id = auth.uid()
    )
  );

-- Weather preferences table
CREATE TABLE IF NOT EXISTS weather_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  min_temp_alert decimal(5, 2),
  max_temp_alert decimal(5, 2),
  rain_alert boolean DEFAULT true,
  frost_alert boolean DEFAULT true,
  wind_alert boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE weather_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weather preferences"
  ON weather_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weather preferences"
  ON weather_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weather preferences"
  ON weather_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weather preferences"
  ON weather_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE,
  crop_type text NOT NULL DEFAULT '',
  recommendation_text text NOT NULL DEFAULT '',
  confidence_score decimal(3, 2) DEFAULT 0.5,
  weather_context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Seasonal reminders table
CREATE TABLE IF NOT EXISTS seasonal_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id uuid REFERENCES crops(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  reminder_date date NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seasonal_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON seasonal_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON seasonal_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON seasonal_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON seasonal_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS farms_user_id_idx ON farms(user_id);
CREATE INDEX IF NOT EXISTS crops_farm_id_idx ON crops(farm_id);
CREATE INDEX IF NOT EXISTS recommendations_user_id_idx ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS seasonal_reminders_user_id_idx ON seasonal_reminders(user_id);
CREATE INDEX IF NOT EXISTS seasonal_reminders_date_idx ON seasonal_reminders(reminder_date);
