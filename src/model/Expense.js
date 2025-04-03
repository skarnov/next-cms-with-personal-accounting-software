import pool from "../lib/db";
import xss from "xss";

const ALLOWED_CURRENCIES = ["GBP", "USD", "BDT"];

class Expense {
  /**
   * Get all expenses for a user with pagination and search
   * @param {number} userId - User ID
   * @param {Object} options - Pagination and search options
   * @param {number} options.page - Page number
   * @param {number} options.pageSize - Items per page
   * @param {string} options.search - Search term
   * @returns {Promise<Array>} List of expenses
   */
  static async findAll(userId, { page = 1, pageSize = 50, search = "" } = {}) {
    try {
      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const offset = (page - 1) * pageSize;
      const [expenses] = await pool.query(
        `SELECT e.id, e.description, e.amount, e.currency, e.created_at, 
                e.fk_wallet_id, w.name as wallet_name
         FROM expenses e
         LEFT JOIN wallets w ON e.fk_wallet_id = w.id
         WHERE e.created_by = ? AND e.deleted_at IS NULL
         AND (e.description LIKE ? OR w.name LIKE ?)
         ORDER BY e.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, `%${search}%`, `%${search}%`, pageSize, offset]
      );

      return expenses.map((expense) => this.sanitize(expense));
    } catch (error) {
      console.error("Expense.findAll error:", {
        userId,
        page,
        pageSize,
        search,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to fetch expenses");
    }
  }

  /**
   * Find expense by ID for a specific user
   * @param {number} id - Expense ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Expense object or null if not found
   */
  static async findById(id, userId) {
    try {
      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid expense ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const [expense] = await pool.query(
        `SELECT e.id, e.description, e.amount, e.currency, e.created_at,
                e.fk_wallet_id, w.name as wallet_name
         FROM expenses e
         LEFT JOIN wallets w ON e.fk_wallet_id = w.id
         WHERE e.id = ? AND e.created_by = ? AND e.deleted_at IS NULL
         LIMIT 1`,
        [id, userId]
      );

      if (!expense.length) return null;
      return this.sanitize(expense[0]);
    } catch (error) {
      console.error("Expense.findById error:", {
        id,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new expense
   * @param {Object} data - Expense data
   * @param {string} data.description - Expense description
   * @param {number} data.amount - Expense amount
   * @param {string} data.currency - Currency code
   * @param {number} data.wallet_id - Wallet ID (optional)
   * @param {string} data.date - Expense date (optional)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created expense
   */
  static async create(data, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const cleanData = this.sanitizeExpenseData(data);
      const expenseDate = cleanData.date ? new Date(cleanData.date) : new Date();

      const [result] = await connection.query(
        `INSERT INTO expenses 
         (description, amount, currency, fk_wallet_id, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          cleanData.description,
          cleanData.amount,
          cleanData.currency,
          cleanData.wallet_id || null,
          expenseDate,
          userId
        ]
      );

      return this.findById(result.insertId, userId);
    } catch (error) {
      console.error("Expense.create error:", {
        data,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || "Failed to create expense");
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Update an expense
   * @param {number} id - Expense ID
   * @param {Object} data - Expense data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated expense
   */
  static async update(id, data, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid expense ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const cleanData = this.sanitizeExpenseData(data);
      const expenseDate = cleanData.date ? new Date(cleanData.date) : new Date();

      const [result] = await connection.query(
        `UPDATE expenses 
         SET description = ?, amount = ?, currency = ?, fk_wallet_id = ?, 
             created_at = ?, updated_at = NOW(), updated_by = ?
         WHERE id = ? AND created_by = ? AND deleted_at IS NULL`,
        [
          cleanData.description,
          cleanData.amount,
          cleanData.currency,
          cleanData.wallet_id || null,
          expenseDate,
          userId,
          id,
          userId
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error("Expense not found");
      }

      return this.findById(id, userId);
    } catch (error) {
      console.error("Expense.update error:", {
        id,
        data,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Soft delete an expense
   * @param {number} id - Expense ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  static async delete(id, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid expense ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const [result] = await connection.query(
        `UPDATE expenses 
         SET deleted_at = NOW(), updated_at = NOW(), updated_by = ?
         WHERE id = ? AND created_by = ? AND deleted_at IS NULL`,
        [userId, id, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error("Expense not found or already deleted");
      }

      return true;
    } catch (error) {
      console.error("Expense.delete error:", {
        id,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Restore a soft-deleted expense
   * @param {number} id - Expense ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if restoration was successful
   */
  static async restore(id, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid expense ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const [result] = await connection.query(
        `UPDATE expenses 
         SET deleted_at = NULL, updated_at = NOW(), updated_by = ?
         WHERE id = ? AND created_by = ? AND deleted_at IS NOT NULL`,
        [userId, id, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error("Expense not found or not deleted");
      }

      return true;
    } catch (error) {
      console.error("Expense.restore error:", {
        id,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Sanitize expense data
   * @param {Object} data - Expense data
   * @returns {Object} Sanitized expense data
   * @throws {Error} If data is invalid
   */
  static sanitizeExpenseData(data) {
    if (!data?.description?.trim()) {
      throw new Error("Description is required");
    }

    if (isNaN(data.amount) || Number(data.amount) <= 0) {
      throw new Error("Valid positive amount is required");
    }

    if (!ALLOWED_CURRENCIES.includes(data.currency)) {
      throw new Error(`Currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}`);
    }

    return {
      description: xss(data.description.trim()),
      amount: Number(data.amount),
      currency: data.currency,
      wallet_id: data.wallet_id ? Number(data.wallet_id) : null,
      date: data.date
    };
  }

  /**
   * Sanitize expense for output
   * @param {Object} expense - Expense data
   * @returns {Object} Sanitized expense
   */
  static sanitize(expense) {
    return {
      id: expense.id,
      description: xss(expense.description),
      amount: Number(expense.amount),
      currency: expense.currency,
      created_at: expense.created_at,
      wallet_id: expense.fk_wallet_id,
      wallet_name: expense.wallet_name ? xss(expense.wallet_name) : null,
    };
  }
}

export default Expense;