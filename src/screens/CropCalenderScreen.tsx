/* eslint-disable react/self-closing-comp */
/* eslint-disable eqeqeq */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  Platform,
  Modal,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { FlatList } from 'react-native-gesture-handler';
import CropDetailCard from '../components/CropDetails';
import { Snackbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/Constants';

const blue = '#2563EB';
const lightBlue = '#BFDBFE';
const cropTypeOptions = ['Cereal', 'Vegetable', 'Fruit', 'Pulses', 'Oilseeds'];
const seasonOptions = ['Rabi', 'Kharif', 'Zaid'];

const CropCalendarScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('createNew');
  const [searchText, setSearchText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropType, setCropType] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [location, setLocation] = useState('');
  const [season, setSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [seedVariety, setSeedVariety] = useState('');
  const [modalType, setModalType] = useState(1); // 1: Create New, 2: Request Crop Calendar
  const [step, setStep] = useState(1);
  const [ccrData, setCcrData] = useState([]);
  const [createPending, setCreatePending] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const slideOffset = useSharedValue(0);
  const modalOpacity = useSharedValue(0);

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideOffset.value }],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  // Fetch token and location on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData?.token) {
            setToken(parsedData.token);
          }
        }
        const loc = await AsyncStorage.getItem('location');
        if (loc) {
          try {
            setLocation(JSON.parse(loc));
          } catch (e) {
            console.warn('Invalid location data in AsyncStorage');
          }
        }
      } catch (err) {
        console.error('Error fetching token/location:', err);
        setError('Failed to load user data. Please try again.');
      }
    };
    fetchToken();
  }, []);

  // Fetch crop calendar data
  useEffect(() => {
    if (token) {
      fetchCCR();
    }
  }, [token]);

  const fetchCCR = async () => {
    try {
      const cleanedToken = token.replace(/"/g, '');
      if (!BASE_URL) {
        throw new Error('BASE_URL is not defined');
      }
      const response = await fetch(`${BASE_URL}/farmer/cropcalendar/all`, {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      setCcrData(Array.isArray(result?.response) ? result.response : []);
    } catch (error) {
      console.error('Error fetching CCR:', error);
      setError('Failed to load crop calendars. Please try again.');
    }
  };

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

  // Modal animation
  useEffect(() => {
    modalOpacity.value = withTiming(modalVisible ? 1 : 0, { duration: 200 });
  }, [modalVisible]);

  // Date picker handlers
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

  // Validate form inputs
  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (selectedOption === 'createNew') {
        return true;
      } else if (selectedOption === 'selectExisting' && !searchText.trim()) {
        setError('Please enter a search term');
        return false;
      }
    } else if (step === 2) {
      if (!projectTitle.trim()) {
        setError('Project Title is required');
        return false;
      }
      if (!projectDescription.trim()) {
        setError('Project Description is required');
        return false;
      }
    } else if (step === 3 && modalType === 1) {
      if (!cropName.trim()) {
        setError('Crop Name is required');
        return false;
      }
      if (!cropType) {
        setError('Crop Type is required');
        return false;
      }
      if (!fieldSize || isNaN(fieldSize) || parseFloat(fieldSize) <= 0) {
        setError('Valid Field Size is required');
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
    }
    return true;
  };

  // Create crop calendar
  const createOwnCCR = async () => {
    if (!validateStep()) return;
    setCreatePending(true);
    try {
      const url = `${BASE_URL}/farmer/cropcalendar`;
      const startDateISO = new Date(startDate).toISOString();
      const data = {
        projectName: projectTitle,
        projectDescription,
        cropName,
        cropType,
        fieldSize: parseFloat(fieldSize),
        location,
        cropVariety: seedVariety,
        season,
        startDate: startDateISO,
      };
      const cleanedToken = token.replace(/"/g, '');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      if (result?.response?.id) {
        setSnackbarVisible(true);
        setModalVisible(false);
        setTimeout(() => {
          navigation.navigate('Calendar', { id: result.response.id });
        }, 1500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating CCR:', error);
      setError('Failed to create crop calendar. Please try again.');
    } finally {
      setCreatePending(false);
    }
  };

  // Navigation between steps
  const handleNextStep = () => {
    if (!validateStep()) return;
    if (step < 3) {
      slideOffset.value = withTiming(-400, { duration: 200 });
      setTimeout(() => {
        setStep(step + 1);
        slideOffset.value = withTiming(0, { duration: 200 });
        setKeyboardVisible(false);
      }, 200);
    } else {
      if (modalType === 1) {
        createOwnCCR();
      } else {
        setModalVisible(false);
        if (navigation.canGoBack()) {
          navigation.navigate('CropList');
        } else {
          console.warn('CropList navigation not available');
        }
      }
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      slideOffset.value = withTiming(400, { duration: 200 });
      setTimeout(() => {
        setStep(step - 1);
        slideOffset.value = withTiming(0, { duration: 200 });
        setKeyboardVisible(false);
      }, 200);
    } else {
      setModalVisible(false);
    }
  };

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
          placeholderTextColor="#6B7280"
        />
        <MaterialIcons name="calendar-today" size={24} color={blue} />
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
          <Text style={styles.sectionTitle}>Select Option</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'createNew' && styles.selectedOption,
              ]}
              onPress={() => setSelectedOption('createNew')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === 'createNew' && styles.selectedText,
                ]}
              >
                Create New
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'selectExisting' && styles.selectedOption,
              ]}
              onPress={() => setSelectedOption('selectExisting')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === 'selectExisting' && styles.selectedText,
                ]}
              >
                Select Existing
              </Text>
            </TouchableOpacity>
          </View>
          {selectedOption === 'selectExisting' && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={24} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search project"
                  placeholderTextColor="#6B7280"
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    if (error.includes('search term')) setError('');
                  }}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
              {searchText ? (
                <Text style={styles.searchHint}>
                  Search results for: {searchText}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      )}
      {step === 2 && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Project Title</Text>
            <TextInput
              style={[styles.textInput, error.includes('Project Title') && styles.errorInput]}
              placeholder="Enter project title"
              placeholderTextColor="#6B7280"
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
              placeholderTextColor="#6B7280"
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
      {step === 3 && modalType === 1 && (
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
              placeholderTextColor="#6B7280"
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
                <Picker.Item label="Select crop type" value="" enabled={false} />
                {cropTypeOptions.map((type, index) => (
                  <Picker.Item key={index.toString()} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Field Size (acres)</Text>
            <TextInput
              style={[styles.textInput, error.includes('Field Size') && styles.errorInput]}
              placeholder="Enter field size"
              placeholderTextColor="#6B7280"
              value={fieldSize}
              onChangeText={(text) => {
                setFieldSize(text);
                if (error.includes('Field Size')) setError('');
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
              placeholderTextColor="#6B7280"
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
                <Picker.Item label="Select season" value="" enabled={false} />
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
              placeholderTextColor="#6B7280"
              value={seedVariety}
              onChangeText={(text) => {
                setSeedVariety(text);
                if (error.includes('Seed Variety')) setError('');
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

  const renderItem = ({ item }) => (
    <Animated.View style={styles.itemContainer} entering={FadeIn.duration(200)}>
      {CropDetailCard ? (
        <CropDetailCard crop={item} />
      ) : (
        <Text style={styles.errorText}>CropDetailCard component not available</Text>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[blue, '#1E40AF']} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : console.warn('Cannot go back')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Calendar</Text>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View entering={FadeIn.duration(200)}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.navigate('createCropCalendar', { type: 'CREATE' });
                } else {
                  console.warn('createCropCalendar navigation not available');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.createButtonText}>Create a Crop Calendar</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(200).delay(100)}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setModalType(2);
                setModalVisible(true);
                setStep(1);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.createButtonText}>Request Crop Calendar</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(200).delay(200)}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.navigate('yourcropcalendar');
                } else {
                  console.warn('yourcropcalendar navigation not available');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.createButtonText}>Your Crop Calendar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Floating Action Button */}
        {ccrData.length > 0 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => {
                setModalType(1);
                setModalVisible(true);
                setStep(1);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Modal for Create/Request */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Animated.View style={[styles.modalOverlay, modalAnimatedStyle]}>
          <LinearGradient colors={[blue, '#1E40AF']} style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalType === 1 ? 'Create a New Project' : 'Request Crop Calendar'}
            </Text>
          </LinearGradient>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
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
                    Category
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
                    Details
                  </Text>
                </View>
                <View
                  style={[styles.line, step >= 3 ? styles.activeLine : styles.inactiveLine]}
                />
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      step >= 3 ? styles.activeCircle : styles.inactiveCircle,
                    ]}
                  />
                  <Text
                    style={[
                      styles.stepText,
                      step >= 3 ? styles.activeStepText : styles.inactiveStepText,
                    ]}
                  >
                    Creation
                  </Text>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {renderStepContent()}

              {/* Navigation Buttons */}
              {!isKeyboardVisible && (
                <View style={styles.modalButtonContainer}>
                  {step > 1 && (
                    <Animated.View entering={FadeIn.duration(200)}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.backButton]}
                        onPress={handleBackStep}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="keyboard-arrow-left" size={24} color="#FFFFFF" />
                        <Text style={styles.modalButtonText}>Back</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                  <Animated.View entering={FadeIn.duration(200)}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.nextButton, createPending && styles.disabledButton]}
                      onPress={handleNextStep}
                      activeOpacity={0.7}
                      disabled={createPending}
                    >
                      {createPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.modalButtonText}>
                            {step === 3 ? (modalType === 1 ? 'Create' : 'Request') : 'Next'}
                          </Text>
                          <MaterialIcons name="keyboard-arrow-right" size={24} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        Crop Calendar Created Successfully
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: verticalScale(Platform.OS === 'ios' ? 40 : 40),
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
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: horizontalScale(20),
    paddingTop: verticalScale(16),
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: moderateScale(16),
    color: '#1F2937',
    marginBottom: verticalScale(16),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingVertical: verticalScale(16),
    gap: verticalScale(12),
    height: '100%',

    // alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: blue,
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(16),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  createButtonText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  floatingButton: {
    position: 'absolute',
    bottom: verticalScale(20),
    right: horizontalScale(20),
    backgroundColor: blue,
    width: horizontalScale(56),
    height: verticalScale(56),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: verticalScale(Platform.OS === 'ios' ? 40 : 20),
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: horizontalScale(10),
    height: verticalScale(10),
    borderRadius: moderateScale(5),
    marginBottom: verticalScale(8),
  },
  activeCircle: {
    backgroundColor: blue,
  },
  inactiveCircle: {
    backgroundColor: '#D1D5DB',
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
    color: '#6B7280',
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
    backgroundColor: '#D1D5DB',
  },
  stepContent: {
    flex: 1,
    width: '100%',
  },
  formContainer: {
    paddingVertical: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: verticalScale(16),
    fontFamily: 'Poppins-SemiBold',
  },
  inputContainer: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(14),
    color: '#1F2937',
    marginBottom: verticalScale(8),
    fontFamily: 'Poppins-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    fontSize: moderateScale(14),
    color: '#1F2937',
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: verticalScale(100),
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    paddingRight: horizontalScale(12),
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    color: '#1F2937',
    fontFamily: 'Poppins-Regular',
  },
  errorInput: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: horizontalScale(12),
  },
  optionButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(16),
    borderRadius: moderateScale(10),
    backgroundColor: lightBlue,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  selectedOption: {
    backgroundColor: blue,
  },
  optionText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  selectedText: {
    fontWeight: '600',
  },
  searchContainer: {
    marginTop: verticalScale(16),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    paddingHorizontal: horizontalScale(12),
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: '#1F2937',
    fontFamily: 'Poppins-Regular',
  },
  searchHint: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  itemContainer: {
    marginBottom: verticalScale(12),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  flatListContent: {
    paddingBottom: verticalScale(80),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  nextButton: {
    backgroundColor: blue,
    marginLeft: horizontalScale(8),
  },
  backButton: {
    backgroundColor: '#6B7280',
    marginRight: horizontalScale(8),
  },
  disabledButton: {
    backgroundColor: '#6B7280',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Medium',
    marginHorizontal: horizontalScale(4),
  },
  errorContainer: {
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: '#EF4444',
    marginHorizontal: horizontalScale(20),
    borderRadius: moderateScale(10),
    marginVertical: verticalScale(8),
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
  },
  snackbar: {
    backgroundColor: blue,
    marginHorizontal: horizontalScale(20),
    borderRadius: moderateScale(10),
  },
});

export default CropCalendarScreen;