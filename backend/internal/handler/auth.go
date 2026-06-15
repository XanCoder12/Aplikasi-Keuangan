package handler

import (
	"net/http"

	"github.com/akrom/finance-backend/internal/database"
	"github.com/akrom/finance-backend/internal/middleware"
	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/repository"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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
