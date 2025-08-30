import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { blue } from '../utils/Colors';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';

const colors = {
  primary: blue,
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const STORAGE_KEY = 'crop_calendar_activities';

const AddActivityModal = ({ visible, onClose, cropCalendar, onActivityAdded, selectedDate }) => {
  const [activityName, setActivityName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const userData = useUserStore(state => state.userData);

  // Set the activity date when modal opens
  useEffect(() => {
    if (visible) {
      if (selectedDate) {
        setActivityDate(selectedDate);
      } else {
        // Default to today if no date is selected
        setActivityDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [visible, selectedDate]);

  const resetForm = () => {
    setActivityName('');
    setStartTime('');
    setEndTime('');
    setDescription('');
    setActivityDate('');
  };

  const validateForm = () => {
    if (!activityName.trim()) {
      Alert.alert('Error', 'Activity name is required');
      return false;
    }
    if (!startTime.trim()) {
      Alert.alert('Error', 'Start time is required');
      return false;
    }
    if (!endTime.trim()) {
      Alert.alert('Error', 'End time is required');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    if (!activityDate) {
      Alert.alert('Error', 'Activity date is required');
      return false;
    }
    return true;
  };

  // Store activity in local storage
  const storeActivityLocally = async (newActivity) => {
    try {
      const storageKey = `${STORAGE_KEY}_${cropCalendar.id}`;
      const existingActivities = await AsyncStorage.getItem(storageKey);
      let activities = existingActivities ? JSON.parse(existingActivities) : {};
      
      // Group activities by date
      if (!activities[activityDate]) {
        activities[activityDate] = [];
      }
      
      // Check for duplicates before adding
      const isDuplicate = activities[activityDate].some(existing => 
        existing.activityName === newActivity.activityName &&
        existing.startTime === newActivity.startTime &&
        existing.endTime === newActivity.endTime &&
        existing.description === newActivity.description &&
        existing.date === newActivity.date
      );
      
      if (!isDuplicate) {
        activities[activityDate].push(newActivity);
        await AsyncStorage.setItem(storageKey, JSON.stringify(activities));
        console.log('Activity stored locally:', newActivity);
        console.log('All activities for crop:', activities);
        return true;
      } else {
        console.log('Duplicate activity detected, not storing:', newActivity);
        return true; // Return true to not block the process
      }
      
    } catch (error) {
      console.error('Error storing activity locally:', error);
      return false;
    }
  };

  const handleAddActivity = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Create activity object with unique local ID
      const localActivity = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        activityName: activityName.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        description: description.trim(),
        date: activityDate,
        cropCalendarId: cropCalendar.id,
        createdAt: new Date().toISOString(),
        isLocal: true, // Mark as locally stored
      };

      // Store locally first
      const localStored = await storeActivityLocally(localActivity);
      
      if (!localStored) {
        throw new Error('Failed to store activity locally');
      }

      // Try to sync with server (optional - can fail gracefully)
      try {
        const cleanedToken = userData.token.replace(/"/g, '');
        const payload = {
          activityName: activityName.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          description: description.trim(),
          date: activityDate,
        };

        const response = await fetch(
          `${BASE_URL}/farmer/cropcalendar/${cropCalendar.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': cleanedToken,
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          console.log('Activity synced with server:', responseData);
          
          // Update local activity with server ID if successful
          if (responseData.response?.id) {
            localActivity.serverId = responseData.response.id;
            localActivity.isLocal = false;
            await storeActivityLocally(localActivity);
          }
        } else {
          console.log('Server sync failed, activity stored locally only');
        }
      } catch (serverError) {
        console.error('Server sync error:', serverError);
        // Continue anyway - activity is stored locally
      }

      Alert.alert(
        'Success', 
        'Activity added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onActivityAdded();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error adding activity:', error);
      Alert.alert('Error', error.message || 'Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setActivityDate(formattedDate);
    setDatePickerVisible(false);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Add Activity</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Crop Info */}
                {cropCalendar && (
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropInfoTitle}>
                      {cropCalendar.projectName}
                    </Text>
                    <Text style={styles.cropInfoSubtitle}>
                      {cropCalendar.cropName} • {cropCalendar.cropType}
                    </Text>
                  </View>
                )}

                <ScrollView 
                  style={styles.formContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Activity Date */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Activity Date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setDatePickerVisible(true)}
                    >
                      <Text style={[styles.dateText, !activityDate && styles.placeholderText]}>
                        {formatDisplayDate(activityDate)}
                      </Text>
                      <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Activity Name */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Activity Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter activity name"
                      placeholderTextColor={colors.textSecondary}
                      value={activityName}
                      onChangeText={setActivityName}
                      returnKeyType="next"
                    />
                  </View>

                  {/* Time Inputs */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeInputContainer}>
                      <Text style={styles.label}>Start Time</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., 8am"
                        placeholderTextColor={colors.textSecondary}
                        value={startTime}
                        onChangeText={setStartTime}
                        returnKeyType="next"
                      />
                    </View>
                    <View style={styles.timeInputContainer}>
                      <Text style={styles.label}>End Time</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., 9am"
                        placeholderTextColor={colors.textSecondary}
                        value={endTime}
                        onChangeText={setEndTime}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="Enter activity description"
                      placeholderTextColor={colors.textSecondary}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      returnKeyType="done"
                      textAlignVertical="top"
                    />
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addButton, loading && styles.disabledButton]}
                    onPress={handleAddActivity}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.addButtonText}>Add Activity</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
          minimumDate={new Date()}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
  },
  modalContainer: {
    width: '90%',
    maxWidth: horizontalScale(400),
    maxHeight: '85%',
    alignSelf: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  cropInfo: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.background,
  },
  cropInfoTitle: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.text,
    fontFamily: 'Poppins-Medium',
  },
  cropInfoSubtitle: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: verticalScale(2),
    fontFamily: 'Poppins-Regular',
  },
  formContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    maxHeight: verticalScale(400),
  },
  inputContainer: {
    marginBottom: verticalScale(16),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputContainer: {
    flex: 1,
    marginBottom: verticalScale(16),
    marginRight: horizontalScale(8),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.text,
    marginBottom: verticalScale(8),
    fontFamily: 'Poppins-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    backgroundColor: colors.white,
  },
  textArea: {
    height: verticalScale(80),
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    marginRight: horizontalScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.text,
    fontFamily: 'Poppins-Medium',
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: verticalScale(12),
    marginLeft: horizontalScale(8),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.white,
    fontFamily: 'Poppins-Medium',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AddActivityModal;