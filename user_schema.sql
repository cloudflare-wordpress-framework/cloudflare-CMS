CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  full_name TEXT,
  birthdate DATE,
  workplace TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
