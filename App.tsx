/* eslint-disable react-native/no-inline-styles */
import { View, Text, SafeAreaView, PermissionsAndroid, Platform, StatusBar } from 'react-native';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/Navigation/Navigation';
import { secondary_color } from './src/utils/Colors';
import { PaperProvider } from 'react-native-paper';
import messaging from '@react-native-firebase/messaging';
import NotificationService from './src/services/notificationService';

const App = () => {

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Initialize notifications
    await initializeNotifications();

    // Check if app was opened from a notification
    checkInitialNotification();
  };

  const initializeNotifications = async () => {
    try {
      // Request notification permissions
      await requestNotificationPermission();

      // Initialize notification service
      const hasPermission = await NotificationService.requestUserPermission();

      if (hasPermission) {
        console.log('✅ Notification permissions granted');
        // Get and log FCM token for testing
        const token = await NotificationService.getFCMToken();
        console.log('📱 FCM Token ready:', token ? 'Yes' : 'No');
      } else {
        console.log('❌ Notification permissions denied');
      }
    } catch (error) {
      console.log('🚨 Notification initialization error:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          // Android 13+ requires POST_NOTIFICATIONS permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'KrishiAadhar Notification Permission',
              message: 'Allow KrishiAadhar to send you important farming notifications and updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('✅ Android notification permission granted');
          } else {
            console.log('❌ Android notification permission denied');
          }
        }
      } catch (error) {
        console.log('🚨 Android permission request error:', error);
      }
    }
  };

  const checkInitialNotification = () => {
    // Check if app was opened from a notification when app was closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🚀 App opened from notification (quit state):', remoteMessage);
          // Handle navigation if needed
        }
      });
  };

  return (
    <PaperProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar
          backgroundColor={secondary_color}
          barStyle="light-content"
        />
        <SafeAreaView style={{ flex: 1, backgroundColor: secondary_color }}>
          <View style={{ flex: 1 }}>
            <Navigation />
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;