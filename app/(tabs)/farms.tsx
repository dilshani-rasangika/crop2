import React, { useState } from 'react';
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
import { Plus, MapPin, CreditCard as Edit, Trash2, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function Farms() {
  const { farms, selectedFarm, setSelectedFarm, loading, refreshFarms } = useFarm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);

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
});
