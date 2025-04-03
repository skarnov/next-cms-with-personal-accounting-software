import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Expense from "@/model/Expense";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const expenses = await Expense.findAll(session.user.id, { page, search });
    return Response.json(expenses);
  } catch (error) {
    return Response.json({ error: error.message || "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const expenseData = {
      ...data,
      wallet_id: data.walletId || null,
    };
    const expense = await Expense.create(expenseData, session.user.id);
    return Response.json(expense, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to create expense" }, { status: 400 });
  }
}