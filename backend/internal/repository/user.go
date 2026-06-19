package repository

import (
	"context"
	"fmt"

	"github.com/akrom/finance-backend/internal/database"
	"github.com/akrom/finance-backend/internal/model"
)

func CreateUser(name, email, passwordHash string) (*model.User, error) {
	query := `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at`
	var u model.User
	err := database.Pool.QueryRow(context.Background(), query, name, email, passwordHash).
		Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &u, nil
}

func GetUserByEmail(email string) (*model.User, string, error) {
	query := `SELECT id, name, email, COALESCE(password_hash, '') AS password_hash, COALESCE(google_id, '') AS google_id, created_at FROM users WHERE email = $1`
	var u model.User
	var hash string
	var gid string
	err := database.Pool.QueryRow(context.Background(), query, email).
		Scan(&u.ID, &u.Name, &u.Email, &hash, &gid, &u.CreatedAt)
	if err != nil {
		return nil, "", fmt.Errorf("get user by email: %w", err)
	}
	if gid != "" {
		u.GoogleID = &gid
	}
	return &u, hash, nil
}

func GetUserByID(id int) (*model.User, error) {
	query := `SELECT id, name, email, COALESCE(google_id, '') AS google_id, created_at FROM users WHERE id = $1`
	var u model.User
	var gid string
	err := database.Pool.QueryRow(context.Background(), query, id).
		Scan(&u.ID, &u.Name, &u.Email, &gid, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user %d: %w", id, err)
	}
	if gid != "" {
		u.GoogleID = &gid
	}
	return &u, nil
}

// GetUserByGoogleID returns the user with the given Google subject ID.
func GetUserByGoogleID(googleID string) (*model.User, error) {
	query := `SELECT id, name, email, COALESCE(google_id, '') AS google_id, created_at FROM users WHERE google_id = $1`
	var u model.User
	var gid string
	err := database.Pool.QueryRow(context.Background(), query, googleID).
		Scan(&u.ID, &u.Name, &u.Email, &gid, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user by google_id: %w", err)
	}
	if gid != "" {
		u.GoogleID = &gid
	}
	return &u, nil
}

// CreateUserGoogle creates a new user from Google OAuth (no password).
func CreateUserGoogle(name, email, googleID string) (*model.User, error) {
	query := `INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING id, name, email, COALESCE(google_id, '') AS google_id, created_at`
	var u model.User
	var gid string
	err := database.Pool.QueryRow(context.Background(), query, name, email, googleID).
		Scan(&u.ID, &u.Name, &u.Email, &gid, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user (google): %w", err)
	}
	if gid != "" {
		u.GoogleID = &gid
	}
	return &u, nil
}

// LinkGoogleID attaches a Google subject ID to an existing user.
func LinkGoogleID(userID int, googleID string) error {
	_, err := database.Pool.Exec(context.Background(),
		"UPDATE users SET google_id = $1 WHERE id = $2", googleID, userID)
	if err != nil {
		return fmt.Errorf("link google_id to user %d: %w", userID, err)
	}
	return nil
}
