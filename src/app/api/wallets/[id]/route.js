import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { name, userId } = await request.json();

  if (!name?.trim()) {
    return Response.json({ success: false, error: "Wallet name is required" }, { status: 400 });
  }

  if (userId !== session.user.id) {
    return Response.json({ success: false, error: "Unauthorized action" }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [wallets] = await connection.query("SELECT * FROM wallets WHERE id = ? AND created_by = ? AND deleted_at IS NULL", [id, session.user.id]);

    if (wallets.length === 0) {
      return Response.json({ success: false, error: "Wallet not found" }, { status: 404 });
    }

    await connection.query(
      `UPDATE wallets 
       SET name = ?, updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [name.trim(), session.user.id, id]
    );

    return Response.json({
      success: true,
      data: {
        id,
        name: name.trim(),
        updated_by: session.user.id,
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ success: false, error: "Failed to update wallet" }, { status: 500 });
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