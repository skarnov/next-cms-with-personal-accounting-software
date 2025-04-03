import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET(request, { params }) {
  const { id } = params;

  if (!id || isNaN(id)) {
    return Response.json({ error: "Invalid wallet ID" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [wallet] = await pool.query("SELECT * FROM wallets WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [id, session.user.id]);

    if (!wallet.length) {
      return Response.json({ error: "Wallet not found" }, { status: 404 });
    }

    return Response.json(wallet[0]);
  } catch (error) {
    console.error("GET Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;

  if (!id || isNaN(id)) {
    return Response.json({ error: "Invalid wallet ID" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, userId } = await request.json();

    if (!name?.trim()) {
      return Response.json({ error: "Wallet name is required" }, { status: 400 });
    }

    if (String(userId) !== String(session.user.id)) {
      return Response.json({ error: "Unauthorized action" }, { status: 403 });
    }

    const [wallet] = await pool.query("SELECT * FROM wallets WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [id, session.user.id]);

    if (!wallet.length) {
      return Response.json({ error: "Wallet not found" }, { status: 404 });
    }

    await pool.query(
      `UPDATE wallets 
       SET name = ?, updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [name.trim(), session.user.id, id]
    );

    const [updatedWallet] = await pool.query("SELECT * FROM wallets WHERE id = ?", [id]);

    return Response.json(updatedWallet[0]);
  } catch (error) {
    console.error("PUT Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [wallets] = await connection.query("SELECT * FROM wallets WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [id, session.user.id]);

    if (wallets.length === 0) {
      return Response.json({ error: "Wallet not found" }, { status: 404 });
    }

    await connection.query(
      `UPDATE wallets 
       SET deleted_at = NOW(), updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [session.user.id, id]
    );

    return Response.json({
      success: true,
      data: { id, message: "Wallet deleted successfully" },
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return Response.json({ error: "Failed to delete wallet" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}