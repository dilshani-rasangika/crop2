import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFarm } from '@/contexts/FarmContext';
import { AddEditFarmModal } from '@/components/AddEditFarmModal';
import AddFieldModal from '@/components/AddFieldModal';
import CropRecommendationsModal from '@/components/CropRecommendationsModal';
import { Plus, MapPin, CreditCard as Edit, Trash2, Check, Sprout, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function Farms() {
  const { farms, selectedFarm, setSelectedFarm, loading, refreshFarms } = useFarm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [recommendationsModalVisible, setRecommendationsModalVisible] = useState(false);
  const [selectedFieldForFarm, setSelectedFieldForFarm] = useState<string | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);

  const handleAddFarm = () => {
    setEditingFarm(null);
    setModalVisible(true);
  };

  const handleEditFarm = (farm: any) => {
    setEditingFarm(farm);
    setModalVisible(true);
  };

  const handleDeleteFarm = (farm: any) => {
    Alert.alert(
      'Delete Farm',
      `Are you sure you want to delete "${farm.name}"? This will also delete all associated crops.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('farms').delete().eq('id', farm.id);

              if (error) throw error;

              if (selectedFarm?.id === farm.id) {
                setSelectedFarm(null);
              }

              await refreshFarms();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete farm');
            }
          },
        },
      ]
    );
  };

  const handleSelectFarm = (farm: any) => {
    setSelectedFarm(farm);
  };

  const handleModalSuccess = async () => {
    await refreshFarms();
  };

  const loadFields = async (farmId: string) => {
    setLoadingFields(true);
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    if (selectedFarm) {
      loadFields(selectedFarm.id);
    } else {
      setFields([]);
    }
  }, [selectedFarm]);

  const handleAddField = (farmId: string) => {
    setSelectedFieldForFarm(farmId);
    setFieldModalVisible(true);
  };

  const handleFieldAdded = async () => {
    setFieldModalVisible(false);
    if (selectedFarm) {
      await loadFields(selectedFarm.id);
    }
  };

  const handleViewRecommendations = (field: any) => {
    setSelectedField(field);
    setRecommendationsModalVisible(true);
  };

  const handleDeleteField = (field: any) => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${field.field_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('fields').delete().eq('id', field.id);
              if (error) throw error;
              if (selectedFarm) {
                await loadFields(selectedFarm.id);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete field');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Farms</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddFarm}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : farms.length > 0 ? (
          <View style={styles.farmsList}>
            {farms.map((farm) => {
              const isSelected = selectedFarm?.id === farm.id;
              return (
                <TouchableOpacity
                  key={farm.id}
                  style={[styles.farmCard, isSelected && styles.farmCardSelected]}
                  onPress={() => handleSelectFarm(farm)}>
                  <View style={styles.farmCardHeader}>
                    <View style={styles.farmCardTitle}>
                      <Text style={styles.farmName}>{farm.name}</Text>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Check size={14} color="#10b981" />
                          <Text style={styles.selectedText}>Selected</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.farmActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditFarm(farm)}>
                        <Edit size={18} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteFarm(farm)}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {farm.location ? (
                    <View style={styles.farmDetail}>
                      <MapPin size={14} color="#6b7280" />
                      <Text style={styles.farmDetailText}>{farm.location}</Text>
                    </View>
                  ) : null}

                  <View style={styles.farmMeta}>
                    {farm.latitude && farm.longitude && (
                      <Text style={styles.farmMetaText}>
                        GPS: {parseFloat(farm.latitude).toFixed(4)}, {parseFloat(farm.longitude).toFixed(4)}
                      </Text>
                    )}
                    {farm.area_size > 0 && (
                      <Text style={styles.farmMetaText}>{farm.area_size} acres</Text>
                    )}
                    {farm.soil_type && (
                      <Text style={styles.farmMetaText}>Soil: {farm.soil_type}</Text>
                    )}
                  </View>

                  {isSelected && (
                    <View style={styles.fieldsSection}>
                      <View style={styles.fieldsSectionHeader}>
                        <Text style={styles.fieldsSectionTitle}>Fields</Text>
                        <TouchableOpacity
                          style={styles.addFieldButton}
                          onPress={() => handleAddField(farm.id)}>
                          <Plus size={16} color="#059669" />
                          <Text style={styles.addFieldButtonText}>Add Field</Text>
                        </TouchableOpacity>
                      </View>

                      {loadingFields ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : fields.length > 0 ? (
                        <View style={styles.fieldsList}>
                          {fields.map((field) => (
                            <View key={field.id} style={styles.fieldCard}>
                              <View style={styles.fieldHeader}>
                                <View style={styles.fieldInfo}>
                                  <Sprout size={16} color="#059669" />
                                  <Text style={styles.fieldName}>{field.field_name}</Text>
                                </View>
                                <TouchableOpacity
                                  style={styles.deleteFieldButton}
                                  onPress={() => handleDeleteField(field)}>
                                  <Trash2 size={14} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.fieldDetail}>
                                Soil: {field.soil_type} • {field.area_size} acres
                              </Text>
                              {field.previous_crops && field.previous_crops.length > 0 && (
                                <Text style={styles.fieldDetail}>
                                  Previous: {field.previous_crops.join(', ')}
                                </Text>
                              )}
                              <TouchableOpacity
                                style={styles.recommendButton}
                                onPress={() => handleViewRecommendations(field)}>
                                <Sparkles size={16} color="#fff" />
                                <Text style={styles.recommendButtonText}>
                                  Get Recommendations
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noFieldsText}>No fields added yet</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No farms yet</Text>
            <Text style={styles.emptyText}>Add your first farm to get started</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddFarm}>
              <Plus size={20} color="#10b981" />
              <Text style={styles.emptyButtonText}>Add Farm</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddEditFarmModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingFarm(null);
        }}
        onSuccess={handleModalSuccess}
        farm={editingFarm}
      />

      {selectedFieldForFarm && (
        <AddFieldModal
          visible={fieldModalVisible}
          onClose={() => {
            setFieldModalVisible(false);
            setSelectedFieldForFarm(null);
          }}
          onSuccess={handleFieldAdded}
          farmId={selectedFieldForFarm}
        />
      )}

      <CropRecommendationsModal
        visible={recommendationsModalVisible}
        onClose={() => {
          setRecommendationsModalVisible(false);
          setSelectedField(null);
        }}
        field={selectedField}
      />
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
  farmsList: {
    gap: 12,
  },
  farmCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  farmCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  farmCardTitle: {
    flex: 1,
    gap: 8,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  farmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  farmDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  farmDetailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  farmMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  farmMetaText: {
    fontSize: 12,
    color: '#6b7280',
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
  fieldsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  fieldsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  addFieldButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  fieldsList: {
    gap: 8,
  },
  fieldCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  deleteFieldButton: {
    padding: 4,
  },
  fieldDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#059669',
    borderRadius: 6,
  },
  recommendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  noFieldsText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
