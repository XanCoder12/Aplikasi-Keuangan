package service

import (
	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/repository"
)

func GetTransactions(userID int, filter model.TransactionFilter) ([]model.Transaction, int, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	return repository.GetTransactions(userID, filter)
}

func GetTransactionByID(id, userID int) (*model.Transaction, error) {
	return repository.GetTransactionByID(id, userID)
}

func CreateTransaction(userID int, req model.TransactionRequest) (*model.Transaction, error) {
	return repository.CreateTransaction(userID, req)
}

func UpdateTransaction(id, userID int, req model.TransactionRequest) (*model.Transaction, error) {
	return repository.UpdateTransaction(id, userID, req)
}

func DeleteTransaction(id, userID int) error {
	return repository.DeleteTransaction(id, userID)
}

func GetSummary(userID, month, year int) (*model.SummaryResponse, error) {
	return repository.GetSummary(userID, month, year)
}

func GetYearlyTrend(userID, year int) (*model.YearlyTrendResponse, error) {
	return repository.GetYearlyTrend(userID, year)
}

func GetCategoryTrend(userID, month, year int) (*model.CategoryTrendResponse, error) {
	return repository.GetCategoryTrend(userID, month, year)
}
