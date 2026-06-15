package model

import "time"

type SavingsGoal struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	Name          string    `json:"name"`
	TargetAmount  int64     `json:"target_amount"`
	CurrentAmount int64     `json:"current_amount"`
	Deadline      *string   `json:"deadline"` // optional, format: "2025-12-31"
	Color         string    `json:"color"`
	ImageURL      string    `json:"image_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type SavingsGoalRequest struct {
	Name         string  `json:"name" binding:"required,min=1"`
	TargetAmount int64   `json:"target_amount" binding:"required,min=1"`
	Deadline     *string `json:"deadline"`
	Color        string  `json:"color"`
	ImageURL     string  `json:"image_url"`
}

type SavingsGoalDeposit struct {
	Amount int64 `json:"amount" binding:"required,min=1"`
}
