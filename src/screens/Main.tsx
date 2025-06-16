/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import {View, Text} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './HomeScreen';

import {blue} from '../utils/Colors';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import ProfileScreen from './ProfileScreen';
import FeedScreen from './FeedScreen';

const Tab = createBottomTabNavigator();

const Main = () => {
  return (
    <View style={{flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: blue,
          elevation: 5,
          alignItems: 'center',
          paddingHorizontal: horizontalScale(20),
          paddingTop: verticalScale(30),
          height: '12%',
        }}>
        <Text
          style={{
            fontSize: moderateScale(18),
            color: '#fff',
            fontFamily: 'Poppins-Bold',
            marginTop: verticalScale(6),
          }}>
          KrishiAadhar
        </Text>
      </View>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Feed') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Icon name={iconName} size={size} color={color} />; // Increase icon size
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: '#f5f5f5',
          tabBarStyle: {
            backgroundColor: blue, // Custom background color
            borderTopWidth: 0, // Remove border top
            height: verticalScale(50), // Adjust tab bar height
          },
          tabBarLabelStyle: {
            fontSize: moderateScale(10), // Increase text size
            fontFamily: 'Poppins-Regular', // Optional: Add font style
          },
          tabBarItemStyle: {
            paddingVertical: verticalScale(2), // Add padding for better spacing
          },
        })}>
        <Tab.Screen
          name="Home"
          options={{headerShown: false}}
          component={HomeScreen}
        />
        <Tab.Screen
          name="Feed"
          options={{headerShown: false}}
          component={FeedScreen}
        />
        <Tab.Screen
          name="Profile"
          options={{headerShown: false}}
          component={ProfileScreen}
        />
      </Tab.Navigator>
    </View>
  );
};

export default Main;
