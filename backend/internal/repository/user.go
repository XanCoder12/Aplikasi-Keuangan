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
	query := `SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1`
	var u model.User
	var hash string
	err := database.Pool.QueryRow(context.Background(), query, email).
		Scan(&u.ID, &u.Name, &u.Email, &hash, &u.CreatedAt)
	if err != nil {
		return nil, "", fmt.Errorf("get user by email: %w", err)
	}
	return &u, hash, nil
}

func GetUserByID(id int) (*model.User, error) {
	query := `SELECT id, name, email, created_at FROM users WHERE id = $1`
	var u model.User
	err := database.Pool.QueryRow(context.Background(), query, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user %d: %w", id, err)
	}
	return &u, nil
}
