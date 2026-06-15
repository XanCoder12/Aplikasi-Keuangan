package service

import (
	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/repository"
)

func GetCategories(userID int, categoryType string) ([]model.Category, error) {
	return repository.GetCategories(userID, categoryType)
}

func GetCategoryByID(id, userID int) (*model.Category, error) {
	return repository.GetCategoryByID(id, userID)
}

func CreateCategory(userID int, req model.CategoryRequest) (*model.Category, error) {
	if req.Icon == "" {
		req.Icon = "Circle"
	}
	if req.Color == "" {
		req.Color = "#6b7280"
	}
	return repository.CreateCategory(userID, req)
}

func UpdateCategory(id, userID int, req model.CategoryRequest) (*model.Category, error) {
	if req.Icon == "" {
		req.Icon = "Circle"
	}
	if req.Color == "" {
		req.Color = "#6b7280"
	}
	return repository.UpdateCategory(id, userID, req)
}

func DeleteCategory(id, userID int) error {
	return repository.DeleteCategory(id, userID)
}
