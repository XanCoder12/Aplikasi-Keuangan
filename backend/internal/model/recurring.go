package model

import "time"

type RecurringTransaction struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	CategoryID    int       `json:"category_id"`
	Amount        int64     `json:"amount"`
	Description   string    `json:"description"`
	Type          string    `json:"type"` // "income" or "expense"
	Frequency     string    `json:"frequency"` // "daily", "weekly", "monthly", "yearly"
	StartDate     string    `json:"start_date"` // "2024-01-15"
	EndDate       string    `json:"end_date,omitempty"`
	NextDate      string    `json:"next_date"`
	LastProcessed string    `json:"last_processed,omitempty"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	// Joined fields
	CategoryName  string `json:"category_name,omitempty"`
	CategoryIcon  string `json:"category_icon,omitempty"`
	CategoryColor string `json:"category_color,omitempty"`
}

type RecurringRequest struct {
	CategoryID  int    `json:"category_id" binding:"required"`
	Amount      int64  `json:"amount" binding:"required,min=1"`
	Description string `json:"description"`
	Type        string `json:"type" binding:"required,oneof=income expense"`
	Frequency   string `json:"frequency" binding:"required,oneof=daily weekly monthly yearly"`
	StartDate   string `json:"start_date" binding:"required"`
	EndDate     string `json:"end_date"`
	IsActive    *bool  `json:"is_active"`
}
