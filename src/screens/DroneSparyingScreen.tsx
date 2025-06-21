/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import { blue } from '../utils/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // For calendar icon and dropdown arrow
import DateTimePickerModal from 'react-native-modal-datetime-picker'; // For date selection
import { Snackbar } from 'react-native-paper'; // For user feedback messages
import { BASE_URL } from '../utils/Constants'; // Assuming this constant exists
import { useUserStore } from '../zustand/store'; // Assuming your user store handles token
import { Picker } from '@react-native-picker/picker'; // Import Picker for dropdown

// Define the enum options for cropType
const cropTypeOptions = ['Cereal', 'Vegetable', 'Fruit', 'Pulses', 'Oilseeds'];

const DroneSprayingScreen = ({ navigation }) => {
  // State variables for form inputs
  const [farmLocation, setFarmLocation] = useState('');
  const [cropType, setCropType] = useState(''); // This will now hold the selected crop type
  const [areaInHectares, setAreaInHectares] = useState('');
  const [sprayDate, setSprayDate] = useState(''); // Stores formatted date string
  const [query, setQuery] = useState('');

  // State variables for UI feedback and API handling
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Get user data (including token) from Zustand store
  const userData = useUserStore((state) => state.userData);

  // Close snackbar after a delay
  useEffect(() => {
    if (snackbarVisible) {
      const timer = setTimeout(() => {
        setSnackbarVisible(false);
      }, 3000); // Snackbar will disappear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [snackbarVisible]);

  // Validation function for all form fields
  const validateForm = () => {
    setError(''); // Clear previous errors
    if (!farmLocation.trim()) {
      setError('Farm Location is required.');
      return false;
    }
    // Validate cropType against the predefined options
    if (!cropType || !cropTypeOptions.includes(cropType)) {
      setError('Please select a valid Crop Type.');
      return false;
    }
    const parsedArea = parseFloat(areaInHectares);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setError('Area in Hectares must be a positive number.');
      return false;
    }
    if (!sprayDate) {
      setError('Spray Date is required.');
      return false;
    }
    if (!query.trim()) {
      setError('Query is required.');
      return false;
    }
    return true;
  };

  // Handle date picker visibility
  const showDatePicker = () => {
    setDatePickerVisible(true);
    Keyboard.dismiss(); // Dismiss keyboard when date picker opens
  };
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleConfirmDate = (date) => {
    // Format the date to YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    setSprayDate(formattedDate);
    hideDatePicker();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbarVisible(true); // Show snackbar if validation fails
      return;
    }

    setSubmitPending(true); // Show loading indicator

    try {
      if (!BASE_URL) {
        throw new Error('BASE_URL is not defined in Constants.js');
      }
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const payload = {
        farmLocation: farmLocation.trim(),
        cropType: cropType, // Use the directly selected enum value
        areaInHectares: parseFloat(areaInHectares),
        sprayDate: new Date(sprayDate).toISOString(), // Convert to ISO string
        query: query.trim(),
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      // Remove potential quotes from token if it's stringified
      const cleanedToken = userData.token.replace(/"/g, '');

      const response = await fetch(`${BASE_URL}/farmer/service/drone-spraying`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('API Response:', JSON.stringify(responseData, null, 2));

      if (response.ok) {
        setError(''); // Clear error on success
        setSnackbarVisible(false);
        navigation.navigate('SubmissionSuccess', {
          message: 'Your drone spraying request has been successfully placed!',
          navigateBackTo: 'Main', // Changed to 'Main' for consistency and better navigation
        });

        // Optionally reset form fields here if desired, but navigation will likely unmount this component
        setFarmLocation('');
        setCropType('');
        setAreaInHectares('');
        setSprayDate('');
        setQuery('');
      } else {
        const errorMessage = responseData.message || responseData.error || 'Unknown error occurred.';
        throw new Error(`Failed to submit request: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setSnackbarVisible(true);
    } finally {
      setSubmitPending(false); // Hide loading indicator
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalScale(40) : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={moderateScale(25)} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drone Spraying Service</Text>
      </View>

      <ScrollView
        style={styles.formScrollView}
        contentContainerStyle={styles.formContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Important for Picker/DatePicker
      >
        {/* Farm Location */}
        <Text style={styles.label}>Farm Location</Text>
        <TextInput
          style={[styles.input, error.includes('Farm Location') && styles.errorInput]}
          value={farmLocation}
          onChangeText={(text) => {
            setFarmLocation(text);
            if (error.includes('Farm Location')) setError('');
          }}
          placeholder="Enter farm location"
          placeholderTextColor="gray"
          returnKeyType="next"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {/* Crop Type - Now a Dropdown */}
        <Text style={styles.label}>Crop Type</Text>
        <View style={[styles.pickerContainer, error.includes('Crop Type') && styles.errorInput]}>
          <Picker
            selectedValue={cropType}
            onValueChange={(itemValue) => {
              setCropType(itemValue);
              if (error.includes('Crop Type')) setError('');
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select Crop Type" value="" enabled={false} style={{ color: 'gray' }} />
            {cropTypeOptions.map((type, index) => (
              <Picker.Item key={index.toString()} label={type} value={type} />
            ))}
          </Picker>
          {/* <MaterialIcons name="arrow-drop-down" size={moderateScale(24)} color="#333" style={styles.dropdownArrow} /> */}
        </View>

        {/* Area in Hectares */}
        <Text style={styles.label}>Area in Hectares</Text>
        <TextInput
          style={[styles.input, error.includes('Area in Hectares') && styles.errorInput]}
          value={areaInHectares}
          onChangeText={(text) => {
            setAreaInHectares(text);
            if (error.includes('Area in Hectares')) setError('');
          }}
          placeholder="Enter area in hectares"
          placeholderTextColor="gray"
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {/* Spray Date Input with DatePicker */}
        <Text style={styles.label}>Spray Date</Text>
        <TouchableOpacity
          style={styles.dateInputContainer}
          onPress={showDatePicker}
          activeOpacity={0.7}
        >
          <TextInput
            style={styles.dateTextInput}
            placeholder="YYYY-MM-DD"
            value={sprayDate}
            editable={false} // Make it read-only so date picker is the only input method
            placeholderTextColor="gray"
          />
          <MaterialIcons name="calendar-today" size={moderateScale(24)} color={blue} />
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          minimumDate={new Date()} // Prevent picking past dates
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
        />

        {/* Query */}
        <Text style={styles.label}>Query</Text>
        <TextInput
          style={[styles.input, styles.textArea, error.includes('Query') && styles.errorInput]}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (error.includes('Query')) setError('');
          }}
          placeholder="Enter your query or specific instructions"
          placeholderTextColor="gray"
          multiline
          numberOfLines={4}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitPending && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitPending}
          activeOpacity={0.7}
        >
          {submitPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Snackbar for messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        style={[styles.snackbar, error ? styles.snackbarError : styles.snackbarSuccess]}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error ? error : 'Drone spraying request submitted successfully!'}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light background for the whole screen
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blue,
    elevation: 5,
    height: verticalScale(80),
    paddingTop: verticalScale(Platform.OS === 'ios' ? 40 : 30),
    paddingHorizontal: horizontalScale(16), // Consistent padding
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    paddingRight: horizontalScale(10), // Space for the arrow
  },
  headerTitle: {
    flex: 1, // Allows title to take available space and center
    fontSize: moderateScale(18),
    textAlign: 'center',
    color: 'white',
    fontFamily: 'Poppins-Medium',
    marginRight: moderateScale(30), // Compensate for back button width
  },
  formScrollView: {
    flex: 1,
  },
  formContentContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(30),
  },
  label: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(8),
    color: '#333', // Darker text for labels
    fontFamily: 'Poppins-Regular',
  },
  input: {
    height: verticalScale(45), // Slightly taller input
    borderColor: '#CCC', // Lighter border color
    borderWidth: 1,
    borderRadius: moderateScale(8), // Rounded corners
    paddingHorizontal: horizontalScale(12),
    marginBottom: verticalScale(16), // More space between fields
    fontSize: moderateScale(14),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    backgroundColor: 'white', // White background for inputs
  },
  textArea: {
    height: verticalScale(100), // Larger height for query
    textAlignVertical: 'top', // Text starts from top
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(45),
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    marginBottom: verticalScale(16),
    backgroundColor: 'white',
  },
  dateTextInput: {
    flex: 1, // Takes up remaining space
    fontSize: moderateScale(14),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    paddingVertical: 0, // Remove default vertical padding
  },
  pickerContainer: { // Style for Picker wrapper to make it look like an input field
    flexDirection: 'row', // Added to place picker and icon side-by-side
    alignItems: 'center', // Align items vertically in the center
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(16),
    backgroundColor: 'white',
    // overflow: 'hidden', // Keep this if default picker arrow causes issues
  },
  picker: {
    flex: 1, // Allow picker to take up available space
    height: verticalScale(50),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    backgroundColor: 'transparent', // Make picker background transparent so container's white shows
  },
  dropdownArrow: { // Style for the explicit dropdown arrow icon
    paddingRight: horizontalScale(12), // Padding on the right for spacing
  },
  submitButton: {
    backgroundColor: blue,
    borderRadius: moderateScale(10), // More rounded button
    paddingVertical: verticalScale(14), // Taller button
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(30), // More margin before button
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  submitButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold', // Bolder text for button
  },
  disabledButton: {
    backgroundColor: '#A0A0A0', // Grey out when disabled
    opacity: 0.7,
  },
  snackbar: {
    marginHorizontal: horizontalScale(20),
    marginBottom: verticalScale(10), // Space from bottom
    borderRadius: moderateScale(8),
  },
  snackbarSuccess: {
    backgroundColor: 'green',
  },
  snackbarError: {
    backgroundColor: 'red',
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 1.5,
  }
});

export default DroneSprayingScreen;