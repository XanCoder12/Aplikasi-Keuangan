package repository

import (
	"context"

	"github.com/akrom/finance-backend/internal/database"
	"github.com/akrom/finance-backend/internal/model"
)

func GetSavingsGoals(userID int) ([]model.SavingsGoal, error) {
	rows, err := database.Pool.Query(context.Background(),
		`SELECT id, user_id, name, target_amount, current_amount, 
		 CASE WHEN deadline IS NOT NULL THEN deadline::text ELSE NULL END,
		 color, image_url, created_at, updated_at 
		 FROM savings_goals WHERE user_id = $1 
		 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []model.SavingsGoal
	for rows.Next() {
		var g model.SavingsGoal
		if err := rows.Scan(&g.ID, &g.UserID, &g.Name, &g.TargetAmount, &g.CurrentAmount,
			&g.Deadline, &g.Color, &g.ImageURL, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, err
		}
		goals = append(goals, g)
	}
	return goals, nil
}

func GetSavingsGoalByID(userID, id int) (*model.SavingsGoal, error) {
	var g model.SavingsGoal
	err := database.Pool.QueryRow(context.Background(),
		`SELECT id, user_id, name, target_amount, current_amount, 
		 CASE WHEN deadline IS NOT NULL THEN deadline::text ELSE NULL END,
		 color, image_url, created_at, updated_at 
		 FROM savings_goals WHERE id = $1 AND user_id = $2`, id, userID).
		Scan(&g.ID, &g.UserID, &g.Name, &g.TargetAmount, &g.CurrentAmount,
			&g.Deadline, &g.Color, &g.ImageURL, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func CreateSavingsGoal(userID int, req model.SavingsGoalRequest) (*model.SavingsGoal, error) {
	color := req.Color
	if color == "" {
		color = "#3b82f6"
	}

	var g model.SavingsGoal
	err := database.Pool.QueryRow(context.Background(),
		`INSERT INTO savings_goals (user_id, name, target_amount, deadline, color, image_url) 
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, user_id, name, target_amount, current_amount, 
		 CASE WHEN deadline IS NOT NULL THEN deadline::text ELSE NULL END,
		 color, image_url, created_at, updated_at`,
		userID, req.Name, req.TargetAmount, req.Deadline, color, req.ImageURL).
		Scan(&g.ID, &g.UserID, &g.Name, &g.TargetAmount, &g.CurrentAmount,
			&g.Deadline, &g.Color, &g.ImageURL, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func UpdateSavingsGoal(userID, id int, req model.SavingsGoalRequest) (*model.SavingsGoal, error) {
	color := req.Color
	if color == "" {
		color = "#3b82f6"
	}

	var g model.SavingsGoal
	err := database.Pool.QueryRow(context.Background(),
		`UPDATE savings_goals SET name=$1, target_amount=$2, deadline=$3, color=$4, image_url=$5, updated_at=NOW() 
		 WHERE id=$6 AND user_id=$7
		 RETURNING id, user_id, name, target_amount, current_amount, 
		 CASE WHEN deadline IS NOT NULL THEN deadline::text ELSE NULL END,
		 color, image_url, created_at, updated_at`,
		req.Name, req.TargetAmount, req.Deadline, color, req.ImageURL, id, userID).
		Scan(&g.ID, &g.UserID, &g.Name, &g.TargetAmount, &g.CurrentAmount,
			&g.Deadline, &g.Color, &g.ImageURL, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func DeleteSavingsGoal(userID, id int) error {
	_, err := database.Pool.Exec(context.Background(),
		"DELETE FROM savings_goals WHERE id=$1 AND user_id=$2", id, userID)
	return err
}

func DepositToSavingsGoal(userID, id int, amount int64) (*model.SavingsGoal, error) {
	var g model.SavingsGoal
	err := database.Pool.QueryRow(context.Background(),
		`UPDATE savings_goals SET current_amount = current_amount + $1, updated_at = NOW() 
		 WHERE id=$2 AND user_id=$3
		 RETURNING id, user_id, name, target_amount, current_amount, 
		 CASE WHEN deadline IS NOT NULL THEN deadline::text ELSE NULL END,
		 color, image_url, created_at, updated_at`,
		amount, id, userID).
		Scan(&g.ID, &g.UserID, &g.Name, &g.TargetAmount, &g.CurrentAmount,
			&g.Deadline, &g.Color, &g.ImageURL, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func WithdrawFromSavingsGoal(userID, id int, amount int64) (*model.SavingsGoal, error) {
	var g model.SavingsGoal
	err := database.Pool.QueryRow(context.Background(),
		`UPDATE savings_goals SET current_amount = GREATEST(current_amount - $1, 0), updated_at = NOW() 
		 WHERE id=$2 AND user_id=$3
		 RETURNING id, user_id, name, target_amount, current_amount, 
		 CASE WHEN deadline IS NOT NULL THEN deadline::text ELSE NULL END,
		 color, image_url, created_at, updated_at`,
		amount, id, userID).
		Scan(&g.ID, &g.UserID, &g.Name, &g.TargetAmount, &g.CurrentAmount,
			&g.Deadline, &g.Color, &g.ImageURL, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}
