import pool from "../lib/db";
import xss from "xss";

const ALLOWED_CURRENCIES = ["GBP", "USD", "BDT"];

class Expense {
  static async findAll(userId, { page = 1, pageSize = 50, search = "" } = {}) {
    try {
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

      return expenses.map((expense) => ({
        id: expense.id,
        description: xss(expense.description),
        amount: parseFloat(expense.amount),
        currency: expense.currency,
        created_at: expense.created_at,
        wallet_id: expense.fk_wallet_id,
        wallet_name: expense.wallet_name ? xss(expense.wallet_name) : null,
      }));
    } catch (error) {
      console.error("Expense.findAll error:", error);
      throw new Error("Failed to load expenses");
    }
  }

  static async findById(id, userId) {
    try {
      const [expense] = await pool.query(
        `SELECT e.id, e.description, e.amount, e.currency, e.created_at,
                e.fk_wallet_id, w.name as wallet_name
         FROM expenses e
         LEFT JOIN wallets w ON e.fk_wallet_id = w.id
         WHERE e.id = ? AND e.created_by = ? AND e.deleted_at IS NULL
         LIMIT 1`,
        [id, userId]
      );

      return expense[0]
        ? {
            id: expense[0].id,
            description: xss(expense[0].description),
            amount: parseFloat(expense[0].amount),
            currency: expense[0].currency,
            created_at: expense[0].created_at,
            wallet_id: expense[0].fk_wallet_id,
            wallet_name: expense[0].wallet_name ? xss(expense[0].wallet_name) : null,
          }
        : null;
    } catch (error) {
      console.error(`Expense.findById(${id}) error:`, error);
      throw new Error("Expense not found");
    }
  }

  static async create(data, userId) {
    const { description, amount, currency, wallet_id, date } = data;

    if (!description?.trim()) throw new Error("Description is required");
    if (isNaN(amount) || amount <= 0) throw new Error("Valid amount is required");
    if (!ALLOWED_CURRENCIES.includes(currency)) throw new Error("Valid currency is required");
    if (!userId) throw new Error("User ID is required");

    try {
      const sanitizedDesc = xss(description.trim());
      const expenseDate = date ? new Date(date) : new Date();

      const [result] = await pool.query(
        `INSERT INTO expenses 
         (description, amount, currency, fk_wallet_id, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sanitizedDesc, amount, currency, wallet_id || null, expenseDate, userId]
      );

      return {
        id: result.insertId,
        description: sanitizedDesc,
        amount: parseFloat(amount),
        currency,
        wallet_id: wallet_id || null,
        created_at: expenseDate.toISOString(),
      };
    } catch (error) {
      console.error("Expense.create error:", error);
      throw new Error("Failed to create expense");
    }
  }

  static async update(id, data, userId) {
    const { description, amount, currency, wallet_id, date } = data;

    if (!description?.trim()) throw new Error("Description is required");
    if (isNaN(amount) || amount <= 0) throw new Error("Valid amount is required");
    if (!ALLOWED_CURRENCIES.includes(currency)) throw new Error("Valid currency is required");
    if (!userId) throw new Error("User ID is required");

    try {
      const sanitizedDesc = xss(description.trim());
      const expenseDate = date ? new Date(date) : new Date();

      await pool.query(
        `UPDATE expenses 
         SET description = ?, amount = ?, currency = ?, fk_wallet_id = ?, 
             created_at = ?, updated_at = NOW(), updated_by = ?
         WHERE id = ? AND created_by = ? AND deleted_at IS NULL`,
        [sanitizedDesc, amount, currency, wallet_id || null, expenseDate, userId, id, userId]
      );

      return this.findById(id, userId);
    } catch (error) {
      console.error(`Expense.update(${id}) error:`, error);
      throw new Error("Failed to update expense");
    }
  }

  static async delete(id, userId) {
    if (!userId) throw new Error("User ID is required");

    try {
      const [result] = await pool.query(
        `UPDATE expenses 
         SET deleted_at = NOW(), updated_at = NOW(), updated_by = ?
         WHERE id = ? AND created_by = ? AND deleted_at IS NULL`,
        [userId, id, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Expense.delete(${id}) error:`, error);
      throw new Error("Failed to delete expense");
    }
  }

  static async restore(id, userId) {
    if (!userId) throw new Error("User ID is required");

    try {
      const [result] = await pool.query(
        `UPDATE expenses 
         SET deleted_at = NULL, updated_at = NOW(), updated_by = ?
         WHERE id = ? AND created_by = ? AND deleted_at IS NOT NULL`,
        [userId, id, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Expense.restore(${id}) error:`, error);
      throw new Error("Failed to restore expense");
    }
  }
}

export default Expense;