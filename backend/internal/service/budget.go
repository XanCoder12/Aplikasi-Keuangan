package service

import (
	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/repository"
)

func GetBudgets(userID, month, year int) ([]model.Budget, error) {
	return repository.GetBudgets(userID, month, year)
}

func UpsertBudget(userID int, req model.BudgetRequest) (*model.Budget, error) {
	return repository.UpsertBudget(userID, req)
}

func DeleteBudget(userID, id int) error {
	return repository.DeleteBudget(userID, id)
}

func GetBudgetSummary(userID, month, year int) (*model.BudgetSummaryResponse, error) {
	return repository.GetBudgetSummary(userID, month, year)
}
