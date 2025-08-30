/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable comma-dangle */
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
  Modal,
  FlatList,
  Alert,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';
import { Snackbar } from 'react-native-paper';
import { blue } from '../utils/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  mapOverlay: 'rgba(76, 175, 80, 0.3)',
  geofenceStroke: '#2E7D32',
  coordinatePoint: '#FF5722',
};

const cropTypeOptions = ['Cereal', 'Vegetable', 'Fruit', 'Pulses', 'Oilseeds'];
const seasonOptions = ['Rabi', 'Kharif', 'Zaid'];

const CropCalenderCreateScreen = ({ navigation }) => {
  const userData = useUserStore((state) => state.userData);
  const [createPending, setCreatePending] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropType, setCropType] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [season, setSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seedVariety, setSeedVariety] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState('');
  const [newActivityDate, setNewActivityDate] = useState('');
  const [isActivityDatePickerVisible, setActivityDatePickerVisible] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(null);

  // Info popup state
  const [infoPopupVisible, setInfoPopupVisible] = useState(false);

  // Location and Map related states
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [geofenceCoordinates, setGeofenceCoordinates] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLocation, setAddressLocation] = useState('');

  // States for custom dropdowns
  const [cropTypeModalVisible, setCropTypeModalVisible] = useState(false);
  const [seasonModalVisible, setSeasonModalVisible] = useState(false);

  // Show info popup when component mounts
  useEffect(() => {
    setInfoPopupVisible(true);
  }, []);

  // Request location permission for Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CropCalendarApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const address = data.address;
          let locationString = '';

          if (address.village || address.town || address.city) {
            locationString += address.village || address.town || address.city;
          }
          if (address.state_district || address.county) {
            locationString += locationString ? ', ' + (address.state_district || address.county) : (address.state_district || address.county);
          }
          if (address.state) {
            locationString += locationString ? ', ' + address.state : address.state;
          }
          if (address.country) {
            locationString += locationString ? ', ' + address.country : address.country;
          }

          if (!locationString && data.display_name) {
            const parts = data.display_name.split(',');
            locationString = parts.slice(0, 3).join(', ');
          }

          return locationString || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  // Get current location using GPS
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to use this feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLocationLoading(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });

        const address = await reverseGeocode(latitude, longitude);
        setAddressLocation(address);
        setLocation(address);

        setLocationLoading(false);

        setMapModalVisible(true);

        Alert.alert(
          'Location Found',
          `📍 ${address}\n\nYou can now draw geofencing boundaries on the map.`,
          [{ text: 'OK' }]
        );
      },
      (error) => {
        console.log('Location error:', error);
        setLocationLoading(false);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please ensure location services are enabled.',
          [{ text: 'OK' }]
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  };

  // Generate HTML for OpenStreetMap with Leaflet
  const generateMapHTML = () => {
    const { latitude, longitude } = currentLocation || { latitude: 20.2961, longitude: 85.8245 };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Geofencing Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            #map { height: 100vh; width: 100vw; }
            .info-panel {
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                font-size: 14px;
            }
            .controls {
                position: absolute;
                bottom: 20px;
                left: 10px;
                right: 10px;
                display: flex;
                gap: 10px;
                z-index: 1000;
            }
            .btn {
                flex: 1;
                padding: 12px;
                background: #2E7D32;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
            }
            .btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .btn-secondary {
                background: #FF5722;
            }
            .coordinate-list {
                max-height: 80px;
                overflow-y: auto;
                margin-top: 8px;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="info-panel">
            <div><strong>📍 Location:</strong> ${addressLocation || 'Loading...'}</div>
            <div><strong>🎯 Geofence Points:</strong> <span id="pointCount">0/4</span></div>
            <div><strong>📐 Area:</strong> <span id="area">0 acres</span></div>
            <div class="coordinate-list" id="coordinateList"></div>
        </div>
        
        <div id="map"></div>
        
        <div class="controls">
            <button class="btn btn-secondary" onclick="clearGeofence()">Clear All</button>
            <button class="btn" id="applyBtn" onclick="applyGeofence()" disabled>Apply Geofence</button>
        </div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            let map;
            let markers = [];
            let polygon = null;
            let coordinates = [];
            
            function initMap() {
                map = L.map('map').setView([${latitude}, ${longitude}], 16);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(map);
                
                L.marker([${latitude}, ${longitude}])
                    .addTo(map)
                    .bindPopup('📍 Current Location')
                    .openPopup();
                
                map.on('click', function(e) {
                    if (coordinates.length < 4) {
                        addPoint(e.latlng.lat, e.latlng.lng);
                    } else {
                        alert('Maximum 4 points allowed for geofencing!');
                    }
                });
            }
            
            function addPoint(lat, lng) {
                const marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF5722"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                    })
                }).addTo(map);
                
                markers.push(marker);
                coordinates.push([lat, lng]);
                
                updateGeofence();
                updateUI();
            }
            
            function updateGeofence() {
                if (polygon) {
                    map.removeLayer(polygon);
                }
                
                if (coordinates.length >= 3) {
                    polygon = L.polygon(coordinates, {
                        color: '#2E7D32',
                        fillColor: '#4CAF50',
                        fillOpacity: 0.3,
                        weight: 2
                    }).addTo(map);
                    
                    if (coordinates.length >= 3) {
                        map.fitBounds(polygon.getBounds(), { padding: [20, 20] });
                    }
                }
            }
            
            function calculateArea(coords) {
                if (coords.length < 3) return 0;
                
                let area = 0;
                const n = coords.length;
                
                for (let i = 0; i < n; i++) {
                    const j = (i + 1) % n;
                    area += coords[i][0] * coords[j][1];
                    area -= coords[j][0] * coords[i][1];
                }
                
                area = Math.abs(area) / 2;
                
                const areaInSqMeters = area * 111320 * 111320;
                const areaInAcres = areaInSqMeters / 4046.86;
                
                return areaInAcres;
            }
            
            function updateUI() {
                document.getElementById('pointCount').textContent = coordinates.length + '/4';
                
                if (coordinates.length >= 3) {
                    const area = calculateArea(coordinates);
                    document.getElementById('area').textContent = area.toFixed(2) + ' acres';
                    document.getElementById('applyBtn').disabled = false;
                } else {
                    document.getElementById('area').textContent = '0 acres';
                    document.getElementById('applyBtn').disabled = true;
                }
                
                const listElement = document.getElementById('coordinateList');
                listElement.innerHTML = coordinates.map((coord, index) => 
                    '<div>Point ' + (index + 1) + ': ' + coord[0].toFixed(6) + ', ' + coord[1].toFixed(6) + '</div>'
                ).join('');
            }
            
            function clearGeofence() {
                markers.forEach(marker => map.removeLayer(marker));
                if (polygon) map.removeLayer(polygon);
                
                markers = [];
                coordinates = [];
                polygon = null;
                
                updateUI();
            }
            
            function applyGeofence() {
                if (coordinates.length < 3) {
                    alert('Please add at least 3 points to create a geofence.');
                    return;
                }
                
                const area = calculateArea(coordinates);
                const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
                const centerLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
                
                const result = {
                    coordinates: coordinates.map(coord => ({ latitude: coord[0], longitude: coord[1] })),
                    area: area.toFixed(2),
                    center: { latitude: centerLat, longitude: centerLng },
                    location: '${addressLocation}'
                };
                
                window.ReactNativeWebView.postMessage(JSON.stringify(result));
            }
            
            document.addEventListener('DOMContentLoaded', function() {
                initMap();
            });
        </script>
    </body>
    </html>
    `;
  };

  // Handle message from WebView (map)
  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.coordinates && data.area) {
        setGeofenceCoordinates(data.coordinates);
        setFieldSize(data.area);

        const locationString = `${data.location} (Geofenced: ${data.coordinates.length} points)`;
        setLocation(locationString);

        setMapModalVisible(false);

        Alert.alert(
          'Geofence Applied Successfully! 🎉',
          `✅ ${data.coordinates.length} boundary points set\n📐 Area: ${data.area} acres\n📍 Location: ${data.location}\n\n⚡ Field size has been automatically updated.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

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

  // Validate form inputs
  const validateForm = () => {
    setError('');

    if (!projectTitle.trim()) {
      setError('Project Title is required');
      return false;
    }
    if (!projectDescription.trim()) {
      setError('Project Description is required');
      return false;
    }
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
    if (!endDate) {
      setError('End Date is required');
      return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End Date must be after Start Date');
      return false;
    }
    if (!seedVariety.trim()) {
      setError('Seed Variety is required');
      return false;
    }
    if (!cropVariety.trim()) {
      setError('Crop Variety is required');
      return false;
    }
    if (activities.length > 0) {
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        if (!activity.name.trim()) {
          setError(`Activity ${i + 1} name is required`);
          return false;
        }
        if (!activity.date) {
          setError(`Activity ${i + 1} date is required`);
          return false;
        }
        const activityDate = new Date(activity.date);
        if (activityDate < new Date(startDate) || activityDate > new Date(endDate)) {
          setError(`Activity ${i + 1} date must be within the date range`);
          return false;
        }
      }
    }

    return true;
  };

  // Handle date picker
  const showDatePicker = (mode) => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => setDatePickerVisible(false);

  const handleConfirm = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      if (datePickerMode === 'start') {
        setStartDate(formattedDate);
        if (endDate && new Date(formattedDate) >= new Date(endDate)) {
          setEndDate('');
        }
      } else {
        setEndDate(formattedDate);
      }
    }
    hideDatePicker();
    Keyboard.dismiss();
  };

  // Handle activity date picker
  const showActivityDatePicker = (index) => {
    setCurrentActivityIndex(index);
    setActivityDatePickerVisible(true);
  };

  const hideActivityDatePicker = () => {
    setActivityDatePickerVisible(false);
    setCurrentActivityIndex(null);
  };

  const handleActivityDateConfirm = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      if (currentActivityIndex === null) {
        setNewActivityDate(formattedDate);
      } else {
        const updatedActivities = [...activities];
        updatedActivities[currentActivityIndex] = {
          ...updatedActivities[currentActivityIndex],
          date: formattedDate,
        };
        setActivities(updatedActivities);
      }
    }
    hideActivityDatePicker();
    Keyboard.dismiss();
  };

  // Add new activity
  const addActivity = () => {
    if (!newActivity.trim()) {
      setError('Activity name is required');
      setSnackbarVisible(true);
      return;
    }
    if (!newActivityDate) {
      setError('Activity date is required');
      setSnackbarVisible(true);
      return;
    }
    const activityDate = new Date(newActivityDate);
    if (activityDate < new Date(startDate) || activityDate > new Date(endDate)) {
      setError('Activity date must be within the date range');
      setSnackbarVisible(true);
      return;
    }

    setActivities([...activities, { name: newActivity.trim(), date: newActivityDate }]);
    setNewActivity('');
    setNewActivityDate('');
    setError('');
  };

  // Delete activity
  const deleteActivity = (index) => {
    const updatedActivities = activities.filter((_, i) => i !== index);
    setActivities(updatedActivities);
  };

  // Info Popup Component
  const renderInfoPopup = () => (
    <Modal
      visible={infoPopupVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setInfoPopupVisible(false)}
    >
      <View style={styles.infoModalOverlay}>
        <View style={styles.infoModalContent}>
          <View style={styles.infoModalHeader}>
            <Ionicons name="information-circle" size={32} color={blue} />
            <Text style={styles.infoModalTitle}>Important Information</Text>
          </View>

          <View style={styles.infoModalBody}>
            <Text style={styles.infoModalText}>
              📅 Create your crop calendar with a date range and add activities now.
            </Text>
            <Text style={styles.infoModalText}>
              ✅ You can add multiple activities with specific dates within the calendar's date range.
            </Text>
            <Text style={styles.infoModalText}>
              🎯 Fill in all required details to create your complete crop calendar.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.infoModalButton}
            onPress={() => setInfoPopupVisible(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoModalButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Custom Dropdown Component
  const CustomDropdown = ({
    label,
    value,
    options,
    onSelect,
    placeholder,
    modalVisible,
    setModalVisible,
    hasError
  }) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            hasError && styles.errorInput
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dropdownButtonText,
            !value && styles.placeholderText
          ]}>
            {value || placeholder}
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {label}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={options}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      value === item && styles.selectedOption
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      value === item && styles.selectedOptionText
                    ]}>
                      {item}
                    </Text>
                    {value === item && (
                      <MaterialIcons name="check" size={20} color={blue} />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  // Location Input
  const renderLocationInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Location</Text>
      <TouchableOpacity
        style={[styles.locationInputContainer, error.includes('Location') && styles.errorInput]}
        onPress={getCurrentLocation}
        activeOpacity={0.7}
      >
        <TextInput
          style={[styles.textInput, styles.locationInput]}
          placeholder="Tap to get current location & draw geofence"
          placeholderTextColor={colors.textSecondary}
          value={location}
          editable={false}
        />
        <View style={styles.locationButtonContainer}>
          {locationLoading ? (
            <ActivityIndicator size={20} color={blue} />
          ) : (
            <MaterialIcons name="my-location" size={24} color={blue} />
          )}
        </View>
      </TouchableOpacity>

      {currentLocation && (
        <TouchableOpacity
          style={styles.openMapButton}
          onPress={() => setMapModalVisible(true)}
        >
          <MaterialIcons name="map" size={20} color={colors.white} />
          <Text style={styles.openMapButtonText}>Open Map for Geofencing</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Map Modal with WebView
  const renderMapModal = () => (
    <Modal
      visible={mapModalVisible}
      animationType="slide"
      onRequestClose={() => setMapModalVisible(false)}
    >
      <View style={styles.mapModalContainer}>
        <View style={styles.mapHeader}>
          <TouchableOpacity
            onPress={() => setMapModalVisible(false)}
            style={styles.mapHeaderButton}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.mapHeaderTitle}>Draw Geofencing Boundaries</Text>
          <View style={styles.mapHeaderButton} />
        </View>

        {currentLocation && (
          <WebView
            source={{ html: generateMapHTML() }}
            style={styles.webView}
            onMessage={handleMapMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={blue} />
                <Text style={styles.loadingText}>Loading Map...</Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );

  // Date Range Input
  const renderDateRangeInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Cultivation Period</Text>
      <View style={styles.professionalDateRangeContainer}>
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateInputLabel}>Start Date</Text>
          <TouchableOpacity
            style={[
              styles.professionalDateInput,
              error.includes('Start Date') && styles.errorInput
            ]}
            onPress={() => showDatePicker('start')}
            activeOpacity={0.8}
          >
            <View style={styles.dateInputContent}>
              <MaterialIcons
                name="event"
                size={20}
                color={startDate ? blue : colors.textSecondary}
                style={styles.dateIcon}
              />
              <Text style={[
                styles.dateInputText,
                !startDate && styles.dateInputPlaceholder
              ]}>
                {startDate || 'Select start date'}
              </Text>
            </View>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.dateRangeDivider}>
          <View style={styles.dateRangeLine} />
          <Text style={styles.dateRangeText}>to</Text>
          <View style={styles.dateRangeLine} />
        </View>

        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateInputLabel}>End Date</Text>
          <TouchableOpacity
            style={[
              styles.professionalDateInput,
              error.includes('End Date') && styles.errorInput,
              !startDate && styles.disabledDateInput
            ]}
            onPress={() => showDatePicker('end')}
            activeOpacity={0.8}
            disabled={!startDate}
          >
            <View style={styles.dateInputContent}>
              <MaterialIcons
                name="event"
                size={20}
                color={endDate ? blue : colors.textSecondary}
                style={styles.dateIcon}
              />
              <Text style={[
                styles.dateInputText,
                !endDate && styles.dateInputPlaceholder
              ]}>
                {endDate || 'Select end date'}
              </Text>
            </View>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {startDate && endDate && (
        <View style={styles.dateRangeSummary}>
          <MaterialIcons name="schedule" size={16} color={colors.secondary} />
          <Text style={styles.dateRangeSummaryText}>
            Duration: {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days
          </Text>
        </View>
      )}

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

  // Activities Section
  const renderActivitiesSection = () => (
    <View style={styles.inputContainer}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="assignment" size={24} color={blue} />
        <Text style={styles.sectionTitle}>Activity Management</Text>
        <View style={styles.activityCounter}>
          <Text style={styles.activityCounterText}>{activities.length}</Text>
        </View>
      </View>

      <View style={styles.professionalActivityInputContainer}>
        <View style={styles.activityInputCard}>
          <Text style={styles.activityInputTitle}>Add New Activity</Text>

          <View style={styles.activityInputRow}>
            <View style={styles.activityNameInputWrapper}>
              <Text style={styles.activityInputLabel}>Activity Name</Text>
              <TextInput
                style={[
                  styles.professionalActivityInput,
                  error.includes('Activity name') && styles.errorInput
                ]}
                placeholder="e.g., Seed preparation, Planting"
                placeholderTextColor={colors.textSecondary}
                value={newActivity}
                onChangeText={(text) => {
                  setNewActivity(text);
                  if (error.includes('Activity name')) setError('');
                }}
                returnKeyType="next"
              />
            </View>

            <View style={styles.activityDateInputWrapper}>
              <Text style={styles.activityInputLabel}>Scheduled Date</Text>
              <TouchableOpacity
                style={[
                  styles.professionalActivityDateInput,
                  error.includes('Activity date') && styles.errorInput,
                  (!startDate || !endDate) && styles.disabledDateInput
                ]}
                onPress={() => showActivityDatePicker(null)}
                activeOpacity={0.8}
                disabled={!startDate || !endDate}
              >
                <MaterialIcons
                  name="today"
                  size={18}
                  color={newActivityDate ? blue : colors.textSecondary}
                />
                <Text style={[
                  styles.activityDateInputText,
                  !newActivityDate && styles.dateInputPlaceholder
                ]}>
                  {newActivityDate || 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.professionalAddActivityButton,
              (!newActivity.trim() || !newActivityDate) && styles.disabledButton
            ]}
            onPress={addActivity}
            activeOpacity={0.8}
            disabled={!newActivity.trim() || !newActivityDate}
          >
            <MaterialIcons name="add-circle" size={20} color={colors.white} />
            <Text style={styles.professionalAddActivityButtonText}>Add Activity</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activities.length > 0 && (
        <View style={styles.activityListContainer}>
          <Text style={styles.activityListTitle}>Scheduled Activities ({activities.length})</Text>
          <FlatList
            data={activities}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.professionalActivityItem}>
                <View style={styles.activityItemHeader}>
                  <View style={styles.activityItemIndex}>
                    <Text style={styles.activityItemIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.activityItemContent}>
                    <Text style={styles.professionalActivityName}>{item.name}</Text>
                    <View style={styles.activityItemDateContainer}>
                      <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
                      <Text style={styles.professionalActivityDate}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={styles.activityItemActions}>
                    <TouchableOpacity
                      onPress={() => showActivityDatePicker(index)}
                      style={styles.activityActionButton}
                    >
                      <MaterialIcons name="edit-calendar" size={18} color={blue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteActivity(index)}
                      style={[styles.activityActionButton, styles.deleteActionButton]}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            style={styles.professionalActivityList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {!startDate || !endDate ? (
        <View style={styles.activityDisabledNotice}>
          <MaterialIcons name="info-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.activityDisabledNoticeText}>
            Please select cultivation period dates first to add activities
          </Text>
        </View>
      ) : null}

      <DateTimePickerModal
        isVisible={isActivityDatePickerVisible}
        mode="date"
        onConfirm={handleActivityDateConfirm}
        onCancel={hideActivityDatePicker}
        minimumDate={startDate ? new Date(startDate) : new Date()}
        maximumDate={endDate ? new Date(endDate) : undefined}
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
      />
    </View>
  );

  // Create crop calendar
  const createOwnCCR = async () => {
    if (!validateForm()) {
      setSnackbarVisible(true);
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
        cropVariety: cropVariety.trim(),
        season,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        activities: activities.map(activity => ({
          name: activity.name,
          date: new Date(activity.date).toISOString(),
        })),
        geofenceCoordinates: geofenceCoordinates.length >= 3 ? geofenceCoordinates : null,
        currentLocation: currentLocation,
        addressLocation: addressLocation,
      };

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
        setError('');
        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.navigate('yourcropcalendar', { id: responseBody.response.id });
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

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      console.warn('Cannot go back');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalScale(40) : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Crop Calendar</Text>
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        <CustomDropdown
          label="Crop Type"
          value={cropType}
          options={cropTypeOptions}
          onSelect={(value) => {
            setCropType(value);
            if (error.includes('Crop Type')) setError('');
          }}
          placeholder="Select crop type"
          modalVisible={cropTypeModalVisible}
          setModalVisible={setCropTypeModalVisible}
          hasError={error.includes('Crop Type')}
        />

        {renderLocationInput()}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Field Size (acres)</Text>
          <TextInput
            style={[styles.textInput, error.includes('Field size') && styles.errorInput]}
            placeholder="Auto-filled from geofencing or enter manually"
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

        <CustomDropdown
          label="Season"
          value={season}
          options={seasonOptions}
          onSelect={(value) => {
            setSeason(value);
            if (error.includes('Season')) setError('');
          }}
          placeholder="Select season"
          modalVisible={seasonModalVisible}
          setModalVisible={setSeasonModalVisible}
          hasError={error.includes('Season')}
        />

        {renderDateRangeInput()}

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

        {renderActivitiesSection()}

        <View style={{ height: verticalScale(100) }} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, createPending && styles.disabledButton]}
          onPress={createOwnCCR}
          activeOpacity={0.7}
          disabled={createPending}
        >
          {createPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Create Crop Calendar</Text>
          )}
        </TouchableOpacity>
      </View>

      {renderInfoPopup()}

      {renderMapModal()}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blue,
    paddingTop: verticalScale(Platform.OS === 'ios' ? 40 : 50),
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
  formContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.text,
    marginBottom: verticalScale(16),
    marginTop: verticalScale(8),
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
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
    marginHorizontal: horizontalScale(4),
  },
  dateRangeSeparator: {
    fontSize: moderateScale(14),
    color: colors.text,
    marginHorizontal: horizontalScale(8),
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
  },
  locationInput: {
    flex: 1,
    borderWidth: 0,
    margin: 0,
  },
  locationButtonContainer: {
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
  },
  openMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(12),
    marginTop: verticalScale(8),
  },
  openMapButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: horizontalScale(6),
    fontFamily: 'Poppins-SemiBold',
  },
  errorInput: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
  },
  infoModalContent: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    width: '100%',
    maxWidth: horizontalScale(350),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  infoModalHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  infoModalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: colors.text,
    marginTop: verticalScale(8),
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  infoModalBody: {
    marginBottom: verticalScale(24),
  },
  infoModalText: {
    fontSize: moderateScale(14),
    color: colors.text,
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(12),
    fontFamily: 'Poppins-Regular',
  },
  infoModalButton: {
    backgroundColor: blue,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(24),
    alignItems: 'center',
  },
  infoModalButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    backgroundColor: colors.white,
    minHeight: verticalScale(48),
  },
  dropdownButtonText: {
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    width: '85%',
    maxHeight: '60%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOption: {
    backgroundColor: `${blue}10`,
  },
  optionText: {
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  selectedOptionText: {
    color: blue,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: blue,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  // disabledButton: {
  //   backgroundColor: colors.textSecondary,
  //   opacity: 0.7,
  // },
  snackbar: {
    marginHorizontal: horizontalScale(20),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(10),
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blue,
    paddingTop: verticalScale(Platform.OS === 'ios' ? 40 : 10),
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapHeaderTitle: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  mapHeaderButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: horizontalScale(40),
    height: verticalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(16),
    color: colors.text,
    fontFamily: 'Poppins-Medium',
  },
  activityInputContainer: {
    marginBottom: verticalScale(16),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
  },
  activityDate: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
  },
  deleteActivityButton: {
    padding: moderateScale(8),
  },
  editActivityDateButton: {
    padding: moderateScale(8),
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(12),
    marginTop: verticalScale(8),
  },
  addActivityButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: horizontalScale(6),
    fontFamily: 'Poppins-SemiBold',
  },
  activityList: {
    maxHeight: verticalScale(200),
  },

  professionalDateRangeContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateInputWrapper: {
    marginBottom: verticalScale(12),
  },
  dateInputLabel: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: colors.text,
    marginBottom: verticalScale(6),
    fontFamily: 'Poppins-Medium',
  },
  professionalDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
    minHeight: verticalScale(48),
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIcon: {
    marginRight: horizontalScale(10),
  },
  dateInputText: {
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  dateInputPlaceholder: {
    color: colors.textSecondary,
  },
  disabledDateInput: {
    backgroundColor: '#F8F9FA',
    opacity: 0.6,
  },
  dateRangeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(8),
  },
  dateRangeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateRangeText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginHorizontal: horizontalScale(12),
    fontFamily: 'Poppins-Regular',
  },
  dateRangeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: `${colors.secondary}10`,
    borderRadius: moderateScale(6),
  },
  dateRangeSummaryText: {
    fontSize: moderateScale(12),
    color: colors.secondary,
    marginLeft: horizontalScale(6),
    fontFamily: 'Poppins-Medium',
  },

  // Professional Activity Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  activityCounter: {
    backgroundColor: blue,
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(2),
    marginLeft: horizontalScale(8),
    minWidth: horizontalScale(24),
    alignItems: 'center',
  },
  activityCounterText: {
    fontSize: moderateScale(12),
    color: colors.white,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  professionalActivityInputContainer: {
    marginBottom: verticalScale(20),
  },
  activityInputCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityInputTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: verticalScale(12),
    fontFamily: 'Poppins-SemiBold',
  },
  activityInputRow: {
    marginBottom: verticalScale(16),
  },
  activityNameInputWrapper: {
    marginBottom: verticalScale(12),
  },
  activityInputLabel: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: colors.text,
    marginBottom: verticalScale(6),
    fontFamily: 'Poppins-Medium',
  },
  professionalActivityInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    backgroundColor: colors.background,
    minHeight: verticalScale(44),
  },
  activityDateInputWrapper: {
    flex: 1,
  },
  professionalActivityDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
    minHeight: verticalScale(44),
  },
  activityDateInputText: {
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    marginLeft: horizontalScale(8),
    flex: 1,
  },
  professionalAddActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: blue,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(16),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  professionalAddActivityButtonText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-SemiBold',
  },
  activityListContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityListTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontFamily: 'Poppins-SemiBold',
  },
  professionalActivityList: {
    maxHeight: verticalScale(250),
  },
  professionalActivityItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
  },
  activityItemIndex: {
    width: horizontalScale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: `${blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: horizontalScale(12),
  },
  activityItemIndexText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: blue,
    fontFamily: 'Poppins-SemiBold',
  },
  activityItemContent: {
    flex: 1,
  },
  professionalActivityName: {
    fontSize: moderateScale(14),
    color: colors.text,
    fontFamily: 'Poppins-Medium',
    marginBottom: verticalScale(2),
  },
  activityItemDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalActivityDate: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    marginLeft: horizontalScale(4),
  },
  activityItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityActionButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(6),
    marginLeft: horizontalScale(4),
  },
  deleteActionButton: {
    backgroundColor: `${colors.error}10`,
  },
  activityDisabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.textSecondary}10`,
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(12),
  },
  activityDisabledNoticeText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginLeft: horizontalScale(8),
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
});

export default CropCalenderCreateScreen;