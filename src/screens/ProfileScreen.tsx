/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import {blue} from '../utils/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ActivityIndicator} from 'react-native-paper';
import {useUserStore} from '../zustand/store';
import {CommonActions} from '@react-navigation/native';

const ProfileScreen = ({navigation, route}) => {
  const userData = useUserStore(state => state.userData);
  const resetUserData = useUserStore(state => state.resetUserData);

  console.log(userData);

  const [location, setLocation] = useState('');

  useEffect(() => {
    // fetchData();
  });

  // const fetchData = async () => {
  //   const loc = JSON.parse(await AsyncStorage.getItem('location'));

  //   setLocation(loc);
  // };

  const handleLogout = async () => {
    // Implement logout logic here
    resetUserData();
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('location');

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Welcome', params: {role: userData?.role}}],
      }),
    );
  };

  if (!userData) {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
        <ActivityIndicator animating={true} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View
        style={{
          marginTop: verticalScale(60),
        }}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri:
                userData?.role === 'FARMER'
                  ? 'https://t4.ftcdn.net/jpg/06/30/06/81/360_F_630068155_RnZI6mC91wz7gUYFVmhzwpl4O6x00Cbh.jpg'
                  : 'https://www.shutterstock.com/image-photo/portrait-middle-aged-rancher-standing-260nw-1491637241.jpg',
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIcon}>
            <Icon name="edit-2" size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{userData?.name}</Text>
        <View style={styles.infoContainer}>
          <InfoItem label="Name" value={userData?.name} />

          {userData?.role === 'FARMER' && (
            <InfoItem label="Contact" value={userData?.phoneNumber} />
          )}
          <InfoItem
            label="Role"
            value={userData?.role === 'FARMER' ? 'Farmer' : 'Expert'}
          />
          {/* <InfoItem label="Location" value={location} /> */}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const InfoItem = ({label, value}) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: moderateScale(20),

    marginBottom: 20,
    color: 'black',
    fontFamily: 'Poppins-SemiBold',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
  },
  editIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
  },
  name: {
    fontSize: moderateScale(16),

    textAlign: 'center',
    marginBottom: verticalScale(20),
    fontFamily: 'Poppins-Medium',
    color: 'black',
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(10),
  },
  infoLabel: {
    width: horizontalScale(70),
    color: 'black',
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(12),
  },
  infoValue: {
    flex: 1,
    color: 'black',
    fontFamily: 'Poppins-Medium',
    fontSize: moderateScale(12),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: blue,
    borderRadius: moderateScale(10),
    padding: 15,
    marginTop: verticalScale(20),
  },
  logoutText: {
    color: '#fff',
    marginLeft: horizontalScale(10),
    fontSize: moderateScale(13),
    fontFamily: 'Poppins-SemiBold',
  },
});

export default ProfileScreen;
