import pool from "../lib/db";

class Dashboard {
  static async dashboardData() {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const start = `${year}-${month}-01`;
      const end = `${year}-${month}-31`;

      const [inResult] = await pool.query(
        `SELECT COALESCE(SUM(in_amount), 0) AS total_in FROM cashbook
           WHERE created_at BETWEEN ? AND ? AND deleted_at IS NULL`,
        [start, end]
      );

      const [outResult] = await pool.query(
        `SELECT COALESCE(SUM(out_amount), 0) AS total_out FROM cashbook
           WHERE created_at BETWEEN ? AND ? AND deleted_at IS NULL`,
        [start, end]
      );

      const [walletExpenseResult] = await pool.query(
        `SELECT w.name AS wallet_name, 
                COALESCE(SUM(e.amount), 0) AS total_expense
           FROM expenses e
           LEFT JOIN wallets w ON e.fk_wallet_id = w.id
           WHERE e.created_at >= ? 
             AND e.created_at <= ? 
             AND e.deleted_at IS NULL
           GROUP BY w.name`,
        [start, end]
      );

      const walletExpenses = walletExpenseResult.map((wallet) => ({
        wallet_name: wallet.wallet_name,
        total_expense: parseFloat(wallet.total_expense),
      }));

      const [walletIncomeResult] = await pool.query(
        `SELECT w.name AS wallet_name, 
                COALESCE(SUM(i.amount), 0) AS total_income
           FROM incomes i
           LEFT JOIN wallets w ON i.fk_wallet_id = w.id
           WHERE i.created_at >= ? 
             AND i.created_at <= ? 
             AND i.deleted_at IS NULL
           GROUP BY w.name`,
        [start, end]
      );

      const walletIncomes = walletIncomeResult.map((wallet) => ({
        wallet_name: wallet.wallet_name,
        total_income: parseFloat(wallet.total_income),
      }));

      return {
        in: parseFloat(inResult[0].total_in),
        out: parseFloat(outResult[0].total_out),
        walletExpenses,
        walletIncomes,
      };
    } catch (error) {
      console.error("Dashboard findAll error:", error);
      throw new Error(`Failed to load dashboard data: ${error.message}`);
    }
  }
}

export default Dashboard;