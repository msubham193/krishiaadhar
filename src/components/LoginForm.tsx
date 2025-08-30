/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { horizontalScale, moderateScale, verticalScale } from '../utils/metrics';
import { blue, lightBlue } from '../utils/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../utils/Constants';
import { useUserStore } from '../zustand/store';
import FCMAuthHelper from '../utils/FCMAuthHelper';

const LoginForm = ({ setIsRegistering, role }) => {
  const [focusedInput, setFocusedInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setUserData = useUserStore(state => state.setUserData);
  const [loading, setLoading] = useState(false);

  // OTP Related States
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);

  const navigation = useNavigation();

  // Timer for OTP resend
  useEffect(() => {
    let interval;
    if (showOTPModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOTPModal, resendTimer]);

  const handleLogin = async () => {
    if (role === 'FARMER' && !phoneNumber) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    if (role !== 'FARMER' && !email) {
      Alert.alert('Error', 'Please enter email');
      return;
    }

    setLoading(true);

    try {
      // Send OTP for login
      const response = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role,
          phoneNumber: phoneNumber,
        }),
      });

      const data = await response.json();
      console.log('Send OTP response:', data);

      if (response.ok && data.Status === 'Success') {
        Alert.alert('Success', data.message || 'OTP sent successfully');
        setShowOTPModal(true);
        setResendTimer(30);
        setCanResend(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value, index) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    // Auto focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsVerifyingOTP(true);

    let URL = '';
    if (role === 'FARMER') {
      URL = `${BASE_URL}/auth/farmer/authenticate`;
    } else {
      URL = `${BASE_URL}/auth/expert/authenticate`;
    }

    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          otp: otpString,
        }),
      });

      const data = await response.json();
      console.log('OTP verification response:', data);

      if (response.ok && data.Status === 'Account Verification Sucessfull') {
        Alert.alert('Success', 'Login successful');

        // Store user data in Zustand store
        setUserData({
          token: data.token,
          role: data.role,
          name: data.name,
        });

        // Store userData for backward compatibility
        await AsyncStorage.setItem('userData', JSON.stringify({
          token: data.token,
          role: data.role,
          name: data.name,
        }));

        // Store access token specifically for FCM
        await AsyncStorage.setItem('access_token', data.token);

        // Setup FCM with authentication
        try {
          console.log('Setting up FCM after successful login...');
          const fcmResult = await FCMAuthHelper.onUserLogin(data.token);
          console.log('FCM setup result after login:', fcmResult);

          if (fcmResult.success) {
            console.log('FCM notifications enabled successfully');
          } else {
            console.log('FCM setup had issues, but login continues:', fcmResult.error);
          }
        } catch (error) {
          console.log('FCM setup error after login (non-blocking):', error);
        }

        setShowOTPModal(false);
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Something went wrong, please try again');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role,
          phoneNumber: phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok && data.Status === 'Success') {
        Alert.alert('Success', 'OTP resent successfully');
        setResendTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']); // Clear previous OTP
      } else {
        Alert.alert('Error', data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Phone/Email Input */}
      {role === 'FARMER' ? (
        <View style={styles.inputContainer}>
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
      ) : (
        <View style={styles.inputContainer}>
          <Feather
            name="mail"
            size={verticalScale(18)}
            color={focusedInput === 'mail' ? blue : 'gray'}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="gray"
            textContentType="emailAddress"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('mail')}
            onBlur={() => setFocusedInput('')}
          />
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.continueButtonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsRegistering(true)}
        style={styles.registerLink}>
        <Text style={styles.registerLinkText}>Create new account</Text>
      </TouchableOpacity>

      {/* OTP Verification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showOTPModal}
        onRequestClose={() => setShowOTPModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContent}>
            <View style={styles.otpHeader}>
              <TouchableOpacity
                onPress={() => setShowOTPModal(false)}
                style={styles.backButton}>
                <Feather name="arrow-left" size={24} color={blue} />
              </TouchableOpacity>
              <Text style={styles.otpTitle}>Verify OTP</Text>
            </View>

            <Text style={styles.otpSubtitle}>
              Enter the 6-digit code sent to {role === 'FARMER' ? phoneNumber : email}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => otpRefs.current[index] = ref}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, isVerifyingOTP && styles.disabledButton]}
              onPress={handleVerifyOTP}
              disabled={isVerifyingOTP}>
              {isVerifyingOTP ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={!canResend}>
                <Text style={[styles.resendLink, !canResend && styles.disabledText]}>
                  {canResend ? 'Resend' : `Resend in ${resendTimer}s`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: verticalScale(2),
    backgroundColor: lightBlue,
    marginTop: verticalScale(20),
    borderRadius: 10,
    paddingHorizontal: horizontalScale(10),
  },
  input: {
    width: '90%',
    fontFamily: 'Poppins-Regular',
    fontSize: moderateScale(14),
    paddingHorizontal: horizontalScale(10),
    color: 'black',
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
  registerLink: {
    marginTop: verticalScale(20),
    cursor: 'pointer',
  },
  registerLinkText: {
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
  otpModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
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
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  otpTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginLeft: -34, // Compensate for back button width
  },
  otpSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: lightBlue,
    borderRadius: 10,
    fontSize: moderateScale(18),
    fontFamily: 'Poppins-SemiBold',
    color: blue,
  },
  verifyButton: {
    backgroundColor: blue,
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(30),
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: moderateScale(16),
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: 'gray',
  },
  resendLink: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-SemiBold',
    color: blue,
  },
  disabledText: {
    color: 'gray',
  },
});

export default LoginForm;