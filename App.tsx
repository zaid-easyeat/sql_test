import React, {useEffect, useState} from 'react';
import {
  Alert,
  Platform,
  NativeModules,
  StatusBar,
  LogBox,
  UIManager,
  Text,
  SafeAreaView,
  View,
  TouchableOpacity,
} from 'react-native';

import HttpServer from './source/services/HttpServer';
import ServerScreen from './source/screens/ServerScreen';
import DatabaseScreen from './source/screens/DatabaseScreen';

import SQLite from 'react-native-sqlite-storage';
import axios from 'axios';

// Enable SQLite debugging in development
if (__DEV__) {
  SQLite.DEBUG(true);
  SQLite.enablePromise(false); // Make sure we're using callback-based API
}

// Ignore specific warnings if needed
LogBox.ignoreLogs(['Remote debugger']);

// Helper function to get device IP address on dev machine for easier testing
const getDeviceIpInDev = () => {
  if (__DEV__) {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1].split(':')[0];
      return address;
    }
  }
  return 'unknown';
};

const App = () => {
  const [serverStatus, setServerStatus] = useState('Stopped');
  const [serverPort, setServerPort] = useState(8080);
  const [server, setServer] = useState(null);

  // Get dev IP address if available
  const devIp = getDeviceIpInDev();
  const [ipAddress, setIpAddress] = useState(
    devIp !== 'unknown' ? devIp : 'Your device IP',
  );

  // Initialize server once
  useEffect(() => {
    console.log('Creating HTTP server instance');
    const httpServer = HttpServer.create();

    console.log('Server created:', httpServer);

    // Set up request handler
    // httpServer.onRequest = (request, response) => {
    //   const {url, method} = request;

    //   console.log(`Received ${method} request for: ${url}`);

    //   // Route handling for specific endpoints in App.js
    //   if (url === '/' && method === 'GET') {
    //     // Handle root path
    //     console.log('Welcome to React Native HTTP Server!');
    //     response.send(200, 'Welcome to React Native HTTP Server!');
    //     return true; // Indicate we've handled this request
    //   }

    //   // For all other routes, let the default handler in HttpServer.js handle it
    //   // Important: Return undefined (not false!) to let the default handler process it
    //   console.log('Route missing !!');
    //   // response.send(604, 'Not found !!');
    //   return true;
    // };

    console.log('this.onRequest', typeof this.onRequest);

    setServer(httpServer);

    // Cleanup function
    return () => {
      console.log('Cleaning up server');
      if (httpServer) {
        httpServer.stop().catch(error => {
          console.error('Failed to stop server during cleanup:', error);
        });
      }
    };
  }, []);

  const startServer = async () => {
    if (!server) {
      console.error('Server not initialized');
      setServerStatus('Error');
      return;
    }

    try {
      console.log(`Starting server on port ${serverPort}`);
      await server.start(serverPort);
      setServerStatus('Running');

      // Set appropriate IP address guidance based on platform
      if (Platform.OS === 'ios' && devIp !== 'unknown') {
        // We have access to the dev server IP, so we can use that
        setIpAddress(devIp);
      } else if (Platform.OS === 'ios') {
        // On iOS simulators, you might be able to use localhost
        console.log('Setting IP address to:', devIp);
        setIpAddress('localhost (simulator only) or device IP');
      } else if (Platform.OS === 'android' && devIp !== 'unknown') {
        // For Android, we can use the dev server IP
        setIpAddress(devIp);
      } else {
        // Fallback to generic guidance
        console.log('Setting IP address for generic device');
        setIpAddress('device IP (check WiFi settings)');
      }

      console.log(
        `Server running on port ${serverPort}, accessible at http://${ipAddress}:${serverPort}`,
      );
    } catch (error) {
      console.error('Failed to start server:', error);
      setServerStatus('Error');
    }
  };

  const stopServer = async () => {
    if (!server) {
      console.error('Server not initialized');
      return;
    }

    try {
      console.log('Stopping server');
      await server.stop();
      setServerStatus('Stopped');
      console.log('Server stopped');
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  };

  const testServerFromApp = async () => {
    if (!server || serverStatus !== 'Running') {
      Alert.alert('Server not running', 'Please start the server first');
      return;
    }

    try {
      // Replace fetch with axios
      console.log('Testing server from within the app...');
      const response = await axios.get(`http://localhost:${serverPort}/`);

      Alert.alert(
        'Server Test Success',
        `Connected to server successfully!\nResponse: ${response.data}`,
        [{text: 'OK'}],
      );
    } catch (error) {
      console.error('Error testing server:', error);
      // Handle axios errors
      const errorMessage = error.response
        ? `Error ${error.response.status}: ${error.message}`
        : error.message;
      Alert.alert(
        'Server Test Failed',
        `Could not connect to server: ${errorMessage}`,
        [{text: 'OK'}],
      );
    }
  };

  const [activeTab, setActiveTab] = useState('server');

  LogBox.ignoreAllLogs(true);

  return (
    <SafeAreaView style={{flex: 1, marginTop: 20}}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <Text>dsdsdsa</Text>
      <View style={{flex: 1, borderWidth: 1}}>
        {activeTab == 'server' ? (
          <ServerScreen
            serverStatus={serverStatus}
            serverPort={serverPort}
            ipAddress={ipAddress}
            startServer={startServer}
            stopServer={stopServer}
          />
        ) : activeTab == 'database' ? (
          <DatabaseScreen
            serverStatus={serverStatus}
            serverPort={serverPort}
            ipAddress={ipAddress}
          />
        ) : null}
      </View>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: 'row',
        }}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('server');
          }}
          style={{
            borderWidth: 1,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: 60,
          }}>
          <Text style={{fontSize: 24}}>Server</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('database');
          }}
          style={{
            borderWidth: 1,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: 60,
          }}>
          <Text style={{fontSize: 24}}>Database</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('server');
          }}
          style={{
            borderWidth: 1,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: 60,
          }}>
          <Text style={{fontSize: 24}}>Server</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default App;
