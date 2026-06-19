package handler

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/akrom/finance-backend/internal/database"
	"github.com/akrom/finance-backend/internal/middleware"
	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/repository"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
)

func Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email already exists
	_, _, err := repository.GetUserByEmail(req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email sudah terdaftar"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal memproses password"})
		return
	}

	// Create user
	user, err := repository.CreateUser(req.Name, req.Email, string(hash))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal membuat akun"})
		return
	}

	// Seed default categories for new user
	database.SeedCategories(user.ID)

	// Generate token
	token, err := middleware.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal membuat token"})
		return
	}

	c.JSON(http.StatusCreated, model.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	user, hash, err := repository.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email atau password salah"})
		return
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email atau password salah"})
		return
	}

	// Generate token
	token, err := middleware.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, model.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := repository.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// GoogleLogin handles "Sign in with Google".
// The frontend sends the Google ID token (credential) from Google Identity Services.
// Backend verifies it, then finds or creates the user and issues a JWT.
func GoogleLogin(c *gin.Context) {
	var req model.GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	if clientID == "" {
		log.Println("GOOGLE_CLIENT_ID env var is not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server misconfigured"})
		return
	}

	validator, err := idtoken.NewValidator(context.Background())
	if err != nil {
		log.Printf("idtoken.NewValidator: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal memverifikasi token"})
		return
	}

	payload, err := validator.Validate(context.Background(), req.Credential, clientID)
	if err != nil {
		log.Printf("idtoken.Validate: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token google tidak valid"})
		return
	}

	// Extract standard claims
	sub, _ := payload.Claims["sub"].(string)
	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)
	emailVerified, _ := payload.Claims["email_verified"].(bool)

	if sub == "" || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token google tidak lengkap"})
		return
	}
	if !emailVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email google belum terverifikasi"})
		return
	}
	if name == "" {
		name = email // fallback
	}

	// 1. Try lookup by google_id
	user, err := repository.GetUserByGoogleID(sub)
	if err == nil {
		// Found by google_id -> issue token
		token, err := middleware.GenerateToken(user.ID, user.Email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal membuat token"})
			return
		}
		c.JSON(http.StatusOK, model.AuthResponse{Token: token, User: *user})
		return
	}

	// 2. Try lookup by email (account linking)
	user, _, err = repository.GetUserByEmail(email)
	if err == nil {
		// Found existing user by email -> link google_id
		if err := repository.LinkGoogleID(user.ID, sub); err != nil {
			log.Printf("link google_id: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal menghubungkan akun google"})
			return
		}
		gid := sub
		user.GoogleID = &gid
		token, err := middleware.GenerateToken(user.ID, user.Email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal membuat token"})
			return
		}
		c.JSON(http.StatusOK, model.AuthResponse{Token: token, User: *user})
		return
	}

	// 3. New user -> create with Google
	user, err = repository.CreateUserGoogle(name, email, sub)
	if err != nil {
		log.Printf("create google user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal membuat akun google"})
		return
	}

	// Seed default categories
	database.SeedCategories(user.ID)

	token, err := middleware.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, model.AuthResponse{Token: token, User: *user})
}
