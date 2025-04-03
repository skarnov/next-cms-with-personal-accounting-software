import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

const ALLOWED_CURRENCIES = ["GBP", "BDT", "USD"];

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
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const { id } = params; // No need to await params in Next.js 13+
    const requestBody = await request.json();
    
    if (!requestBody) {
      return new Response(JSON.stringify({ error: "Request body is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const { fk_wallet_id, description, amount, currency } = requestBody;

    if (!description?.trim()) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (isNaN(amount)) {
      return new Response(
        JSON.stringify({ error: "Amount must be a number" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!currency) {
      return new Response(
        JSON.stringify({ error: "Currency is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      const [result] = await connection.query(
        `UPDATE expenses
         SET fk_wallet_id = ?, description = ?, amount = ?, currency = ?, updated_at = NOW(), updated_by = ?
         WHERE id = ?`,
        [fk_wallet_id || null, description.trim(), amount, currency, session.user.id, id]
      );

      const [updatedExpense] = await connection.query(
        `SELECT * FROM expenses WHERE id = ?`,
        [id]
      );

      await connection.commit();

      return new Response(JSON.stringify(updatedExpense[0]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      await connection.rollback();
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Database operation failed" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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