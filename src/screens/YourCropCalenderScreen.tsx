/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import IoniIcon from 'react-native-vector-icons/Ionicons';
import {blue, lightBlue} from '../utils/Colors';
import CropDetailCard from '../components/CropDetails';
import {BASE_URL} from '../utils/Constants';
import {useUserStore} from '../zustand/store';

const YourCropCalenderScreen = ({navigation}) => {
  const [selectedOption, setSelectedOption] = useState('created');
  const [ccrData, setccrData] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const userData = useUserStore(state => state.userData);

  useEffect(() => {
    fetchCCR();
  }, []);

  const fetchCCR = async () => {
    setLoading(true); // Show loader
    const cleanedToken = userData.token.replace(/"/g, '');

    try {
      const response = await fetch(`${BASE_URL}/farmer/cropcalendar/all`, {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanedToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setccrData(data?.response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Hide loader
    }
  };

  const renderItem = ({item}) => (
    <View
      style={{
        marginBottom: 10,
        width: '100%',
        paddingHorizontal: horizontalScale(10),
      }}>
      <CropDetailCard crop={item} />
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        height: '100%',
      }}>
      {/* Header */}
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
            Your Crop Calendar
          </Text>
        </View>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            padding: horizontalScale(20),
          }}>
          <View
            style={{
              flexDirection: 'row',
              marginBottom: verticalScale(20),
            }}>
            <TouchableOpacity
              onPress={() => setSelectedOption('created')}
              style={[
                {
                  flex: 1,
                  paddingHorizontal: horizontalScale(5),
                  paddingVertical: verticalScale(5),
                  marginHorizontal: verticalScale(5),
                  borderRadius: moderateScale(8),
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                selectedOption === 'created'
                  ? {backgroundColor: blue}
                  : {backgroundColor: '#9DBDFF'},
              ]}>
              <Text
                style={{
                  fontSize: moderateScale(14),
                  color: '#fff',
                  fontFamily: 'Poppins-Medium',
                }}>
                Created
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                {
                  flex: 1,
                  paddingHorizontal: horizontalScale(5),
                  paddingVertical: verticalScale(5),
                  marginHorizontal: verticalScale(5),
                  borderRadius: moderateScale(8),
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                selectedOption === 'Requested'
                  ? {backgroundColor: blue}
                  : {backgroundColor: '#9DBDFF'},
              ]}
              onPress={() => setSelectedOption('Requested')}>
              <Text
                style={{
                  fontSize: moderateScale(14),
                  color: '#fff',
                  fontFamily: 'Poppins-Medium',
                }}>
                Requested
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={{paddingHorizontal: horizontalScale(5)}}>
            {loading ? (
              <ActivityIndicator size="large" color={blue} />
            ) : selectedOption === 'created' ? (
              <FlatList
                data={ccrData}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text>No data available</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default YourCropCalenderScreen;
