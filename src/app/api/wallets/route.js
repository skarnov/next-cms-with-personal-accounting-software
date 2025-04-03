import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [wallets] = await pool.query("SELECT * FROM wallets WHERE created_by = ? AND deleted_at IS NULL", [session.user.id]);

    return Response.json(wallets);
  } catch (error) {
    console.error("GET Error:", error);
    return Response.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();

    if (!name?.trim()) {
      return Response.json({ error: "Wallet name is required" }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO wallets (name, created_by, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [name.trim(), session.user.id]
    );

    const [newWallet] = await pool.query("SELECT * FROM wallets WHERE id = ?", [result.insertId]);

    return Response.json(newWallet[0], { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return Response.json(
      {
        error: error.message || "Failed to create wallet",
      },
      { status: 500 }
    );
  }
}