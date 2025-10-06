import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Sprout } from 'lucide-react-native';

export default function Onboarding() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [soilType, setSoilType] = useState('');
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');

  const handleComplete = async () => {
    if (!farmName || !location || !cropType) {
      setError('Please fill in farm name, location, and crop type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .insert({
          user_id: session?.user.id,
          name: farmName,
          location,
          area_size: areaSize ? parseFloat(areaSize) : 0,
          soil_type: soilType,
        })
        .select()
        .maybeSingle();

      if (farmError) throw farmError;

      if (farmData) {
        const { error: cropError } = await supabase.from('crops').insert({
          farm_id: farmData.id,
          crop_type: cropType,
          variety,
          current_stage: 'planning',
        });

        if (cropError) throw cropError;
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to save farm details');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Sprout size={40} color="#10b981" />
        </View>
        <Text style={styles.title}>Set Up Your Farm</Text>
        <Text style={styles.subtitle}>Let's get started with your farm details</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Farm Information</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Farm Name *</Text>
          <TextInput
            style={styles.input}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="My Farm"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Area Size (acres)</Text>
          <TextInput
            style={styles.input}
            value={areaSize}
            onChangeText={setAreaSize}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Soil Type</Text>
          <TextInput
            style={styles.input}
            value={soilType}
            onChangeText={setSoilType}
            placeholder="e.g., Clay, Sandy, Loam"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Sprout size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Current Crop</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Crop Type *</Text>
          <TextInput
            style={styles.input}
            value={cropType}
            onChangeText={setCropType}
            placeholder="e.g., Wheat, Rice, Corn"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Variety</Text>
          <TextInput
            style={styles.input}
            value={variety}
            onChangeText={setVariety}
            placeholder="e.g., Basmati, Golden Harvest"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue to Dashboard</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  skipText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
