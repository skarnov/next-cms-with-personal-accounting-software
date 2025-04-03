import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";

const PAGE_SIZE = 50; // Number of items per page
const ALLOWED_CURRENCIES = ["BDT", "GBP", "USD"];

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * PAGE_SIZE;

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get paginated results
    const [expenses] = await connection.query(
      `SELECT e.*, w.name as wallet_name 
       FROM expenses e
       LEFT JOIN wallets w ON e.fk_wallet_id = w.id
       WHERE e.created_by = ? 
       AND e.deleted_at IS NULL
       ${search ? `AND (e.description LIKE ? OR w.name LIKE ?)` : ''}
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [
        session.user.id,
        ...(search ? [`%${search}%`, `%${search}%`] : []),
        PAGE_SIZE,
        offset
      ]
    );

    // Get total count for pagination
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total 
       FROM expenses e
       WHERE e.created_by = ? 
       AND e.deleted_at IS NULL
       ${search ? `AND (e.description LIKE ?)` : ''}`,
      [
        session.user.id,
        ...(search ? [`%${search}%`] : [])
      ]
    );

    return Response.json({ 
      success: true, 
      data: expenses,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / PAGE_SIZE)
      }
    });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ success: false, error: "Failed to fetch expenses" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: "Unauthorized" }, 
      { status: 401, headers }
    );
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return Response.json(
      { success: false, error: "Invalid JSON body" }, 
      { status: 400, headers }
    );
  }

  const { fk_wallet_id, description, amount, currency = "BDT" } = requestBody;

  // Basic validation (without wallet checks)
  if (!description?.trim()) {
    return Response.json(
      { success: false, error: "Description is required" }, 
      { status: 400, headers }
    );
  }

  const amountNumber = Number(amount);
  if (isNaN(amountNumber)) {
    return Response.json(
      { success: false, error: "Valid amount is required" }, 
      { status: 400, headers }
    );
  }

  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return Response.json(
      { success: false, error: "Invalid currency" }, 
      { status: 400, headers }
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Directly insert without wallet validation
    const [result] = await connection.query(
      `INSERT INTO expenses 
       (fk_wallet_id, description, amount, currency, created_at, created_by, updated_at, updated_by)
       VALUES (?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
      [
        fk_wallet_id || null, // Accept whatever comes from frontend or null
        description.trim(),
        amountNumber,
        currency,
        session.user.id,
        session.user.id
      ]
    );

    // Get the newly created expense
    const [newExpense] = await connection.query(
      `SELECT e.*, w.name as wallet_name 
       FROM expenses e
       LEFT JOIN wallets w ON e.fk_wallet_id = w.id
       WHERE e.id = ?`,
      [result.insertId]
    );

    return Response.json(
      { success: true, data: newExpense[0] },
      { status: 201, headers }
    );

  } catch (error) {
    console.error("Database error:", error);
    return Response.json(
      { success: false, error: "Failed to create expense" }, 
      { status: 500, headers }
    );
  } finally {
    if (connection) connection.release();
  }
}