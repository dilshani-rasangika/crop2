import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFarm } from '@/contexts/FarmContext';
import { WeatherCard } from '@/components/WeatherCard';
import { CropInfoCard } from '@/components/CropInfoCard';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Plus, RefreshCw } from 'lucide-react-native';

export default function Dashboard() {
  const { session } = useAuth();
  const { selectedFarm } = useFarm();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const loadData = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .maybeSingle();

      setProfile(profileData);

      if (selectedFarm) {
        const { data: cropsData } = await supabase
          .from('crops')
          .select('*')
          .eq('farm_id', selectedFarm.id)
          .order('created_at', { ascending: false })
          .limit(3);

        setCrops(cropsData || []);

        if (selectedFarm.location) {
          setWeather({
            temperature: 24,
            condition: 'Partly Cloudy',
            humidity: 65,
            windSpeed: 12,
            location: selectedFarm.location,
          });
        }
      } else {
        setCrops([]);
        setWeather(null);
      }

      const { data: recommendationsData } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      setRecommendations(recommendationsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session, selectedFarm]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{profile?.full_name || 'Farmer'}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <RefreshCw size={20} color="#10b981" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <WeatherCard weather={weather} loading={loading && !weather} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Crops</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/crops')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {crops.length > 0 ? (
          <View style={styles.cropsList}>
            {crops.map((crop) => (
              <CropInfoCard key={crop.id} crop={crop} onPress={() => router.push('/(tabs)/crops')} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No crops yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/onboarding')}>
              <Plus size={20} color="#10b981" />
              <Text style={styles.addButtonText}>Add Your First Crop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {recommendations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Recommendations</Text>
          </View>
          <View style={styles.recommendationsList}>
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 48,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  cropsList: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  recommendationsList: {
    gap: 12,
  },
  bottomPadding: {
    height: 40,
  },
});
