import { 
  users, 
  categories, 
  transactions, 
  budgets, 
  communityTips, 
  deals, 
  alerts,
  type User, 
  type InsertUser, 
  type Category, 
  type InsertCategory,
  type Transaction, 
  type InsertTransaction,
  type Budget, 
  type InsertBudget,
  type CommunityTip, 
  type InsertCommunityTip,
  type Deal, 
  type InsertDeal,
  type Alert, 
  type InsertAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql as drizzleSql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { getRedisClient } from "./redis-cache";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Transaction methods
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getTransactionsByUserIdDateRange(userId: number, startDate: Date, endDate: Date): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createManyTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  // Budget methods
  getBudgetsByUserId(userId: number): Promise<Budget[]>;
  getBudgetById(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;

  // Community tips methods
  getCommunityTips(): Promise<CommunityTip[]>;
  getCommunityTipById(id: number): Promise<CommunityTip | undefined>;
  createCommunityTip(tip: InsertCommunityTip): Promise<CommunityTip>;
  updateCommunityTip(id: number, tip: Partial<InsertCommunityTip>): Promise<CommunityTip | undefined>;
  deleteCommunityTip(id: number): Promise<boolean>;

  // Deals methods
  getDeals(): Promise<Deal[]>;
  getDealById(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;

  // Alerts methods
  getAlertsByUserId(userId: number): Promise<Alert[]>;
  getAlertById(id: number): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;

  // Dashboard summary
  getUserDashboardSummary(userId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      // Use PostgreSQL for session storage in production
      const connectPgSimple = require('connect-pg-simple');
      const PgStore = connectPgSimple(session);
      
      this.sessionStore = new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true
      });
    } else {
      // Use memory store for development
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    // Import the caching functions directly
    const { getCachedData, cacheData } = await import('./redis-cache');
    const cacheKey = "all-categories";
    
    try {
      // Try to get from cache first
      const cachedData = await getCachedData<Category[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // If not in cache, get from database
      const result = await db.select().from(categories);
      
      // Store in cache for 1 hour
      await cacheData(cacheKey, result, 3600);
      
      return result;
    } catch (error) {
      console.error("Cache error, falling back to database:", error);
      return await db.select().from(categories);
    }
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    
    // Invalidate the categories cache
    try {
      const { invalidateCache } = await import('./redis-cache');
      await invalidateCache("all-categories");
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
    
    return newCategory;
  }

  // Transaction methods
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByUserIdDateRange(userId: number, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async createManyTransactions(transactionsData: InsertTransaction[]): Promise<Transaction[]> {
    return await db.insert(transactions)
      .values(transactionsData)
      .returning();
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db.update(transactions)
      .set(transactionData)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions)
      .where(eq(transactions.id, id))
      .returning({ id: transactions.id });
    return result.length > 0;
  }

  // Budget methods
  async getBudgetsByUserId(userId: number): Promise<Budget[]> {
    return await db.select()
      .from(budgets)
      .where(eq(budgets.userId, userId));
  }

  async getBudgetById(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select()
      .from(budgets)
      .where(eq(budgets.id, id));
    return budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets)
      .values(budget)
      .returning();
    return newBudget;
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updatedBudget] = await db.update(budgets)
      .set(budgetData)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await db.delete(budgets)
      .where(eq(budgets.id, id))
      .returning({ id: budgets.id });
    return result.length > 0;
  }

  // Community tips methods
  async getCommunityTips(): Promise<CommunityTip[]> {
    return await db.select()
      .from(communityTips)
      .where(eq(communityTips.isApproved, true))
      .orderBy(desc(communityTips.createdAt));
  }

  async getCommunityTipById(id: number): Promise<CommunityTip | undefined> {
    const [tip] = await db.select()
      .from(communityTips)
      .where(eq(communityTips.id, id));
    return tip;
  }

  async createCommunityTip(tip: InsertCommunityTip): Promise<CommunityTip> {
    const [newTip] = await db.insert(communityTips)
      .values(tip)
      .returning();
    return newTip;
  }

  async updateCommunityTip(id: number, tipData: Partial<InsertCommunityTip>): Promise<CommunityTip | undefined> {
    const [updatedTip] = await db.update(communityTips)
      .set(tipData)
      .where(eq(communityTips.id, id))
      .returning();
    return updatedTip;
  }

  async deleteCommunityTip(id: number): Promise<boolean> {
    const result = await db.delete(communityTips)
      .where(eq(communityTips.id, id))
      .returning({ id: communityTips.id });
    return result.length > 0;
  }

  // Deals methods
  async getDeals(): Promise<Deal[]> {
    return await db.select()
      .from(deals)
      .orderBy(desc(deals.createdAt));
  }

  async getDealById(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select()
      .from(deals)
      .where(eq(deals.id, id));
    return deal;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals)
      .values(deal)
      .returning();
    return newDeal;
  }

  async updateDeal(id: number, dealData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [updatedDeal] = await db.update(deals)
      .set(dealData)
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db.delete(deals)
      .where(eq(deals.id, id))
      .returning({ id: deals.id });
    return result.length > 0;
  }

  // Alerts methods
  async getAlertsByUserId(userId: number): Promise<Alert[]> {
    return await db.select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertById(id: number): Promise<Alert | undefined> {
    const [alert] = await db.select()
      .from(alerts)
      .where(eq(alerts.id, id));
    return alert;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const [updatedAlert] = await db.update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    const result = await db.delete(alerts)
      .where(eq(alerts.id, id))
      .returning({ id: alerts.id });
    return result.length > 0;
  }

  // Dashboard summary
  async getUserDashboardSummary(userId: number): Promise<any> {
    // Get current date and first day of current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get monthly income and expenses
    const monthlyTransactions = await this.getTransactionsByUserIdDateRange(
      userId,
      firstDayOfMonth,
      today
    );
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Get total balance (all time)
    const allTransactions = await this.getTransactionsByUserId(userId);
    const totalIncome = allTransactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = allTransactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;
    
    // Get recent transactions
    const recentTransactions = monthlyTransactions.slice(0, 5);
    
    // Get budgets and calculate remaining amount
    const budgets = await this.getBudgetsByUserId(userId);
    const budgetSummary = budgets.map(budget => {
      const budgetTransactions = monthlyTransactions
        .filter(t => t.categoryId === budget.categoryId && !t.isIncome);
      
      const budgetSpent = budgetTransactions
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const budgetRemaining = Number(budget.amount) - budgetSpent;
      const percentUsed = Math.round((budgetSpent / Number(budget.amount)) * 100);
      
      return {
        ...budget,
        spent: budgetSpent,
        remaining: budgetRemaining,
        percentUsed
      };
    });
    
    // Get alerts
    const userAlerts = await this.getAlertsByUserId(userId);
    
    // Get category breakdown
    const categoryTotals = await db.select({
      categoryId: transactions.categoryId,
      total: drizzleSql`SUM(${transactions.amount})::float`
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.isIncome, false),
        gte(transactions.date, firstDayOfMonth),
        lte(transactions.date, today)
      )
    )
    .groupBy(transactions.categoryId);
    
    // Calculate total expenses for percentage calculation
    const totalMonthlyExpenses = categoryTotals.reduce((sum, cat) => sum + Number(cat.total), 0);
    
    // Get category details
    const categoryIds = categoryTotals.map(c => c.categoryId).filter(Boolean) as number[];
    const categoryDetails = categoryIds.length > 0 
      ? await db.select().from(categories).where(
          eq(categories.id, categoryIds[0]) // TODO: Use "in" operator when we have multiple categories
        )
      : [];
    
    // Combine category totals with details
    const categoryBreakdown = categoryTotals
      .filter(c => c.categoryId !== null)
      .map(catTotal => {
        const category = categoryDetails.find(c => c.id === catTotal.categoryId);
        return {
          categoryId: catTotal.categoryId,
          name: category?.name || 'Uncategorized',
          color: category?.color || '#888888',
          icon: category?.icon || 'category',
          amount: Number(catTotal.total),
          percentage: totalMonthlyExpenses > 0 
            ? Math.round((Number(catTotal.total) / totalMonthlyExpenses) * 100) 
            : 0
        };
      });
    
    // Add "Other" category for uncategorized transactions
    const uncategorizedTotal = categoryTotals.find(c => c.categoryId === null);
    if (uncategorizedTotal) {
      categoryBreakdown.push({
        categoryId: null,
        name: 'Other',
        color: '#9E9E9E',
        icon: 'help_outline',
        amount: Number(uncategorizedTotal.total),
        percentage: totalMonthlyExpenses > 0 
          ? Math.round((Number(uncategorizedTotal.total) / totalMonthlyExpenses) * 100) 
          : 0
      });
    }
    
    return {
      balance,
      monthlyIncome,
      monthlyExpenses,
      budgetRemaining: budgetSummary.reduce((sum, b) => sum + b.remaining, 0),
      recentTransactions,
      budgetSummary,
      alerts: userAlerts,
      categoryBreakdown
    };
  }
}

export const storage = new DatabaseStorage();
