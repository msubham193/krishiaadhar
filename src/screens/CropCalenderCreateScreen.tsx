/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';
import { Snackbar } from 'react-native-paper';
import { blue } from '../utils/Colors';
import { blue400 } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

// Define color palette for a professional look
const colors = {
  primary: '#2E7D32', // Green for agriculture theme
  secondary: '#4CAF50',
  background: '#F8FAFC',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  error: '#EF5350',
};

const cropTypeOptions = ['Cereal', 'Vegetable', 'Fruit', 'Pulses', 'Oilseeds'];
const seasonOptions = ['Rabi', 'Kharif', 'Zaid'];

const CropCalenderCreateScreen = ({ navigation }) => {
  const userData = useUserStore((state) => state.userData);
  const [step, setStep] = useState(1);
  const [createPending, setCreatePending] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropType, setCropType] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [season, setSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [seedVariety, setSeedVariety] = useState('');
  const [cropVariety, setCropVariety] = useState(''); // State for Crop Variety
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const slideOffset = useSharedValue(0);

  // Fetch location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await AsyncStorage.getItem('location');
        if (loc) {
          try {
            setLocation(JSON.parse(loc));
          } catch (e) {
            console.warn('Invalid location data in AsyncStorage');
          }
        }
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Failed to load location. Please try again.');
      }
    };
    fetchLocation();
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Validate form inputs
  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!projectTitle.trim()) {
        setError('Project Title is required');
        return false;
      }
      if (!projectDescription.trim()) {
        setError('Project Description is required');
        return false;
      }
    } else if (step === 2) {
      if (!cropName.trim()) {
        setError('Crop Name is required');
        return false;
      }
      if (!cropType) {
        setError('Crop Type is required');
        return false;
      }
      if (!fieldSize || isNaN(fieldSize) || parseFloat(fieldSize) <= 0) {
        setError('Field size should be a positive number');
        return false;
      }
      if (!location.trim()) {
        setError('Location is required');
        return false;
      }
      if (!season) {
        setError('Season is required');
        return false;
      }
      if (!startDate) {
        setError('Start Date is required');
        return false;
      }
      if (!seedVariety.trim()) {
        setError('Seed Variety is required');
        return false;
      }
      if (!cropVariety.trim()) { // Validation for Crop Variety
        setError('Crop Variety is required');
        return false;
      }
    }
    return true;
  };

  // Handle date picker
  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleConfirm = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setStartDate(formattedDate);
    }
    hideDatePicker();
    Keyboard.dismiss();
  };

  // Create crop calendar
  const createOwnCCR = async () => {
    if (!validateStep()) {
      setSnackbarVisible(true); // Show snackbar for validation errors
      return;
    }

    setCreatePending(true);

    try {
      if (!BASE_URL) {
        throw new Error('BASE_URL is not defined');
      }
      if (!userData?.token) {
        throw new Error('User token is not available. Please log in again.');
      }

      const payload = {
        projectName: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        cropName: cropName.trim(),
        cropType,
        fieldSize: parseFloat(fieldSize),
        location: location.trim(),
        seedVariety: seedVariety.trim(),
        cropVariety: cropVariety.trim(), // Include cropVariety in the payload
        season,
        startDate: new Date(startDate).toISOString(),
      };

      // Additional validation to catch issues before API call
      if (!payload.projectName || !payload.projectDescription || !payload.cropName || !payload.seedVariety || !payload.cropVariety || !payload.location) {
        throw new Error('All text fields must be non-empty.');
      }
      if (isNaN(payload.fieldSize) || payload.fieldSize <= 0) {
        throw new Error('Field size must be a positive number.');
      }
      // Ensure cropType and season match allowed options
      if (!cropTypeOptions.includes(payload.cropType)) {
        throw new Error(`Invalid crop type selected: ${payload.cropType}. Allowed: ${cropTypeOptions.join(', ')}`);
      }
      if (!seasonOptions.includes(payload.season)) {
        throw new Error(`Invalid season selected: ${payload.season}. Allowed: ${seasonOptions.join(', ')}`);
      }
      if (isNaN(new Date(startDate).getTime())) {
        throw new Error('Invalid start date.');
      }

      const cleanedToken = userData.token.replace(/"/g, '');
      const url = `${BASE_URL}/farmer/cropcalendar`;

      console.log('Request Payload:', JSON.stringify(payload, null, 2));
      console.log('Token:', cleanedToken);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json();
      console.log('Response:', JSON.stringify(responseBody, null, 2));

      if (!response.ok) {
        const errorMessage = responseBody.message || JSON.stringify(responseBody) || 'Unknown error';
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorMessage}`);
      }

      if (responseBody?.response?.id) {
        setSnackbarVisible(true);
        setError(''); // Clear any previous error on success
        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.navigate('Calendar', { id: responseBody.response.id });
          } else {
            console.warn('Navigation not available');
          }
        }, 1500);
      } else {
        throw new Error('Invalid response: No ID returned from server.');
      }
    } catch (error) {
      console.error('Error creating CCR:', error.message);
      setError(`Failed to create crop calendar: ${error.message}`);
      setSnackbarVisible(true);
    } finally {
      setCreatePending(false);
    }
  };

  // Navigation between steps
  const handleNextStep = () => {
    if (!validateStep()) {
      setSnackbarVisible(true); // Show snackbar for validation errors
      return;
    }
    if (step < 2) {
      slideOffset.value = withTiming(-400, { duration: 300 });
      setTimeout(() => {
        setStep(step + 1);
        slideOffset.value = withSpring(0, { damping: 20, stiffness: 90 });
        Keyboard.dismiss();
      }, 300);
    } else {
      createOwnCCR();
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      slideOffset.value = withTiming(400, { duration: 300 });
      setTimeout(() => {
        setStep(step - 1);
        slideOffset.value = withSpring(0, { damping: 20, stiffness: 90 });
        Keyboard.dismiss();
      }, 300);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        console.warn('Cannot go back');
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideOffset.value }],
  }));

  const renderDateInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Start Date</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={showDatePicker}
        activeOpacity={0.7}
      >
        <TextInput
          style={styles.textInput}
          placeholder="YYYY-MM-DD"
          value={startDate}
          editable={false}
          placeholderTextColor={colors.textSecondary}
        />
        <MaterialIcons name="calendar-today" size={24} color={blue} style={{ paddingHorizontal: horizontalScale(10) }} />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={new Date()}
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
      />
    </View>
  );

  const renderStepContent = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]}>
      {step === 1 && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Project Title</Text>
            <TextInput
              style={[styles.textInput, error.includes('Project Title') && styles.errorInput]}
              placeholder="Enter project title"
              placeholderTextColor={colors.textSecondary}
              value={projectTitle}
              onChangeText={(text) => {
                setProjectTitle(text);
                if (error.includes('Project Title')) setError('');
              }}
              returnKeyType="next"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Project Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, error.includes('Project Description') && styles.errorInput]}
              placeholder="Enter project description"
              placeholderTextColor={colors.textSecondary}
              value={projectDescription}
              onChangeText={(text) => {
                setProjectDescription(text);
                if (error.includes('Project Description')) setError('');
              }}
              multiline
              numberOfLines={4}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </View>
      )}
      {step === 2 && (
        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Crop Details</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Crop Name</Text>
            <TextInput
              style={[styles.textInput, error.includes('Crop Name') && styles.errorInput]}
              placeholder="Enter crop name"
              placeholderTextColor={colors.textSecondary}
              value={cropName}
              onChangeText={(text) => {
                setCropName(text);
                if (error.includes('Crop Name')) setError('');
              }}
              returnKeyType="next"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Crop Type</Text>
            <View style={[styles.pickerContainer, error.includes('Crop Type') && styles.errorInput]}>
              <Picker
                selectedValue={cropType}
                onValueChange={(value) => {
                  setCropType(value);
                  if (error.includes('Crop Type')) setError('');
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select crop type" value="" enabled={false} style={{ color: colors.textSecondary }} />
                {cropTypeOptions.map((type, index) => (
                  <Picker.Item key={index.toString()} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Field Size (acres)</Text>
            <TextInput
              style={[styles.textInput, error.includes('Field size') && styles.errorInput]}
              placeholder="Enter field size"
              placeholderTextColor={colors.textSecondary}
              value={fieldSize}
              onChangeText={(text) => {
                setFieldSize(text);
                if (error.includes('Field size')) setError('');
              }}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={[styles.textInput, error.includes('Location') && styles.errorInput]}
              placeholder="Enter location"
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                if (error.includes('Location')) setError('');
              }}
              returnKeyType="next"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Season</Text>
            <View style={[styles.pickerContainer, error.includes('Season') && styles.errorInput]}>
              <Picker
                selectedValue={season}
                onValueChange={(value) => {
                  setSeason(value);
                  if (error.includes('Season')) setError('');
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select season" value="" enabled={false} style={{ color: colors.textSecondary }} />
                {seasonOptions.map((type, index) => (
                  <Picker.Item key={index.toString()} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>
          {renderDateInput()}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Seed Variety</Text>
            <TextInput
              style={[styles.textInput, error.includes('Seed Variety') && styles.errorInput]}
              placeholder="Enter seed variety"
              placeholderTextColor={colors.textSecondary}
              value={seedVariety}
              onChangeText={(text) => {
                setSeedVariety(text);
                if (error.includes('Seed Variety')) setError('');
              }}
              returnKeyType="next"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Crop Variety</Text>
            <TextInput
              style={[styles.textInput, error.includes('Crop Variety') && styles.errorInput]}
              placeholder="Enter crop variety"
              placeholderTextColor={colors.textSecondary}
              value={cropVariety}
              onChangeText={(text) => {
                setCropVariety(text);
                if (error.includes('Crop Variety')) setError('');
              }}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <View style={{ height: verticalScale(100) }} />
        </ScrollView>
      )}
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalScale(40) : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackStep}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Crop Calendar</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicatorContainer}>
        <View style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step >= 1 ? styles.activeCircle : styles.inactiveCircle,
            ]}
          />
          <Text
            style={[
              styles.stepText,
              step >= 1 ? styles.activeStepText : styles.inactiveStepText,
            ]}
          >
            Project Details
          </Text>
        </View>
        <View
          style={[styles.line, step >= 2 ? styles.activeLine : styles.inactiveLine]}
        />
        <View style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step >= 2 ? styles.activeCircle : styles.inactiveCircle,
            ]}
          />
          <Text
            style={[
              styles.stepText,
              step >= 2 ? styles.activeStepText : styles.inactiveStepText,
            ]}
          >
            Crop Details
          </Text>
        </View>
      </View>

      {/* Form Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleBackStep}
            activeOpacity={0.7}
          >
            <MaterialIcons name="keyboard-arrow-left" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.nextButton, createPending && styles.disabledButton]}
          onPress={handleNextStep}
          activeOpacity={0.7}
          disabled={createPending}
        >
          {createPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.buttonText}>{step === 2 ? 'Create' : 'Next'}</Text>
              <MaterialIcons name="keyboard-arrow-right" size={24} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[styles.snackbar, error ? { backgroundColor: colors.error } : { backgroundColor: colors.secondary }]}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error ? error : 'Crop calendar created successfully!'}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  buttonText:{
    color:colors.white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blue,
    paddingTop: verticalScale(Platform.OS === 'ios' ? 40 : 30),
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: horizontalScale(20),
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: horizontalScale(12),
    height: verticalScale(12),
    borderRadius: moderateScale(6),
    marginBottom: verticalScale(8),
  },
  activeCircle: {
    backgroundColor: blue,
  },
  inactiveCircle: {
    backgroundColor: colors.border,
  },
  stepText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  activeStepText: {
    color: blue,
    fontWeight: '500',
  },
  inactiveStepText: {
    color: colors.textSecondary,
  },
  line: {
    flex: 1,
    height: verticalScale(2),
    marginHorizontal: horizontalScale(8),
  },
  activeLine: {
    backgroundColor: blue,
  },
  inactiveLine: {
    backgroundColor: colors.border,
  },
  stepContent: {
    flex: 1,
    width: '100%',
  },
  formContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    marginBottom: verticalScale(16),
    fontFamily: 'Poppins-SemiBold',
  },
  inputContainer: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(14),
    color: colors.text,
    marginBottom: verticalScale(8),
    fontFamily: 'Poppins-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    backgroundColor: colors.white,
  },
  textArea: {
    height: verticalScale(100),
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
    fontFamily: 'Poppins-Regular',
  },
  errorInput: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nextButton: {
    backgroundColor: blue,
    marginLeft: horizontalScale(8),
  },
  backButton: {
    backgroundColor: colors.textSecondary,
    marginRight: horizontalScale(8),
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.7,
  },
  errorContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: colors.error,
    marginHorizontal: horizontalScale(20),
    borderRadius: moderateScale(8),
    marginVertical: verticalScale(8),
  },
  errorText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
  },
  snackbar: {
    marginHorizontal: horizontalScale(20),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(10), // Adjust if needed to not overlap buttons
  },
});

export default CropCalenderCreateScreen;