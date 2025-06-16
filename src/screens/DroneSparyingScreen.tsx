/* eslint-disable react-native/no-inline-styles */
import {View, Text, TouchableOpacity, TextInput} from 'react-native';
import React, {useState} from 'react';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import {blue} from '../utils/Colors';
import IoniIcon from 'react-native-vector-icons/Ionicons';
import {StyleSheet} from 'react-native';

const DroneSprayingScreen = ({navigation}) => {
  const [farmLocation, setFarmLocation] = useState('');
  const [cropType, setCropType] = useState('');
  const [areaInHectares, setAreaInHectares] = useState('');
  const [sprayDate, setSprayDate] = useState('');
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    // Handle form submission here
    console.log({
      farmLocation,
      cropType,
      areaInHectares,
      sprayDate,
      query,
    });

    navigation.goBack();
  };

  return (
    <View
      style={{
        flex: 1,
      }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: blue,
          elevation: 5,
          height: verticalScale(80),
          paddingTop: verticalScale(40),
          paddingHorizontal: horizontalScale(10),
          alignItems: 'center',
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IoniIcon name="arrow-back" size={25} color="white" />
        </TouchableOpacity>

        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '90%',
          }}>
          <Text
            style={{
              fontSize: moderateScale(15),
              textAlign: 'center',
              color: 'white',
              fontFamily: 'Poppins-Medium',
            }}>
            Drone Spraying Service
          </Text>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: horizontalScale(30),
          marginTop: verticalScale(30),
        }}>
        <Text style={styles.label}>Farm Location</Text>
        <TextInput
          style={styles.input}
          value={farmLocation}
          onChangeText={setFarmLocation}
          placeholder="Enter farm location"
          placeholderTextColor="gray" // Set placeholder text color
        />

        <Text style={styles.label}>Crop Type</Text>
        <TextInput
          style={styles.input}
          value={cropType}
          onChangeText={setCropType}
          placeholder="Enter crop type"
          placeholderTextColor="gray"
        />

        <Text style={styles.label}>Area in Hectares</Text>
        <TextInput
          style={styles.input}
          value={areaInHectares}
          onChangeText={setAreaInHectares}
          placeholder="Enter area in hectares"
          placeholderTextColor="gray"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Spray Date</Text>
        <TextInput
          style={styles.input}
          value={sprayDate}
          onChangeText={setSprayDate}
          placeholder="Enter spray date"
          placeholderTextColor="gray"
        />

        <Text style={styles.label}>Query</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Enter your query"
          placeholderTextColor="gray"
        />

        <TouchableOpacity
          style={{
            backgroundColor: blue,
            marginTop: verticalScale(50),
          }}
          onPress={handleSubmit}>
          <Text
            style={{
              color: 'white',
              fontSize: moderateScale(15),
              textAlign: 'center',
              padding: moderateScale(12),
              borderRadius: moderateScale(4),
            }}>
            Submit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: 'black', // Set label text color to black
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    color: 'black', // Set input text color to black
  },
});

export default DroneSprayingScreen;
