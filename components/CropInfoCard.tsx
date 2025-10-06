import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sprout, Calendar, TrendingUp } from 'lucide-react-native';

interface Crop {
  id: string;
  crop_type: string;
  variety: string;
  current_stage: string;
  planting_date: string | null;
  expected_harvest_date: string | null;
}

interface CropInfoCardProps {
  crop: Crop;
  onPress?: () => void;
}

export function CropInfoCard({ crop, onPress }: CropInfoCardProps) {
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'planning':
        return '#6b7280';
      case 'planting':
        return '#3b82f6';
      case 'growing':
        return '#10b981';
      case 'flowering':
        return '#f59e0b';
      case 'harvesting':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Sprout size={24} color="#10b981" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.cropType}>{crop.crop_type}</Text>
          {crop.variety ? (
            <Text style={styles.variety}>{crop.variety}</Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: `${getStageColor(crop.current_stage)}20` }]}>
          <Text style={[styles.badgeText, { color: getStageColor(crop.current_stage) }]}>
            {crop.current_stage}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Calendar size={16} color="#6b7280" />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>Planted</Text>
            <Text style={styles.detailValue}>{formatDate(crop.planting_date)}</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <TrendingUp size={16} color="#6b7280" />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>Expected Harvest</Text>
            <Text style={styles.detailValue}>{formatDate(crop.expected_harvest_date)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  cropType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  variety: {
    fontSize: 14,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  details: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
