import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';

interface AddFieldModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farmId: string;
}

const SOIL_TYPES = [
  'Clay',
  'Sandy',
  'Loamy',
  'Silty',
  'Peaty',
  'Chalky',
  'Mixed',
];

export default function AddFieldModal({
  visible,
  onClose,
  onSuccess,
  farmId,
}: AddFieldModalProps) {
  const [fieldName, setFieldName] = useState('');
  const [soilType, setSoilType] = useState('');
  const [fieldLocation, setFieldLocation] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [previousCrops, setPreviousCrops] = useState<string[]>([]);
  const [currentCrop, setCurrentCrop] = useState('');
  const [saving, setSaving] = useState(false);

  const addPreviousCrop = () => {
    if (currentCrop.trim()) {
      setPreviousCrops([...previousCrops, currentCrop.trim()]);
      setCurrentCrop('');
    }
  };

  const removePreviousCrop = (index: number) => {
    setPreviousCrops(previousCrops.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!fieldName.trim() || !soilType) {
      Alert.alert('Error', 'Please fill in field name and soil type');
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');

      const { error } = await supabase.from('fields').insert({
        farm_id: farmId,
        field_name: fieldName,
        soil_type: soilType,
        field_location: fieldLocation,
        area_size: parseFloat(areaSize) || 0,
        previous_crops: previousCrops,
      });

      if (error) throw error;

      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error saving field:', error);
      Alert.alert('Error', 'Failed to save field details');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFieldName('');
    setSoilType('');
    setFieldLocation('');
    setAreaSize('');
    setPreviousCrops([]);
    setCurrentCrop('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Field Details</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Field Name *</Text>
              <TextInput
                style={styles.input}
                value={fieldName}
                onChangeText={setFieldName}
                placeholder="e.g., North Field"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soil Type *</Text>
              <View style={styles.soilTypeGrid}>
                {SOIL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.soilTypeButton,
                      soilType === type && styles.soilTypeButtonActive,
                    ]}
                    onPress={() => setSoilType(type)}
                  >
                    <Text
                      style={[
                        styles.soilTypeText,
                        soilType === type && styles.soilTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Field Location</Text>
              <TextInput
                style={styles.input}
                value={fieldLocation}
                onChangeText={setFieldLocation}
                placeholder="e.g., GPS coordinates or description"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area Size (acres)</Text>
              <TextInput
                style={styles.input}
                value={areaSize}
                onChangeText={setAreaSize}
                placeholder="e.g., 5.5"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Previous Crops</Text>
              <View style={styles.cropInputRow}>
                <TextInput
                  style={[styles.input, styles.cropInput]}
                  value={currentCrop}
                  onChangeText={setCurrentCrop}
                  placeholder="e.g., Wheat"
                  placeholderTextColor="#9CA3AF"
                  onSubmitEditing={addPreviousCrop}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addPreviousCrop}
                >
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {previousCrops.length > 0 && (
                <View style={styles.cropsListContainer}>
                  {previousCrops.map((crop, index) => (
                    <View key={index} style={styles.cropChip}>
                      <Text style={styles.cropChipText}>{crop}</Text>
                      <TouchableOpacity
                        onPress={() => removePreviousCrop(index)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save & Get Recommendations</Text>
              )}
            </TouchableOpacity>
          </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  soilTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soilTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  soilTypeButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  soilTypeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  soilTypeTextActive: {
    color: '#fff',
  },
  cropInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cropInput: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropsListContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  cropChipText: {
    fontSize: 14,
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
