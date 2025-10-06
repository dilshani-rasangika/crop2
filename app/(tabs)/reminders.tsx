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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, CircleCheck as CheckCircle, Circle, Calendar } from 'lucide-react-native';

export default function Reminders() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  useEffect(() => {
    loadReminders();
  }, [session]);

  const loadReminders = async () => {
    try {
      const { data } = await supabase
        .from('seasonal_reminders')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('reminder_date', { ascending: true });

      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!title || !reminderDate) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('seasonal_reminders').insert({
        user_id: session?.user.id,
        title,
        description,
        reminder_date: reminderDate,
        is_completed: false,
      });

      if (!error) {
        setTitle('');
        setDescription('');
        setReminderDate('');
        setModalVisible(false);
        loadReminders();
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('seasonal_reminders')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      loadReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isPastDue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
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
        ) : reminders.length > 0 ? (
          <View style={styles.remindersList}>
            {reminders.map((reminder) => (
              <TouchableOpacity
                key={reminder.id}
                style={[
                  styles.reminderCard,
                  reminder.is_completed && styles.reminderCardCompleted,
                ]}
                onPress={() => toggleComplete(reminder.id, reminder.is_completed)}>
                <View style={styles.reminderHeader}>
                  {reminder.is_completed ? (
                    <CheckCircle size={24} color="#10b981" />
                  ) : (
                    <Circle size={24} color="#6b7280" />
                  )}
                  <View style={styles.reminderContent}>
                    <Text
                      style={[
                        styles.reminderTitle,
                        reminder.is_completed && styles.reminderTitleCompleted,
                      ]}>
                      {reminder.title}
                    </Text>
                    {reminder.description ? (
                      <Text style={styles.reminderDescription}>{reminder.description}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.reminderFooter}>
                  <Calendar size={14} color="#6b7280" />
                  <Text
                    style={[
                      styles.reminderDate,
                      isPastDue(reminder.reminder_date) &&
                        !reminder.is_completed &&
                        styles.reminderDateOverdue,
                    ]}>
                    {formatDate(reminder.reminder_date)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptyText}>Add a reminder to stay on track</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}>
              <Plus size={20} color="#10b981" />
              <Text style={styles.emptyButtonText}>Add Reminder</Text>
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
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Water crops, Apply fertilizer"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Additional details..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={reminderDate}
                  onChangeText={setReminderDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleAddReminder}
                disabled={saving || !title || !reminderDate}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Reminder</Text>
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
  remindersList: {
    gap: 12,
  },
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderCardCompleted: {
    opacity: 0.6,
  },
  reminderHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reminderTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  reminderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 36,
  },
  reminderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  reminderDateOverdue: {
    color: '#ef4444',
    fontWeight: '600',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
