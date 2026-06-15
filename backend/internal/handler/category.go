package handler

import (
	"net/http"
	"strconv"

	"github.com/akrom/finance-backend/internal/middleware"
	"github.com/akrom/finance-backend/internal/model"
	"github.com/akrom/finance-backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetCategories(c *gin.Context) {
	userID := middleware.GetUserID(c)
	categoryType := c.Query("type")
	categories, err := service.GetCategories(userID, categoryType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func GetCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	category, err := service.GetCategoryByID(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}
	c.JSON(http.StatusOK, category)
}

func CreateCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req model.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := service.CreateCategory(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, category)
}

func UpdateCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req model.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := service.UpdateCategory(id, userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, category)
}

func DeleteCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := service.DeleteCategory(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "category deleted"})
}
