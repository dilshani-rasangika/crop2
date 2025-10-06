import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useFarm } from '@/contexts/FarmContext';
import { CropInfoCard } from '@/components/CropInfoCard';
import { Plus, X, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function Crops() {
  const router = useRouter();
  const { selectedFarm, farms } = useFarm();
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [currentStage, setCurrentStage] = useState('planning');

  useEffect(() => {
    loadData();
  }, [selectedFarm]);

  const loadData = async () => {
    if (!selectedFarm) {
      setLoading(false);
      setCrops([]);
      return;
    }

    try {
      const { data: cropsData } = await supabase
        .from('crops')
        .select('*')
        .eq('farm_id', selectedFarm.id)
        .order('created_at', { ascending: false });

      setCrops(cropsData || []);
    } catch (error) {
      console.error('Error loading crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrop = async () => {
    if (!cropType || !selectedFarm) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('crops').insert({
        farm_id: selectedFarm.id,
        crop_type: cropType,
        variety,
        current_stage: currentStage,
      });

      if (!error) {
        setCropType('');
        setVariety('');
        setCurrentStage('planning');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      console.error('Error adding crop:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!selectedFarm && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Crops</Text>
        </View>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>No farm selected</Text>
          <Text style={styles.emptyText}>
            {farms.length > 0
              ? 'Please select a farm from the Farms tab to view and manage crops'
              : 'Please add a farm first to start managing crops'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/farms')}>
            <Plus size={20} color="#10b981" />
            <Text style={styles.emptyButtonText}>
              {farms.length > 0 ? 'Go to Farms' : 'Add Farm'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Crops</Text>
          {selectedFarm && (
            <Text style={styles.subtitle}>{selectedFarm.name}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : crops.length > 0 ? (
          <View style={styles.cropsList}>
            {crops.map((crop) => (
              <CropInfoCard key={crop.id} crop={crop} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No crops yet</Text>
            <Text style={styles.emptyText}>Add your first crop to get started</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}>
              <Plus size={20} color="#10b981" />
              <Text style={styles.emptyButtonText}>Add Crop</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Crop</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Current Stage</Text>
                <View style={styles.stageButtons}>
                  {['planning', 'planting', 'growing', 'flowering', 'harvesting'].map((stage) => (
                    <TouchableOpacity
                      key={stage}
                      style={[
                        styles.stageButton,
                        currentStage === stage && styles.stageButtonActive,
                      ]}
                      onPress={() => setCurrentStage(stage)}>
                      <Text
                        style={[
                          styles.stageButtonText,
                          currentStage === stage && styles.stageButtonTextActive,
                        ]}>
                        {stage}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleAddCrop}
                disabled={saving || !cropType}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Crop</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
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
  cropsList: {
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
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
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
  stageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stageButtonActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  stageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  stageButtonTextActive: {
    color: '#10b981',
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
