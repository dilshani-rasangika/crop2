/*
  # Add Fields and Enhanced Recommendations

  1. New Tables
    - `fields`
      - `id` (uuid, primary key) - Unique field identifier
      - `farm_id` (uuid, foreign key) - Reference to farms table
      - `field_name` (text) - Name of the field
      - `soil_type` (text) - Type of soil in this field
      - `field_location` (text) - Specific location within farm
      - `area_size` (decimal) - Field size in acres/hectares
      - `previous_crops` (text[]) - Array of previously grown crops
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time
  
    - `crop_recommendations`
      - `id` (uuid, primary key) - Unique recommendation identifier
      - `field_id` (uuid, foreign key) - Reference to fields table
      - `user_id` (uuid, foreign key) - User reference
      - `crop_type` (text) - Recommended crop type
      - `suitability_percentage` (decimal) - Suitability score (0-100)
      - `recommendation_factors` (jsonb) - Detailed factors (weather, soil, etc.)
      - `weather_data` (jsonb) - Weather data at time of recommendation
      - `created_at` (timestamptz) - When recommendation was generated
  
  2. Security
    - Enable RLS on both new tables
    - Add policies for authenticated users to manage their own data
  
  3. Important Notes
    - Uses array type for previous_crops to store multiple crop history
    - JSONB for flexible storage of recommendation factors and weather data
    - Suitability percentage stored as decimal (0-100)
*/

-- Fields table
CREATE TABLE IF NOT EXISTS fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_name text NOT NULL DEFAULT '',
  soil_type text NOT NULL DEFAULT '',
  field_location text DEFAULT '',
  area_size decimal(10, 2) DEFAULT 0,
  previous_crops text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fields from own farms"
  ON fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = fields.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create fields for own farms"
  ON fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = fields.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields from own farms"
  ON fields FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = fields.farm_id
      AND farms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = fields.farm_id
      AND farms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fields from own farms"
  ON fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id = fields.farm_id
      AND farms.user_id = auth.uid()
    )
  );

-- Crop recommendations table
CREATE TABLE IF NOT EXISTS crop_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_type text NOT NULL DEFAULT '',
  suitability_percentage decimal(5, 2) NOT NULL DEFAULT 0,
  recommendation_factors jsonb DEFAULT '{}',
  weather_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crop recommendations"
  ON crop_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own crop recommendations"
  ON crop_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own crop recommendations"
  ON crop_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS fields_farm_id_idx ON fields(farm_id);
CREATE INDEX IF NOT EXISTS crop_recommendations_field_id_idx ON crop_recommendations(field_id);
CREATE INDEX IF NOT EXISTS crop_recommendations_user_id_idx ON crop_recommendations(user_id);