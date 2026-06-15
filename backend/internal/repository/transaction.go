package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/akrom/finance-backend/internal/database"
	"github.com/akrom/finance-backend/internal/model"
)

func GetTransactions(userID int, filter model.TransactionFilter) ([]model.Transaction, int, error) {
	where := []string{"t.user_id = $1"}
	args := []interface{}{userID}
	argIdx := 2

	if filter.Month > 0 && filter.Year > 0 {
		where = append(where, fmt.Sprintf("EXTRACT(MONTH FROM t.date) = $%d", argIdx))
		args = append(args, filter.Month)
		argIdx++
		where = append(where, fmt.Sprintf("EXTRACT(YEAR FROM t.date) = $%d", argIdx))
		args = append(args, filter.Year)
		argIdx++
	} else if filter.Month > 0 {
		where = append(where, fmt.Sprintf("EXTRACT(MONTH FROM t.date) = $%d", argIdx))
		args = append(args, filter.Month)
		argIdx++
	} else if filter.Year > 0 {
		where = append(where, fmt.Sprintf("EXTRACT(YEAR FROM t.date) = $%d", argIdx))
		args = append(args, filter.Year)
		argIdx++
	}

	if filter.Type != "" {
		where = append(where, fmt.Sprintf("t.type = $%d", argIdx))
		args = append(args, filter.Type)
		argIdx++
	}

	if filter.CategoryID > 0 {
		where = append(where, fmt.Sprintf("t.category_id = $%d", argIdx))
		args = append(args, filter.CategoryID)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM transactions t WHERE %s", whereClause)
	var total int
	err := database.Pool.QueryRow(context.Background(), countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count transactions: %w", err)
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := fmt.Sprintf(`
		SELECT t.id, t.category_id, t.amount, t.description, t.date::text, t.type, t.created_at, t.updated_at,
			   c.name AS category_name, c.icon AS category_icon, c.color AS category_color
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE %s
		ORDER BY t.date DESC, t.id DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := database.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query transactions: %w", err)
	}
	defer rows.Close()

	var transactions []model.Transaction
	for rows.Next() {
		var t model.Transaction
		if err := rows.Scan(&t.ID, &t.CategoryID, &t.Amount, &t.Description, &t.Date, &t.Type,
			&t.CreatedAt, &t.UpdatedAt, &t.CategoryName, &t.CategoryIcon, &t.CategoryColor); err != nil {
			return nil, 0, err
		}
		transactions = append(transactions, t)
	}

	return transactions, total, nil
}

func GetTransactionByID(id, userID int) (*model.Transaction, error) {
	query := `
		SELECT t.id, t.category_id, t.amount, t.description, t.date::text, t.type, t.created_at, t.updated_at,
			   c.name AS category_name, c.icon AS category_icon, c.color AS category_color
		FROM transactions t
		JOIN categories c ON c.id = t.category_id
		WHERE t.id = $1 AND t.user_id = $2
	`
	var t model.Transaction
	err := database.Pool.QueryRow(context.Background(), query, id, userID).Scan(
		&t.ID, &t.CategoryID, &t.Amount, &t.Description, &t.Date, &t.Type,
		&t.CreatedAt, &t.UpdatedAt, &t.CategoryName, &t.CategoryIcon, &t.CategoryColor)
	if err != nil {
		return nil, fmt.Errorf("get transaction %d: %w", id, err)
	}
	return &t, nil
}

func CreateTransaction(userID int, req model.TransactionRequest) (*model.Transaction, error) {
	query := `
		INSERT INTO transactions (user_id, category_id, amount, description, date, type)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, category_id, amount, description, date::text, type, created_at, updated_at
	`
	var t model.Transaction
	err := database.Pool.QueryRow(context.Background(), query,
		userID, req.CategoryID, req.Amount, req.Description, req.Date, req.Type).Scan(
		&t.ID, &t.CategoryID, &t.Amount, &t.Description, &t.Date, &t.Type,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create transaction: %w", err)
	}
	return &t, nil
}

func UpdateTransaction(id, userID int, req model.TransactionRequest) (*model.Transaction, error) {
	query := `
		UPDATE transactions SET category_id=$1, amount=$2, description=$3, date=$4, type=$5, updated_at=NOW()
		WHERE id=$6 AND user_id=$7
		RETURNING id, category_id, amount, description, date::text, type, created_at, updated_at
	`
	var t model.Transaction
	err := database.Pool.QueryRow(context.Background(), query,
		req.CategoryID, req.Amount, req.Description, req.Date, req.Type, id, userID).Scan(
		&t.ID, &t.CategoryID, &t.Amount, &t.Description, &t.Date, &t.Type,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update transaction %d: %w", id, err)
	}
	return &t, nil
}

func DeleteTransaction(id, userID int) error {
	_, err := database.Pool.Exec(context.Background(), "DELETE FROM transactions WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		return fmt.Errorf("delete transaction %d: %w", id, err)
	}
	return nil
}

func GetSummary(userID, month, year int) (*model.SummaryResponse, error) {
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
		FROM transactions
		WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
	`
	var summary model.SummaryResponse
	err := database.Pool.QueryRow(context.Background(), query, userID, month, year).Scan(
		&summary.TotalIncome, &summary.TotalExpense)
	if err != nil {
		return nil, fmt.Errorf("get summary: %w", err)
	}
	summary.Balance = summary.TotalIncome - summary.TotalExpense

	catQuery := `
		SELECT c.id, c.name, c.icon, c.color,
			   COALESCE(SUM(t.amount), 0) AS total,
			   COUNT(t.id) AS count
		FROM categories c
		LEFT JOIN transactions t ON t.category_id = c.id
			AND t.user_id = $1
			AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
		WHERE c.user_id = $1
		GROUP BY c.id, c.name, c.icon, c.color
		ORDER BY total DESC
	`
	rows, err := database.Pool.Query(context.Background(), catQuery, userID, month, year)
	if err != nil {
		return nil, fmt.Errorf("get summary by category: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cs model.CategorySummary
		if err := rows.Scan(&cs.CategoryID, &cs.CategoryName, &cs.CategoryIcon,
			&cs.CategoryColor, &cs.Total, &cs.Count); err != nil {
			return nil, err
		}
		summary.ByCategory = append(summary.ByCategory, cs)
	}

	return &summary, nil
}
