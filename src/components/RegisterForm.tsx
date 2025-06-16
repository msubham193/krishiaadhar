/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import {blue, lightBlue} from '../utils/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import {useUserStore} from '../zustand/store';
import {BASE_URL} from '../utils/Constants';

const RegisterForm = ({setIsRegistering, role}) => {
  const [focusedInput, setFocusedInput] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [location, setLocation] = useState('');
  const [token, setToken] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [fetchLoc, isFetch] = useState(false);
  const setUserData = useUserStore(state => state.setUserData);

  const navigation = useNavigation();

  useEffect(() => {
    if (showProfileModal) {
      fetchLocation();
    }
  }, [showProfileModal]);

  const fetchLocation = async () => {
    isFetch(true);
    fetchLocationFromApi(20.175243350000002, 85.70674392837967);
    // Geolocation.getCurrentPosition(
    //   position => {
    //     const {latitude, longitude} = position.coords;

    //     console.log(latitude);

    //     isFetch(false);
    //   },
    //   error => {
    //     isFetch(false);
    //     console.log(error.code, error.message);
    //     setLocation('Location not available');
    //   },
    //   {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    // );
  };

  const fetchLocationFromApi = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=85.70674392837967&latitude=20.175243350000002&access_token=pk.eyJ1IjoibXN1YmhhbTE5MyIsImEiOiJjbTB1MmcwbDIwb2FvMmlyNmhnZ2Voajd6In0.HwRZQK2dvHGL18cKArc_3A`,
      );

      const json = await response.json();
      console.log(json[0]);
      setLocation(json.features[0].properties.name);
      await AsyncStorage.setItem(
        'location',
        JSON.stringify(json.features[0].properties.name),
      );
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to fetch location');
    }
  };

  const handleRegister = async () => {
    if (!name || !phoneNumber || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    console.log(role);
    setIsLoading(true);

    let URL = '';
    role === 'FARMER'
      ? (URL = `${BASE_URL}/farmer`)
      : (URL = `${BASE_URL}/expert`);

    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:
          role === 'FARMER'
            ? JSON.stringify({
                name,
                phoneNumber,
                password,
              })
            : JSON.stringify({
                name,
                phoneNumber,
                password,
                email: email,
              }),
      });
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        console.log(data?.response);
        setUserData(data?.response);
        setToken(data?.response?.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data?.response));
        // setShowProfileModal(true);
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorMessage);
      } else if (result.assets && result.assets.length > 0) {
        const source = {uri: result.assets[0].uri};
        setProfileImage(source);
      }
    } catch (error) {
      console.error('Error in image picker:', error);
    }
  };

  const handleSkip = () => {
    setShowProfileModal(false);
    navigation.navigate('Main');
  };

  const handleComplete = async () => {
    setIsCompleting(true);

    let URL = '';
    role === 'FARMER'
      ? (URL = 'http://47.247.12.114:3001/api/farmer/update')
      : (URL = 'http://47.247.12.114:3001/api/expert/update');

    try {
      const formData = new FormData();

      if (profileImage) {
        formData.append('image', {
          uri: profileImage.uri,
          type: 'image/jpeg',
          name: profileImage.uri.split('/').pop(),
        });
      }

      formData.append('location', location);

      const response = await fetch(URL, {
        method: 'PUT',
        headers: {
          'x-access-token': token,
        },
        body: formData,
      });

      const data = await response.json();

      console.log(data);
      if (response.ok) {
        console.log(data?.response);
        await AsyncStorage.setItem('userData', JSON.stringify(data?.response));

        navigation.navigate('Main');
      } else {
        Alert.alert('Error', data.message || 'Update failed');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong, please try again');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Name Input */}
      <View
        style={[
          styles.inputContainer,
          focusedInput === 'name' && styles.focusedInput,
        ]}>
        <Feather
          name="user"
          size={verticalScale(18)}
          color={focusedInput === 'name' ? blue : 'gray'}
        />
        <TextInput
          placeholder="Name"
          placeholderTextColor="gray"
          style={styles.input}
          value={name}
          onChangeText={setName}
          onFocus={() => setFocusedInput('name')}
          onBlur={() => setFocusedInput('')}
        />
      </View>

      {role !== 'FARMER' && (
        <View
          style={[
            styles.inputContainer,
            focusedInput === 'email' && styles.focusedInput,
          ]}>
          <Feather
            name="mail"
            size={verticalScale(18)}
            color={focusedInput === 'phone' ? blue : 'gray'}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="gray"
            textContentType="emailAddress"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput('')}
          />
        </View>
      )}

      {/* Phone Number Input */}
      <View
        style={[
          styles.inputContainer,
          focusedInput === 'phone' && styles.focusedInput,
        ]}>
        <Feather
          name="phone"
          size={verticalScale(18)}
          color={focusedInput === 'phone' ? blue : 'gray'}
        />
        <TextInput
          placeholder="Phone Number"
          placeholderTextColor="gray"
          textContentType="telephoneNumber"
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onFocus={() => setFocusedInput('phone')}
          onBlur={() => setFocusedInput('')}
        />
      </View>

      {/* Password Input */}
      <View
        style={[
          styles.inputContainer,
          focusedInput === 'password' && styles.focusedInput,
        ]}>
        <Feather
          name="lock"
          size={verticalScale(18)}
          color={focusedInput === 'password' ? blue : 'gray'}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="gray"
          textContentType="password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput('')}
          secureTextEntry
        />
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleRegister}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsRegistering(false)}
        style={styles.loginLink}>
        <Text style={styles.loginLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>

      {/* Profile Completion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              <Text style={styles.modalTitle}>
                Hi {name}, let's add more to your profile!
              </Text>

              <TouchableOpacity onPress={handleImageUpload}>
                {profileImage ? (
                  <Image source={profileImage} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Feather name="camera" size={30} color={blue} />
                    <Text style={styles.uploadText}>Upload Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Feather name="map-pin" size={verticalScale(18)} color={blue} />
                <Text style={styles.locationText}>
                  {fetchLoc ? 'Fetching...' : location}
                </Text>
              </View>

              {location ? (
                <TouchableOpacity onPress={fetchLocation} style={{}}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-SemiBold',
                      color: blue,
                    }}>
                    Re-fetch
                  </Text>
                </TouchableOpacity>
              ) : (
                ''
              )}

              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
                disabled={isCompleting}>
                {isCompleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.completeButtonText}>
                    Complete Profile
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: verticalScale(2),
    backgroundColor: lightBlue,
    marginTop: verticalScale(20),
    borderRadius: 10,
    paddingHorizontal: horizontalScale(10),
  },
  focusedInput: {
    borderColor: blue,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: moderateScale(13),
    paddingHorizontal: horizontalScale(10),
    color: 'black',
    // backgroundColor:'red'
  },
  continueButton: {
    backgroundColor: blue,
    width: '100%',
    height: verticalScale(45),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(30),
  },
  continueButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(15),
    color: 'white',
  },
  loginLink: {
    marginTop: verticalScale(20),
  },
  loginLinkText: {
    fontFamily: 'Poppins-Medium',
    color: 'black',
    textAlign: 'center',
    fontSize: moderateScale(12),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  scrollViewContent: {
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-Medium',
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: verticalScale(20),
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  uploadText: {
    marginTop: verticalScale(5),
    color: blue,
    fontFamily: 'Poppins-Regular',
    fontSize: moderateScale(12),
  },
  locationText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: moderateScale(14),
    paddingHorizontal: horizontalScale(10),
    color: 'black',
  },
  completeButton: {
    backgroundColor: blue,
    paddingVertical: verticalScale(10),
    paddingHorizontal: horizontalScale(20),
    borderRadius: 10,
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  completeButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(14),
  },
  skipText: {
    color: blue,
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(14),
    marginTop: verticalScale(10),
  },
});

export default RegisterForm;
