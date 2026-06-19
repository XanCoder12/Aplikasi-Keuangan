package service

import (
	"fmt"

	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/repository"
)

func GetRecurring(userID int) ([]model.RecurringTransaction, error) {
	return repository.GetRecurring(userID)
}

func GetRecurringByID(id, userID int) (*model.RecurringTransaction, error) {
	return repository.GetRecurringByID(id, userID)
}

func CreateRecurring(userID int, req model.RecurringRequest) (*model.RecurringTransaction, error) {
	return repository.CreateRecurring(userID, req)
}

func UpdateRecurring(id, userID int, req model.RecurringRequest) (*model.RecurringTransaction, error) {
	return repository.UpdateRecurring(id, userID, req)
}

func DeleteRecurring(id, userID int) error {
	return repository.DeleteRecurring(id, userID)
}

// ProcessDueRecurring generates real transactions for every due recurring item.
// If userID is 0, all users are processed (used at server startup); otherwise
// only the given user's items are processed (manual trigger). It loops to catch
// up on missed periods, capped to avoid runaway generation.
func ProcessDueRecurring(userID int) (int, error) {
	processed := 0
	const maxIterations = 500

	for iter := 0; iter < maxIterations; iter++ {
		due, err := repository.GetDueRecurring(userID)
		if err != nil {
			return processed, fmt.Errorf("get due recurring: %w", err)
		}
		if len(due) == 0 {
			break
		}

		for _, r := range due {
			req := model.TransactionRequest{
				CategoryID:  r.CategoryID,
				Amount:      r.Amount,
				Description: r.Description,
				Date:        r.NextDate,
				Type:        r.Type,
			}
			if _, err := repository.CreateTransaction(r.UserID, req); err != nil {
				// Log and skip this one so one bad row doesn't block the rest.
				fmt.Printf("recurring: create transaction for recurring %d failed: %v\n", r.ID, err)
				continue
			}
			if err := repository.AdvanceRecurring(r.ID, r.Frequency, r.EndDate); err != nil {
				fmt.Printf("recurring: advance recurring %d failed: %v\n", r.ID, err)
				continue
			}
			processed++
		}
	}

	return processed, nil
}
