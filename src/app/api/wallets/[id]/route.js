import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid wallet ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { name, userId } = await request.json();

    if (!name?.trim()) {
      return new Response(JSON.stringify({ error: "Wallet name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (String(userId) !== String(session.user.id)) {
      return new Response(JSON.stringify({ error: "Unauthorized action" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const [wallet] = await pool.query(
      "SELECT * FROM wallets WHERE id = ? AND created_by = ? AND deleted_at IS NULL",
      [id, session.user.id]
    );

    if (!wallet.length) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    await pool.query(
      `UPDATE wallets 
       SET name = ?, updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [name.trim(), session.user.id, id]
    );

    const [updatedWallet] = await pool.query(
      "SELECT * FROM wallets WHERE id = ?",
      [id]
    );

    return new Response(JSON.stringify(updatedWallet[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("PUT error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
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
    const [wallets] = await connection.query("SELECT * FROM wallets WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [id, session.user.id]);

    if (wallets.length === 0) {
      return Response.json({ success: false, error: "Wallet not found" }, { status: 404 });
    }

    await connection.query(
      `UPDATE wallets 
       SET deleted_at = NOW(), updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [session.user.id, id]
    );

    return Response.json({
      success: true,
      data: {
        id,
        message: "Wallet deleted successfully",
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ success: false, error: "Failed to delete wallet" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}