import Database from 'sqlite3';
import bcrypt from 'bcrypt';

const dbPath = './dev.db'; // Target the development database
const db = new Database.Database(dbPath);

const username = 'designer';
const plainPassword = 'password123';
const saltRounds = 10;

console.log(`Seeding database at: ${dbPath}`);

// Ensure the users table exists (redundant if db.ts runs first, but safe)
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL
  )`, (err: Error | null) => {
    if (err) {
      console.error('Error ensuring users table exists:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('Users table verified/created.');

    // Hash the password
    bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        db.close();
        process.exit(1);
      }
      
      console.log(`Password hashed for user: ${username}`);

      // Insert the user, replacing if the username already exists
      const stmt = db.prepare("INSERT OR REPLACE INTO users (username, passwordHash) VALUES (?, ?)");
      stmt.run(username, hash, (err: Error | null) => {
        if (err) {
          console.error('Error inserting user:', err.message);
        } else {
          console.log(`Successfully inserted/updated user: ${username}`);
        }
        stmt.finalize(); // Finalize the statement
        db.close((err) => { // Close the database connection
          if (err) {
            console.error('Error closing database:', err.message);
          }
          console.log('Database connection closed.');
        });
      });
    });
}); 