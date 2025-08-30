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
  Modal,
  Alert,
  Dimensions,
  PermissionsAndroid,
  Linking,
  FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import { blue } from '../utils/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Snackbar } from 'react-native-paper';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';
import { Picker } from '@react-native-picker/picker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define the enum options for soilType and cropType
const soilTypeOptions = ["CLAY", "SANDY", "LOAMY", "SILTY", "PEATY", "CHALKY"];
const cropTypeOptions = ['Cereal', 'Vegetable', 'Fruit', 'Pulses', 'Oilseeds'];

// Define color palette - Green theme for crop health
const colors = {
  primary: '#10B981', // Emerald green for crop health
  secondary: '#34D399',
  background: '#F8FAFC',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  error: '#EF5350',
  success: '#10B981',
  warning: '#F59E0B',
};

const CropHealthMonitorScreen = ({ navigation }) => {
  // State variables for form inputs
  const [farmLocation, setFarmLocation] = useState('');
  const [soilType, setSoilType] = useState('');
  const [cropType, setCropType] = useState('');
  const [areaInHectares, setAreaInHectares] = useState('');
  const [query, setQuery] = useState('');

  // State variables for UI feedback and API handling
  const [submitPending, setSubmitPending] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Location and Map related states
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [geofenceCoordinates, setGeofenceCoordinates] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLocation, setAddressLocation] = useState('');

  // Expert Reports states
  const [expertReports, setExpertReports] = useState([]);
  const [reportsModalVisible, setReportsModalVisible] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  // Get user data (including token) from Zustand store
  const userData = useUserStore((state) => state.userData);

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
            'User-Agent': 'CropHealthMonitorApp/1.0'
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
        setFarmLocation(address);

        setLocationLoading(false);
        setMapModalVisible(true);

        Alert.alert(
          'Location Found',
          `📍 ${address}\n\nYou can now draw geofencing boundaries on the map for crop health monitoring.`,
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
        <title>Crop Health Monitoring Map</title>
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
                background: #10B981;
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
            <div><strong>🌱 Crop Health Monitoring</strong></div>
            <div><strong>📍 Location:</strong> ${addressLocation || 'Loading...'}</div>
            <div><strong>🎯 Monitoring Points:</strong> <span id="pointCount">0/4</span></div>
            <div><strong>📐 Area:</strong> <span id="area">0 hectares</span></div>
            <div class="coordinate-list" id="coordinateList"></div>
        </div>
        
        <div id="map"></div>
        
        <div class="controls">
            <button class="btn btn-secondary" onclick="clearGeofence()">Clear All</button>
            <button class="btn" id="applyBtn" onclick="applyGeofence()" disabled>Apply Monitoring Area</button>
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
                        alert('Maximum 4 points allowed for crop health monitoring!');
                    }
                });
            }
            
            function addPoint(lat, lng) {
                const marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
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
                        color: '#10B981',
                        fillColor: '#34D399',
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
                
                // Convert to square meters (approximate)
                const areaInSqMeters = area * 111320 * 111320;
                
                // Convert to hectares
                const areaInHectares = areaInSqMeters / 10000;
                
                return areaInHectares;
            }
            
            function updateUI() {
                document.getElementById('pointCount').textContent = coordinates.length + '/4';
                
                if (coordinates.length >= 3) {
                    const area = calculateArea(coordinates);
                    document.getElementById('area').textContent = area.toFixed(2) + ' hectares';
                    document.getElementById('applyBtn').disabled = false;
                } else {
                    document.getElementById('area').textContent = '0 hectares';
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
                    alert('Please add at least 3 points to create a monitoring area.');
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
        setAreaInHectares(data.area);

        const locationString = `${data.location} (Monitored: ${data.coordinates.length} points)`;
        setFarmLocation(locationString);

        setMapModalVisible(false);

        Alert.alert(
          'Crop Health Monitoring Area Set! 🌱',
          `✅ ${data.coordinates.length} monitoring points set\n📐 Area: ${data.area} hectares\n📍 Location: ${data.location}\n\n⚡ Area has been automatically updated for crop health analysis.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  // Fetch expert reports
  const fetchExpertReports = async () => {
    setLoadingReports(true);
    try {
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const cleanedToken = userData.token.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/farmer/expert-reports/crop-health-monitor`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
      });

      const responseData = await response.json();

      if (response.ok && responseData.reports) {
        setExpertReports(responseData.reports);
      } else {
        setExpertReports([]);
      }
    } catch (error) {
      console.error('Error fetching expert reports:', error);
      setExpertReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  // Open PDF report
  const openPDFReport = (reportUrl) => {
    if (reportUrl) {
      Linking.openURL(reportUrl).catch(() => {
        Alert.alert('Error', 'Unable to open the PDF report.');
      });
    }
  };

  // Expert Reports Modal
  const ExpertReportsModal = () => (
    <Modal
      visible={reportsModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setReportsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.reportsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crop Health Reports</Text>
            <TouchableOpacity
              onPress={() => setReportsModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loadingReports ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading crop health reports...</Text>
            </View>
          ) : expertReports.length > 0 ? (
            <FlatList
              data={expertReports}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reportItem}
                  onPress={() => openPDFReport(item.pdfUrl)}
                >
                  <View style={styles.reportIconContainer}>
                    <MaterialIcons name="picture-as-pdf" size={32} color={colors.error} />
                  </View>
                  <View style={styles.reportDetails}>
                    <Text style={styles.reportTitle}>{item.title}</Text>
                    <Text style={styles.reportSubtitle}>
                      Expert: {item.expertName}
                    </Text>
                    <Text style={styles.reportDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.reportType}>Crop Health Analysis</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyReportsView}>
              <MaterialIcons name="local-florist" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyReportsText}>No crop health reports available</Text>
              <Text style={styles.emptyReportsSubtext}>
                Expert crop health analysis reports will appear here once available
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // Close snackbar after a delay
  useEffect(() => {
    if (snackbarVisible) {
      const timer = setTimeout(() => {
        setSnackbarVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbarVisible]);

  // Validation function for all form fields
  const validateForm = () => {
    setError('');
    if (!farmLocation.trim()) {
      setError('Farm Location is required.');
      return false;
    }
    if (!soilType || !soilTypeOptions.includes(soilType)) {
      setError('Please select a valid Soil Type.');
      return false;
    }
    if (!cropType || !cropTypeOptions.includes(cropType)) {
      setError('Please select a valid Crop Type.');
      return false;
    }
    const parsedArea = parseFloat(areaInHectares);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setError('Area in Hectares must be a positive number.');
      return false;
    }
    if (!query.trim()) {
      setError('Query is required.');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbarVisible(true);
      return;
    }

    setSubmitPending(true);

    try {
      if (!BASE_URL) {
        throw new Error('BASE_URL is not defined in Constants.js');
      }
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const payload = {
        farmLocation: farmLocation.trim(),
        soilType: soilType,
        cropType: cropType,
        areaInHectares: parseFloat(areaInHectares),
        query: query.trim(),
        geofenceCoordinates: geofenceCoordinates.length >= 3 ? geofenceCoordinates : null,
        currentLocation: currentLocation,
        addressLocation: addressLocation,
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const cleanedToken = userData.token.replace(/"/g, '');

      const response = await fetch(`${BASE_URL}/farmer/service/crop-health-monitor`, {
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
        setError('');
        setSnackbarVisible(false);
        navigation.navigate('SubmissionSuccess', {
          message: 'Your crop health monitoring request has been successfully submitted!',
          navigateBackTo: 'Main',
        });
        // Reset form fields
        setFarmLocation('');
        setSoilType('');
        setCropType('');
        setAreaInHectares('');
        setQuery('');
        setGeofenceCoordinates([]);
        setCurrentLocation(null);
        setAddressLocation('');
      } else {
        const errorMessage = responseData.message || responseData.error || 'Unknown error occurred.';
        throw new Error(`Failed to submit request: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setSnackbarVisible(true);
    } finally {
      setSubmitPending(false);
    }
  };

  // Location Input Component
  const renderLocationInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Farm Location</Text>
      <TouchableOpacity
        style={[styles.locationInputContainer, error.includes('Farm Location') && styles.errorInput]}
        onPress={getCurrentLocation}
        activeOpacity={0.7}
      >
        <TextInput
          style={[styles.input, styles.locationInput]}
          placeholder="Tap to get current location & set monitoring area"
          placeholderTextColor="gray"
          value={farmLocation}
          editable={false}
        />
        <View style={styles.locationButtonContainer}>
          {locationLoading ? (
            <ActivityIndicator size={20} color={colors.primary} />
          ) : (
            <MaterialIcons name="my-location" size={24} color={colors.primary} />
          )}
        </View>
      </TouchableOpacity>

      {currentLocation && (
        <TouchableOpacity
          style={styles.openMapButton}
          onPress={() => setMapModalVisible(true)}
        >
          <MaterialIcons name="local-florist" size={20} color={colors.white} />
          <Text style={styles.openMapButtonText}>Open Map for Crop Health Monitoring</Text>
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
          <Text style={styles.mapHeaderTitle}>Crop Health Monitoring</Text>
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
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading Crop Health Monitor...</Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Crop Health Monitor</Text>
        <TouchableOpacity
          onPress={() => {
            fetchExpertReports();
            setReportsModalVisible(true);
          }}
          style={styles.reportsButton}
        >
          <MaterialIcons name="assignment" size={moderateScale(25)} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.formScrollView}
        contentContainerStyle={styles.formContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Farm Location with Geofencing */}
        {renderLocationInput()}

        {/* Area in Hectares - moved below location */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Area in Hectares</Text>
          <TextInput
            style={[styles.input, error.includes('Area in Hectares') && styles.errorInput]}
            value={areaInHectares}
            onChangeText={(text) => {
              setAreaInHectares(text);
              if (error.includes('Area in Hectares')) setError('');
            }}
            placeholder="Auto-filled from monitoring area or enter manually"
            placeholderTextColor="gray"
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>

        {/* Soil Type - Dropdown */}
        <Text style={styles.label}>Soil Type</Text>
        <View style={[styles.pickerContainer, error.includes('Soil Type') && styles.errorInput]}>
          <Picker
            selectedValue={soilType}
            onValueChange={(itemValue) => {
              if (itemValue !== '') {
                setSoilType(itemValue);
                if (error.includes('Soil Type')) setError('');
              }
            }}
            style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : undefined}
          >
            <Picker.Item
              label="Select Soil Type"
              value=""
              color={Platform.OS === 'ios' ? '#999' : '#999'}
            />
            {soilTypeOptions.map((type, index) => (
              <Picker.Item
                key={index.toString()}
                label={type}
                value={type}
                color={Platform.OS === 'ios' ? '#333' : '#333'}
              />
            ))}
          </Picker>
        </View>

        {/* Crop Type - Dropdown */}
        <Text style={styles.label}>Crop Type</Text>
        <View style={[styles.pickerContainer, error.includes('Crop Type') && styles.errorInput]}>
          <Picker
            selectedValue={cropType}
            onValueChange={(itemValue) => {
              if (itemValue !== '') {
                setCropType(itemValue);
                if (error.includes('Crop Type')) setError('');
              }
            }}
            style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : undefined}
          >
            <Picker.Item
              label="Select Crop Type"
              value=""
              color={Platform.OS === 'ios' ? '#999' : '#999'}
            />
            {cropTypeOptions.map((type, index) => (
              <Picker.Item
                key={index.toString()}
                label={type}
                value={type}
                color={Platform.OS === 'ios' ? '#333' : '#333'}
              />
            ))}
          </Picker>
        </View>

        {/* Query */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Query</Text>
          <TextInput
            style={[styles.input, styles.textArea, error.includes('Query') && styles.errorInput]}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (error.includes('Query')) setError('');
            }}
            placeholder="Enter your crop health monitoring query or specific concerns"
            placeholderTextColor="gray"
            multiline
            numberOfLines={4}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

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
            <Text style={styles.submitButtonText}>Submit Crop Health Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Modal */}
      {renderMapModal()}

      {/* Expert Reports Modal */}
      <ExpertReportsModal />

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
        {error ? error : 'Crop health monitoring request submitted successfully!'}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blue,
    elevation: 5,
    height: verticalScale(80),
    paddingTop: verticalScale(Platform.OS === 'ios' ? 40 : 30),
    paddingHorizontal: horizontalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    paddingRight: horizontalScale(10),
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    textAlign: 'center',
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },
  reportsButton: {
    paddingLeft: horizontalScale(10),
  },
  formScrollView: {
    flex: 1,
  },
  formContentContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(30),
  },
  inputContainer: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(8),
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  input: {
    height: verticalScale(45),
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    fontSize: moderateScale(14),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    backgroundColor: 'white',
  },
  textArea: {
    height: verticalScale(100),
    textAlignVertical: 'top',
    paddingTop: verticalScale(12),
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(16),
    backgroundColor: 'white',
    overflow: 'hidden',
    minHeight: verticalScale(55),
    justifyContent: 'center',
  },
  pickerAndroid: {
    height: verticalScale(55),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    backgroundColor: 'white',
    marginTop: -8,
    marginBottom: -8,
  },
  pickerIOS: {
    height: verticalScale(45),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    backgroundColor: 'white',
  },
  pickerItemIOS: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    height: verticalScale(45),
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: moderateScale(8),
    backgroundColor: 'white',
    marginBottom: verticalScale(8),
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
    backgroundColor: colors.primary,
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(12),
    marginBottom: verticalScale(8),
  },
  openMapButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: horizontalScale(6),
    fontFamily: 'Poppins-SemiBold',
  },
  submitButton: {
    backgroundColor: blue,
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(30),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  submitButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-SemiBold',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
  snackbar: {
    marginHorizontal: horizontalScale(20),
    marginBottom: verticalScale(10),
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
  },

  // Map Modal Styles
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportsModal: {
    width: '95%',
    height: '80%',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  reportIconContainer: {
    marginRight: horizontalScale(16),
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: verticalScale(4),
  },
  reportSubtitle: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    marginBottom: verticalScale(2),
  },
  reportDate: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    marginBottom: verticalScale(2),
  },
  reportType: {
    fontSize: moderateScale(12),
    color: colors.primary,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
  },
  emptyReportsView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  emptyReportsText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(16),
    fontFamily: 'Poppins-SemiBold',
  },
  emptyReportsSubtext: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(8),
    fontFamily: 'Poppins-Regular',
  },

});

export default CropHealthMonitorScreen;