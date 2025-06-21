import {View, Text, StatusBar} from 'react-native';
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import SpalshScreen from '../screens/SpalshScreen';

import Main from '../screens/Main';
import CropCalendarScreen from '../screens/CropCalenderScreen';
import CalendarScreen from '../screens/CalenderScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthenticationScreen from '../screens/AuthenticationScreen';
import YourCropCalenderScreen from '../screens/YourCropCalenderScreen';
import CropCalenderCreateScreen from '../screens/CropCalenderCreateScreen';
import SmartIrrigationScreen from '../screens/SmartIrrigationScreen';
import DroneSprayingScreen from '../screens/DroneSparyingScreen';
import SoilHealthMapScreen from '../screens/SoilHealthMapScreen';
import TermsAndPrivacypolicies from '../screens/Terms&Privacypolicies';
import CropHealthMonitor from '../screens/CropHealthScreen';
import ExpertVisitScreen from '../screens/ExpertVisitScreen';
import SubmissionSuccessScreen from '../screens/SubmissinScreen';
const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Stack.Navigator>
        <Stack.Screen
          name="Spalsh"
          options={{headerShown: false}}
          component={SpalshScreen}
        />

        <Stack.Screen
          name="Welcome"
          options={{headerShown: false}}
          component={WelcomeScreen}
        />

        <Stack.Screen
          name="Authentication"
          options={{headerShown: false}}
          component={AuthenticationScreen}
        />
        <Stack.Screen
          name="Main"
          options={{
            headerShown: false,
          }}
          component={Main}
        />

        <Stack.Screen
          name="CropCalendar"
          options={{
            headerShown: false,
          }}
          component={CropCalendarScreen}
        />

        <Stack.Screen
          name="Calendar"
          options={{
            headerShown: false,
          }}
          component={CalendarScreen}
        />
        <Stack.Screen
          name="yourcropcalendar"
          options={{
            headerShown: false,
          }}
          component={YourCropCalenderScreen}
        />

        <Stack.Screen
          name="TermsandService"
          options={{
            headerShown: false,
          }}
          component={TermsAndPrivacypolicies}
        />

        <Stack.Screen
          name="createCropCalendar"
          options={{
            headerShown: false,
          }}
          component={CropCalenderCreateScreen}
        />

        <Stack.Screen
          name="smartirrigation"
          options={{
            headerShown: false,
          }}
          component={SmartIrrigationScreen}
        />
        <Stack.Screen
          name="dronesparying"
          options={{
            headerShown: false,
          }}
          component={DroneSprayingScreen}
        />

        <Stack.Screen
          name="soilhealthmap"
          options={{
            headerShown: false,
          }}
          component={SoilHealthMapScreen}
        />

        <Stack.Screen
          name="crophealthmonitor"
          options={{
            headerShown: false,
          }}
          component={CropHealthMonitor}
        />
        <Stack.Screen
          name="expertvisit"
          options={{
            headerShown: false,
          }}
          component={ExpertVisitScreen}
        />

        <Stack.Screen name='SubmissionSuccess' options={{
          headerShown:false
        }} component={SubmissionSuccessScreen}/>

        {/* <Stack.Screen
          name="Calendar"
          options={{
            headerShown: false,
          }}
          component={CalendarScreen}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
