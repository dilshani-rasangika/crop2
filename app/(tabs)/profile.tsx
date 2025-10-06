import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, MapPin, Mail, LogOut, Settings } from 'lucide-react-native';

export default function Profile() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, [session]);

  const loadProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .maybeSingle();

      setProfile(profileData);

      const { data: farmsData } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', session?.user.id);

      setFarms(farmsData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/sign-in');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <User size={40} color="#10b981" />
              </View>
              <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
              <View style={styles.emailContainer}>
                <Mail size={16} color="#6b7280" />
                <Text style={styles.email}>{session?.user.email}</Text>
              </View>
            </View>

            {farms.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Farm Details</Text>
                {farms.map((farm) => (
                  <View key={farm.id} style={styles.farmCard}>
                    <View style={styles.farmHeader}>
                      <Text style={styles.farmName}>{farm.name}</Text>
                    </View>
                    {farm.location && (
                      <View style={styles.farmDetail}>
                        <MapPin size={16} color="#6b7280" />
                        <Text style={styles.farmDetailText}>{farm.location}</Text>
                      </View>
                    )}
                    {farm.area_size > 0 && (
                      <View style={styles.farmDetail}>
                        <Text style={styles.farmDetailLabel}>Area: </Text>
                        <Text style={styles.farmDetailText}>{farm.area_size} acres</Text>
                      </View>
                    )}
                    {farm.soil_type && (
                      <View style={styles.farmDetail}>
                        <Text style={styles.farmDetailLabel}>Soil Type: </Text>
                        <Text style={styles.farmDetailText}>{farm.soil_type}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <TouchableOpacity style={styles.actionButton}>
                <Settings size={20} color="#6b7280" />
                <Text style={styles.actionButtonText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
                <LogOut size={20} color="#ef4444" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  farmCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  farmHeader: {
    marginBottom: 12,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  farmDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  farmDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  farmDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtonTextDanger: {
    color: '#ef4444',
  },
});
