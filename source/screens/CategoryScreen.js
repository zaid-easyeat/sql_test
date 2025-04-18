import {Dimensions} from 'react-native';
import {useEffect} from 'react';

// Inside your component function, add:
useEffect(() => {
  // This ensures the screen stays in its current orientation
  const initialOrientation =
    Dimensions.get('window').width > Dimensions.get('window').height
      ? 'LANDSCAPE'
      : 'PORTRAIT';

  // If you're using a library for orientation control like react-native-orientation or react-native-device-info
  // You would use something like:
  // Orientation.lockToCurrentOrientation();

  return () => {
    // Cleanup when component unmounts
    // Orientation.unlockAllOrientations();
  };
}, []);
