import pool from "../lib/db";
import xss from "xss";

class Wallet {
  /**
   * Get all wallets for a user
   * @param {number} userId
   * @returns {Promise<Array>} List of wallets
   */
  static async findAllByUser(userId) {
    try {
      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const [wallets] = await pool.query(
        `SELECT id, name, created_at, updated_at 
         FROM wallets 
         WHERE created_by = ? AND deleted_at IS NULL
         ORDER BY name ASC`,
        [userId]
      );

      return wallets.map((w) => this.sanitize(w));
    } catch (error) {
      console.error("Wallet.findAllByUser error:", {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to fetch wallets");
    }
  }

  /**
   * Get a specific wallet by ID for a user
   * @param {number} id
   * @param {number} userId
   * @returns {Promise<Object>} Wallet object
   */
  static async findByIdAndUser(id, userId) {
    try {
      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid wallet ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const [wallet] = await pool.query(
        `SELECT id, name, created_at, updated_at 
         FROM wallets 
         WHERE id = ? AND created_by = ? AND deleted_at IS NULL
         LIMIT 1`,
        [id, userId]
      );

      if (!wallet.length) throw new Error("Wallet not found");
      return this.sanitize(wallet[0]);
    } catch (error) {
      console.error("Wallet.findByIdAndUser error:", error);
      throw error;
    }
  }

  /**
   * Create a new wallet
   * @param {string} name
   * @param {number} userId
   * @returns {Promise<Object>} Created wallet
   */
  static async create(name, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const cleanName = this.sanitizeName(name);

      const [result] = await connection.query(
        `INSERT INTO wallets 
         (name, created_by, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())`,
        [cleanName, userId]
      );

      return this.findByIdAndUser(result.insertId, userId);
    } catch (error) {
      console.error("Wallet.create error:", {
        userId,
        name,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || "Failed to create wallet");
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Update a wallet
   * @param {number} id
   * @param {string} name
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  static async update(id, name, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid wallet ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const cleanName = this.sanitizeName(name);

      const [result] = await connection.query(
        `UPDATE wallets 
         SET name = ?, updated_at = NOW(), updated_by = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [cleanName, userId, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Wallet not found");
      }

      return this.findByIdAndUser(id, userId);
    } catch (error) {
      console.error(`Wallet.update failed for ID ${id}`, {
        id,
        userId,
        name,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Delete a wallet (soft delete)
   * @param {number} id
   * @param {number} userId
   * @returns {Promise<Object>} Deletion result
   */
  static async delete(id, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid wallet ID format");
      }

      if (!Number.isInteger(Number(userId))) {
        throw new Error("Invalid user ID format");
      }

      const [result] = await connection.query(
        `UPDATE wallets 
         SET deleted_at = NOW(), updated_at = NOW(), updated_by = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [userId, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Wallet not found or already deleted");
      }

      return { id, success: true };
    } catch (error) {
      console.error("Wallet.delete error:", {
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
   * Sanitize wallet name
   * @param {string} name
   * @returns {string} Sanitized name
   * @throws {Error} If name is invalid
   */
  static sanitizeName(name) {
    if (!name?.trim()) {
      throw new Error("Wallet name is required");
    }

    const clean = xss(name.trim());

    if (clean.length > 50) {
      throw new Error("Wallet name cannot exceed 50 characters");
    }

    return clean;
  }

  /**
   * Sanitize wallet data
   * @param {Object} wallet
   * @returns {Object} Sanitized wallet
   */
  static sanitize(wallet) {
    return {
      id: wallet.id,
      name: wallet.name,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
    };
  }
}

export default Wallet;