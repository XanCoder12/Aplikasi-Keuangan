package model

import "time"

type Category struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // "income" or "expense"
	Icon      string    `json:"icon"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

type CategoryRequest struct {
	Name  string `json:"name" binding:"required"`
	Type  string `json:"type" binding:"required,oneof=income expense"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}
