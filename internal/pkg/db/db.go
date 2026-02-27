package db

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB() error {
	home, _ := os.UserHomeDir()
	dbDir := filepath.Join(home, ".renovo")
	os.MkdirAll(dbDir, 0755)
	dbPath := filepath.Join(dbDir, "renovo.db")

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	// Create tables
	sqlStmt := `
	CREATE TABLE IF NOT EXISTS presets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		rules TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		operation_type TEXT,
		details TEXT,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = DB.Exec(sqlStmt)
	return err
}
