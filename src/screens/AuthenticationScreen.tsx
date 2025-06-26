/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
  Animated,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {blue, lightBlue, secondary_color} from '../utils/Colors';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
// import AntDesign from 'react-native-vector-icons/FontAwesome';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';

import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const {height} = Dimensions.get('window');
// import auth from '@react-native-firebase/auth';
// import {GoogleSignin} from '@react-native-google-signin/google-signin';
// import {LoginManager, AccessToken, Settings} from 'react-native-fbsdk-next';

const AuthenticationScreen = ({navigation, route}) => {
  const {role} = route.params;
  const [isRegistering, setIsRegistering] = useState(false);

  // useEffect(() => {
  //   Settings.initializeSDK();
  //   GoogleSignin.configure({
  //     webClientId:
  //       '1055295740060-4jv4635b23cc8sdcqbvvkg5r92fokr3k.apps.googleusercontent.com',
  //   });
  // }, []);

  // async function onGoogleButtonPress() {
  //   try {
  //     await GoogleSignin.hasPlayServices({
  //       showPlayServicesUpdateDialog: true,
  //     });

  //     const signInResult = await GoogleSignin.signIn();

  //     const googleCredential = auth.GoogleAuthProvider.credential(
  //       signInResult?.data?.idToken,
  //     );

  //     const userCredential = await auth().signInWithCredential(
  //       googleCredential,
  //     );

  //     // Fetch user details
  //     const {displayName, email, phoneNumber, photoURL} = userCredential.user;

  //     console.log('Google User Details:', {
  //       name: displayName,
  //       email,
  //       phone: phoneNumber,
  //       profileImage: photoURL,
  //     });

  //     // Navigate to Main screen
  //     navigation.navigate('Main', {
  //       user: {
  //         name: displayName,
  //         email,
  //         phone: phoneNumber,
  //         profileImage: photoURL,
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Google Sign-In Error:', error);
  //   }
  // }

  // async function onFacebookButtonPress() {
  //   try {
  //     const result = await LoginManager.logInWithPermissions([
  //       'public_profile',
  //       'email',
  //     ]);

  //     if (result.isCancelled) {
  //       console.warn('User cancelled the login process');
  //       return;
  //     }

  //     const data = await AccessToken.getCurrentAccessToken();

  //     if (!data) {
  //       console.error('Something went wrong obtaining access token');
  //       return;
  //     }

  //     const facebookCredential = auth.FacebookAuthProvider.credential(
  //       data.accessToken,
  //     );

  //     const userCredential = await auth().signInWithCredential(
  //       facebookCredential,
  //     );

  //     // Fetch user details
  //     const {displayName, email, phoneNumber, photoURL} = userCredential.user;

  //     console.log('Facebook User Details:', {
  //       name: displayName,
  //       email,
  //       phone: phoneNumber,
  //       profileImage: photoURL,
  //     });

  //     // Navigate to Main screen
  //     navigation.navigate('Main', {
  //       user: {
  //         name: displayName,
  //         email,
  //         phone: phoneNumber,
  //         profileImage: photoURL,
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Facebook Sign-In Error:', error);
  //   }
  // }

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: secondary_color}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1}}>
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
          />
          <View
            style={{
              height: height * 0.6,
              justifyContent: 'flex-end',
            }}>
            <Animated.Image
              source={require('../assets/images/bg.jpg')}
              style={{
                resizeMode: 'cover',
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
              }}
            />

            <LinearGradient
              colors={['transparent', '#000000']}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '200%',
              }}
            />
          </View>

          <View
            style={{
              flex: 1,
              position: 'absolute',
              backgroundColor: secondary_color,
              height: '75%',
              width: '100%',
              bottom: 0,
              paddingHorizontal: horizontalScale(20),
              paddingVertical: verticalScale(20),
              borderTopRightRadius: moderateScale(20),
              borderTopLeftRadius: moderateScale(20),
            }}>
            <ScrollView
              contentContainerStyle={{flexGrow: 1}}
              keyboardShouldPersistTaps="handled">
              <View
                style={{
                  marginTop: verticalScale(10),
                  paddingHorizontal: horizontalScale(10),
                }}>
                <Text
                  style={{
                    fontFamily: 'Poppins-Bold',
                    fontSize: moderateScale(18),
                    color: blue,
                  }}>
                  {isRegistering ? 'Create New Account' : 'Welcome Back,'}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Poppins-Regular',
                    fontSize: moderateScale(11),
                    color: 'black',
                  }}>
                  {isRegistering
                    ? `Register as ${
                        role === 'FARMER' ? 'farmer' : 'agri expert'
                      } to get started!`
                    : `Login  as ${
                        role === 'FARMER' ? 'farmer' : 'agri expert'
                      } to get started!`}
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: verticalScale(20),
                }}>
                {isRegistering ? (
                  <RegisterForm
                    navigation=""
                    setIsRegistering={setIsRegistering}
                    role={role}
                  />
                ) : (
                  <LoginForm
                    navigation=""
                    setIsRegistering={setIsRegistering}
                    role={role}
                  />
                )}

                {/* Continue with Google */}

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: verticalScale(10),
                  }}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: moderateScale(11),
                      color: 'black',
                    }}>
                    By continuing, you agree to our
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        'https://krishiaadhar-frontend.vercel.app/terms-condition',
                      )
                    }>
                    <Text
                      style={{
                        fontFamily: 'Poppins-Regular',
                        textDecorationLine: 'underline',
                        fontSize: moderateScale(11),
                        color: 'black',
                      }}>
                      {' '}
                      Terms
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: moderateScale(11),
                      color: 'black',
                    }}>
                    {' '}
                    &{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        'https://krishiaadhar-frontend.vercel.app/privacy-policy',
                      )
                    }>
                    <Text
                      style={{
                        textDecorationLine: 'underline',
                        fontFamily: 'Poppins-Regular',
                        fontSize: moderateScale(11),
                        color: 'black',
                      }}>
                      Privacy Policy
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: verticalScale(20),
                  }}>
                  {/* <Text
                    style={{
                      fontFamily: 'Poppins-Medium',
                      fontSize: moderateScale(14),
                      color: blue,
                    }}>
                    Or continue with
                  </Text> */}

                  {/*  */}

                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: verticalScale(20),
                      width: horizontalScale(200),
                      justifyContent: 'space-evenly',
                    }}>
                    {/* <TouchableOpacity
                      onPress={onGoogleButtonPress}
                      style={{
                        paddingHorizontal: horizontalScale(10),
                        paddingVertical: verticalScale(10),
                        marginTop: verticalScale(10),
                        backgroundColor: lightBlue,
                        borderRadius: moderateScale(100),
                        width: horizontalScale(50),
                        height: verticalScale(50),
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <AntDesign
                        name="google"
                        size={verticalScale(25)}
                        color="black"
                      />
                    </TouchableOpacity> */}
                    {/* <TouchableOpacity
                      onPress={() => onFacebookButtonPress()}
                      style={{
                        paddingHorizontal: horizontalScale(10),
                        paddingVertical: verticalScale(10),
                        marginTop: verticalScale(10),
                        backgroundColor: lightBlue,
                        borderRadius: moderateScale(100),
                        width: horizontalScale(50),
                        height: verticalScale(50),
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <AntDesign
                        name="facebook"
                        size={verticalScale(25)}
                        color="black"
                      />
                    </TouchableOpacity>  */}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default AuthenticationScreen;
