import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Sparkles, Droplet, Sun, Sprout } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Field {
  id: string;
  field_name: string;
  soil_type: string;
  field_location: string;
  previous_crops: string[];
}

interface Recommendation {
  crop: string;
  suitability: number;
  factors: {
    soil: string;
    climate: string;
    rotation: string;
    water: string;
  };
}

interface CropRecommendationsModalProps {
  visible: boolean;
  onClose: () => void;
  field: Field | null;
}

export default function CropRecommendationsModal({
  visible,
  onClose,
  field,
}: CropRecommendationsModalProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && field) {
      fetchRecommendations();
    }
  }, [visible, field]);

  const fetchRecommendations = async () => {
    if (!field) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/crop-recommendation`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldId: field.id,
          soilType: field.soil_type,
          location: field.field_location,
          previousCrops: field.previous_crops,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSuitabilityColor = (percentage: number) => {
    if (percentage >= 80) return '#059669';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Sparkles size={24} color="#059669" />
              <Text style={styles.modalTitle}>Crop Recommendations</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {field && (
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldName}>{field.field_name}</Text>
              <Text style={styles.fieldDetails}>
                Soil: {field.soil_type} • Location: {field.field_location || 'Not specified'}
              </Text>
              {field.previous_crops?.length > 0 && (
                <Text style={styles.fieldDetails}>
                  Previous: {field.previous_crops.join(', ')}
                </Text>
              )}
            </View>
          )}

          <ScrollView style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.loadingText}>
                  Analyzing field conditions and generating recommendations...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchRecommendations}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : recommendations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No recommendations available
                </Text>
              </View>
            ) : (
              <View style={styles.recommendationsList}>
                {recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <Text style={styles.cropName}>{rec.crop}</Text>
                      <View
                        style={[
                          styles.suitabilityBadge,
                          {
                            backgroundColor: getSuitabilityColor(rec.suitability),
                          },
                        ]}
                      >
                        <Text style={styles.suitabilityText}>
                          {rec.suitability}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.factorsContainer}>
                      <View style={styles.factorRow}>
                        <Sprout size={16} color="#6B7280" />
                        <View style={styles.factorContent}>
                          <Text style={styles.factorLabel}>Soil Match</Text>
                          <Text style={styles.factorText}>{rec.factors.soil}</Text>
                        </View>
                      </View>

                      <View style={styles.factorRow}>
                        <Sun size={16} color="#6B7280" />
                        <View style={styles.factorContent}>
                          <Text style={styles.factorLabel}>Climate</Text>
                          <Text style={styles.factorText}>{rec.factors.climate}</Text>
                        </View>
                      </View>

                      <View style={styles.factorRow}>
                        <Sprout size={16} color="#6B7280" />
                        <View style={styles.factorContent}>
                          <Text style={styles.factorLabel}>Rotation Benefit</Text>
                          <Text style={styles.factorText}>{rec.factors.rotation}</Text>
                        </View>
                      </View>

                      <View style={styles.factorRow}>
                        <Droplet size={16} color="#6B7280" />
                        <View style={styles.factorContent}>
                          <Text style={styles.factorLabel}>Water Needs</Text>
                          <Text style={styles.factorText}>{rec.factors.water}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  fieldInfo: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  fieldDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  recommendationsList: {
    padding: 16,
    gap: 16,
  },
  recommendationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  suitabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suitabilityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  factorsContainer: {
    gap: 12,
  },
  factorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  factorContent: {
    flex: 1,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  factorText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
