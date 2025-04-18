import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
  Pressable,
  StatusBar,
} from 'react-native';
import axios from 'axios';

const windowWidth = Dimensions.get('window').width;

const TableViewScreen = ({serverStatus, serverPort, ipAddress}) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const baseUrl = serverStatus === 'Running' ? `http://192.168.0.130:8080` : '';

  const fetchEmployees = async () => {
    if (serverStatus !== 'Running') {
      Alert.alert('Server Not Running', 'Please start the server first.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);

      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code, // Some errors have a `code` property
        response: error.response, // Useful for API errors
        config: error.config, // If it's an Axios error, this can help
      });

      const errorMessage = error.response
        ? `Error ${error.response.status}: ${
            error.response.data.error || error.message
          }`
        : error.message;
      Alert.alert('Error', `Failed to fetch employees: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const deleteEmployee = id => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this employee?',
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
              await axios.delete(`${baseUrl}/api/employees/${id}`);
              Alert.alert('Success', 'Employee deleted successfully');
              fetchEmployees(); // Refresh the list after deletion
            } catch (error) {
              console.error('Error deleting employee:', error);
              const errorMessage = error.response
                ? `Error ${error.response.status}: ${
                    error.response.data.error || error.message
                  }`
                : error.message;
              Alert.alert(
                'Error',
                `Failed to delete employee: ${errorMessage}`,
              );
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

  const sortEmployees = field => {
    if (sortField === field) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Get window width for responsive table
  const idWidth = windowWidth * 0.12;
  const nameWidth = windowWidth * 0.4;
  const ageWidth = windowWidth * 0.18;
  const actionWidth = windowWidth * 0.18;

  useEffect(() => {
    if (serverStatus === 'Running') {
      fetchEmployees();
    }
  }, [serverStatus]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2874F0" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employee Data Table</Text>
        {serverStatus === 'Running' && (
          <View style={styles.headerStats}>
            <Text style={styles.statsText}>{employees.length} Records</Text>
          </View>
        )}
      </View>

      {serverStatus !== 'Running' ? (
        <View style={styles.statusContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warning}>
            Server is offline. Please start the server to view data.
          </Text>
        </View>
      ) : loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2874F0" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <View style={styles.tableOuterContainer}>
          <View style={styles.toolbar}>
            <Text style={styles.toolbarTitle}>Database Records</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={loading}>
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <TouchableOpacity
                onPress={() => sortEmployees('id')}
                style={[styles.headerCell, {width: idWidth}]}>
                <Text style={styles.headerCellText}>
                  ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sortEmployees('name')}
                style={[styles.headerCell, {width: nameWidth}]}>
                <Text style={styles.headerCellText}>
                  Name{' '}
                  {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sortEmployees('age')}
                style={[styles.headerCell, {width: ageWidth}]}>
                <Text style={styles.headerCellText}>
                  Age {sortField === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </TouchableOpacity>
              <View style={[styles.headerCell, {width: actionWidth}]}>
                <Text style={styles.headerCellText}>Action</Text>
              </View>
            </View>

            {/* Table Body */}
            {employees.length === 0 ? (
              <View style={styles.emptyTableContainer}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyTitle}>No Data Found</Text>
                <Text style={styles.emptyText}>
                  Add employees from the Database tab
                </Text>
              </View>
            ) : (
              <ScrollView
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#2874F0']}
                  />
                }>
                {sortedEmployees.map((employee, index) => (
                  <Pressable
                    key={employee.id}
                    style={({pressed}) => [
                      styles.tableRow,
                      index % 2 === 1 && styles.tableRowAlt,
                      selectedRow === employee.id && styles.selectedRow,
                      pressed && styles.pressedRow,
                    ]}
                    onPress={() => setSelectedRow(employee.id)}>
                    <Text
                      style={[styles.cell, styles.idCell, {width: idWidth}]}>
                      #{employee.id}
                    </Text>
                    <Text style={[styles.cell, {width: nameWidth}]}>
                      {employee.name}
                    </Text>
                    <Text style={[styles.cell, {width: ageWidth}]}>
                      {employee.age} yrs
                    </Text>
                    <View style={[styles.actionCell, {width: actionWidth}]}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteEmployee(employee.id)}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by React Native HTTP Server
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2874F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerStats: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  tableOuterContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2874F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    justifyContent: 'center',
  },
  headerCellText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  selectedRow: {
    backgroundColor: '#e3f2fd',
  },
  pressedRow: {
    backgroundColor: '#f0f0f0',
  },
  cell: {
    fontSize: 14,
    color: '#444',
  },
  idCell: {
    fontWeight: 'bold',
    color: '#2874F0',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
  emptyTableContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  warning: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});

export default TableViewScreen;
