import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment'; // For formatting the date
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import {useNavigation} from '@react-navigation/native';

const CropDetailCard = ({crop}) => {
  const {
    cropName,
    cropType,
    expert,
    filedSize,
    location,
    season,
    startDate,
    status,
  } = crop;

  const navigate = useNavigation();

  console.log(filedSize);

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Crop Name */}
        <View style={styles.row}>
          <Icon name="leaf" size={24} color="#4CAF50" style={styles.icon} />
          <Text style={styles.label}>Crop Name: </Text>
          <Text style={styles.value}>{cropName || 'N/A'}</Text>
        </View>

        {/* Crop Type */}
        <View style={styles.row}>
          <Icon name="seed" size={24} color="#FF9800" style={styles.icon} />
          <Text style={styles.label}>Crop Type: </Text>
          <Text style={styles.value}>{cropType || 'N/A'}</Text>
        </View>

        {/* Expert */}
        <View style={styles.row}>
          <Icon name="account" size={24} color="#2196F3" style={styles.icon} />
          <Text style={styles.label}>Expert: </Text>
          <Text style={styles.value}>{expert?.name || 'Not Assigned'}</Text>
        </View>

        {/* Field Size */}
        <View style={styles.row}>
          <Icon name="crop" size={24} color="#795548" style={styles.icon} />
          <Text style={styles.label}>Field Size: </Text>
          <Text style={styles.value}>{filedSize || 'N/A'} acres</Text>
        </View>

        {/* Location */}
        <View style={styles.row}>
          <Icon
            name="map-marker"
            size={24}
            color="#E91E63"
            style={styles.icon}
          />
          <Text style={styles.label}>Location: </Text>
          <Text style={styles.value}>{location || 'N/A'}</Text>
        </View>

        {/* Season */}
        <View style={styles.row}>
          <Icon
            name="weather-partly-cloudy"
            size={24}
            color="#9C27B0"
            style={styles.icon}
          />
          <Text style={styles.label}>Season: </Text>
          <Text style={styles.value}>{season || 'N/A'}</Text>
        </View>

        {/* Start Date */}
        <View style={styles.row}>
          <Icon name="calendar" size={24} color="#FF5722" style={styles.icon} />
          <Text style={styles.label}>Start Date: </Text>
          <Text style={styles.value}>
            {moment(startDate).format('MMMM Do YYYY, h:mm A')}
          </Text>
        </View>

        {/* Status */}
        {/* <View style={styles.row}>
          <Icon
            name="alert-circle"
            size={24}
            color={status === 'PENDING' ? 'orange' : 'green'}
            style={styles.icon}
          />
          <Text style={styles.label}>Status: </Text>
          <Text
            style={[
              styles.value,
              status === 'PENDING' ? styles.pendingStatus : null,
            ]}>
            {status || 'N/A'}
          </Text>
        </View> */}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(10),
    elevation: 3,
    // backgroundColor: 'red',
    width: '100%',
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center', // Align text and icon in the center
    marginVertical: verticalScale(3),
  },
  icon: {
    marginRight: verticalScale(10),
  },
  label: {
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    width: horizontalScale(100),
    fontSize: moderateScale(10),
  },
  value: {
    color: '#555',
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: moderateScale(10),
  },
  pendingStatus: {
    color: 'orange',
  },
});

export default CropDetailCard;
