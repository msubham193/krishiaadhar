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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import { blue } from '../utils/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Snackbar } from 'react-native-paper';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';
import { Picker } from '@react-native-picker/picker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define the enum options - Updated based on your specifications
const soilTypeOptions = ["LOAM", "CLAY", "SANDY", "SILT", "PEAT", "CHALK"];
const cropTypeOptions = ['Cereal', 'Vegetable', 'Fruit', 'Pulses', 'Oilseeds'];
const visitPurposeOptions = ['General Consultation', 'Soil Assessment', 'Crop Health Check', 'Pest Management', 'Irrigation Planning', 'Harvest Planning'];

// Define color palette - Cyan theme for expert visits
const colors = {
  primary: '#06B6D4', // Cyan for expert visits
  secondary: '#22D3EE',
  background: '#F8FAFC',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  error: '#EF5350',
  success: '#10B981',
  warning: '#F59E0B',
};

const ExpertVisitScreen = ({ navigation }) => {
  // State variables for form inputs
  const [farmLocation, setFarmLocation] = useState('');
  const [soilType, setSoilType] = useState('');
  const [cropType, setCropType] = useState('');
  const [AreainHector, setAreainHector] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [preferedVisitDate, setPreferedVisitDate] = useState('');
  const [Query, setQuery] = useState('');

  // State variables for UI feedback and API handling
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Location and Map related states
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [geofenceCoordinates, setGeofenceCoordinates] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLocation, setAddressLocation] = useState('');

  // Expert Visit Requests states
  const [expertVisitRequests, setExpertVisitRequests] = useState([]);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // PDF related states
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');

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
            'User-Agent': 'ExpertVisitApp/1.0'
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
          `📍 ${address}\n\nYou can now draw geofencing boundaries on the map for the expert visit area.`,
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
        <title>Expert Visit Area Map</title>
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
                background: #06B6D4;
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
            <div><strong>👨‍🌾 Expert Visit Area</strong></div>
            <div><strong>📍 Location:</strong> ${addressLocation || 'Loading...'}</div>
            <div><strong>🎯 Visit Points:</strong> <span id="pointCount">0/4</span></div>
            <div><strong>📐 Area:</strong> <span id="area">0 hectares</span></div>
            <div class="coordinate-list" id="coordinateList"></div>
        </div>
        
        <div id="map"></div>
        
        <div class="controls">
            <button class="btn btn-secondary" onclick="clearGeofence()">Clear All</button>
            <button class="btn" id="applyBtn" onclick="applyGeofence()" disabled>Apply Visit Area</button>
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
                        alert('Maximum 4 points allowed for expert visit area!');
                    }
                });
            }
            
            function addPoint(lat, lng) {
                const marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06B6D4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
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
                        color: '#06B6D4',
                        fillColor: '#22D3EE',
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
                    alert('Please add at least 3 points to create a visit area.');
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
        setAreainHector(data.area);

        const locationString = `${data.location} (Visit Area: ${data.coordinates.length} points)`;
        setFarmLocation(locationString);

        setMapModalVisible(false);

        Alert.alert(
          'Expert Visit Area Set! 👨‍🌾',
          `✅ ${data.coordinates.length} visit area points set\n📐 Area: ${data.area} hectares\n📍 Location: ${data.location}\n\n⚡ Area has been automatically updated for expert visit planning.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  // Fetch expert visit requests (GET API)
  const fetchExpertVisitRequests = async () => {
    setLoadingRequests(true);
    try {
      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const cleanedToken = userData.token.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/farmer/expert-visit`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
      });

      console.log('GET Expert Visit Requests Response Status:', response.status);
      const responseData = await response.json();
      console.log('GET Expert Visit Requests Response:', JSON.stringify(responseData, null, 2));

      if (response.ok) {
        // Assuming the response structure contains an array of requests
        setExpertVisitRequests(responseData.requests || responseData.data || responseData || []);
      } else {
        console.error('Failed to fetch expert visit requests:', responseData);
        setExpertVisitRequests([]);
      }
    } catch (error) {
      console.error('Error fetching expert visit requests:', error);
      setExpertVisitRequests([]);
      Alert.alert('Error', 'Failed to fetch expert visit requests. Please try again.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Open PDF in viewer
  const openPdfViewer = (pdfUrl, title = 'Expert Report') => {
    if (!pdfUrl) {
      Alert.alert('Error', 'PDF URL not available');
      return;
    }

    setSelectedPdfUrl(pdfUrl);
    setPdfTitle(title);
    setPdfModalVisible(true);
  };

  // Handle PDF download/external viewing
  const handlePdfExternalView = async () => {
    try {
      if (selectedPdfUrl) {
        const supported = await Linking.canOpenURL(selectedPdfUrl);
        if (supported) {
          await Linking.openURL(selectedPdfUrl);
        } else {
          Alert.alert('Error', 'Cannot open this PDF URL');
        }
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF');
    }
  };

  // Generate PDF viewer HTML
  const generatePdfViewerHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pdfTitle}</title>
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif;
                background: #f5f5f5;
            }
            .header {
                background: #06B6D4;
                color: white;
                padding: 15px;
                text-align: center;
                font-weight: bold;
                font-size: 16px;
            }
            .pdf-container {
                width: 100%;
                height: calc(100vh - 60px);
                border: none;
            }
            .loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
            }
            .error-message {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: #ff0000;
                padding: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">${pdfTitle}</div>
        <div class="loading" id="loading">
            <div>Loading PDF...</div>
        </div>
        <div class="error-message" id="error" style="display: none;">
            <div>❌ Failed to load PDF</div>
            <div>Please check your internet connection or try again later.</div>
        </div>
        <iframe 
            src="${selectedPdfUrl}" 
            class="pdf-container"
            onload="document.getElementById('loading').style.display='none'"
            onerror="document.getElementById('loading').style.display='none'; document.getElementById('error').style.display='block'"
        ></iframe>
    </body>
    </html>
    `;
  };

  // PDF Viewer Modal
  const PdfViewerModal = () => (
    <Modal
      visible={pdfModalVisible}
      animationType="slide"
      onRequestClose={() => setPdfModalVisible(false)}
    >
      <View style={styles.pdfModalContainer}>
        <View style={styles.pdfHeader}>
          <TouchableOpacity
            onPress={() => setPdfModalVisible(false)}
            style={styles.pdfHeaderButton}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.pdfHeaderTitle} numberOfLines={1}>
            {pdfTitle}
          </Text>
          <TouchableOpacity
            onPress={handlePdfExternalView}
            style={styles.pdfHeaderButton}
          >
            <MaterialIcons name="open-in-new" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {selectedPdfUrl ? (
          <WebView
            source={{ html: generatePdfViewerHTML() }}
            style={styles.pdfWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.pdfWebViewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('PDF WebView error:', nativeEvent);
            }}
          />
        ) : (
          <View style={styles.pdfErrorView}>
            <MaterialIcons name="picture-as-pdf" size={48} color={colors.textSecondary} />
            <Text style={styles.pdfErrorText}>No PDF available</Text>
          </View>
        )}
      </View>
    </Modal>
  );

  // Expert Visit Requests Modal with PDF viewing option
  const ExpertVisitRequestsModal = () => (
    <Modal
      visible={requestsModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setRequestsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.reportsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Expert Visit Requests</Text>
            <TouchableOpacity
              onPress={() => setRequestsModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loadingRequests ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading expert visit requests...</Text>
            </View>
          ) : expertVisitRequests.length > 0 ? (
            <FlatList
              data={expertVisitRequests}
              keyExtractor={(item, index) => `${item.id || index}`}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <View style={styles.requestIconContainer}>
                    <MaterialIcons name="person" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.requestDetails}>
                    <Text style={styles.requestTitle}>
                      {item.farmLocation || 'Expert Visit Request'}
                    </Text>
                    <Text style={styles.requestSubtitle}>
                      Crop: {item.cropType || 'N/A'} | Soil: {item.soilType || 'N/A'}
                    </Text>
                    <Text style={styles.requestArea}>
                      Area: {item.AreainHector || item.areaInHectares || 'N/A'} hectares
                    </Text>
                    <Text style={styles.requestDate}>
                      Preferred Date: {item.preferedVisitDate ? new Date(item.preferedVisitDate).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text style={styles.requestStatus}>
                      Status: {item.status || 'Pending'}
                    </Text>
                    {item.Query && (
                      <Text style={styles.requestQuery} numberOfLines={2}>
                        Query: {item.Query}
                      </Text>
                    )}
                    
                    {/* PDF View Button - Show only if PDF is available */}
                    {(item.pdfUrl || item.reportPdf || item.expertReport) && (
                      <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => openPdfViewer(
                          item.pdfUrl || item.reportPdf || item.expertReport,
                          `Expert Report - ${item.farmLocation || 'Visit'}`
                        )}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="picture-as-pdf" size={20} color={colors.white} />
                        <Text style={styles.pdfButtonText}>View Expert Report</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyRequestsView}>
              <MaterialIcons name="person" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyRequestsText}>No expert visit requests found</Text>
              <Text style={styles.emptyRequestsSubtext}>
                Your expert visit requests will appear here
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
    const parsedArea = parseFloat(AreainHector);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setError('Area in Hectares must be a positive number.');
      return false;
    }
    if (!visitPurpose || !visitPurposeOptions.includes(visitPurpose)) {
      setError('Please select a valid Visit Purpose.');
      return false;
    }
    if (!preferedVisitDate) {
      setError('Preferred Visit Date is required.');
      return false;
    }
    if (!Query.trim()) {
      setError('Query is required.');
      return false;
    }
    return true;
  };

  // Handle date picker visibility
  const showDatePicker = () => {
    setDatePickerVisible(true);
    Keyboard.dismiss();
  };
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleConfirmDate = (date) => {
    const formattedDate = date.toISOString();
    setPreferedVisitDate(formattedDate);
    hideDatePicker();
  };

  // Submit Expert Visit Request (POST API)
  const submitExpertVisitRequest = async () => {
    if (!validateForm()) {
      setSnackbarVisible(true);
      return;
    }

    setSubmitPending(true);

    try {
      // Validate required configurations
      if (!BASE_URL) {
        throw new Error('BASE_URL is not configured. Please check your Constants.js file.');
      }

      if (!userData?.token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Prepare the payload according to your specifications
      const payload = {
        farmLocation: farmLocation.trim(),
        AreainHector: AreainHector.toString(), // Send as string
        visitPurpose: visitPurpose.trim(),
        cropType: cropType.trim(),
        soilType: soilType,
        Query: Query.trim(),
        preferedVisitDate: preferedVisitDate,
      };

      console.log('Expert Visit Request Payload:', JSON.stringify(payload, null, 2));

      // Clean the token (remove quotes if present)
      const cleanedToken = userData.token.replace(/"/g, '');

      // Make the API request to the correct endpoint
      const response = await fetch(`${BASE_URL}/farmer/expert-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('POST Expert Visit Response Status:', response.status);
      const responseData = await response.json();
      console.log('POST Expert Visit API Response:', JSON.stringify(responseData, null, 2));

      if (response.ok) {
        // Success handling
        setError('');
        setSnackbarVisible(false);

        // Show success alert
        Alert.alert(
          'Expert Visit Request Submitted! 👨‍🌾',
          `✅ Your expert visit request has been successfully submitted.\n\n📍 Location: ${farmLocation}\n🌾 Crop Type: ${cropType}\n📐 Area: ${AreainHector} hectares\n📅 Preferred Date: ${new Date(preferedVisitDate).toLocaleDateString()}\n\n🔔 You will be notified once an expert is assigned to your request.`,
          [
            {
              text: 'View Requests',
              onPress: () => {
                fetchExpertVisitRequests();
                setRequestsModalVisible(true);
              },
            },
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );

        // Reset form fields after successful submission
        resetForm();

      } else {
        // Error handling
        let errorMessage = 'Failed to submit expert visit request.';

        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid request data. Please check your inputs.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('Expert Visit Request Error:', error);

      // Handle different types of errors
      let userFriendlyError = error.message;

      if (error.message.includes('Network request failed')) {
        userFriendlyError = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('Authentication')) {
        userFriendlyError = 'Authentication failed. Please log out and log in again.';
      } else if (error.message.includes('BASE_URL')) {
        userFriendlyError = 'Configuration error. Please contact support.';
      }

      setError(userFriendlyError);
      setSnackbarVisible(true);

    } finally {
      setSubmitPending(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setFarmLocation('');
    setSoilType('');
    setCropType('');
    setAreainHector('');
    setVisitPurpose('');
    setPreferedVisitDate('');
    setQuery('');
    setGeofenceCoordinates([]);
    setCurrentLocation(null);
    setAddressLocation('');
    setError('');
  };

  // Handle form submission
  const handleSubmit = submitExpertVisitRequest;

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
          placeholder="Tap to get current location & set visit area"
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
          <MaterialIcons name="person" size={20} color={colors.white} />
          <Text style={styles.openMapButtonText}>Open Map for Expert Visit Area</Text>
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
          <Text style={styles.mapHeaderTitle}>Expert Visit Area</Text>
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
                <Text style={styles.loadingText}>Loading Expert Visit Map...</Text>
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
        <Text style={styles.headerTitle}>Expert Visit</Text>
        <TouchableOpacity
          onPress={() => {
            fetchExpertVisitRequests();
            setRequestsModalVisible(true);
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

        {/* Area in Hectares */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Area in Hectares</Text>
          <TextInput
            style={[styles.input, error.includes('Area in Hectares') && styles.errorInput]}
            value={AreainHector}
            onChangeText={(text) => {
              setAreainHector(text);
              if (error.includes('Area in Hectares')) setError('');
            }}
            placeholder="Auto-filled from visit area or enter manually"
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

        {/* Visit Purpose - Dropdown */}
        <Text style={styles.label}>Visit Purpose</Text>
        <View style={[styles.pickerContainer, error.includes('Visit Purpose') && styles.errorInput]}>
          <Picker
            selectedValue={visitPurpose}
            onValueChange={(itemValue) => {
              if (itemValue !== '') {
                setVisitPurpose(itemValue);
                if (error.includes('Visit Purpose')) setError('');
              }
            }}
            style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : undefined}
          >
            <Picker.Item
              label="Select Visit Purpose"
              value=""
              color={Platform.OS === 'ios' ? '#999' : '#999'}
            />
            {visitPurposeOptions.map((purpose, index) => (
              <Picker.Item
                key={index.toString()}
                label={purpose}
                value={purpose}
                color={Platform.OS === 'ios' ? '#333' : '#333'}
              />
            ))}
          </Picker>
        </View>

        {/* Preferred Visit Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Preferred Visit Date</Text>
          <TouchableOpacity
            style={[styles.dateInputContainer, error.includes('Preferred Visit Date') && styles.errorInput]}
            onPress={showDatePicker}
            activeOpacity={0.7}
          >
            <TextInput
              style={styles.dateTextInput}
              placeholder="Select preferred visit date"
              value={preferedVisitDate ? new Date(preferedVisitDate).toLocaleDateString() : ''}
              editable={false}
              placeholderTextColor="gray"
            />
            <MaterialIcons name="calendar-today" size={moderateScale(24)} color={colors.primary} />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
          />
        </View>

        {/* Query */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Query</Text>
          <TextInput
            style={[styles.input, styles.textArea, error.includes('Query') && styles.errorInput]}
            value={Query}
            onChangeText={(text) => {
              setQuery(text);
              if (error.includes('Query')) setError('');
            }}
            placeholder="Enter your expert visit query or specific requirements"
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
            <Text style={styles.submitButtonText}>Request Expert Visit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Modal */}
      {renderMapModal()}

      {/* Expert Visit Requests Modal with PDF viewing */}
      <ExpertVisitRequestsModal />

      {/* PDF Viewer Modal */}
      <PdfViewerModal />

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
        {error ? error : 'Expert visit request submitted successfully!'}
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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(45),
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    backgroundColor: 'white',
  },
  dateTextInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    paddingVertical: 0,
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
  errorInput: {
    borderColor: 'red',
    borderWidth: 1.5,
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

  // Request Item Styles
  requestItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  requestIconContainer: {
    marginRight: horizontalScale(16),
    marginTop: verticalScale(4),
  },
  requestDetails: {
    flex: 1,
  },
  requestTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: verticalScale(4),
  },
  requestSubtitle: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    marginBottom: verticalScale(2),
  },
  requestArea: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    marginBottom: verticalScale(2),
  },
  requestDate: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    marginBottom: verticalScale(2),
  },
  requestStatus: {
    fontSize: moderateScale(12),
    color: colors.primary,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    marginBottom: verticalScale(4),
  },
  requestQuery: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
    marginBottom: verticalScale(8),
  },
  emptyRequestsView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  emptyRequestsText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(16),
    fontFamily: 'Poppins-SemiBold',
  },
  emptyRequestsSubtext: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(8),
    fontFamily: 'Poppins-Regular',
  },

  // PDF Button Styles
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    marginTop: verticalScale(8),
    alignSelf: 'flex-start',
  },
  pdfButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: horizontalScale(6),
    fontFamily: 'Poppins-SemiBold',
  },

  // PDF Modal Styles
  pdfModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  pdfHeader: {
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
  pdfHeaderTitle: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    marginHorizontal: horizontalScale(8),
  },
  pdfHeaderButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: horizontalScale(40),
    height: verticalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfWebView: {
    flex: 1,
  },
  pdfWebViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  pdfErrorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  pdfErrorText: {
    fontSize: moderateScale(16),
    color: colors.textSecondary,
    marginTop: verticalScale(16),
    fontFamily: 'Poppins-Medium',
  },
});

export default ExpertVisitScreen;