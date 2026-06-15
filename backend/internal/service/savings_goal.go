package service

import (
	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/repository"
)

func GetSavingsGoals(userID int) ([]model.SavingsGoal, error) {
	return repository.GetSavingsGoals(userID)
}

func GetSavingsGoalByID(userID, id int) (*model.SavingsGoal, error) {
	return repository.GetSavingsGoalByID(userID, id)
}

func CreateSavingsGoal(userID int, req model.SavingsGoalRequest) (*model.SavingsGoal, error) {
	return repository.CreateSavingsGoal(userID, req)
}

func UpdateSavingsGoal(userID, id int, req model.SavingsGoalRequest) (*model.SavingsGoal, error) {
	return repository.UpdateSavingsGoal(userID, id, req)
}

func DeleteSavingsGoal(userID, id int) error {
	return repository.DeleteSavingsGoal(userID, id)
}

func DepositToSavingsGoal(userID, id int, amount int64) (*model.SavingsGoal, error) {
	return repository.DepositToSavingsGoal(userID, id, amount)
}

func WithdrawFromSavingsGoal(userID, id int, amount int64) (*model.SavingsGoal, error) {
	return repository.WithdrawFromSavingsGoal(userID, id, amount)
}
