import pool from "../lib/db";

class Cashbook {
  static async findAll({ page = 1, pageSize = 50, search = "" } = {}) {
    try {
      const offset = (page - 1) * pageSize;
      const searchTerm = `%${search}%`;

      const query = `
        SELECT 
          cashbook.id, 
          cashbook.in_amount, 
          incomes.description AS income_description, 
          incomes.amount AS income_amount,
          incomes.currency AS income_currency,
          cashbook.out_amount, 
          expenses.description AS expense_description,
          expenses.amount AS expense_amount,
          expenses.currency AS expense_currency,
          cashbook.created_at,
          cashbook.updated_at,
          CASE 
            WHEN cashbook.in_amount > 0 THEN 'income'
            WHEN cashbook.out_amount > 0 THEN 'expense'
          END AS type
        FROM cashbook
        LEFT JOIN expenses ON 
          expenses.id = cashbook.fk_reference_id AND 
          cashbook.out_amount > 0 AND
          expenses.deleted_at IS NULL
        LEFT JOIN incomes ON 
          incomes.id = cashbook.fk_reference_id AND 
          cashbook.in_amount > 0 AND
          incomes.deleted_at IS NULL
        WHERE cashbook.deleted_at IS NULL
        AND (
          (cashbook.in_amount > 0 AND (incomes.description LIKE ? OR ? = '')) OR
          (cashbook.out_amount > 0 AND (expenses.description LIKE ? OR ? = ''))
        )
        ORDER BY cashbook.id DESC
        LIMIT ? OFFSET ?
      `;

      const [entries] = await pool.query(query, [searchTerm, search, searchTerm, search, pageSize, offset]);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM cashbook
        LEFT JOIN expenses ON 
          expenses.id = cashbook.fk_reference_id AND 
          cashbook.out_amount > 0 AND
          expenses.deleted_at IS NULL
        LEFT JOIN incomes ON 
          incomes.id = cashbook.fk_reference_id AND 
          cashbook.in_amount > 0 AND
          incomes.deleted_at IS NULL
        WHERE cashbook.deleted_at IS NULL
        AND (
          (cashbook.in_amount > 0 AND (incomes.description LIKE ? OR ? = '')) OR
          (cashbook.out_amount > 0 AND (expenses.description LIKE ? OR ? = ''))
        )
      `;

      const [[total]] = await pool.query(countQuery, [searchTerm, search, searchTerm, search]);

      return {
        data: entries.map((entry) => ({
          id: entry.id,
          in_amount: Number(entry.in_amount),
          income_description: entry.income_description,
          income_amount: Number(entry.income_amount),
          income_currency: entry.income_currency,
          out_amount: Number(entry.out_amount),
          expense_description: entry.expense_description,
          expense_amount: Number(entry.expense_amount),
          expense_currency: entry.expense_currency,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          type: entry.type,
        })),
        pagination: {
          page,
          pageSize,
          totalItems: total.total,
          totalPages: Math.ceil(total.total / pageSize),
        },
      };
    } catch (error) {
      console.error("Cashbook findAll error:", error);
      throw new Error(`Failed to load cashbook entries: ${error.message}`);
    }
  }
}

export default Cashbook;