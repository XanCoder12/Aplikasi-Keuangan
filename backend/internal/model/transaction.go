package model

import "time"

type Transaction struct {
	ID          int       `json:"id"`
	CategoryID  int       `json:"category_id"`
	Amount      int64     `json:"amount"`
	Description string    `json:"description"`
	Date        string    `json:"date"` // format: "2024-01-15"
	Type        string    `json:"type"` // "income" or "expense"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	// Joined field
	CategoryName  string `json:"category_name,omitempty"`
	CategoryIcon  string `json:"category_icon,omitempty"`
	CategoryColor string `json:"category_color,omitempty"`
}

type TransactionRequest struct {
	CategoryID  int    `json:"category_id" binding:"required"`
	Amount      int64  `json:"amount" binding:"required,min=1"`
	Description string `json:"description"`
	Date        string `json:"date" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=income expense"`
}

type TransactionFilter struct {
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
	Month      int    `form:"month"`
	Year       int    `form:"year"`
	Type       string `form:"type"`
	CategoryID int    `form:"category_id"`
}

type SummaryResponse struct {
	TotalIncome  int64             `json:"total_income"`
	TotalExpense int64             `json:"total_expense"`
	Balance      int64             `json:"balance"`
	ByCategory   []CategorySummary `json:"by_category"`
}

type CategorySummary struct {
	CategoryID    int    `json:"category_id"`
	CategoryName  string `json:"category_name"`
	CategoryIcon  string `json:"category_icon"`
	CategoryColor string `json:"category_color"`
	Total         int64  `json:"total"`
	Count         int    `json:"count"`
}

type MonthlyTrend struct {
	Month   int   `json:"month"`
	Income  int64 `json:"income"`
	Expense int64 `json:"expense"`
	Balance int64 `json:"balance"`
}

type YearlyTrendResponse struct {
	Year         int            `json:"year"`
	TotalIncome  int64          `json:"total_income"`
	TotalExpense int64          `json:"total_expense"`
	Balance      int64          `json:"balance"`
	Months       []MonthlyTrend `json:"months"`
}

type WeeklyTrend struct {
	Week    int   `json:"week"`
	Income  int64 `json:"income"`
	Expense int64 `json:"expense"`
}

type CategoryWeeklyTrend struct {
	CategoryID    int           `json:"category_id"`
	CategoryName  string        `json:"category_name"`
	CategoryColor string        `json:"category_color"`
	Total         int64         `json:"total"`
	Count         int           `json:"count"`
	Weekly        []WeeklyTrend `json:"weekly"`
}

type CategoryTrendResponse struct {
	Month      int                   `json:"month"`
	Year       int                   `json:"year"`
	Categories []CategoryWeeklyTrend `json:"categories"`
}
