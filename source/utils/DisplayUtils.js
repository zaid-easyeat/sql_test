import {Dimensions, Platform, StatusBar} from 'react-native';

// Get screen dimensions considering status bar and notches
export const getScreenDimensions = () => {
  const {width, height} = Dimensions.get('window');
  const statusBarHeight = StatusBar.currentHeight || 0;

  return {
    width,
    height,
    statusBarHeight,
    screenHeight: Platform.OS === 'ios' ? height : height + statusBarHeight,
    safeAreaInsets: {
      top: Platform.OS === 'ios' ? 44 : statusBarHeight,
      bottom: Platform.OS === 'ios' ? 34 : 0,
      left: 0,
      right: 0,
    },
  };
};

// Enable immersive mode on Android (hide status and navigation bars)
export const enableImmersiveMode = () => {
  if (Platform.OS === 'android') {
    try {
      const {NativeModules} = require('react-native');
      if (NativeModules.ImmersiveMode) {
        NativeModules.ImmersiveMode.setImmersive(true);
      } else {
        console.warn('Immersive mode module not available');
      }
    } catch (error) {
      console.error('Failed to enable immersive mode:', error);
    }
  }
};

// Disable immersive mode on Android
export const disableImmersiveMode = () => {
  if (Platform.OS === 'android') {
    try {
      const {NativeModules} = require('react-native');
      if (NativeModules.ImmersiveMode) {
        NativeModules.ImmersiveMode.setImmersive(false);
      }
    } catch (error) {
      console.error('Failed to disable immersive mode:', error);
    }
  }
};
