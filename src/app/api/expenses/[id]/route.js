import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

const ALLOWED_CURRENCIES = ["BDT", "GBP", "USD"];

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = params;
  const { fk_wallet_id, description, amount } = requestBody;

  if (!description?.trim()) {
    return Response.json({ success: false, error: "Description is required" }, { status: 400 });
  }

  if (!amount || isNaN(amount)) {
    return Response.json({ success: false, error: "Valid amount is required" }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [expenses] = await connection.query("SELECT * FROM expenses WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [id, session.user.id]);

    if (expenses.length === 0) {
      return Response.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    if (fk_wallet_id) {
      const [wallets] = await connection.query("SELECT id FROM wallets WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [fk_wallet_id, session.user.id]);
      if (wallets.length === 0) {
        return Response.json({ success: false, error: "Wallet not found" }, { status: 404 });
      }
    }

    await connection.query(
      `UPDATE expenses 
       SET fk_wallet_id = ?, description = ?, amount = ?, currency = ?, updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [fk_wallet_id || null, description.trim(), amount, currency, session.user.id, id]
    );

    const [updatedExpense] = await connection.query(
      `SELECT e.*, w.name as wallet_name 
       FROM expenses e
       LEFT JOIN wallets w ON e.fk_wallet_id = w.id
       WHERE e.id = ?`,
      [id]
    );

    return Response.json({
      success: true,
      data: updatedExpense[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ success: false, error: "Failed to update expense" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  let connection;
  try {
    connection = await pool.getConnection();
    const [expenses] = await connection.query("SELECT * FROM expenses WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [id, session.user.id]);

    if (expenses.length === 0) {
      return Response.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    await connection.query(
      `UPDATE expenses 
       SET deleted_at = NOW(), updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [session.user.id, id]
    );

    return Response.json({
      success: true,
      data: {
        id,
        message: "Expense deleted successfully",
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ success: false, error: "Failed to delete expense" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}