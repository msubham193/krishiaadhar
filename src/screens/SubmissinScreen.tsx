import React, { useEffect } from 'react'; // Import useEffect
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale, verticalScale, horizontalScale } from '../utils/metrics'; // Assuming these are available
import { blue } from '../utils/Colors'; // Assuming this color is defined

const SubmissionSuccessScreen = ({ navigation, route }) => {
  // Get message from navigation params, or use a default
  const message = route.params?.message || 'Your request has been submitted successfully!';
  // Default to 'Main' or a more appropriate services screen in your app.
  // Using 'Main' as it's likely a central point in your navigation.
  const navigateBackTo = route.params?.navigateBackTo || 'Main';

  const handleGoBack = () => {
    // Check if a specific screen to navigate back to was provided.
    // If yes, navigate to it. This is generally preferred for specific return paths.
    if (route.params?.navigateBackTo) {
        navigation.navigate(navigateBackTo);
    }
    // If not, try to pop to the top of the stack. This effectively clears intermediate screens.
    // Use canGoBack() for safety, though popToTop often handles an empty stack gracefully.
    else if (navigation.canGoBack()) {
        navigation.popToTop();
    }
    // As a final fallback, navigate to the 'Main' screen.
    else {
        navigation.navigate('Main');
    }
  };

  // Automatically navigate back after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGoBack(); // Call the navigation function after the delay
    }, 2000); // Navigate after 3 seconds

    // Cleanup the timer if the component unmounts before the delay finishes
    return () => clearTimeout(timer);
  }, [navigation, navigateBackTo]); // Re-run effect if navigation object or target screen changes

  return (
    <View style={styles.container}>
      {/* Back button at the top-left */}
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={moderateScale(28)} color="white" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Ionicons
          name="checkmark-circle-outline" // Success icon
          size={moderateScale(100)}
          color="white" // Icon color changed to white for contrast on green background
          style={styles.icon}
        />
        <Text style={styles.title}>Success!</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32', // Full green background
    alignItems: 'center', // Center content horizontally
    paddingTop: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(30), // Adjust padding for status bar
    paddingHorizontal: horizontalScale(20),
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20), // Position from top
    left: horizontalScale(20), // Position from left
    zIndex: 1, // Ensure it's above other content
    padding: horizontalScale(5), // Add some touch padding
  },
  contentContainer: {
    flex: 1, // Takes remaining space
    justifyContent: 'center', // Center content vertically within its container
    alignItems: 'center',
    width: '100%', // Ensure it takes full width
  },
  icon: {
    marginBottom: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(30),
    fontWeight: 'bold',
    color: 'white', // Text color changed to white for contrast
    marginBottom: verticalScale(10),
    fontFamily: 'Poppins-Bold',
  },
  message: {
    fontSize: moderateScale(16),
    color: 'white', // Text color changed to white for contrast
    textAlign: 'center',
    marginBottom: verticalScale(30),
    fontFamily: 'Poppins-Regular',
    lineHeight: verticalScale(24),
  },
});

export default SubmissionSuccessScreen;