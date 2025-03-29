import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { azureStorage } from "./azure-storage";
import { parse } from "csv-parse";
import { initRedisClient } from "./redis-cache";
import { insertTransactionSchema, insertBudgetSchema, insertCommunityTipSchema, insertDealSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import * as fs from "fs";

// Initialize Redis cache
initRedisClient();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Configure multer for CSV file upload
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'text/csv') {
        return cb(new Error('Only CSV files are allowed'));
      }
      cb(null, true);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Dashboard routes
  app.get("/api/dashboard", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const dashboardData = await storage.getUserDashboardSummary(userId);
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  });

  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let transactions;
      if (startDate && endDate) {
        transactions = await storage.getTransactionsByUserIdDateRange(userId, startDate, endDate);
      } else {
        transactions = await storage.getTransactionsByUserId(userId);
      }
      
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const transactionData = { ...req.body, userId };
      
      // Validate transaction data
      const validatedData = insertTransactionSchema.parse(transactionData);
      
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: fromZodError(error).message });
      } else {
        next(error);
      }
    }
  });

  app.put("/api/transactions/:id", isAuthenticated, async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      // Check if transaction belongs to user
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedTransaction = await storage.updateTransaction(transactionId, req.body);
      res.json(updatedTransaction);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/transactions/:id", isAuthenticated, async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      // Check if transaction belongs to user
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteTransaction(transactionId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete transaction" });
      }
    } catch (error) {
      next(error);
    }
  });

  // CSV upload route
  app.post("/api/transactions/upload", isAuthenticated, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.user?.id;
      const fileBuffer = req.file.buffer;
      
      // Upload to Azure Storage
      const fileUrl = await azureStorage.uploadFile(fileBuffer, req.file.originalname);
      
      // Save file locally for parsing
      const localFilePath = await azureStorage.saveFileLocally(fileBuffer);
      
      // Parse CSV
      const records: any[] = [];
      const parser = fs
        .createReadStream(localFilePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
      
      for await (const record of parser) {
        records.push(record);
      }
      
      // Validate and transform records
      const transactions = records.map(record => {
        return {
          userId,
          categoryId: record.categoryId ? parseInt(record.categoryId) : null,
          amount: parseFloat(record.amount),
          description: record.description,
          date: record.date ? new Date(record.date) : new Date(),
          isIncome: record.isIncome === 'true' || record.isIncome === '1'
        };
      });
      
      // Insert transactions in batch
      const createdTransactions = await storage.createManyTransactions(transactions);
      
      // Clean up temporary file
      fs.unlinkSync(localFilePath);
      
      res.status(201).json({
        message: `Successfully imported ${createdTransactions.length} transactions`,
        fileUrl,
        transactions: createdTransactions
      });
    } catch (error) {
      next(error);
    }
  });

  // Budget routes
  app.get("/api/budgets", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const budgets = await storage.getBudgetsByUserId(userId);
      res.json(budgets);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/budgets", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const budgetData = { ...req.body, userId };
      
      // Validate budget data
      const validatedData = insertBudgetSchema.parse(budgetData);
      
      const budget = await storage.createBudget(validatedData);
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid budget data", errors: fromZodError(error).message });
      } else {
        next(error);
      }
    }
  });

  app.put("/api/budgets/:id", isAuthenticated, async (req, res, next) => {
    try {
      const budgetId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      // Check if budget belongs to user
      const budget = await storage.getBudgetById(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedBudget = await storage.updateBudget(budgetId, req.body);
      res.json(updatedBudget);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/budgets/:id", isAuthenticated, async (req, res, next) => {
    try {
      const budgetId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      // Check if budget belongs to user
      const budget = await storage.getBudgetById(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteBudget(budgetId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete budget" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  // Community tips routes
  app.get("/api/community-tips", async (req, res, next) => {
    try {
      const tips = await storage.getCommunityTips();
      res.json(tips);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/community-tips", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tipData = { ...req.body, userId };
      
      // Validate tip data
      const validatedData = insertCommunityTipSchema.parse(tipData);
      
      const tip = await storage.createCommunityTip(validatedData);
      res.status(201).json(tip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid tip data", errors: fromZodError(error).message });
      } else {
        next(error);
      }
    }
  });

  // Deals routes
  app.get("/api/deals", async (req, res, next) => {
    try {
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/deals", isAuthenticated, async (req, res, next) => {
    try {
      const dealData = req.body;
      
      // Validate deal data
      const validatedData = insertDealSchema.parse(dealData);
      
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid deal data", errors: fromZodError(error).message });
      } else {
        next(error);
      }
    }
  });

  // Alerts routes
  app.get("/api/alerts", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const alerts = await storage.getAlertsByUserId(userId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/alerts/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      const alertId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      // Check if alert belongs to user
      const alert = await storage.getAlertById(alertId);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      if (alert.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedAlert = await storage.markAlertAsRead(alertId);
      res.json(updatedAlert);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
