/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import {blue, lightBlue} from '../utils/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {BASE_URL} from '../utils/Constants';
import {useUserStore} from '../zustand/store';

const LoginForm = ({setIsRegistering, role}) => {
  const [focusedInput, setFocusedInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setUserData = useUserStore(state => state.setUserData);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();



  const handleLogin = async () => {
    setLoading(true);
    // if (!phoneNumber || !password ) {
    //   Alert.alert('Error', 'Please fill all fields');
    //   return;
    // }
    let URL = '';
    role === 'FARMER'
      ? (URL = `${BASE_URL}/farmer/login`)
      : (URL = `${BASE_URL}/expert/login`);

    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:
          role === 'FARMER'
            ? JSON.stringify({
                phoneNumber,
                password,
              })
            : JSON.stringify({
                email: email,
                password,
              }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data);
        setUserData(data?.response);
        await AsyncStorage.setItem('userData', JSON.stringify(data.response));
        setLoading(false);
        Alert.alert('Success', 'Login successful');
        navigation.navigate('Main');
      } else {
        setLoading(false);
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert('Error', 'Something went wrong, please try again');
    }
  };

  return (
    <>
      {/* Phone Input */}

      {role === 'FARMER' ? (
        <View
          style={{
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
          }}>
          <Feather
            name="phone"
            size={verticalScale(18)}
            color={focusedInput === 'phone' ? blue : 'gray'}
          />
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="gray"
            textContentType="telephoneNumber"
            style={{
              width: '90%',
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
              paddingHorizontal: horizontalScale(10),
              color: 'black',
            }}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onFocus={() => setFocusedInput('phone')}
            onBlur={() => setFocusedInput('')}
          />
        </View>
      ) : (
        <View
          style={{
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
          }}>
          <Feather
            name="mail"
            size={verticalScale(18)}
            color={focusedInput === 'mail' ? blue : 'gray'}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="gray"
            textContentType="emailAddress"
            style={{
              width: '90%',
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
              paddingHorizontal: horizontalScale(10),
              color: 'black',
            }}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('mail')}
            onBlur={() => setFocusedInput('')}
          />
        </View>
      )}

      {/* Password Input */}
      <View
        style={{
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
        }}>
        <Feather
          name="eye"
          size={verticalScale(18)}
          color={focusedInput === 'password' ? blue : 'gray'}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="gray"
          textContentType="password"
          style={{
            width: '90%',
            fontFamily: 'Poppins-Regular',
            fontSize: moderateScale(14),
            paddingHorizontal: horizontalScale(10),
            color: 'black',
          }}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput('')}
          secureTextEntry
        />
      </View>

      {/* Forgot Password */}
      {/* <View
        style={{
          width: '100%',
          marginTop: verticalScale(10),
        }}>
        <Text
          style={{
            fontFamily: 'Poppins-SemiBold',
            fontSize: moderateScale(13),
            color: blue,
            alignSelf: 'flex-end',
          }}>
          Forgot your password ?
        </Text>
      </View> */}

      {/* Continue Button */}
      <TouchableOpacity
        style={{
          backgroundColor: blue,
          width: '100%',
          height: verticalScale(45),
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: verticalScale(30),
        }}
        onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text
            style={{
              fontFamily: 'Poppins-Medium',
              fontSize: moderateScale(15),
              color: 'white',
            }}>
            Continue
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsRegistering(true)}
        style={{
          marginTop: verticalScale(20),
          cursor: 'pointer',
        }}>
        <Text
          style={{
            fontFamily: 'Poppins-Medium',
            color: 'black',
            textAlign: 'center',
            fontSize: moderateScale(12),
          }}>
          Create new account
        </Text>
      </TouchableOpacity>
    </>
  );
};

export default LoginForm;
