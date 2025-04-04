import pool from "./db";

class ConfigService {
  static async getConfig(name) {
    try {
      const [rows] = await pool.query("SELECT setting FROM configurations WHERE name = ? AND deleted_at IS NULL", [name]);
      return rows[0]?.setting;
    } catch (error) {
      console.error("Error fetching config:", error);
      return null;
    }
  }

  static async getPaginateRows() {
    const rows = await this.getConfig("paginate_rows");
    return rows ? parseInt(rows) : parseInt(process.env.DEFAULT_PAGINATE_ROWS || "50");
  }

  static async getDefaultCurrency() {
    const currency = await this.getConfig("default_currency");
    return currency || process.env.DEFAULT_CURRENCY || "GBP";
  }

  static async getCurrencies() {
    const currenciesJson = await this.getConfig("currencies");
    try {
      return currenciesJson
        ? JSON.parse(currenciesJson)
        : [
            { code: "GBP", name: "British Pound", symbol: "£" },
            { code: "USD", name: "US Dollar", symbol: "$" },
            { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
          ];
    } catch (e) {
      console.error("Error parsing currencies:", e);
      return [
        { code: "GBP", name: "British Pound", symbol: "£" },
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
      ];
    }
  }
}

export default ConfigService;