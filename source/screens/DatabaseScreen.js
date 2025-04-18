import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  StatusBar,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import {enableImmersiveMode} from '../utils/DisplayUtils';

const {width} = Dimensions.get('window');

const DatabaseScreen = ({serverStatus, serverPort, ipAddress}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'schemas'

  const baseUrl = serverStatus === 'Running' ? `http://10.0.2.2:8080` : '';

  const fetchUsers = async () => {
    if (serverStatus !== 'Running') {
      Alert.alert('Server Not Running', 'Please start the server first.');
      return;
    }

    const response = await fetch(`${baseUrl}/api/restaurant-users`);
    const data = await response.json();
    console.log('Fetched data:', data);

    // setLoading(true);
    // try {
    //   const response = await axios.get(`${baseUrl}/api/restaurant-users`);
    //   setUsers(response.data || []);
    // } catch (error) {
    //   console.error('Error fetching users:', error);
    //   const errorMessage = error.response
    //     ? `Error ${error.response.status}: ${
    //         error.response.data.error || error.message
    //       }`
    //     : error.message;
    //   Alert.alert('Error', `Failed to fetch users: ${errorMessage}`);
    // } finally {
    //   setLoading(false);
    //   setRefreshing(false);
    // }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const addUser = async () => {
    if (serverStatus !== 'Running') {
      Alert.alert('Server Not Running', 'Please start the server first.');
      return;
    }

    if (!email.trim() || !userName.trim()) {
      Alert.alert('Invalid Input', 'Please enter both email and name.');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        login_email: email,
        login_phone: phone,
        user_name: userName,
        user_role: role,
        restaurant_name: restaurantName,
        is_admin: isAdmin ? 1 : 0,
      };

      console.log('Sending user data:', userData);

      const response = await axios.post(
        `${baseUrl}/api/restaurant-users`,
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('response', response);

      if (response.status >= 200 && response.status < 300) {
        Alert.alert('Success', 'Restaurant user added successfully!');
        // Reset form
        setEmail('');
        setPhone('');
        setUserName('');
        setRole('');
        setRestaurantName('');
        setIsAdmin(false);
        // Refresh users list
        fetchUsers();
      } else {
        Alert.alert('Error', response.data.error || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      const errorMessage = error.response
        ? `Error ${error.response.status}: ${
            error.response.data.error || error.message
          }`
        : error.message;
      Alert.alert('Error', `Failed to add user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = id => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${baseUrl}/api/restaurant-users/${id}`);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers(); // Refresh the list after deletion
            } catch (error) {
              console.error('Error deleting user:', error);
              const errorMessage = error.response
                ? `Error ${error.response.status}: ${
                    error.response.data.error || error.message
                  }`
                : error.message;
              Alert.alert('Error', `Failed to delete user: ${errorMessage}`);
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const fetchTables = async () => {
    if (serverStatus !== 'Running') {
      Alert.alert('Server Not Running', 'Please start the server first.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/tables`);
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      const errorMessage = error.response
        ? `Error ${error.response.status}: ${
            error.response.data.error || error.message
          }`
        : error.message;
      Alert.alert('Error', `Failed to fetch tables: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverStatus === 'Running') {
      fetchUsers();
      fetchTables();
    }
  }, [serverStatus]);

  // Enable immersive mode when component mounts
  useEffect(() => {
    enableImmersiveMode();
    return () => {
      // Optional: disable when unmounting if you only want specific screens
      // disableImmersiveMode();
    };
  }, []);

  if (serverStatus !== 'Running') {
    return (
      <SafeAreaView style={{flex: 1}}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Restaurant Management</Text>
          </View>
          <View style={styles.serverOfflineContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warning}>
              Server is offline. Please start the server to use the database.
            </Text>
            <View style={styles.offlineImageContainer}>
              <Text style={styles.offlineEmoji}>📡</Text>
              <Text style={styles.offlineText}>Waiting for connection...</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderUserForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.sectionTitle}>
          <Text style={styles.iconText}>👤 </Text>Add User
        </Text>
      </View>
      <ScrollView style={styles.formScrollView}>
        <View style={styles.formContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={userName}
              onChangeText={setUserName}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🎭</Text>
            <TextInput
              style={styles.input}
              placeholder="Role"
              value={role}
              onChangeText={setRole}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🏢</Text>
            <TextInput
              style={styles.input}
              placeholder="Restaurant Name"
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Is Admin</Text>
            <Switch
              value={isAdmin}
              onValueChange={setIsAdmin}
              trackColor={{false: '#ddd', true: '#a7c8ff'}}
              thumbColor={isAdmin ? '#2874F0' : '#f4f3f4'}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addUser}
            disabled={loading}>
            <Text style={styles.addButtonText}>
              {loading ? '⏳ Adding...' : '➕ Add User'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderUsersList = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          <Text style={styles.iconText}>📋 </Text>User List
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={loading}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2874F0" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id || item.id || Math.random().toString()}
          renderItem={({item, index}) => (
            <View
              style={[styles.userCard, index % 2 === 0 && styles.userCardEven]}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.user_name}</Text>
                <Text style={styles.userEmail}>📧 {item.login_email}</Text>
                {item.login_phone && (
                  <Text style={styles.userPhone}>📱 {item.login_phone}</Text>
                )}
                {item.user_role && (
                  <Text style={styles.userRole}>🎭 {item.user_role}</Text>
                )}
                {item.restaurant_name && (
                  <Text style={styles.userRestaurant}>
                    🏢 {item.restaurant_name}
                  </Text>
                )}
                <View style={styles.userAdmin}>
                  <Text
                    style={[
                      styles.userAdminBadge,
                      item.is_admin ? styles.adminBadge : styles.userBadge,
                    ]}>
                    {item.is_admin ? 'Admin' : 'User'}
                  </Text>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteUser(item._id || item.id)}>
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListEmoji}>📭</Text>
              <Text style={styles.emptyList}>No users found</Text>
              <Text style={styles.emptyListSubtext}>
                Add your first user using the form
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Restaurant Management</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Server Online</Text>
          </View>
        </View>

        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'users' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('users')}>
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'users' && styles.activeTabButtonText,
              ]}>
              Restaurant Users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'schemas' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('schemas')}>
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'schemas' && styles.activeTabButtonText,
              ]}>
              Database Schemas
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'users' ? (
          <View style={styles.splitContainer}>
            {renderUserForm()}
            {renderUsersList()}
          </View>
        ) : (
          <View style={styles.schemasContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.iconText}>🗃️ </Text>Database Schemas
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchTables}
                disabled={loading}>
                <Text style={styles.refreshButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2874F0" />
                <Text style={styles.loadingText}>Loading schemas...</Text>
              </View>
            ) : (
              <FlatList
                data={tables}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (
                  <View
                    style={[
                      styles.schemaCard,
                      index % 2 === 0 && styles.schemaCardEven,
                    ]}>
                    <Text style={styles.schemaName}>
                      <Text style={styles.iconText}>📊 </Text>
                      {item}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListEmoji}>🗄️</Text>
                    <Text style={styles.emptyList}>No schemas found</Text>
                    <Text style={styles.emptyListSubtext}>
                      Database seems to be empty
                    </Text>
                  </View>
                }
                contentContainerStyle={styles.listContentContainer}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2874F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 4,
    margin: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeTabButton: {
    backgroundColor: '#2874F0',
  },
  tabButtonText: {
    fontWeight: 'bold',
    color: '#666',
    fontSize: 12,
  },
  activeTabButtonText: {
    color: 'white',
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 6,
    marginRight: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    overflow: 'hidden',
  },
  formScrollView: {
    flex: 1,
  },
  formHeader: {
    backgroundColor: '#2874F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  iconText: {
    fontSize: 10,
  },
  formContent: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 6,
    backgroundColor: '#f9f9f9',
    height: 32,
  },
  inputIcon: {
    paddingHorizontal: 6,
    fontSize: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 4,
    paddingRight: 6,
    fontSize: 11,
    height: 32,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 11,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 6,
    marginLeft: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2874F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    padding: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContentContainer: {
    padding: 8,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 4,
    marginBottom: 6,
    padding: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#2874F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  userCardEven: {
    borderLeftColor: '#FF9800',
  },
  userInfo: {
    flex: 1,
  },
  userActions: {
    justifyContent: 'center',
    paddingLeft: 6,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 10,
    color: '#666',
    marginBottom: 1,
  },
  userPhone: {
    fontSize: 10,
    color: '#666',
    marginBottom: 1,
  },
  userRole: {
    fontSize: 10,
    color: '#666',
    marginBottom: 1,
  },
  userRestaurant: {
    fontSize: 10,
    color: '#666',
    marginBottom: 1,
  },
  userAdmin: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAdminBadge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  adminBadge: {
    backgroundColor: '#2874F0',
    color: 'white',
  },
  userBadge: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#e74c3c',
  },
  emptyListContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyListEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyList: {
    textAlign: 'center',
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyListSubtext: {
    textAlign: 'center',
    color: '#888',
    fontSize: 10,
    marginTop: 4,
  },
  loadingContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 11,
  },
  schemasContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 6,
    margin: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    overflow: 'hidden',
  },
  schemaCard: {
    backgroundColor: 'white',
    borderRadius: 4,
    marginBottom: 6,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#2874F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  schemaCardEven: {
    borderLeftColor: '#FF9800',
  },
  schemaName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  serverOfflineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  warning: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  offlineImageContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  offlineEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  offlineText: {
    color: '#888',
    fontSize: 12,
  },
});

export default DatabaseScreen;
