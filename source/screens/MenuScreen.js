import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import {enableImmersiveMode} from '../utils/DisplayUtils';

// Conditional import for Orientation
let Orientation;
try {
  Orientation = require('react-native-orientation-locker').default;
} catch (e) {
  console.warn('Orientation module could not be loaded', e);
  // Create a mock implementation
  Orientation = {
    lockToLandscape: () => {},
    unlockAllOrientations: () => {},
  };
}

const MenuScreen = ({serverStatus, serverPort, ipAddress}) => {
  // State for categories, subcategories, and menu items
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Selected items
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Form visibility state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);

  // Form data
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image_url: '',
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: '',
    image_url: '',
    category_id: '',
  });

  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    ingredients: '',
    is_vegetarian: false,
    is_spicy: false,
  });

  const [loading, setLoading] = useState(false);

  const baseUrl = serverStatus === 'Running' ? `http://192.168.0.130:8080` : '';

  // Enable immersive mode when component mounts
  useEffect(() => {
    enableImmersiveMode();
    try {
      Orientation.lockToLandscape();
    } catch (e) {
      console.warn('Could not lock to landscape:', e);
    }

    return () => {
      try {
        Orientation.unlockAllOrientations();
      } catch (e) {
        console.warn('Error unlocking orientations:', e);
      }
    };
  }, []);

  // Fetch categories on load
  useEffect(() => {
    if (serverStatus === 'Running') {
      fetchCategories();
    }
  }, [serverStatus]);

  // Fetch subcategories when a category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.id);
      setSelectedSubcategory(null);
      setMenuItems([]);
    }
  }, [selectedCategory]);

  // Fetch menu items when a subcategory is selected
  useEffect(() => {
    if (selectedSubcategory) {
      fetchMenuItems(selectedSubcategory.id);
    }
  }, [selectedSubcategory]);

  // API functions
  const fetchCategories = async () => {
    if (serverStatus !== 'Running') {
      Alert.alert('Server Not Running', 'Please start the server first.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Alert.alert('Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async categoryId => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/api/subcategories?category_id=${categoryId}`,
      );
      setSubcategories(response.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      // Comment out alert to prevent disruption
      // Alert.alert('Error', 'Failed to fetch subcategories');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async subcategoryId => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/api/menu/items?subcategory_id=${subcategoryId}`,
      );
      setMenuItems(response.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      // Comment out alert to prevent disruption
      // Alert.alert('Error', 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  // Form submission handlers
  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}/api/categories`,
        categoryForm,
      );

      if (response.status === 201) {
        // Alert.alert('Success', 'Category added successfully');
        setCategoryForm({name: '', description: '', image_url: ''});
        setShowCategoryForm(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async () => {
    if (!subcategoryForm.name) {
      Alert.alert('Error', 'Subcategory name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/api/subcategories`, {
        ...subcategoryForm,
        category_id: selectedCategory.id,
      });

      if (response.status === 201) {
        // Alert.alert('Success', 'Subcategory added successfully');
        setSubcategoryForm({
          name: '',
          description: '',
          image_url: '',
          category_id: '',
        });
        setShowSubcategoryForm(false);
        fetchSubcategories(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error adding subcategory:', error);
      Alert.alert('Error', 'Failed to add subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!menuItemForm.name || !menuItemForm.price) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }

    if (!selectedCategory || !selectedSubcategory) {
      Alert.alert('Error', 'Please select both a category and subcategory');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/api/menu/items`, {
        ...menuItemForm,
        item_name: menuItemForm.name,
        price: parseFloat(menuItemForm.price),
        image: menuItemForm.image_url,
        category_id: selectedCategory.id,
        subcategory_id: selectedSubcategory.id,
      });

      if (response.status === 201) {
        setMenuItemForm({
          name: '',
          description: '',
          price: '',
          image_url: '',
          ingredients: '',
          is_vegetarian: false,
          is_spicy: false,
        });
        setShowMenuItemForm(false);
        fetchMenuItems(selectedSubcategory.id);
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      Alert.alert('Error', 'Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  // UI Components
  const renderCategoryForm = () => (
    <Modal
      visible={showCategoryForm}
      animationType="fade"
      transparent={true}
      supportedOrientations={['landscape']}
      onShow={() => {
        try {
          Orientation.lockToLandscape();
        } catch (e) {
          console.warn('Could not lock to landscape on modal show:', e);
        }
      }}
      onRequestClose={() => {
        setShowCategoryForm(false);
      }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Category</Text>

          <TextInput
            style={styles.input}
            placeholder="Category Name*"
            value={categoryForm.name}
            onChangeText={text =>
              setCategoryForm({...categoryForm, name: text})
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={categoryForm.description}
            onChangeText={text =>
              setCategoryForm({...categoryForm, description: text})
            }
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Image URL"
            value={categoryForm.image_url}
            onChangeText={text =>
              setCategoryForm({...categoryForm, image_url: text})
            }
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowCategoryForm(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={() => {
                try {
                  Orientation.lockToLandscape();
                } catch (e) {
                  console.warn('Could not lock to landscape:', e);
                }
                handleAddCategory();
              }}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? 'Adding...' : 'Add Category'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSubcategoryForm = () => (
    <Modal
      visible={showSubcategoryForm}
      animationType="fade"
      transparent={true}
      supportedOrientations={['landscape']}
      onShow={() => {
        try {
          Orientation.lockToLandscape();
        } catch (e) {
          console.warn('Could not lock to landscape on modal show:', e);
        }
      }}
      onRequestClose={() => {
        setShowSubcategoryForm(false);
      }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Subcategory</Text>
          <Text style={styles.modalSubtitle}>
            In category: {selectedCategory?.name}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Subcategory Name*"
            value={subcategoryForm.name}
            onChangeText={text =>
              setSubcategoryForm({...subcategoryForm, name: text})
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={subcategoryForm.description}
            onChangeText={text =>
              setSubcategoryForm({...subcategoryForm, description: text})
            }
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Image URL"
            value={subcategoryForm.image_url}
            onChangeText={text =>
              setSubcategoryForm({...subcategoryForm, image_url: text})
            }
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowSubcategoryForm(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={() => {
                try {
                  Orientation.lockToLandscape();
                } catch (e) {
                  console.warn('Could not lock to landscape:', e);
                }
                handleAddSubcategory();
              }}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? 'Adding...' : 'Add Subcategory'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMenuItemForm = () => (
    <Modal
      visible={showMenuItemForm}
      animationType="fade"
      transparent={true}
      supportedOrientations={['landscape']}
      onShow={() => {
        try {
          Orientation.lockToLandscape();
        } catch (e) {
          console.warn('Could not lock to landscape on modal show:', e);
        }
      }}
      onRequestClose={() => {
        setShowMenuItemForm(false);
      }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlayWithScroll}>
        <ScrollView>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Menu Item</Text>
            <Text style={styles.modalSubtitle}>
              In subcategory: {selectedSubcategory?.name}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Item Name*"
              value={menuItemForm.name}
              onChangeText={text =>
                setMenuItemForm({...menuItemForm, name: text})
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Price*"
              value={menuItemForm.price}
              onChangeText={text =>
                setMenuItemForm({...menuItemForm, price: text})
              }
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, {height: 80}]}
              placeholder="Description"
              value={menuItemForm.description}
              onChangeText={text =>
                setMenuItemForm({...menuItemForm, description: text})
              }
              multiline
            />

            <TextInput
              style={[styles.input, {height: 80}]}
              placeholder="Ingredients"
              value={menuItemForm.ingredients}
              onChangeText={text =>
                setMenuItemForm({...menuItemForm, ingredients: text})
              }
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Image URL"
              value={menuItemForm.image_url}
              onChangeText={text =>
                setMenuItemForm({...menuItemForm, image_url: text})
              }
            />

            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>Vegetarian</Text>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  menuItemForm.is_vegetarian && styles.checkboxChecked,
                ]}
                onPress={() =>
                  setMenuItemForm({
                    ...menuItemForm,
                    is_vegetarian: !menuItemForm.is_vegetarian,
                  })
                }>
                {menuItemForm.is_vegetarian && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>Spicy</Text>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  menuItemForm.is_spicy && styles.checkboxChecked,
                ]}
                onPress={() =>
                  setMenuItemForm({
                    ...menuItemForm,
                    is_spicy: !menuItemForm.is_spicy,
                  })
                }>
                {menuItemForm.is_spicy && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowMenuItemForm(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={() => {
                  try {
                    Orientation.lockToLandscape();
                  } catch (e) {
                    console.warn('Could not lock to landscape:', e);
                  }
                  handleAddMenuItem();
                }}
                disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? 'Adding...' : 'Add Menu Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Render the main UI
  if (serverStatus !== 'Running') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <View style={styles.offlineContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warning}>
            Server is offline. Please start the server to manage menu.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Menu Management</Text>
      </View>

      <View style={styles.content}>
        {/* Three-column layout */}
        <View style={styles.columnLayout}>
          {/* Categories column */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>Categories</Text>
              <TouchableOpacity
                style={styles.addIcon}
                onPress={() => {
                  // Force orientation lock before showing the modal
                  // This prevents any rotation during the transition
                  if (Platform.OS === 'ios') {
                    // On iOS, we need to use specific orientation locking
                    StatusBar.setHidden(true, 'none');
                    setTimeout(() => {
                      try {
                        Orientation.lockToLandscape();

                        // Delay showing the modal slightly to ensure orientation is locked
                        setTimeout(() => {
                          setShowCategoryForm(true);
                          StatusBar.setHidden(false, 'none');
                        }, 100);
                      } catch (e) {
                        console.warn('Could not lock to landscape:', e);
                        setShowCategoryForm(true);
                      }
                    }, 50);
                  } else {
                    // On Android, orientation locking is more reliable
                    try {
                      Orientation.lockToLandscape();
                      setShowCategoryForm(true);
                    } catch (e) {
                      console.warn('Could not lock to landscape:', e);
                      setShowCategoryForm(true);
                    }
                  }
                }}>
                <Text style={styles.addIconText}>+</Text>
              </TouchableOpacity>
            </View>

            {loading && categories.length === 0 ? (
              <ActivityIndicator size="large" color="#2874F0" />
            ) : (
              <FlatList
                data={categories}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      selectedCategory?.id === item.id &&
                        styles.selectedListItem,
                    ]}
                    onPress={() => setSelectedCategory(item)}>
                    <Text style={styles.listItemName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No categories found</Text>
                }
              />
            )}
          </View>

          {/* Subcategories column */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>
                {selectedCategory
                  ? `${selectedCategory.name} Subcategories`
                  : 'Subcategories'}
              </Text>
              {selectedCategory && (
                <TouchableOpacity
                  style={styles.addIcon}
                  onPress={() => {
                    // Force orientation lock before showing the modal
                    // This prevents any rotation during the transition
                    if (Platform.OS === 'ios') {
                      // On iOS, we need to use specific orientation locking
                      StatusBar.setHidden(true, 'none');
                      setTimeout(() => {
                        try {
                          Orientation.lockToLandscape();

                          // Delay showing the modal slightly to ensure orientation is locked
                          setTimeout(() => {
                            setShowSubcategoryForm(true);
                            StatusBar.setHidden(false, 'none');
                          }, 100);
                        } catch (e) {
                          console.warn('Could not lock to landscape:', e);
                          setShowSubcategoryForm(true);
                        }
                      }, 50);
                    } else {
                      // On Android, orientation locking is more reliable
                      try {
                        Orientation.lockToLandscape();
                        setShowSubcategoryForm(true);
                      } catch (e) {
                        console.warn('Could not lock to landscape:', e);
                        setShowSubcategoryForm(true);
                      }
                    }
                  }}>
                  <Text style={styles.addIconText}>+</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedCategory ? (
              loading && subcategories.length === 0 ? (
                <ActivityIndicator size="large" color="#2874F0" />
              ) : (
                <FlatList
                  data={subcategories}
                  keyExtractor={item => item.id}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        selectedSubcategory?.id === item.id &&
                          styles.selectedListItem,
                      ]}
                      onPress={() => setSelectedSubcategory(item)}>
                      <Text style={styles.listItemName}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No subcategories found</Text>
                  }
                />
              )
            ) : (
              <Text style={styles.instructionText}>
                Select a category to view subcategories
              </Text>
            )}
          </View>

          {/* Menu items column */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>
                {selectedSubcategory
                  ? `${selectedSubcategory.name} Items`
                  : 'Menu Items'}
              </Text>
              {selectedSubcategory && (
                <TouchableOpacity
                  style={styles.addIcon}
                  onPress={() => {
                    // Force orientation lock before showing the modal
                    if (Platform.OS === 'ios') {
                      StatusBar.setHidden(true, 'none');
                      setTimeout(() => {
                        try {
                          Orientation.lockToLandscape();
                          setTimeout(() => {
                            setShowMenuItemForm(true);
                            StatusBar.setHidden(false, 'none');
                          }, 100);
                        } catch (e) {
                          console.warn('Could not lock to landscape:', e);
                          setShowMenuItemForm(true);
                        }
                      }, 50);
                    } else {
                      try {
                        Orientation.lockToLandscape();
                        setShowMenuItemForm(true);
                      } catch (e) {
                        console.warn('Could not lock to landscape:', e);
                        setShowMenuItemForm(true);
                      }
                    }
                  }}>
                  <Text style={styles.addIconText}>+</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedSubcategory ? (
              loading && menuItems.length === 0 ? (
                <ActivityIndicator size="large" color="#2874F0" />
              ) : (
                <FlatList
                  data={menuItems}
                  keyExtractor={item => item.id}
                  renderItem={({item}) => (
                    <View style={styles.menuItemCard}>
                      <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemName}>
                          {item.item_name}
                        </Text>
                        <Text style={styles.menuItemPrice}>
                          ₹{parseFloat(item.price).toFixed(2)}
                        </Text>
                        {item.description && (
                          <Text style={styles.menuItemDescription}>
                            {item.description}
                          </Text>
                        )}
                        <View style={styles.menuItemTags}>
                          {item.is_vegetarian && (
                            <View style={[styles.tag, styles.vegTag]}>
                              <Text style={styles.tagText}>Veg</Text>
                            </View>
                          )}
                          {item.is_spicy && (
                            <View style={[styles.tag, styles.spicyTag]}>
                              <Text style={styles.tagText}>Spicy</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {item.image && (
                        <Image
                          source={{uri: item.image}}
                          style={styles.menuItemImage}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No menu items found</Text>
                  }
                />
              )
            ) : (
              <Text style={styles.instructionText}>
                Select a subcategory to view menu items
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Render forms */}
      {renderCategoryForm()}
      {renderSubcategoryForm()}
      {renderMenuItemForm()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2874F0',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 8,
  },
  columnLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    margin: 4,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  addIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2874F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedListItem: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2874F0',
  },
  listItemName: {
    fontSize: 13,
    color: '#333',
  },
  emptyText: {
    padding: 16,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionText: {
    padding: 16,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  menuItemCard: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItemPrice: {
    fontSize: 12,
    color: '#2874F0',
    fontWeight: 'bold',
    marginTop: 2,
  },
  menuItemDescription: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginLeft: 8,
  },
  menuItemTags: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  vegTag: {
    backgroundColor: '#e8f5e9',
  },
  spicyTag: {
    backgroundColor: '#ffebee',
  },
  tagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayWithScroll: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxWidth: 400,
    alignSelf: 'center',
    margin: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 13,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#2874F0',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#333',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2874F0',
    borderColor: '#2874F0',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  warning: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MenuScreen;
