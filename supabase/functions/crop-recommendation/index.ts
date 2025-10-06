import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENWEATHER_API_KEY = "1a2b3c4d5e6f7g8h9i0j";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { fieldId, soilType, location, previousCrops } = await req.json();

    if (!fieldId || !soilType) {
      throw new Error("Field ID and soil type are required");
    }

    let weatherData = {};
    let weatherDescription = "moderate conditions";

    if (location) {
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (weatherResponse.ok) {
          weatherData = await weatherResponse.json();
          const temp = weatherData.main?.temp || 25;
          const humidity = weatherData.main?.humidity || 60;
          const rainfall = weatherData.rain?.["1h"] || 0;
          
          weatherDescription = `Temperature: ${temp}°C, Humidity: ${humidity}%, Recent rainfall: ${rainfall}mm`;
        }
      } catch (error) {
        console.error("Weather API error:", error);
      }
    }

    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!googleApiKey) {
      throw new Error("Google AI API key not configured");
    }

    const previousCropsText = previousCrops && previousCrops.length > 0 
      ? `Previous crops grown: ${previousCrops.join(", ")}` 
      : "No previous crop history available";

    const prompt = `You are an agricultural expert. Based on the following field information, recommend the top 5 most suitable crops with their suitability percentages (0-100).

Field Information:
- Soil Type: ${soilType}
- Location: ${location || "Not specified"}
- Weather: ${weatherDescription}
- ${previousCropsText}

Consider:
1. Soil compatibility
2. Climate suitability
3. Crop rotation benefits
4. Water requirements
5. Market demand

Provide your response in this exact JSON format:
{
  "recommendations": [
    {
      "crop": "Crop Name",
      "suitability": 95,
      "factors": {
        "soil": "Brief soil compatibility reason",
        "climate": "Brief climate suitability reason",
        "rotation": "Brief crop rotation benefit",
        "water": "Water requirement level"
      }
    }
  ]
}

Only respond with valid JSON, no other text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const aiText = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let recommendations;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.recommendations || [];
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      recommendations = [
        {
          crop: "Wheat",
          suitability: 85,
          factors: {
            soil: "Good compatibility with most soil types",
            climate: "Suitable for moderate climates",
            rotation: "Excellent rotation crop",
            water: "Moderate water requirements"
          }
        },
        {
          crop: "Corn",
          suitability: 80,
          factors: {
            soil: "Thrives in well-drained soils",
            climate: "Requires warm growing season",
            rotation: "Good for nitrogen management",
            water: "High water requirements"
          }
        },
        {
          crop: "Soybeans",
          suitability: 78,
          factors: {
            soil: "Improves soil nitrogen",
            climate: "Warm season crop",
            rotation: "Excellent nitrogen fixer",
            water: "Moderate water needs"
          }
        }
      ];
    }

    const savedRecommendations = [];
    for (const rec of recommendations) {
      const { error: insertError } = await supabaseClient
        .from("crop_recommendations")
        .insert({
          field_id: fieldId,
          user_id: user.id,
          crop_type: rec.crop,
          suitability_percentage: rec.suitability,
          recommendation_factors: rec.factors,
          weather_data: weatherData,
        });

      if (!insertError) {
        savedRecommendations.push(rec);
      }
    }

    return new Response(
      JSON.stringify({ recommendations: savedRecommendations }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in crop-recommendation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});