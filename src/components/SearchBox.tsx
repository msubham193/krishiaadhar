/* eslint-disable react-native/no-inline-styles */
import {View, Text, TextInput} from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
const SearchBox = () => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 8,
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        elevation: moderateScale(5),
        alignItems: 'center',
      }}>
      <Icon
        name="search"
        size={24}
        color="#999"
        style={{marginRight: horizontalScale(5)}}
      />
      <TextInput
        style={{
          flex: 1,
          color: '#000',
          fontSize: moderateScale(14),
          fontFamily: 'Poppins-Regular',
        }}
        placeholder="Search for services or help"
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );
};

export default SearchBox;
