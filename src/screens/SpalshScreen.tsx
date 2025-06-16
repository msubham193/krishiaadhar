/* eslint-disable react-native/no-inline-styles */
import {View, Text, Image, StatusBar} from 'react-native';
import React, {useEffect} from 'react';
import {blue, primary_color, secondary_color} from '../utils/Colors';
import Animated, {
  BounceIn,
  BounceInLeft,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUserStore} from '../zustand/store';
const DURATION = 1000;
const DELAY = 500;
const SpalshScreen = ({navigation}: any) => {
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);

  const setUserData = useUserStore(state => state.setUserData);

  // const {userData} = useUserStore();

  // console.log(userData);

  useEffect(() => {
    opacity1.value = withDelay(0 * DELAY, withTiming(1, {duration: DURATION}));
    opacity2.value = withDelay(1 * DELAY, withTiming(1, {duration: DURATION}));
    opacity3.value = withDelay(2 * DELAY, withTiming(1, {duration: DURATION}));

    setTimeout(() => {
      getToken();
    }, 3000);
  });

  const getToken = async () => {
    console.log('Subham');
    const userdata = JSON.parse(await AsyncStorage.getItem('userData'));

    // console.log('Subham' + userdata);
    setUserData(userdata);

    if (userdata?.token) {
      navigation.navigate('Main');
    } else {
      navigation.navigate('Welcome');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: secondary_color,
      }}>
      <Animated.Image
        source={require('../assets/images/icon.png')}
        style={{
          opacity: opacity1,
          width: horizontalScale(120),
          height: verticalScale(120),
          resizeMode: 'contain',
          // transform: [{scale: opacity1.value * 1.2}],
        }}
      />
      <Animated.Text
        style={{
          fontSize: moderateScale(20),
          color: blue,
          fontFamily: 'Poppins-Bold',
          opacity: opacity2,
          marginTop: verticalScale(2),
        }}>
        KRISHIAADHAR
      </Animated.Text>
    </View>
  );
};

export default SpalshScreen;
