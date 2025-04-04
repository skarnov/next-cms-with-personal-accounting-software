import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Income from "@/model/Income";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const income = await Income.findById(params.id, session.user.id);
    if (!income) {
      return Response.json({ error: "Income not found" }, { status: 404 });
    }
    return Response.json(income);
  } catch (error) {
    return Response.json({ error: error.message || "Failed to fetch income" }, { status: 500 });
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

    const income = await Income.update(params.id, transformedData, session.user.id);
    return Response.json(income);
  } catch (error) {
    console.error("Error in PUT /api/incomes/[id]:", {
      error: error.message,
      stack: error.stack,
      params,
      userId: session?.user?.id,
      data,
    });

    return Response.json(
      {
        error: error.message || "Failed to update income",
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
    const success = await Income.delete(params.id, session.user.id);
    if (!success) {
      return Response.json({ error: "Income not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to delete income" }, { status: 500 });
  }
}