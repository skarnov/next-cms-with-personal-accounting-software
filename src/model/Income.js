import pool from "../lib/db";
import xss from "xss";

const ALLOWED_CURRENCIES = ["GBP", "USD", "BDT"];

class Income {
  /**
   * Get all incomes for a user with pagination and search
   * @param {number} userId - User ID
   * @param {Object} options - Pagination and search options
   * @param {number} options.page - Page number
   * @param {number} options.pageSize - Items per page
   * @param {string} options.search - Search term
   * @returns {Promise<Array>} List of incomes
   */
  static async findAll(userId, { page = 1, pageSize = 50, search = "" } = {}) {
    try {
      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const offset = (page - 1) * pageSize;
      const [incomes] = await pool.query(
        `SELECT e.id, e.description, e.amount, e.currency, e.created_at, 
                e.fk_wallet_id, w.name as wallet_name
         FROM incomes e
         LEFT JOIN wallets w ON e.fk_wallet_id = w.id
         WHERE e.created_by = ? AND e.deleted_at IS NULL
         AND (e.description LIKE ? OR w.name LIKE ?)
         ORDER BY e.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, `%${search}%`, `%${search}%`, pageSize, offset]
      );

      return incomes.map((income) => this.sanitize(income));
    } catch (error) {
      console.error("Income.findAll error:", {
        userId,
        page,
        pageSize,
        search,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to fetch incomes");
    }
  }

  /**
   * Find income by ID for a specific user
   * @param {number} id - Income ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Income object or null if not found
   */
  static async findById(id, userId) {
    try {
      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid income ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const [income] = await pool.query(
        `SELECT e.id, e.description, e.amount, e.currency, e.created_at,
                e.fk_wallet_id, w.name as wallet_name
         FROM incomes e
         LEFT JOIN wallets w ON e.fk_wallet_id = w.id
         WHERE e.id = ? AND e.created_by = ? AND e.deleted_at IS NULL
         LIMIT 1`,
        [id, userId]
      );

      if (!income.length) return null;
      return this.sanitize(income[0]);
    } catch (error) {
      console.error("Income.findById error:", {
        id,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new income
   * @param {Object} data - Income data
   * @param {string} data.description - Income description
   * @param {number} data.amount - Income amount
   * @param {string} data.currency - Currency code
   * @param {number} data.wallet_id - Wallet ID (optional)
   * @param {string} data.date - Income date (optional)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created income
   */
  static async create(data, userId) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const cleanData = this.sanitizeIncomeData(data);
      const incomeDate = cleanData.date ? new Date(cleanData.date) : new Date();

      const [incomeResult] = await connection.query(
        `INSERT INTO incomes 
         (description, amount, currency, fk_wallet_id, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cleanData.description, cleanData.amount, cleanData.currency, cleanData.wallet_id || null, incomeDate, userId]
      );

      await connection.query(
        `INSERT INTO cashbook 
         (in_amount, fk_reference_id, created_at, created_by)
         VALUES (?, ?, ?, ?)`,
        [cleanData.amount, incomeResult.insertId, incomeDate, userId]
      );

      await connection.commit();
      return this.findById(incomeResult.insertId, userId);
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Income.create error:", {
        data,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || "Failed to create income");
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Update an income
   * @param {number} id - Income ID
   * @param {Object} data - Income data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated income
   */
  static async update(id, data, userId) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid income ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const cleanData = this.sanitizeIncomeData(data);
      const incomeDate = cleanData.date ? new Date(cleanData.date) : new Date();
      const now = new Date();

      const [incomeResult] = await connection.query(
        `UPDATE incomes 
         SET description = ?, amount = ?, currency = ?, fk_wallet_id = ?, 
             updated_at = ?, updated_by = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [cleanData.description, cleanData.amount, cleanData.currency, cleanData.wallet_id || null, now, userId, id]
      );

      if (incomeResult.affectedRows === 0) {
        throw new Error("Income not found");
      }

      await connection.query(
        `UPDATE cashbook 
         SET in_amount = ?, updated_at = ?, updated_by = ?
         WHERE fk_reference_id = ? AND deleted_at IS NULL`,
        [cleanData.amount, now, userId, id]
      );

      await connection.commit();
      return this.findById(id, userId);
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Income.update error:", {
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
   * Soft delete an income
   * @param {number} id - Income ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  static async delete(id, userId) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid income ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const now = new Date();

      const [incomeResult] = await connection.query(
        `UPDATE incomes 
         SET deleted_at = ?, updated_at = ?, updated_by = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [now, now, userId, id]
      );

      if (incomeResult.affectedRows === 0) {
        throw new Error("Income not found or already deleted");
      }

      await connection.query(
        `UPDATE cashbook 
         SET deleted_at = ?, updated_at = ?, updated_by = ?
         WHERE fk_reference_id = ? AND deleted_at IS NULL`,
        [now, now, userId, id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Income.delete error:", {
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
   * Restore a soft-deleted income
   * @param {number} id - Income ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if restoration was successful
   */
  static async restore(id, userId) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid income ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const now = new Date();

      const [incomeResult] = await connection.query(
        `UPDATE incomes 
         SET deleted_at = NULL, updated_at = ?, updated_by = ?
         WHERE id = ? AND deleted_at IS NOT NULL`,
        [now, userId, id]
      );

      if (incomeResult.affectedRows === 0) {
        throw new Error("Income not found or not deleted");
      }

      await connection.query(
        `UPDATE cashbook 
         SET deleted_at = NULL, updated_at = ?, updated_by = ?
         WHERE fk_reference_id = ? AND deleted_at IS NOT NULL`,
        [now, userId, id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Income.restore error:", {
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
   * Sanitize income data
   * @param {Object} data - Income data
   * @returns {Object} Sanitized income data
   * @throws {Error} If data is invalid
   */
  static sanitizeIncomeData(data) {
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
      date: data.date,
    };
  }

  /**
   * Sanitize income for output
   * @param {Object} income - Income data
   * @returns {Object} Sanitized income
   */
  static sanitize(income) {
    return {
      id: income.id,
      description: xss(income.description),
      amount: Number(income.amount),
      currency: income.currency,
      created_at: income.created_at,
      wallet_id: income.fk_wallet_id,
      wallet_name: income.wallet_name ? xss(income.wallet_name) : null,
    };
  }
}

export default Income;