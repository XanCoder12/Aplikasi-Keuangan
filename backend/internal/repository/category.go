package repository

import (
	"context"
	"fmt"

	"github.com/akrom/finance-backend/internal/database"
	"github.com/akrom/finance-backend/internal/model"
)

func GetCategories(userID int, categoryType string) ([]model.Category, error) {
	query := "SELECT id, name, type, icon, color, created_at FROM categories WHERE user_id = $1"
	args := []interface{}{userID}
	argIdx := 2

	if categoryType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, categoryType)
		argIdx++
	}
	query += " ORDER BY type, name"

	rows, err := database.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("query categories: %w", err)
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &c.Icon, &c.Color, &c.CreatedAt); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, nil
}

func GetCategoryByID(id, userID int) (*model.Category, error) {
	query := "SELECT id, name, type, icon, color, created_at FROM categories WHERE id = $1 AND user_id = $2"
	var c model.Category
	err := database.Pool.QueryRow(context.Background(), query, id, userID).Scan(
		&c.ID, &c.Name, &c.Type, &c.Icon, &c.Color, &c.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get category %d: %w", id, err)
	}
	return &c, nil
}

func CreateCategory(userID int, req model.CategoryRequest) (*model.Category, error) {
	query := "INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, type, icon, color, created_at"
	var c model.Category
	err := database.Pool.QueryRow(context.Background(), query,
		userID, req.Name, req.Type, req.Icon, req.Color).Scan(
		&c.ID, &c.Name, &c.Type, &c.Icon, &c.Color, &c.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create category: %w", err)
	}
	return &c, nil
}

func UpdateCategory(id, userID int, req model.CategoryRequest) (*model.Category, error) {
	query := "UPDATE categories SET name=$1, type=$2, icon=$3, color=$4 WHERE id=$5 AND user_id=$6 RETURNING id, name, type, icon, color, created_at"
	var c model.Category
	err := database.Pool.QueryRow(context.Background(), query,
		req.Name, req.Type, req.Icon, req.Color, id, userID).Scan(
		&c.ID, &c.Name, &c.Type, &c.Icon, &c.Color, &c.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("update category %d: %w", id, err)
	}
	return &c, nil
}

func DeleteCategory(id, userID int) error {
	_, err := database.Pool.Exec(context.Background(), "DELETE FROM categories WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		return fmt.Errorf("delete category %d: %w", id, err)
	}
	return nil
}
