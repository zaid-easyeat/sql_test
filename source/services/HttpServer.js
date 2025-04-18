import {NativeModules} from 'react-native';
import TcpSocket from 'react-native-tcp-socket';
import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
// import DeviceInfo from 'react-native-device-info';
// import {fetch} from 'react-native-fetch-api';

class HttpServer {
  constructor() {
    this.server = null;
    this.port = 8080;
    this.clients = new Set();
    this.onRequest = null;
    this.clientBuffers = new Map();
  }

  /**
   * Check if a server is running on a given port by making an HTTP request.
   * @param {number} port - The port number to check.
   * @returns {Promise<boolean>} - Resolves to true if the server is running, false otherwise.
   */
  // isServerRunning = async port => {
  //   try {
  //     const response = await fetch(`http://127.0.0.1:${port}`);
  //     if (response.status >= 200 && response.status < 500) {
  //       console.log('====================================');
  //       console.log('Server responded → Server is running');
  //       console.log('====================================');
  //       return true; // Server responded → Server is running
  //     }
  //   } catch (error) {
  //     console.log('====================================');
  //     console.log('Server not responded → Server not running');
  //     console.log('====================================');
  //     return false; // No response → Server not running
  //   }
  //   return false;
  // };

  /**
   * Check if a server is running on a given port
   * @param {number} port - The port number to check
   * @returns {Promise<boolean>} - Resolves to true if the port is in use, false otherwise
   */
  isPortInUse = port => {
    console.log('isPortInUse ..  . .');
    return new Promise(resolve => {
      const client = TcpSocket.createConnection(
        {port, host: '127.0.0.1'},
        () => {
          client.destroy(); // Connection successful, server is running
          resolve(true); // when port is already running its true or client have instance of local address and port
        },
      );

      console.log('client >> ', client);

      client.on('error', error => {
        console.log('====================================');
        console.log('error >>> ', error);
        console.log('====================================');
        if (error == 'Connection refused') {
          console.log('====================================');
          console.log('No server running on this port..');
          console.log('====================================');
          resolve(false);
        } else {
          console.log('====================================');
          console.log('Else Error ..  ', error);
          console.log('====================================');
          resolve(false);
        }
        client.destroy();
      });
    });
  };

  initDatabase() {
    return new Promise((resolve, reject) => {
      try {
        this.db = SQLite.openDatabase(
          {name: 'restaurantDB.db', location: 'default'},
          () => {
            console.log('Database opened successfully');

            // Create restaurant_user table if it doesn't exist
            this.db.transaction(tx => {
              tx.executeSql(
                `CREATE TABLE IF NOT EXISTS restaurant_user (
                  _id TEXT PRIMARY KEY,
                  admin_cred TEXT,
                  all_outlets INTEGER,
                  creation_timestamp INTEGER,
                  designation TEXT,
                  dial_code TEXT,
                  employee_id TEXT,
                  gender TEXT,
                  history TEXT, 
                  hq_id TEXT,
                  image_url TEXT,
                  inv_cred TEXT,
                  is_admin INTEGER,
                  is_hq_admin INTEGER,
                  kitchen_counters TEXT,
                  last_reset_token TEXT,
                  login_email TEXT,
                  login_phone TEXT,
                  modified_at INTEGER,
                  password_hash TEXT,
                  refresh_token INTEGER,
                  restaurant_id TEXT,
                  restaurant_ids TEXT,
                  restaurant_name TEXT,
                  staff_cred TEXT,
                  status INTEGER,
                  tables TEXT,
                  token TEXT,
                  token_expiry INTEGER,
                  user_id TEXT,
                  user_name TEXT,
                  user_role TEXT,
                  user_roles TEXT,
                  user_type TEXT,
                  work_timings TEXT
                )`,
                [],
                () => {
                  console.log('Restaurant User table created successfully');
                  resolve(true);
                },
                (_, error) => {
                  console.error('Error creating Restaurant User table:', error);
                  reject(error);
                },
              );
            });

            // Add this function to initialize the category schema
            const initializeCategorySchema = db => {
              // Check if category table exists using transaction and executeSql
              db.transaction(tx => {
                tx.executeSql(
                  "SELECT name FROM sqlite_master WHERE type='table' AND name='category'",
                  [],
                  (_, results) => {
                    if (results.rows.length === 0) {
                      console.log('Creating category table...');
                      // Create the category table with SQLite schema using executeSql
                      db.transaction(tx => {
                        tx.executeSql(
                          `CREATE TABLE IF NOT EXISTS category (
                            _id INTEGER PRIMARY KEY AUTOINCREMENT,
                            cmm_id TEXT,
                            created_at TEXT,
                            description TEXT,
                            hq_id TEXT,
                            id TEXT,
                            name TEXT,
                            priority INTEGER,
                            restaurant_id TEXT,
                            status INTEGER,
                            updated_at TEXT,
                            visible INTEGER
                          )`,
                          [],
                          (_, result) => {
                            console.log('Category table created successfully');
                          },
                          (_, error) => {
                            console.error(
                              'Error creating category table:',
                              error,
                            );
                          },
                        );
                      });
                    } else {
                      console.log('Category table already exists');
                    }
                  },
                  (_, error) => {
                    console.error('Error checking for category table:', error);
                  },
                );
              });
            };

            // After database connection is established
            initializeCategorySchema(this.db);

            // Add this after the initializeCategorySchema function
            const initializeSubcategorySchema = db => {
              // Check if subcategory table exists
              db.transaction(tx => {
                tx.executeSql(
                  "SELECT name FROM sqlite_master WHERE type='table' AND name='subcategory'",
                  [],
                  (_, results) => {
                    if (results.rows.length === 0) {
                      console.log('Creating subcategory table...');
                      // Create the subcategory table with SQLite schema
                      db.transaction(tx => {
                        tx.executeSql(
                          `CREATE TABLE IF NOT EXISTS subcategory (
                            _id INTEGER PRIMARY KEY AUTOINCREMENT,
                            category_id TEXT NOT NULL,
                            cmm_id TEXT,
                            created_at TEXT,
                            description TEXT,
                            hq_id TEXT,
                            id TEXT,
                            kitchen_counter_id TEXT,
                            kitchen_counters TEXT, 
                            name TEXT,
                            priority INTEGER,
                            restaurant_id TEXT,
                            status INTEGER,
                            updated_at TEXT,
                            visible INTEGER,
                            FOREIGN KEY (category_id) REFERENCES category(id)
                          )`,
                          [],
                          (_, result) => {
                            console.log(
                              'Subcategory table created successfully',
                            );
                          },
                          (_, error) => {
                            console.error(
                              'Error creating subcategory table:',
                              error,
                            );
                          },
                        );
                      });
                    } else {
                      console.log('Subcategory table already exists');
                    }
                  },
                  (_, error) => {
                    console.error(
                      'Error checking for subcategory table:',
                      error,
                    );
                  },
                );
              });
            };

            // Call the initialization function after database connection
            // Add this after calling initializeCategorySchema
            initializeSubcategorySchema(this.db);

            // Add this after the initializeSubcategorySchema function
            const initializeMenuItemsSchema = db => {
              // Check if menu_items table exists
              db.transaction(tx => {
                tx.executeSql(
                  "SELECT name FROM sqlite_master WHERE type='table' AND name='menu_items'",
                  [],
                  (_, results) => {
                    if (results.rows.length === 0) {
                      console.log('Creating menu_items table...');
                      // Create the menu_items table with SQLite schema
                      db.transaction(tx => {
                        tx.executeSql(
                          `CREATE TABLE IF NOT EXISTS menu_items (
                            _id INTEGER PRIMARY KEY AUTOINCREMENT,
                            id TEXT,
                            item_name TEXT NOT NULL,
                            description TEXT,
                            item_code TEXT,
                            category_id TEXT NOT NULL,
                            subcategory_id TEXT NOT NULL,
                            kitchen_counter_id TEXT,
                            price REAL NOT NULL,
                            original_price REAL,
                            currency TEXT,
                            image TEXT,
                            availability INTEGER DEFAULT 1,
                            availability_days TEXT,
                            base_qty INTEGER DEFAULT 1,
                            cmm_id TEXT,
                            combo_discount REAL,
                            combo_discount_type TEXT,
                            created_at TEXT,
                            filters TEXT,
                            grab_price REAL,
                            hq_id TEXT,
                            is_combo_item INTEGER DEFAULT 0,
                            is_ee INTEGER DEFAULT 0,
                            is_grab INTEGER DEFAULT 0,
                            next_available INTEGER,
                            no_of_reviews INTEGER DEFAULT 0,
                            open_price REAL,
                            order_type INTEGER,
                            parent_id TEXT,
                            preparation_minutes INTEGER,
                            priority INTEGER DEFAULT 0,
                            restaurant_id TEXT,
                            status INTEGER DEFAULT 1,
                            total_rating INTEGER DEFAULT 0,
                            unit TEXT,
                            updated_at TEXT,
                            visible INTEGER DEFAULT 1,
                            addons_list TEXT, 
                            inventory_details TEXT,
                            combo_items TEXT,
                            variations TEXT,
                            FOREIGN KEY (category_id) REFERENCES category(id),
                            FOREIGN KEY (subcategory_id) REFERENCES subcategory(id)
                          )`,
                          [],
                          (_, result) => {
                            console.log(
                              'Menu Items table created successfully',
                            );
                          },
                          (_, error) => {
                            console.error(
                              'Error creating menu_items table:',
                              error,
                            );
                          },
                        );
                      });
                    } else {
                      console.log('Menu Items table already exists');
                    }
                  },
                  (_, error) => {
                    console.error(
                      'Error checking for menu_items table:',
                      error,
                    );
                  },
                );
              });
            };

            // Call the initialization function after database connection
            // Add this after calling initializeSubcategorySchema
            initializeMenuItemsSchema(this.db);
          },
          error => {
            console.error('Error opening database:', error);
            reject(error);
          },
        );

        this.getDatabasePath();
      } catch (error) {
        console.error('Database initialization error:', error);
        reject(error);
      }
    });
  }

