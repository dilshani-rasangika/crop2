import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AddEditFarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farm?: any;
}

export function AddEditFarmModal({ visible, onClose, onSuccess, farm }: AddEditFarmModalProps) {
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [soilType, setSoilType] = useState('');

  useEffect(() => {
    if (farm) {
      setName(farm.name || '');
      setLocation(farm.location || '');
      setLatitude(farm.latitude?.toString() || '');
      setLongitude(farm.longitude?.toString() || '');
      setAreaSize(farm.area_size?.toString() || '');
      setSoilType(farm.soil_type || '');
    } else {
      setName('');
      setLocation('');
      setLatitude('');
      setLongitude('');
      setAreaSize('');
      setSoilType('');
    }
  }, [farm, visible]);

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      if ('geolocation' in navigator) {
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude.toString());
            setLongitude(position.coords.longitude.toString());
            setGettingLocation(false);
          },
          (error) => {
            Alert.alert('Error', 'Unable to get your location. Please enter manually.');
            setGettingLocation(false);
          }
        );
      } else {
        Alert.alert('Error', 'Geolocation is not supported by your browser');
      }
      return;
    }

    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your current location');
        setGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLatitude(currentLocation.coords.latitude.toString());
      setLongitude(currentLocation.coords.longitude.toString());
    } catch (error) {
      Alert.alert('Error', 'Unable to get your location. Please enter manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a farm name');
      return;
    }

    setSaving(true);
    try {
      const farmData = {
        name: name.trim(),
        location: location.trim() || '',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        area_size: areaSize ? parseFloat(areaSize) : 0,
        soil_type: soilType.trim() || '',
        user_id: session?.user.id,
      };

      if (farm) {
        const { error } = await supabase
          .from('farms')
          .update(farmData)
          .eq('id', farm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('farms').insert(farmData);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save farm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{farm ? 'Edit Farm' : 'Add New Farm'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Farm Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Green Valley Farm"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location Address</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., 123 Farm Road, City"
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>GPS Coordinates</Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={gettingLocation}>
                  {gettingLocation ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (
                    <>
                      <MapPin size={16} color="#10b981" />
                      <Text style={styles.locationButtonText}>Use Current Location</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.coordsRow}>
                <View style={styles.coordInput}>
                  <Text style={styles.coordLabel}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="e.g., 40.7128"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.coordInput}>
                  <Text style={styles.coordLabel}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="e.g., -74.0060"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Area Size (acres)</Text>
              <TextInput
                style={styles.input}
                value={areaSize}
                onChangeText={setAreaSize}
                placeholder="e.g., 10"
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

            <TouchableOpacity
              style={[styles.submitButton, saving && styles.submitButtonDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{farm ? 'Update Farm' : 'Add Farm'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  form: {
    gap: 16,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 6,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
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
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordInput: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
