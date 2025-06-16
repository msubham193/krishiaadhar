import React, {useState} from 'react';
import {FlatList, StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import CropDetailCard from '../components/CropDetails'; // Assuming you have the CropDetailCard in a separate file
import {horizontalScale, moderateScale, verticalScale} from '../utils/metrics';
import {blue} from '../utils/Colors';

const statuses = ['PENDING', 'COMPLETED']; // Define statuses to filter by

const CropListScreen = ({ccrData}) => {
  const [selectedStatus, setSelectedStatus] = useState('PENDING'); // Default filter to show all crops

  console.log(ccrData);

  const filteredData = selectedStatus
    ? ccrData.filter(crop => crop?.status === selectedStatus)
    : ccrData;

  const renderItem = ({item}) => (
    <View style={styles.itemContainer}>
      <CropDetailCard crop={item} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Component */}
      <FilterComponent
        statuses={statuses}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <FlatList
        data={filteredData} // Use filtered data for FlatList
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false} // Optional, to hide scroll bar
      />
    </View>
  );
};

const FilterComponent = ({statuses, selectedStatus, onStatusChange}) => {
  return (
    <View style={styles.filterContainer}>
      {statuses.map(status => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            selectedStatus === status && styles.selectedButton, // Highlight the selected status
          ]}
          onPress={() =>
            onStatusChange(status === selectedStatus ? null : status)
          } // Toggle selection
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedStatus === status && styles.selectedButtonText,
            ]}>
            {status}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', // Make the container take full width of the screen
    backgroundColor: '#f5f5f5', // Set background color to light gray
    marginTop: verticalScale(80),
  },
  listContentContainer: {
    width: '100%', // Makes FlatList content take the full width
    paddingHorizontal: horizontalScale(20), // Add padding on the sides
  },
  itemContainer: {
    marginBottom: 10, // Adds spacing between the cards
    width: '100%', // Ensures each item takes the full width available
    paddingHorizontal: horizontalScale(10),
  },
  // Filter Component Styles
  filterContainer: {
    flexDirection: 'row',

    marginBottom: verticalScale(20),
    justifyContent: 'center',
  },
  filterButton: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: horizontalScale(15),
    borderRadius: moderateScale(10),
    backgroundColor: '#e0e0e0',
    width: '40%',
    marginLeft: horizontalScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: blue, // Highlight selected button
  },
  filterButtonText: {
    fontSize: verticalScale(10),
    color: '#000',
  },
  selectedButtonText: {
    color: '#fff', // White text for selected button
  },
});

export default CropListScreen;
