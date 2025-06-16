// WelcomeScreen.js
import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {moderateScale, verticalScale} from '../utils/metrics';
import {blue} from '../utils/Colors';

const {width, height} = Dimensions.get('window');

export default function WelcomeScreen({navigation}) {
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../assets/images/welcome.webp')}
        style={styles.backgroundImage}
        resizeMode="cover">
        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(0,0,0,0.6)',
            'rgba(0,0,0,0.8)',
            'rgba(0,0,0,0.9)',
          ]}
          style={styles.gradient}
          locations={[0, 0.4, 0.7, 1]}
        />

        {/* Status Bar Time */}

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Welcome Text */}
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeTitle}>Welcome to Krishi Aadhar</Text>
            <Text style={styles.welcomeSubtitle}>Empowered to Aspire</Text>
          </View>

          {/* Buttons Container */}
          <View style={styles.buttonsContainer}>
            {/* Create Account Button */}
            <TouchableOpacity
              style={styles.createAccountButton}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('Authentication', {
                  role: 'FARMER',
                })
              }>
              <Text style={styles.createAccountButtonText}>
                Sign in as Farmer
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('Authentication', {
                  role: 'AGRIEXPERT',
                })
              }>
              <Text style={styles.loginButtonText}>Sign in as Agri Expert</Text>
            </TouchableOpacity>

            {/* Continue as Staff */}
          </View>

          {/* Bottom Indicator */}
          <View style={styles.bottomIndicator} />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Prevents white flash when loading
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.85, // Gradient covers 85% of the screen height
    zIndex: 1,
  },
  safeArea: {
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
  },
  timeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    zIndex: 2,
  },
  welcomeTextContainer: {
    marginBottom: 64,
    alignItems: 'center',
    width: '100%',
  },
  welcomeTitle: {
    color: 'white',
    fontSize: moderateScale(25),

    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  welcomeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  buttonsContainer: {
    gap: 16,
    width: '100%',
    paddingBottom: 24,
  },
  createAccountButton: {
    backgroundColor: blue,
    paddingVertical: verticalScale(16),
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createAccountButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Medium',
  },
  loginButton: {
    borderWidth: 1,
    borderColor: 'white',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: moderateScale(14),

    fontFamily: 'Poppins-Medium',
  },
  staffButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  staffButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
});
