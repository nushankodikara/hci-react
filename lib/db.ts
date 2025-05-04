import Database from 'sqlite3';
import bcrypt from 'bcrypt';
import { DesignState } from '@/context/DesignContext'; // Import DesignState

const dbPath = process.env.NODE_ENV === 'production' ? './prod.db' : './dev.db';

export const db = new Database.Database(dbPath, (err: Error | null) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log(`Connected to the SQLite database at ${dbPath}`);
    // Optional: Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS designs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roomData TEXT, -- Store room parameters as JSON string
      designData TEXT, -- Store design elements as JSON string
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err: Error | null) => {
      if (err) {
        console.error('Error creating designs table', err.message);
      }
    });
    // Add other table creations here if needed (e.g., users)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL -- Store hashed passwords only!
      )`, (err: Error | null) => {
        if (err) {
            console.error('Error creating users table', err.message);
        }
    });
    
    // --- Add Models Table --- 
    db.run(`CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        filePath TEXT UNIQUE NOT NULL, -- Path relative to /public
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err: Error | null) => {
        if (err) {
            console.error('Error creating models table', err.message);
        }
    });
  }
});

// --- Database Interaction Functions ---

interface User {
  id: number;
  username: string;
  passwordHash: string;
}

interface Model {
  id: number;
  name: string;
  filePath: string;
  createdAt?: string; // Optional as it has a default
}

export function getUserByUsername(username: string): Promise<User | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err: Error | null, row: User | undefined) => {
      if (err) {
        console.error('Error fetching user by username:', err.message);
        return reject(err);
      }
      resolve(row || null);
    });
  });
}

// --- Model Functions ---

export function addModel(name: string, filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare("INSERT INTO models (name, filePath) VALUES (?, ?)");
    // Use function() syntax for callback to access `this.lastID`
    stmt.run(name, filePath, function(this: Database.RunResult, err: Error | null) {
      if (err) {
        console.error('Error inserting model:', err.message);
        return reject(err);
      }
      resolve(this.lastID);
    });
    stmt.finalize();
  });
}

export function getAvailableModels(): Promise<Model[]> {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, name, filePath FROM models ORDER BY createdAt DESC', [], (err: Error | null, rows: Model[]) => {
            if (err) {
                console.error('Error fetching models:', err.message);
                return reject(err);
            }
            resolve(rows || []);
        });
    });
}

// NEW: Function to delete a model by ID
export function deleteModelById(id: number): Promise<Model | null> {
  return new Promise((resolve, reject) => {
    // First, get the model details (especially filePath) before deleting
    db.get('SELECT id, name, filePath, createdAt FROM models WHERE id = ?', [id], (err: Error | null, row: Model | undefined) => {
      if (err) {
        console.error('Error fetching model before delete:', err.message);
        return reject(err);
      }
      if (!row) {
        // Model not found, resolve with null or reject
        console.warn(`Model with ID ${id} not found for deletion.`);
        return resolve(null);
      }

      // Model found, proceed with deletion
      const modelToDelete = row; // Store the row data
      db.run('DELETE FROM models WHERE id = ?', [id], function(this: Database.RunResult, deleteErr: Error | null) {
        if (deleteErr) {
          console.error('Error deleting model:', deleteErr.message);
          return reject(deleteErr);
        }
        if (this.changes === 0) {
          // Should not happen if we found it above, but good practice
          console.warn(`Zero rows affected when deleting model ID ${id}.`);
        }
        console.log(`Model deleted successfully from DB with ID: ${id}`);
        resolve(modelToDelete); // Resolve with the data of the deleted model
      });
    });
  });
}

// --- User Functions ---

export function addUser(username: string, passwordHash: string): Promise<number> {
    return new Promise((resolve, reject) => {
        // First, check if username already exists
        getUserByUsername(username).then(existingUser => {
            if (existingUser) {
                // User already exists, reject the promise
                return reject(new Error('Username already taken'));
            }
            // Username is available, proceed with insertion
            const stmt = db.prepare("INSERT INTO users (username, passwordHash) VALUES (?, ?)");
            stmt.run(username, passwordHash, function(this: Database.RunResult, err: Error | null) {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    return reject(err);
                }
                console.log(`User ${username} added with ID: ${this.lastID}`);
                resolve(this.lastID);
            });
            stmt.finalize();
        }).catch(err => {
            // Error during the check phase
            console.error('Error checking for existing user:', err);
            reject(err);
        });
    });
}

// --- Design Functions ---

// Extend the imported DesignState for DB representation
interface Design extends DesignState {
    id: number;
    name: string;
    createdAt?: string;
    roomData: string; // Override from context type
    designData: string; // Override from context type
}

export function saveDesign(name: string, roomData: string, designData: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT INTO designs (name, roomData, designData) VALUES (?, ?, ?)");
        stmt.run(name, roomData, designData, function(this: Database.RunResult, err: Error | null) {
            if (err) {
                console.error('Error saving design:', err.message);
                return reject(err);
            }
            console.log(`Design saved with ID: ${this.lastID}`);
            resolve(this.lastID);
        });
        stmt.finalize();
    });
}

export function getDesignsList(): Promise<Pick<Design, 'id' | 'name' | 'createdAt'>[]> {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, name, createdAt FROM designs ORDER BY createdAt DESC', [], (err: Error | null, rows: Pick<Design, 'id' | 'name' | 'createdAt'>[]) => {
            if (err) {
                console.error('Error fetching design list:', err.message);
                return reject(err);
            }
            resolve(rows || []);
        });
    });
}

export function getDesignById(id: number): Promise<Design | null> {
    return new Promise((resolve, reject) => {
        db.get('SELECT id, name, roomData, designData, createdAt FROM designs WHERE id = ?', [id], (err: Error | null, row: Design | undefined) => {
            if (err) {
                console.error('Error fetching design by ID:', err.message);
                return reject(err);
            }
            resolve(row || null);
        });
    });
}

// Function to delete a design
export function deleteDesign(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM designs WHERE id = ?', [id], function(this: Database.RunResult, err: Error | null) {
            if (err) {
                console.error('Error deleting design:', err.message);
                return reject(err);
            }
            if (this.changes === 0) {
                 console.warn(`Attempted to delete non-existent design with ID: ${id}`);
                 // Optionally reject or resolve normally
            }
             console.log(`Design deleted successfully with ID: ${id}`);
            resolve();
        });
    });
}

// Add functions for designs later
// e.g., export async function getDesigns() { ... } 