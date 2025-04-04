import pool from "../lib/db";

class Cashbook {
  /**
   * Get cashbook entries with pagination
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise<Object>} Paginated cashbook data
   */
  static async findAll({ page = 1, pageSize = 50 } = {}) {
    try {
      const offset = (page - 1) * pageSize;

      const [entries] = await pool.query(
        `SELECT id, in_amount, out_amount, created_at
         FROM cashbook 
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );

      const [[total]] = await pool.query(
        `SELECT COUNT(*) as total 
         FROM cashbook 
         WHERE deleted_at IS NULL`
      );

      return {
        data: entries.map((entry) => ({
          id: entry.id,
          in_amount: Number(entry.in_amount),
          out_amount: Number(entry.out_amount),
          created_at: entry.created_at,
        })),
        pagination: {
          page,
          pageSize,
          totalItems: total.total,
          totalPages: Math.ceil(total.total / pageSize),
        },
      };
    } catch (error) {
      console.error("Cashbook getEntries error:", error);
      throw new Error("Failed to load cashbook entries");
    }
  }
}

export default Cashbook;