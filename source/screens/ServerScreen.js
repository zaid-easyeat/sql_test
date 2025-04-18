import React from 'react';
import {View, Text, Button, StyleSheet, Platform, Alert} from 'react-native';
import axios from 'axios';

const ServerScreen = ({
  serverStatus,
  serverPort,
  ipAddress,
  startServer,
  stopServer,
  testServerFromApp,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native HTTP Server</Text>
      <Text style={styles.status}>Server Status: {serverStatus}</Text>
      <Text style={styles.port}>Port: {serverPort}</Text>
      <Text style={styles.ipAddress}>
        Server URL:{' '}
        {serverStatus === 'Running'
          ? `http://${ipAddress}:${serverPort}`
          : 'Server not running'}
      </Text>

      {serverStatus === 'Running' && (
        <View>
          <Text style={styles.sectionTitle}>Access Instructions:</Text>

          {Platform.OS === 'ios' && (
            <View>
              <Text style={styles.note}>
                👉 From Safari in iOS Simulator: http://localhost:{serverPort}
              </Text>
              <Text style={styles.note}>
                👉 From your computer browser: http://localhost:{serverPort}
              </Text>
            </View>
          )}

          {Platform.OS === 'android' && (
            <View>
              <Text style={styles.note}>
                👉 From Android Emulator browser: http://10.0.2.2:{serverPort}
              </Text>
              <Text style={styles.note}>
                👉 From your computer browser: http://localhost:{serverPort}
              </Text>
            </View>
          )}

          <Text style={styles.note}>
            If the connection is refused, try the test button below to verify
            the server is working.
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Start Server"
          onPress={startServer}
          disabled={serverStatus === 'Running'}
        />
        <Button
          title="Stop Server"
          onPress={stopServer}
          disabled={serverStatus !== 'Running'}
        />
      </View>

      {serverStatus === 'Running' && (
        <Button
          title="Test Server Connection"
          onPress={testServerFromApp}
          color="#28a745"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    marginBottom: 10,
  },
  port: {
    fontSize: 16,
    marginBottom: 10,
  },
  ipAddress: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#007AFF', // iOS blue
  },
  note: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
});

export default ServerScreen;
