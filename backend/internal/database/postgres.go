package database

import (
	"context"
	"fmt"
	"net"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect() error {
	var dsn string

	// Prefer DATABASE_URL (e.g. from Railway / Supabase)
	if envURL := os.Getenv("DATABASE_URL"); envURL != "" {
		dsn = envURL
	} else {
		host := getEnv("DB_HOST", "localhost")
		port := getEnv("DB_PORT", "5432")
		user := getEnv("DB_USER", "finance")
		password := getEnv("DB_PASSWORD", "finance123")
		dbname := getEnv("DB_NAME", "finance")
		sslmode := getEnv("DB_SSLMODE", "disable")

		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			user, password, host, port, dbname, sslmode)
	}

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return fmt.Errorf("unable to parse config: %w", err)
	}

	// Paksa IPv4, skip IPv6
	config.ConnConfig.Config.LookupFunc = func(ctx context.Context, host string) ([]string, error) {
		addrs, err := net.DefaultResolver.LookupHost(ctx, host)
		if err != nil {
			return nil, err
		}
		var ipv4 []string
		for _, addr := range addrs {
			if net.ParseIP(addr).To4() != nil {
				ipv4 = append(ipv4, addr)
			}
		}
		if len(ipv4) == 0 {
			return addrs, nil // fallback kalau tidak ada IPv4
		}
		return ipv4, nil
	}

	Pool, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}

	if err := Pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	return nil
}
func Migrate() error {
	// Step 1: Create users table first
	_, err := Pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(150) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("migrate users: %w", err)
	}

	// Step 2: Create or update categories
	_, err = Pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS categories (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(100) NOT NULL,
			type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
			icon VARCHAR(50) NOT NULL DEFAULT '',
			color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		// Table exists without user_id, add it
		Pool.Exec(context.Background(), `ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`)
	}

	// Step 3: Create or update transactions
	_, err = Pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS transactions (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
			amount BIGINT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			date DATE NOT NULL,
			type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		Pool.Exec(context.Background(), `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`)
	}

	// Step 4: Create indexes
	Pool.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
		CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
		CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
		CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
		CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
	`)

	// Step 5: Create savings_goals table
	Pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS savings_goals (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(100) NOT NULL,
			target_amount BIGINT NOT NULL,
			current_amount BIGINT NOT NULL DEFAULT 0,
			deadline DATE,
			color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
			image_url TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
	`)

	// Step 5b: Add image_url column for existing databases
	Pool.Exec(context.Background(), `ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''`)

	// Step 6: Create budgets table
	Pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS budgets (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
			month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
			year INTEGER NOT NULL,
			amount BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			UNIQUE(user_id, category_id, month, year)
		);
		CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
		CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
	`)

	// Step 7: Create recurring_transactions table
	_, err = Pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS recurring_transactions (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
			amount BIGINT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
			frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
			start_date DATE NOT NULL,
			end_date DATE,
			next_date DATE NOT NULL,
			last_processed DATE,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_transactions(user_id);
		CREATE INDEX IF NOT EXISTS idx_recurring_due ON recurring_transactions(next_date) WHERE is_active = TRUE;
	`)
	if err != nil {
		return fmt.Errorf("migrate recurring_transactions: %w", err)
	}

	// Step 8: Add google_id column to users and make password_hash nullable (Google OAuth)
	_, err = Pool.Exec(context.Background(), `
		ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
		ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
		CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
	`)
	if err != nil {
		return fmt.Errorf("migrate google_id on users: %w", err)
	}

	return nil
}

func SeedCategories(userID int) error {
	var count int
	err := Pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM categories WHERE user_id = $1", userID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	categories := []struct {
		name  string
		stype string
		icon  string
		color string
	}{
		{"Gaji", "income", "Wallet", "#10b981"},
		{"Freelance", "income", "Briefcase", "#3b82f6"},
		{"Investasi", "income", "TrendingUp", "#8b5cf6"},
		{"Lainnya (Pemasukan)", "income", "PlusCircle", "#6b7280"},

		{"Makanan & Minuman", "expense", "UtensilsCrossed", "#ef4444"},
		{"Transportasi", "expense", "Car", "#f59e0b"},
		{"Belanja", "expense", "ShoppingBag", "#ec4899"},
		{"Hiburan", "expense", "Gamepad2", "#8b5cf6"},
		{"Kesehatan", "expense", "HeartPulse", "#10b981"},
		{"Tagihan", "expense", "FileText", "#3b82f6"},
		{"Pendidikan", "expense", "BookOpen", "#6366f1"},
		{"Tempat Tinggal", "expense", "Home", "#f97316"},
		{"Lainnya (Pengeluaran)", "expense", "MoreHorizontal", "#6b7280"},
	}

	for _, c := range categories {
		_, err := Pool.Exec(context.Background(),
			"INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5)",
			userID, c.name, c.stype, c.icon, c.color)
		if err != nil {
			return fmt.Errorf("seed failed for %s: %w", c.name, err)
		}
	}

	return nil
}

func Close() {
	if Pool != nil {
		Pool.Close()
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
