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

const CropTrackerCreateScreen = ({ navigation }) => {
    const userData = useUserStore((state) => state.userData);
    const [createPending, setCreatePending] = useState(false);
    const [projectTitle, setProjectTitle] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [cropName, setCropName] = useState('');
    const [cropType, setCropType] = useState('');
    const [fieldSize, setFieldSize] = useState('');
    const [season, setSeason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [seedVariety, setSeedVariety] = useState('');
    const [cropVariety, setCropVariety] = useState('');
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    // Location and Map related states
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [geofenceCoordinates, setGeofenceCoordinates] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [addressLocation, setAddressLocation] = useState('');

    // States for custom dropdowns
    const [cropTypeModalVisible, setCropTypeModalVisible] = useState(false);
    const [seasonModalVisible, setSeasonModalVisible] = useState(false);

    // States for created calendars
    const [availableCalendars, setAvailableCalendars] = useState([]);
    const [viewCalendarModalVisible, setViewCalendarModalVisible] = useState(false);

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
            // Using OpenStreetMap Nominatim API (free)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'CropTrackerApp/1.0'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('Geocoding response:', data);

                if (data && data.address) {
                    const address = data.address;
                    let locationString = '';

                    // Build location string from available components
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

                    // Fallback to display_name if components not available
                    if (!locationString && data.display_name) {
                        const parts = data.display_name.split(',');
                        locationString = parts.slice(0, 3).join(', '); // Take first 3 parts
                    }

                    return locationString || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                }
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }

        // Fallback to coordinates if geocoding fails
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

                // Get human-readable address
                const address = await reverseGeocode(latitude, longitude);
                setAddressLocation(address);
                setLocation(address);

                setLocationLoading(false);

                // Automatically open map for geofencing
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
            
            // Initialize map
            function initMap() {
                map = L.map('map').setView([${latitude}, ${longitude}], 16);
                
                // Add OpenStreetMap tiles (free)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(map);
                
                // Add current location marker
                L.marker([${latitude}, ${longitude}])
                    .addTo(map)
                    .bindPopup('📍 Current Location')
                    .openPopup();
                
                // Handle map clicks
                map.on('click', function(e) {
                    if (coordinates.length < 4) {
                        addPoint(e.latlng.lat, e.latlng.lng);
                    } else {
                        alert('Maximum 4 points allowed for geofencing!');
                    }
                });
            }
            
            // Add geofence point
            function addPoint(lat, lng) {
                // Add marker
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
            
            // Update geofence polygon
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
                    
                    // Fit map to polygon bounds
                    if (coordinates.length >= 3) {
                        map.fitBounds(polygon.getBounds(), { padding: [20, 20] });
                    }
                }
            }
            
            // Calculate area using Shoelace formula
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
                
                // Convert to acres
                const areaInAcres = areaInSqMeters / 4046.86;
                
                return areaInAcres;
            }
            
            // Update UI elements
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
                
                // Update coordinate list
                const listElement = document.getElementById('coordinateList');
                listElement.innerHTML = coordinates.map((coord, index) => 
                    '<div>Point ' + (index + 1) + ': ' + coord[0].toFixed(6) + ', ' + coord[1].toFixed(6) + '</div>'
                ).join('');
            }
            
            // Clear all geofence points
            function clearGeofence() {
                markers.forEach(marker => map.removeLayer(marker));
                if (polygon) map.removeLayer(polygon);
                
                markers = [];
                coordinates = [];
                polygon = null;
                
                updateUI();
            }
            
            // Apply geofence
            function applyGeofence() {
                if (coordinates.length < 3) {
                    alert('Please add at least 3 points to create a geofence.');
                    return;
                }
                
                const area = calculateArea(coordinates);
                const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
                const centerLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
                
                // Send data back to React Native
                const result = {
                    coordinates: coordinates.map(coord => ({ latitude: coord[0], longitude: coord[1] })),
                    area: area.toFixed(2),
                    center: { latitude: centerLat, longitude: centerLng },
                    location: '${addressLocation}'
                };
                
                window.ReactNativeWebView.postMessage(JSON.stringify(result));
            }
            
            // Initialize map when page loads
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

    // Fetch available calendars for view calendar functionality
    const fetchAvailableCalendars = async () => {
        try {
            if (!userData?.token) {
                throw new Error('User token is not available. Please log in again.');
            }

            const cleanedToken = userData.token.replace(/"/g, '');
            const url = `${BASE_URL}/farmer/cropcalendars`; // Endpoint to fetch created calendars

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': cleanedToken,
                },
            });

            const responseBody = await response.json();

            if (response.ok && responseBody.calendars) {
                setAvailableCalendars(responseBody.calendars);
            } else {
                setAvailableCalendars([]);
            }
        } catch (error) {
            console.error('Error fetching calendars:', error);
            setAvailableCalendars([]);
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
        fetchAvailableCalendars();
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
        if (!location.trim()) {
            setError('Location is required');
            return false;
        }
        if (!fieldSize || isNaN(fieldSize) || parseFloat(fieldSize) <= 0) {
            setError('Field size should be a positive number');
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
        if (!cropVariety.trim()) {
            setError('Crop Variety is required');
            return false;
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

    // View Calendar Modal Component
    const ViewCalendarModal = () => (
        <Modal
            visible={viewCalendarModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setViewCalendarModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.viewCalendarModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Calendar to View</Text>
                        <TouchableOpacity
                            onPress={() => setViewCalendarModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <MaterialIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {availableCalendars.length > 0 ? (
                        <FlatList
                            data={availableCalendars}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.calendarItem}
                                    onPress={() => {
                                        setViewCalendarModalVisible(false);
                                        navigation.navigate('ViewCropCalendar', { calendarId: item.id });
                                    }}
                                >
                                    <View style={styles.calendarItemContent}>
                                        <MaterialIcons name="event" size={24} color={blue} />
                                        <View style={styles.calendarDetails}>
                                            <Text style={styles.calendarTitle}>{item.projectName}</Text>
                                            <Text style={styles.calendarSubtitle}>
                                                {item.cropName} - {item.season}
                                            </Text>
                                            <Text style={styles.calendarDate}>
                                                {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.emptyCalendarView}>
                            <MaterialIcons name="event-note" size={48} color={colors.textSecondary} />
                            <Text style={styles.emptyCalendarText}>No calendars available</Text>
                            <Text style={styles.emptyCalendarSubtext}>
                                Create a crop calendar first to view it here
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );

    // Map Modal with WebView
    const renderMapModal = () => (
        <Modal
            visible={mapModalVisible}
            animationType="slide"
            onRequestClose={() => setMapModalVisible(false)}
        >
            <View style={styles.mapModalContainer}>
                {/* Header */}
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

                {/* Map WebView */}
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

    // Create crop tracker
    const createCropTracker = async () => {
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
                location: location.trim(),
                fieldSize: parseFloat(fieldSize),
                seedVariety: seedVariety.trim(),
                cropVariety: cropVariety.trim(),
                season,
                startDate: new Date(startDate).toISOString(),
                geofenceCoordinates: geofenceCoordinates.length >= 3 ? geofenceCoordinates : null,
                currentLocation: currentLocation,
                addressLocation: addressLocation,
            };

            // Additional validation to catch issues before API call
            if (!payload.projectName || !payload.projectDescription || !payload.cropName || !payload.seedVariety || !payload.cropVariety || !payload.location) {
                throw new Error('All text fields must be non-empty.');
            }
            if (isNaN(payload.fieldSize) || payload.fieldSize <= 0) {
                throw new Error('Field size must be a positive number.');
            }
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
            const url = `${BASE_URL}/farmer/croptracker`;

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
                        navigation.navigate('yourcroptracker', { id: responseBody.response.id });
                    } else {
                        console.warn('Navigation not available');
                    }
                }, 1500);
            } else {
                throw new Error('Invalid response: No ID returned from server.');
            }
        } catch (error) {
            console.error('Error creating Crop Tracker:', error.message);
            setError(`Failed to create crop tracker: ${error.message}`);
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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? verticalScale(40) : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleBackPress}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Crop Tracker</Text>
            </View>

            {/* Form Content */}
            <ScrollView
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Project Details Section */}
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

                {/* Crop Details Section */}
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

                {/* Location Section - Field Size moved below Location */}
                <Text style={styles.sectionTitle}>Location & Field Details</Text>

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

                {/* Planting Details Section */}
                <Text style={styles.sectionTitle}>Planting Details</Text>

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

                {/* View Calendar Section */}
                <Text style={styles.sectionTitle}>View Calendar</Text>
                <TouchableOpacity
                    style={styles.viewCalendarButton}
                    onPress={() => {
                        fetchAvailableCalendars();
                        setViewCalendarModalVisible(true);
                    }}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="calendar-view-month" size={24} color={colors.white} />
                    <Text style={styles.viewCalendarButtonText}>View Created Calendars</Text>
                </TouchableOpacity>

                <View style={{ height: verticalScale(100) }} />
            </ScrollView>

            {/* Create Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.createButton, createPending && styles.disabledButton]}
                    onPress={createCropTracker}
                    activeOpacity={0.7}
                    disabled={createPending}
                >
                    {createPending ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Create Crop Tracker</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Map Modal */}
            {renderMapModal()}

            {/* View Calendar Modal */}
            <ViewCalendarModal />

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
                {error ? error : 'Crop tracker created successfully!'}
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
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: moderateScale(8),
        backgroundColor: colors.white,
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
    viewCalendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: blue,
        borderRadius: moderateScale(8),
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(16),
        marginBottom: verticalScale(16),
    },
    viewCalendarButtonText: {
        color: colors.white,
        fontSize: moderateScale(14),
        fontWeight: '600',
        marginLeft: horizontalScale(8),
        fontFamily: 'Poppins-SemiBold',
    },
    errorInput: {
        borderColor: colors.error,
        borderWidth: 1.5,
    },
    // Custom Dropdown Styles
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
    disabledButton: {
        backgroundColor: colors.textSecondary,
        opacity: 0.7,
    },
    snackbar: {
        marginHorizontal: horizontalScale(20),
        borderRadius: moderateScale(8),
        marginBottom: verticalScale(10),
    },

    // View Calendar Modal Styles
    viewCalendarModal: {
        width: '95%',
        height: '70%',
        backgroundColor: colors.white,
        borderRadius: moderateScale(16),
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    calendarItem: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    calendarItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
    },
    calendarDetails: {
        flex: 1,
        marginLeft: horizontalScale(12),
    },
    calendarTitle: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: colors.text,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: verticalScale(4),
    },
    calendarSubtitle: {
        fontSize: moderateScale(14),
        color: colors.textSecondary,
        fontFamily: 'Poppins-Regular',
        marginBottom: verticalScale(2),
    },
    calendarDate: {
        fontSize: moderateScale(12),
        color: colors.textSecondary,
        fontFamily: 'Poppins-Regular',
    },
    emptyCalendarView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: moderateScale(40),
    },
    emptyCalendarText: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: verticalScale(16),
        fontFamily: 'Poppins-SemiBold',
    },
    emptyCalendarSubtext: {
        fontSize: moderateScale(14),
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: verticalScale(8),
        fontFamily: 'Poppins-Regular',
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
});

export default CropTrackerCreateScreen;