  start(port = 8080) {
    console.log('====================================');
    console.log('this.server >> ', this.server);
    console.log('====================================');

    return new Promise(async (resolve, reject) => {
      try {
        // Check if server is already running
        // if (this.server) {
        //   console.log('Server is already running on port', this.port);
        //   return resolve(); // Proceed without error
        // }

        // console.log('====================================');
        // console.log('Port checking');
        // console.log('====================================');

        this.port = port;

        // // Check if port is in use before starting the server
        const inUse = await this.isPortInUse(this.port);
        if (inUse) {
          console.log(
            `Port ${this.port} is already in use, but continuing execution.`,
          );
          return resolve(); // Avoid starting another server, but proceed
        }

        // const inServerUse = await this.isServerRunning(this.port);
        // if (inServerUse) {
        //   console.log(
        //     `isServerRunning Port ${this.port} is already in use, but continuing execution.`,
        //   );
        //   return resolve(); // Avoid starting another server, but proceed
        // }

        // Initialize database first
        this.initDatabase()
          .then(() => {
            console.log('Creating TCP server...');

            this.server = TcpSocket.createServer(socket => {
              console.log('Client connected from: ', socket.address());
              this.clients.add(socket);
              this.clientBuffers.set(socket, '');

              console.log('socket >> ', socket);

              socket.on('data', chunk => {
                console.log('this.clientBuffers >> ', this.clientBuffers);

                console.log('Received data chunk:', chunk.toString());
                console.log('Received data chunk, size:', chunk.length);
                let buffer = this.clientBuffers.get(socket) + chunk.toString();
                this.clientBuffers.set(socket, buffer);
                console.log('====================================');
                console.log('buffer >> ', buffer);
                console.log('====================================');
                if (this.isCompleteHttpRequest(buffer)) {
                  console.log('Complete HTTP request received, processing...');
                  this.handleRequest(buffer, socket);
                  this.clientBuffers.set(socket, '');
                } else {
                  console.log('Partial HTTP request, waiting for more data...');
                }
              });

              socket.on('error', error => {
                console.error('Socket error:', error);
                this.clients.delete(socket);
                this.clientBuffers.delete(socket);
              });

              socket.on('close', () => {
                console.log('Client disconnected');
                this.clients.delete(socket);
                this.clientBuffers.delete(socket);
              });
            });

            this.server.listen(
              {
                port: this.port,
                host: '0.0.0.0',
                reuseAddress: true,
              },
              () => {
                console.log(
                  `Server listening on ALL interfaces (0.0.0.0), port ${this.port}`,
                );
                resolve();
              },
            );

            console.log('====================================');
            console.log('this.server >> ', this.server);
            console.log('====================================');

            this.server.on('error', error => {
              console.error('Server error:', error);
              reject(error);
            });
          })
          .catch(error => {
            console.error('Failed to initialize database:', error);
            reject(error);
          });
      } catch (error) {
        console.error('Failed to start server:', error);
        reject(error);
      }
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.server) {
          resolve();
          return;
        }

        // Close all client connections
        for (const client of this.clients) {
          client.destroy();
        }
        this.clients.clear();

        this.server.close(() => {
          this.server = null;
          console.log('Server closed');
          resolve();
        });
      } catch (error) {
        console.error('Failed to stop server:', error);
        reject(error);
      }
    });
  }

  handleRequest(data, socket) {
    // Parse HTTP request
    console.log('Handling raw request data, length:', data.length);
    console.log(
      'Request preview:',
      data.substring(0, 200) + (data.length > 200 ? '...' : ''),
    );

    const requestLines = data.split('\r\n');
    const [method, url] = requestLines[0].split(' ');

    // Create request object
    const request = {
      method,
      url,
      headers: {},
    };

    // Parse headers
    let i = 1;
    let contentType = '';
    let contentLength = 0;

    while (i < requestLines.length && requestLines[i] !== '') {
      const colonIndex = requestLines[i].indexOf(': ');
      if (colonIndex > 0) {
        const key = requestLines[i].substring(0, colonIndex).toLowerCase();
        const value = requestLines[i].substring(colonIndex + 2);
        request.headers[key] = value;

        // Store these for body parsing
        if (key === 'content-type') {
          contentType = value;
        } else if (key === 'content-length') {
          contentLength = parseInt(value, 10) || 0;
        }
      }
      i++;
    }

    // Extract request body if it's a POST or PUT request
    if (method === 'POST' || method === 'PUT') {
      // Find the body start position
      const headerEndPos = data.indexOf('\r\n\r\n');

      if (headerEndPos > -1) {
        // Extract raw body
        const rawBody = data.substring(headerEndPos + 4);
        console.log('Raw body length:', rawBody.length);
        console.log(
          'Raw body preview:',
          rawBody.substring(0, 50) + (rawBody.length > 50 ? '...' : ''),
        );
        console.log('Content-Type:', contentType);
        console.log('Content-Length:', contentLength);

        // More detailed debugging
        console.log('Full request data:');
        console.log('---HEADERS---');
        console.log(data.substring(0, headerEndPos));
        console.log('---BODY---');
        console.log(rawBody);
        console.log('------------');

        // Handle different content types
        if (contentType.includes('application/json')) {
          try {
            // Trim any extraneous characters that might be present
            const cleanBody = rawBody.trim();
            if (cleanBody.length > 0) {
              console.log('Attempting to parse JSON:', cleanBody);
              request.body = JSON.parse(cleanBody);
              console.log('Parsed body:', request.body);
            } else {
              console.warn('Empty JSON body received');
              request.body = {};
            }
          } catch (e) {
            console.error('Invalid JSON body:', e);
            console.error('Raw body was:', rawBody);
            // Try to recover with simple parsing
            try {
              // Sometimes the body might have extra characters
              const extractedJson = rawBody.match(/({.*})/s);
              if (extractedJson) {
                request.body = JSON.parse(extractedJson[1]);
                console.log('Recovered JSON body:', request.body);
              }
            } catch (e2) {
              console.error('Could not recover JSON:', e2);
            }
          }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          // Handle form data
          const formData = {};
          const pairs = rawBody.split('&');
          for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key) {
              formData[decodeURIComponent(key)] = value
                ? decodeURIComponent(value)
                : '';
            }
          }
          request.body = formData;
        } else {
          // For other content types, store raw body
          request.body = rawBody;
        }
      }
    }

    // Helper to send HTTP responses
    const response = {
      send: (statusCode, body, headers = {}) => {
        const statusText = this.getStatusText(statusCode);
        let responseText = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;

        // Set content length header only for non-empty body
        if (body) {
          const contentLength = this.getByteLength(body);
          headers['Content-Length'] = contentLength;
        }

        // Add date header
        headers['Date'] = new Date().toUTCString();
        headers['Server'] = 'ReactNativeServer/1.0';
        headers['Connection'] = 'close'; // Don't keep connections open

        // Add headers to response
        for (const [key, value] of Object.entries(headers)) {
          responseText += `${key}: ${value}\r\n`;
        }

        // End headers section
        responseText += '\r\n';

        // Add body if it exists
        if (body) {
          responseText += body;
        }

        console.log('Sending response:', responseText);

        try {
          socket.write(responseText);
          // We'll close the connection after response is sent
          socket.end();
        } catch (error) {
          console.error('Error sending response:', error);
        }
      },
    };

    console.log('URL >>> ', url);

    // Route handling
    if (url === '/api/tables' && method === 'GET') {
      // Get all tables in the database
      this.getAllTables()
        .then(tables => {
          response.send(200, JSON.stringify(tables), {
            'Content-Type': 'application/json',
          });
        })
        .catch(error => {
          console.error('Error getting tables:', error);
          response.send(
            500,
            JSON.stringify({
              error: 'Database error',
              message: error.message || 'Failed to get tables',
            }),
            {'Content-Type': 'application/json'},
          );
        });
    } else if (url === '/api/restaurant-users' && method === 'GET') {
      // Get all restaurant users
      this.db.transaction(
        tx => {
          tx.executeSql(
            'SELECT * FROM restaurant_user',
            [],
            (_, results) => {
              const users = [];
              for (let i = 0; i < results.rows.length; i++) {
                users.push(results.rows.item(i));
              }
              response.send(200, JSON.stringify(users), {
                'Content-Type': 'application/json',
              });
            },
            (_, error) => {
              console.error('Error getting restaurant users:', error);
              response.send(
                500,
                JSON.stringify({
                  error: 'Database error',
                  message: error.message || 'Unknown database error',
                }),
                {'Content-Type': 'application/json'},
              );
              return true;
            },
          );
        },
        error => {
          console.error('Transaction error:', error);
          response.send(
            500,
            JSON.stringify({
              error: 'Transaction failed',
              message: error.message || 'Unknown transaction error',
            }),
            {'Content-Type': 'application/json'},
          );
        },
      );
    } else if (url === '/api/restaurant-users' && method === 'POST') {
      // Add new restaurant user
      console.log('Request body:', request.body);

      // Extract fields from request body
      const {
        login_email,
        login_phone,
        user_name,
        user_role,
        restaurant_name,
        is_admin,
      } = request.body || {};

      if (!login_email || !user_name) {
        response.send(
          400,
          JSON.stringify({error: 'Email and name are required'}),
          {'Content-Type': 'application/json'},
        );
        return;
      }

      // Generate a unique ID
      const userId = '_' + Math.random().toString(36).substr(2, 9);
      const now = Date.now();

      this.db.transaction(
        tx => {
          tx.executeSql(
            `INSERT INTO restaurant_user (
              _id, login_email, login_phone, user_name, user_role,
              restaurant_name, is_admin, creation_timestamp, modified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              login_email,
              login_phone || '',
              user_name,
              user_role || 'user',
              restaurant_name || '',
              is_admin ? 1 : 0,
              now,
              now,
            ],
            (_, results) => {
              if (results.rowsAffected > 0) {
                response.send(
                  201,
                  JSON.stringify({
                    success: true,
                    id: userId,
                    message: 'Restaurant user added successfully',
                  }),
                  {'Content-Type': 'application/json'},
                );
              } else {
                response.send(
                  500,
                  JSON.stringify({error: 'Failed to add user'}),
                  {'Content-Type': 'application/json'},
                );
              }
            },
            (_, error) => {
              console.error('Error adding restaurant user:', error);
              response.send(
                500,
                JSON.stringify({
                  error: 'Database error',
                  message: error.message || 'Unknown database error',
                }),
                {'Content-Type': 'application/json'},
              );
              return true;
            },
          );
        },
        error => {
          console.error('Transaction error:', error);
          response.send(
            500,
            JSON.stringify({
              error: 'Transaction failed',
              message: error.message || 'Unknown transaction error',
            }),
            {'Content-Type': 'application/json'},
          );
        },
      );
    } else if (
      url.match(/^\/api\/restaurant-users\/[\w]+$/) &&
      method === 'DELETE'
    ) {
      // Delete a restaurant user
      const userId = url.split('/').pop();

      this.db.transaction(
        tx => {
          tx.executeSql(
            'DELETE FROM restaurant_user WHERE _id = ?',
            [userId],
            (_, results) => {
              if (results.rowsAffected > 0) {
                response.send(
                  200,
                  JSON.stringify({
                    success: true,
                    message: 'Restaurant user deleted successfully',
                  }),
                  {'Content-Type': 'application/json'},
                );
              } else {
                response.send(404, JSON.stringify({error: 'User not found'}), {
                  'Content-Type': 'application/json',
                });
              }
            },
            (_, error) => {
              console.error('Error deleting restaurant user:', error);
              response.send(
                500,
                JSON.stringify({
                  error: 'Database error',
                  message: error.message || 'Unknown database error',
                }),
                {'Content-Type': 'application/json'},
              );
              return true;
            },
          );
        },
        error => {
          console.error('Transaction error when deleting user:', error);
          response.send(
            500,
            JSON.stringify({
              error: 'Transaction failed',
              message: error.message || 'Unknown transaction error',
            }),
            {'Content-Type': 'application/json'},
          );
        },
      );
    } else if (url === '/api/categories' && method === 'GET') {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM category ORDER BY priority, name',
          [],
          (_, results) => {
            const categories = [];
            for (let i = 0; i < results.rows.length; i++) {
              categories.push(results.rows.item(i));
            }
            response.send(200, JSON.stringify(categories), {
              'Content-Type': 'application/json',
            });
          },
          (_, error) => {
            console.error('Error fetching categories:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url === '/api/categories' && method === 'POST') {
      const {
        name,
        description,
        cmm_id,
        hq_id,
        restaurant_id,
        priority,
        status,
        visible,
      } = request.body || {};

      if (!name) {
        response.send(
          400,
          JSON.stringify({error: 'Category name is required'}),
          {'Content-Type': 'application/json'},
        );
        return;
      }

      // Generate a unique ID
      const categoryId = 'cat_' + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();

      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO category (
            id, name, description, cmm_id, hq_id, restaurant_id,
            priority, status, visible, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            categoryId,
            name,
            description || '',
            cmm_id || '',
            hq_id || '',
            restaurant_id || '',
            priority || 0,
            status || 1,
            visible || 1,
            now,
            now,
          ],
          (_, results) => {
            if (results.rowsAffected > 0) {
              response.send(
                201,
                JSON.stringify({
                  success: true,
                  id: categoryId,
                  message: 'Category created successfully',
                }),
                {'Content-Type': 'application/json'},
              );
            } else {
              response.send(
                500,
                JSON.stringify({error: 'Failed to create category'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error creating category:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/categories\/[\w]+$/) && method === 'GET') {
      // Get a specific category
      const categoryId = url.split('/').pop();

      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM category WHERE id = ?',
          [categoryId],
          (_, results) => {
            if (results.rows.length > 0) {
              response.send(200, JSON.stringify(results.rows.item(0)), {
                'Content-Type': 'application/json',
              });
            } else {
              response.send(
                404,
                JSON.stringify({error: 'Category not found'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error fetching category:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/categories\/[\w]+$/) && method === 'PUT') {
      // Update a category
      const categoryId = url.split('/').pop();
      const {
        name,
        description,
        cmm_id,
        hq_id,
        restaurant_id,
        priority,
        status,
        visible,
      } = request.body || {};

      if (!name) {
        response.send(
          400,
          JSON.stringify({error: 'Category name is required'}),
          {'Content-Type': 'application/json'},
        );
        return;
      }

      const now = new Date().toISOString();

      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE category SET 
            name = ?, 
            description = ?, 
            cmm_id = ?, 
            hq_id = ?, 
            restaurant_id = ?,
            priority = ?, 
            status = ?, 
            visible = ?, 
            updated_at = ?
          WHERE id = ?`,
          [
            name,
            description || '',
            cmm_id || '',
            hq_id || '',
            restaurant_id || '',
            priority || 0,
            status || 1,
            visible || 1,
            now,
            categoryId,
          ],
          (_, results) => {
            if (results.rowsAffected > 0) {
              response.send(
                200,
                JSON.stringify({
                  success: true,
                  message: 'Category updated successfully',
                }),
                {'Content-Type': 'application/json'},
              );
            } else {
              response.send(
                404,
                JSON.stringify({error: 'Category not found'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error updating category:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/categories\/[\w]+$/) && method === 'DELETE') {
      // Delete a category
      const categoryId = url.split('/').pop();

      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM category WHERE id = ?',
          [categoryId],
          (_, results) => {
            if (results.rowsAffected > 0) {
              response.send(
                200,
                JSON.stringify({
                  success: true,
                  message: 'Category deleted successfully',
                }),
                {'Content-Type': 'application/json'},
              );
            } else {
              response.send(
                404,
                JSON.stringify({error: 'Category not found'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error deleting category:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/subcategories(\?.*)?$/) && method === 'GET') {
      // Parse query parameters manually instead of using URLSearchParams
      let categoryId = null;

      // Extract query string if present
      const queryString = url.includes('?') ? url.split('?')[1] : '';

      // Parse query parameters manually
      if (queryString) {
        const params = queryString.split('&');
        for (const param of params) {
          const [key, value] = param.split('=');
          if (key === 'category_id' && value) {
            categoryId = decodeURIComponent(value);
            break;
          }
        }
      }

      let query = 'SELECT * FROM subcategory';
      let params = [];

      if (categoryId) {
        query += ' WHERE category_id = ?';
        params.push(categoryId);
      }

      query += ' ORDER BY priority, name';

      this.db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, results) => {
            const subcategories = [];
            for (let i = 0; i < results.rows.length; i++) {
              const item = results.rows.item(i);
              // Parse kitchen_counters from JSON if it exists
              if (item.kitchen_counters) {
                try {
                  item.kitchen_counters = JSON.parse(item.kitchen_counters);
                } catch (e) {
                  console.error('Error parsing kitchen_counters:', e);
                  item.kitchen_counters = [];
                }
              } else {
                item.kitchen_counters = [];
              }
              subcategories.push(item);
            }
            response.send(200, JSON.stringify(subcategories), {
              'Content-Type': 'application/json',
            });
          },
          (_, error) => {
            console.error('Error fetching subcategories:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url === '/api/subcategories' && method === 'POST') {
      const {
        category_id,
        name,
        description,
        cmm_id,
        hq_id,
        kitchen_counter_id,
        kitchen_counters,
        restaurant_id,
        priority,
        status,
        visible,
      } = request.body || {};

      if (!name || !category_id) {
        response.send(
          400,
          JSON.stringify({
            error: 'Subcategory name and category_id are required',
          }),
          {'Content-Type': 'application/json'},
        );
        return;
      }

      // First verify that the referenced category exists
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT id FROM category WHERE id = ?',
          [category_id],
          (_, categoryResults) => {
            if (categoryResults.rows.length === 0) {
              response.send(
                404,
                JSON.stringify({error: 'Referenced category not found'}),
                {'Content-Type': 'application/json'},
              );
              return;
            }

            // Category exists, proceed with creating subcategory
            // Generate a unique ID
            const subcategoryId =
              'subcat_' + Math.random().toString(36).substr(2, 9);
            const now = new Date().toISOString();

            // Convert kitchen_counters array to JSON string if it exists
            const kitchenCountersJson = kitchen_counters
              ? JSON.stringify(kitchen_counters)
              : null;

            this.db.transaction(tx => {
              tx.executeSql(
                `INSERT INTO subcategory (
                  id, category_id, name, description, cmm_id, hq_id, 
                  kitchen_counter_id, kitchen_counters, restaurant_id,
                  priority, status, visible, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  subcategoryId,
                  category_id,
                  name,
                  description || '',
                  cmm_id || '',
                  hq_id || '',
                  kitchen_counter_id || '',
                  kitchenCountersJson,
                  restaurant_id || '',
                  priority || 0,
                  status || 1,
                  visible || 1,
                  now,
                  now,
                ],
                (_, results) => {
                  if (results.rowsAffected > 0) {
                    response.send(
                      201,
                      JSON.stringify({
                        success: true,
                        id: subcategoryId,
                        message: 'Subcategory created successfully',
                      }),
                      {'Content-Type': 'application/json'},
                    );
                  } else {
                    response.send(
                      500,
                      JSON.stringify({error: 'Failed to create subcategory'}),
                      {'Content-Type': 'application/json'},
                    );
                  }
                },
                (_, error) => {
                  console.error('Error creating subcategory:', error);
                  response.send(
                    500,
                    JSON.stringify({
                      error: 'Database error',
                      message: error.message || 'Unknown database error',
                    }),
                    {'Content-Type': 'application/json'},
                  );
                  return true;
                },
              );
            });
          },
          (_, error) => {
            console.error('Error checking category existence:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/subcategories\/[\w]+$/) && method === 'GET') {
      const subcategoryId = url.split('/').pop();

      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM subcategory WHERE id = ?',
          [subcategoryId],
          (_, results) => {
            if (results.rows.length > 0) {
              const item = results.rows.item(0);
              // Parse kitchen_counters from JSON if it exists
              if (item.kitchen_counters) {
                try {
                  item.kitchen_counters = JSON.parse(item.kitchen_counters);
                } catch (e) {
                  console.error('Error parsing kitchen_counters:', e);
                  item.kitchen_counters = [];
                }
              } else {
                item.kitchen_counters = [];
              }

              response.send(200, JSON.stringify(item), {
                'Content-Type': 'application/json',
              });
            } else {
              response.send(
                404,
                JSON.stringify({error: 'Subcategory not found'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error fetching subcategory:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/subcategories\/[\w]+$/) && method === 'PUT') {
      const subcategoryId = url.split('/').pop();
      const {
        category_id,
        name,
        description,
        cmm_id,
        hq_id,
        kitchen_counter_id,
        kitchen_counters,
        restaurant_id,
        priority,
        status,
        visible,
      } = request.body || {};

      if (!name) {
        response.send(
          400,
          JSON.stringify({error: 'Subcategory name is required'}),
          {'Content-Type': 'application/json'},
        );
        return;
      }

      // Check if category_id was changed and validate the new category exists
      const categoryCheck = category_id
        ? new Promise((resolve, reject) => {
            this.db.transaction(tx => {
              tx.executeSql(
                'SELECT id FROM category WHERE id = ?',
                [category_id],
                (_, categoryResults) => {
                  if (categoryResults.rows.length === 0) {
                    reject(new Error('Referenced category not found'));
                  } else {
                    resolve();
                  }
                },
                (_, error) => {
                  reject(error);
                },
              );
            });
          })
        : Promise.resolve();

      categoryCheck
        .then(() => {
          const now = new Date().toISOString();

          // Convert kitchen_counters array to JSON string if it exists
          const kitchenCountersJson = kitchen_counters
            ? JSON.stringify(kitchen_counters)
            : null;

          let query = `UPDATE subcategory SET 
                        name = ?, 
                        description = ?, 
                        cmm_id = ?, 
                        hq_id = ?`;

          let params = [name, description || '', cmm_id || '', hq_id || ''];

          // Add optional fields if provided
          if (category_id) {
            query += ', category_id = ?';
            params.push(category_id);
          }

          if (kitchen_counter_id !== undefined) {
            query += ', kitchen_counter_id = ?';
            params.push(kitchen_counter_id || '');
          }

          if (kitchenCountersJson !== undefined) {
            query += ', kitchen_counters = ?';
            params.push(kitchenCountersJson);
          }

          if (restaurant_id !== undefined) {
            query += ', restaurant_id = ?';
            params.push(restaurant_id || '');
          }

          if (priority !== undefined) {
            query += ', priority = ?';
            params.push(priority || 0);
          }

          if (status !== undefined) {
            query += ', status = ?';
            params.push(status || 1);
          }

          if (visible !== undefined) {
            query += ', visible = ?';
            params.push(visible || 1);
          }

          query += ', updated_at = ? WHERE id = ?';
          params.push(now, subcategoryId);

          this.db.transaction(tx => {
            tx.executeSql(
              query,
              params,
              (_, results) => {
                if (results.rowsAffected > 0) {
                  response.send(
                    200,
                    JSON.stringify({
                      success: true,
                      message: 'Subcategory updated successfully',
                    }),
                    {'Content-Type': 'application/json'},
                  );
                } else {
                  response.send(
                    404,
                    JSON.stringify({error: 'Subcategory not found'}),
                    {'Content-Type': 'application/json'},
                  );
                }
              },
              (_, error) => {
                console.error('Error updating subcategory:', error);
                response.send(
                  500,
                  JSON.stringify({
                    error: 'Database error',
                    message: error.message || 'Unknown database error',
                  }),
                  {'Content-Type': 'application/json'},
                );
                return true;
              },
            );
          });
        })
        .catch(error => {
          console.error('Category validation error:', error);
          response.send(
            400,
            JSON.stringify({
              error: error.message || 'Category validation failed',
            }),
            {'Content-Type': 'application/json'},
          );
        });
    } else if (
      url.match(/^\/api\/subcategories\/[\w]+$/) &&
      method === 'DELETE'
    ) {
      const subcategoryId = url.split('/').pop();

      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM subcategory WHERE id = ?',
          [subcategoryId],
          (_, results) => {
            if (results.rowsAffected > 0) {
              response.send(
                200,
                JSON.stringify({
                  success: true,
                  message: 'Subcategory deleted successfully',
                }),
                {'Content-Type': 'application/json'},
              );
            } else {
              response.send(
                404,
                JSON.stringify({error: 'Subcategory not found'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error deleting subcategory:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/menu\/items(\?.*)?$/) && method === 'GET') {
      // Parse query parameters manually
      let subcategoryId = null;
      let categoryId = null;

      // Extract query string if present
      const queryString = url.includes('?') ? url.split('?')[1] : '';

      // Parse query parameters manually
      if (queryString) {
        const params = queryString.split('&');
        for (const param of params) {
          const [key, value] = param.split('=');
          if (key === 'subcategory_id' && value) {
            subcategoryId = decodeURIComponent(value);
          } else if (key === 'category_id' && value) {
            categoryId = decodeURIComponent(value);
          }
        }
      }

      let query = 'SELECT * FROM menu_items';
      let params = [];
      let whereAdded = false;

      if (subcategoryId) {
        query += ' WHERE subcategory_id = ?';
        params.push(subcategoryId);
        whereAdded = true;
      }

      if (categoryId) {
        query += whereAdded ? ' AND category_id = ?' : ' WHERE category_id = ?';
        params.push(categoryId);
        whereAdded = true;
      }

      query += ' ORDER BY priority, item_name';

      this.db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, results) => {
            const menuItems = [];
            for (let i = 0; i < results.rows.length; i++) {
              const item = results.rows.item(i);

              // Parse JSON fields
              try {
                if (item.addons_list)
                  item.addons_list = JSON.parse(item.addons_list);
                if (item.inventory_details)
                  item.inventory_details = JSON.parse(item.inventory_details);
                if (item.combo_items)
                  item.combo_items = JSON.parse(item.combo_items);
                if (item.variations)
                  item.variations = JSON.parse(item.variations);
              } catch (e) {
                console.error('Error parsing JSON fields:', e);
              }

              menuItems.push(item);
            }
            response.send(200, JSON.stringify(menuItems), {
              'Content-Type': 'application/json',
            });
          },
          (_, error) => {
            console.error('Error fetching menu items:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url === '/api/menu/items' && method === 'POST') {
      const {
        item_name,
        description,
        item_code,
        category_id,
        subcategory_id,
        kitchen_counter_id,
        price,
        original_price,
        currency,
        image,
        availability,
        availability_days,
        base_qty,
        cmm_id,
        combo_discount,
        combo_discount_type,
        filters,
        grab_price,
        hq_id,
        is_combo_item,
        is_ee,
        is_grab,
        next_available,
        open_price,
        order_type,
        parent_id,
        preparation_minutes,
        priority,
        restaurant_id,
        status,
        unit,
        visible,
        addons_list,
        inventory_details,
        combo_items,
        variations,
      } = request.body || {};

      if (
        !item_name ||
        !subcategory_id ||
        !category_id ||
        price === undefined
      ) {
        response.send(
          400,
          JSON.stringify({
            error:
              'Item name, category_id, subcategory_id, and price are required',
          }),
          {'Content-Type': 'application/json'},
        );
        return;
      }

      // Verify that the referenced category and subcategory exist
      // First check category
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT id FROM category WHERE id = ?',
          [category_id],
          (_, categoryResults) => {
            if (categoryResults.rows.length === 0) {
              response.send(
                404,
                JSON.stringify({error: 'Referenced category not found'}),
                {'Content-Type': 'application/json'},
              );
              return;
            }

            // Then check subcategory
            tx.executeSql(
              'SELECT id FROM subcategory WHERE id = ?',
              [subcategory_id],
              (_, subcategoryResults) => {
                if (subcategoryResults.rows.length === 0) {
                  response.send(
                    404,
                    JSON.stringify({error: 'Referenced subcategory not found'}),
                    {'Content-Type': 'application/json'},
                  );
                  return;
                }

                // Both exist, proceed with creating menu item
                // Generate a unique ID
                const menuItemId =
                  'item_' + Math.random().toString(36).substr(2, 9);
                const now = new Date().toISOString();

                // Convert array and object fields to JSON strings
                const addonsListJson = addons_list
                  ? JSON.stringify(addons_list)
                  : null;
                const inventoryDetailsJson = inventory_details
                  ? JSON.stringify(inventory_details)
                  : null;
                const comboItemsJson = combo_items
                  ? JSON.stringify(combo_items)
                  : null;
                const variationsJson = variations
                  ? JSON.stringify(variations)
                  : null;

                this.db.transaction(tx => {
                  tx.executeSql(
                    `INSERT INTO menu_items (
                      id, item_name, description, item_code, category_id, subcategory_id,
                      kitchen_counter_id, price, original_price, currency, image,
                      availability, availability_days, base_qty, cmm_id, combo_discount,
                      combo_discount_type, created_at, filters, grab_price, hq_id,
                      is_combo_item, is_ee, is_grab, next_available, open_price,
                      order_type, parent_id, preparation_minutes, priority, restaurant_id,
                      status, unit, updated_at, visible, addons_list, inventory_details,
                      combo_items, variations
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      menuItemId,
                      item_name,
                      description || '',
                      item_code || '',
                      category_id,
                      subcategory_id,
                      kitchen_counter_id || '',
                      price,
                      original_price || price,
                      currency || 'USD',
                      image || '',
                      availability !== undefined ? availability : 1,
                      availability_days || '',
                      base_qty || 1,
                      cmm_id || '',
                      combo_discount || 0,
                      combo_discount_type || '',
                      now,
                      filters || '',
                      grab_price || 0,
                      hq_id || '',
                      is_combo_item || 0,
                      is_ee || 0,
                      is_grab || 0,
                      next_available || null,
                      open_price || 0,
                      order_type || 0,
                      parent_id || '',
                      preparation_minutes || 0,
                      priority || 0,
                      restaurant_id || '',
                      status || 1,
                      unit || '',
                      now,
                      visible || 1,
                      addonsListJson,
                      inventoryDetailsJson,
                      comboItemsJson,
                      variationsJson,
                    ],
                    (_, results) => {
                      if (results.rowsAffected > 0) {
                        response.send(
                          201,
                          JSON.stringify({
                            success: true,
                            id: menuItemId,
                            message: 'Menu item created successfully',
                          }),
                          {'Content-Type': 'application/json'},
                        );
                      } else {
                        response.send(
                          500,
                          JSON.stringify({error: 'Failed to create menu item'}),
                          {'Content-Type': 'application/json'},
                        );
                      }
                    },
                    (_, error) => {
                      console.error('Error creating menu item:', error);
                      response.send(
                        500,
                        JSON.stringify({
                          error: 'Database error',
                          message: error.message || 'Unknown database error',
                        }),
                        {'Content-Type': 'application/json'},
                      );
                      return true;
                    },
                  );
                });
              },
              (_, error) => {
                console.error('Error checking subcategory existence:', error);
                response.send(
                  500,
                  JSON.stringify({
                    error: 'Database error',
                    message: error.message || 'Unknown database error',
                  }),
                  {'Content-Type': 'application/json'},
                );
                return true;
              },
            );
          },
          (_, error) => {
            console.error('Error checking category existence:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/menu\/items\/[\w]+$/) && method === 'GET') {
      const menuItemId = url.split('/').pop();

      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM menu_items WHERE id = ?',
          [menuItemId],
          (_, results) => {
            if (results.rows.length > 0) {
              const item = results.rows.item(0);

              // Parse JSON fields
              try {
                if (item.addons_list)
                  item.addons_list = JSON.parse(item.addons_list);
                if (item.inventory_details)
                  item.inventory_details = JSON.parse(item.inventory_details);
                if (item.combo_items)
                  item.combo_items = JSON.parse(item.combo_items);
                if (item.variations)
                  item.variations = JSON.parse(item.variations);
              } catch (e) {
                console.error('Error parsing JSON fields:', e);
              }

              response.send(200, JSON.stringify(item), {
                'Content-Type': 'application/json',
              });
            } else {
              response.send(
                404,
                JSON.stringify({error: 'Menu item not found'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error fetching menu item:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else if (url.match(/^\/api\/menu\/items\/[\w]+$/) && method === 'PUT') {
      const menuItemId = url.split('/').pop();
      const {
        item_name,
        description,
        item_code,
        category_id,
        subcategory_id,
        kitchen_counter_id,
        price,
        original_price,
        currency,
        image,
        availability,
        availability_days,
        base_qty,
        cmm_id,
        combo_discount,
        combo_discount_type,
        filters,
        grab_price,
        hq_id,
        is_combo_item,
        is_ee,
        is_grab,
        next_available,
        open_price,
        order_type,
        parent_id,
        preparation_minutes,
        priority,
        restaurant_id,
        status,
        unit,
        visible,
        addons_list,
        inventory_details,
        combo_items,
        variations,
      } = request.body || {};

      if (!item_name) {
        response.send(400, JSON.stringify({error: 'Item name is required'}), {
          'Content-Type': 'application/json',
        });
        return;
      }

      // If category_id or subcategory_id changed, verify they exist
      const fieldsToValidate = [];
      if (category_id)
        fieldsToValidate.push({table: 'category', id: category_id});
      if (subcategory_id)
        fieldsToValidate.push({table: 'subcategory', id: subcategory_id});

      const performValidations = async () => {
        for (const field of fieldsToValidate) {
          try {
            await new Promise((resolve, reject) => {
              this.db.transaction(tx => {
                tx.executeSql(
                  `SELECT id FROM ${field.table} WHERE id = ?`,
                  [field.id],
                  (_, results) => {
                    if (results.rows.length === 0) {
                      reject(new Error(`Referenced ${field.table} not found`));
                    } else {
                      resolve();
                    }
                  },
                  (_, error) => {
                    reject(error);
                  },
                );
              });
            });
          } catch (error) {
            throw error;
          }
        }
      };

      performValidations()
        .then(() => {
          const now = new Date().toISOString();

          // Convert array and object fields to JSON strings
          const addonsListJson = addons_list
            ? JSON.stringify(addons_list)
            : null;
          const inventoryDetailsJson = inventory_details
            ? JSON.stringify(inventory_details)
            : null;
          const comboItemsJson = combo_items
            ? JSON.stringify(combo_items)
            : null;
          const variationsJson = variations ? JSON.stringify(variations) : null;

          // Build dynamic update query
          let query = 'UPDATE menu_items SET item_name = ?, updated_at = ?';
          let params = [item_name, now];

          if (description !== undefined) {
            query += ', description = ?';
            params.push(description || '');
          }
          if (item_code !== undefined) {
            query += ', item_code = ?';
            params.push(item_code || '');
          }
          if (category_id !== undefined) {
            query += ', category_id = ?';
            params.push(category_id);
          }
          if (subcategory_id !== undefined) {
            query += ', subcategory_id = ?';
            params.push(subcategory_id);
          }
          if (kitchen_counter_id !== undefined) {
            query += ', kitchen_counter_id = ?';
            params.push(kitchen_counter_id || '');
          }
          if (price !== undefined) {
            query += ', price = ?';
            params.push(price);
          }
          if (original_price !== undefined) {
            query += ', original_price = ?';
            params.push(original_price);
          }
          if (currency !== undefined) {
            query += ', currency = ?';
            params.push(currency || 'USD');
          }
          if (image !== undefined) {
            query += ', image = ?';
            params.push(image || '');
          }
          if (availability !== undefined) {
            query += ', availability = ?';
            params.push(availability);
          }
          if (availability_days !== undefined) {
            query += ', availability_days = ?';
            params.push(availability_days || '');
          }
          if (base_qty !== undefined) {
            query += ', base_qty = ?';
            params.push(base_qty || 1);
          }
          if (cmm_id !== undefined) {
            query += ', cmm_id = ?';
            params.push(cmm_id || '');
          }
          if (combo_discount !== undefined) {
            query += ', combo_discount = ?';
            params.push(combo_discount || 0);
          }
          if (combo_discount_type !== undefined) {
            query += ', combo_discount_type = ?';
            params.push(combo_discount_type || '');
          }
          if (filters !== undefined) {
            query += ', filters = ?';
            params.push(filters || '');
          }
          if (grab_price !== undefined) {
            query += ', grab_price = ?';
            params.push(grab_price || 0);
          }
          if (hq_id !== undefined) {
            query += ', hq_id = ?';
            params.push(hq_id || '');
          }
          if (is_combo_item !== undefined) {
            query += ', is_combo_item = ?';
            params.push(is_combo_item || 0);
          }
          if (is_ee !== undefined) {
            query += ', is_ee = ?';
            params.push(is_ee || 0);
          }
          if (is_grab !== undefined) {
            query += ', is_grab = ?';
            params.push(is_grab || 0);
          }
          if (next_available !== undefined) {
            query += ', next_available = ?';
            params.push(next_available);
          }
          if (open_price !== undefined) {
            query += ', open_price = ?';
            params.push(open_price || 0);
          }
          if (order_type !== undefined) {
            query += ', order_type = ?';
            params.push(order_type || 0);
          }
          if (parent_id !== undefined) {
            query += ', parent_id = ?';
            params.push(parent_id || '');
          }
          if (preparation_minutes !== undefined) {
            query += ', preparation_minutes = ?';
            params.push(preparation_minutes || 0);
          }
          if (priority !== undefined) {
            query += ', priority = ?';
            params.push(priority || 0);
          }
          if (restaurant_id !== undefined) {
            query += ', restaurant_id = ?';
            params.push(restaurant_id || '');
          }
          if (status !== undefined) {
            query += ', status = ?';
            params.push(status || 1);
          }
          if (unit !== undefined) {
            query += ', unit = ?';
            params.push(unit || '');
          }
          if (visible !== undefined) {
            query += ', visible = ?';
            params.push(visible || 1);
          }
          if (addonsListJson !== null) {
            query += ', addons_list = ?';
            params.push(addonsListJson);
          }
          if (inventoryDetailsJson !== null) {
            query += ', inventory_details = ?';
            params.push(inventoryDetailsJson);
          }
          if (comboItemsJson !== null) {
            query += ', combo_items = ?';
            params.push(comboItemsJson);
          }
          if (variationsJson !== null) {
            query += ', variations = ?';
            params.push(variationsJson);
          }

          query += ' WHERE id = ?';
          params.push(menuItemId);

          this.db.transaction(tx => {
            tx.executeSql(
              query,
              params,
              (_, results) => {
                if (results.rowsAffected > 0) {
                  response.send(
                    200,
                    JSON.stringify({
                      success: true,
                      message: 'Menu item updated successfully',
                    }),
                    {'Content-Type': 'application/json'},
                  );
                } else {
                  response.send(
                    404,
                    JSON.stringify({error: 'Menu item not found'}),
                    {'Content-Type': 'application/json'},
                  );
                }
              },
              (_, error) => {
                console.error('Error updating menu item:', error);
                response.send(
                  500,
                  JSON.stringify({
                    error: 'Database error',
                    message: error.message || 'Unknown database error',
                  }),
                  {'Content-Type': 'application/json'},
                );
                return true;
              },
            );
          });
        })
        .catch(error => {
          console.error('Validation error:', error);
          response.send(
            400,
            JSON.stringify({
              error: error.message || 'Validation failed',
            }),
            {'Content-Type': 'application/json'},
          );
        });
    } else if (
      url.match(/^\/api\/menu\/items\/[\w]+$/) &&
      method === 'DELETE'
    ) {
      const menuItemId = url.split('/').pop();

      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM menu_items WHERE id = ?',
          [menuItemId],
          (_, results) => {
            if (results.rowsAffected > 0) {
              response.send(
                200,
                JSON.stringify({
                  success: true,
                  message: 'Menu item deleted successfully',
                }),
                {'Content-Type': 'application/json'},
              );
            } else {
              response.send(
                404,
                JSON.stringify({error: 'Menu item not found'}),
                {'Content-Type': 'application/json'},
              );
            }
          },
          (_, error) => {
            console.error('Error deleting menu item:', error);
            response.send(
              500,
              JSON.stringify({
                error: 'Database error',
                message: error.message || 'Unknown database error',
              }),
              {'Content-Type': 'application/json'},
            );
            return true;
          },
        );
      });
    } else {
      response.send(404, 'Not Found');
    }
  }

  getStatusText(statusCode) {
    const statusTexts = {
      200: 'OK',
      400: 'Bad Request',
      404: 'Not Found',
      500: 'Internal Server Error',
    };

    return statusTexts[statusCode] || 'Unknown';
  }

  getByteLength(str) {
    // Simple function to calculate string byte length in React Native
    // This works for ASCII and simple UTF-8 strings
    return unescape(encodeURIComponent(str)).length;
  }

  isCompleteHttpRequest(data) {
    // First check if we have headers at all
    const headerEndPos = data.indexOf('\r\n\r\n');
    if (headerEndPos === -1) {
      return false;
    }

    // Check if this is a GET or HEAD request which might not have a body
    const firstLine = data.substring(0, data.indexOf('\r\n'));
    if (firstLine.startsWith('GET') || firstLine.startsWith('HEAD')) {
      return true;
    }

    // For methods that may have a body, check Content-Length
    const contentLengthMatch = data.match(/content-length:\s*(\d+)/i);
    if (contentLengthMatch) {
      const contentLength = parseInt(contentLengthMatch[1], 10);
      const bodyStart = headerEndPos + 4;
      const bodyActualLength = data.length - bodyStart;

      console.log(
        `Expected body length: ${contentLength}, Actual: ${bodyActualLength}`,
      );

      return bodyActualLength >= contentLength;
    }

    // If no content-length, then check for chunked encoding
    if (data.match(/transfer-encoding:\s*chunked/i)) {
      // For simplicity, we're looking for the end chunk (0\r\n\r\n)
      return data.includes('\r\n0\r\n\r\n');
    }

    // If we can't determine, assume it's complete after headers
    return true;
  }

  getAllTables() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        // This SQLite query gets all table names
        tx.executeSql(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'",
          [],
          (_, results) => {
            const tables = [];
            for (let i = 0; i < results.rows.length; i++) {
              tables.push(results.rows.item(i).name);
            }
            resolve(tables);
          },
          (_, error) => {
            console.error('Error getting tables:', error);
            reject(error);
          },
        );
      });
    });
  }

  getDatabasePath() {
    let dbPath = '';

    if (Platform.OS === 'ios') {
      dbPath = `${RNFS.LibraryDirectoryPath}/restaurantDB.db`;
    } else {
      dbPath = `${RNFS.DocumentDirectoryPath}/restaurantDB.db`;
    }

    console.log('====================================');
    console.log('✅ ✅ ✅ SQLITE DATABASE PATH:', dbPath);
    console.log('====================================');
  }
}

export default {
  create: () => new HttpServer(),
};
