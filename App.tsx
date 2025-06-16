/* eslint-disable react-native/no-inline-styles */
import {View, Text, SafeAreaView} from 'react-native';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Navigation from './src/Navigation/Navigation';
import {secondary_color} from './src/utils/Colors';
import {PaperProvider} from 'react-native-paper';

const App = () => {
  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: secondary_color,
      }}>
      <PaperProvider>
        <Navigation />
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default App;
