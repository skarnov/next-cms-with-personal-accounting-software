import pool from "../lib/db";
import xss from "xss";

class Wallet {
  static async findAll() {
    try {
      const [wallets] = await pool.query(
        `SELECT id, name 
         FROM wallets 
         WHERE deleted_at IS NULL
         ORDER BY name ASC`
      );
      return wallets.map((wallet) => ({
        id: wallet.id,
        name: xss(wallet.name),
      }));
    } catch (error) {
      console.error("Wallet.findAll error:", error);
      throw new Error("Failed to load wallets");
    }
  }

  static async findById(id) {
    try {
      const [wallet] = await pool.query(
        `SELECT id, name 
         FROM wallets 
         WHERE id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [id]
      );
      return wallet[0]
        ? {
            id: wallet[0].id,
            name: xss(wallet[0].name),
          }
        : null;
    } catch (error) {
      console.error(`Wallet.findById(${id}) error:`, error);
      throw new Error("Wallet not found");
    }
  }

  static async create(name, userId) {
    if (!name?.trim()) throw new Error("Name is required");
    if (!userId) throw new Error("User ID is required");

    try {
      const sanitizedName = xss(name.trim());
      const [result] = await pool.query(
        `INSERT INTO wallets (name, created_at, created_by) 
         VALUES (?, NOW(), ?)`,
        [sanitizedName, userId]
      );

      return {
        id: result.insertId,
        name: sanitizedName,
        created_by: userId,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Wallet.create error:", error);
      throw new Error("Failed to create wallet");
    }
  }

  static async update(id, name, userId) {
    if (!name?.trim()) throw new Error("Name is required");
    if (!userId) throw new Error("User ID is required for audit");

    try {
      const sanitizedName = xss(name.trim());
      await pool.query(
        `UPDATE wallets 
         SET name = ?, updated_at = NOW(), updated_by = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [sanitizedName, userId, id]
      );
      return { id, name: sanitizedName };
    } catch (error) {
      console.error(`Wallet.update(${id}) error:`, error);
      throw new Error("Failed to update wallet");
    }
  }

  static async delete(id, userId) {
    if (!userId) throw new Error("User ID is required for audit");

    try {
      const [result] = await pool.query(
        `UPDATE wallets 
         SET deleted_at = NOW(), updated_at = NOW(), updated_by = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [userId, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Wallet.delete(${id}) error:`, error);
      throw new Error("Failed to delete wallet");
    }
  }

  static async restore(id, userId) {
    if (!userId) throw new Error("User ID is required for audit");

    try {
      const [result] = await pool.query(
        `UPDATE wallets 
         SET deleted_at = NULL, updated_at = NOW(), updated_by = ?
         WHERE id = ? AND deleted_at IS NOT NULL`,
        [userId, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Wallet.restore(${id}) error:`, error);
      throw new Error("Failed to restore wallet");
    }
  }
}

export default Wallet;
