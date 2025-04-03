import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Expense from "@/model/Expense";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expense = await Expense.findById(params.id, session.user.id);
    if (!expense) {
      return Response.json({ error: "Expense not found" }, { status: 404 });
    }
    return Response.json(expense);
  } catch (error) {
    return Response.json({ error: error.message || "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const transformedData = {
      ...data,
      wallet_id: data.walletId,
      date: data.date,
    };

    const expense = await Expense.update(params.id, transformedData, session.user.id);
    return Response.json(expense);
  } catch (error) {
    console.error("Error in PUT /api/expenses/[id]:", {
      error: error.message,
      stack: error.stack,
      params,
      userId: session?.user?.id,
      data,
    });

    return Response.json(
      {
        error: error.message || "Failed to update expense",
      },
      {
        status: error.message.includes("not found") ? 404 : 400,
      }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const success = await Expense.delete(params.id, session.user.id);
    if (!success) {
      return Response.json({ error: "Expense not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to delete expense" }, { status: 500 });
  }
}
