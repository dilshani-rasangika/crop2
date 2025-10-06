import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';

interface Recommendation {
  id: string;
  crop_type: string;
  recommendation_text: string;
  confidence_score: number;
  created_at: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Lightbulb size={20} color="#f59e0b" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.cropType}>{recommendation.crop_type}</Text>
          <Text style={styles.date}>{formatDate(recommendation.created_at)}</Text>
        </View>
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: `${getConfidenceColor(recommendation.confidence_score)}20` },
          ]}>
          <Text
            style={[
              styles.confidenceText,
              { color: getConfidenceColor(recommendation.confidence_score) },
            ]}>
            {Math.round(recommendation.confidence_score * 100)}%
          </Text>
        </View>
      </View>
      <Text style={styles.recommendation}>{recommendation.recommendation_text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  cropType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recommendation: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
