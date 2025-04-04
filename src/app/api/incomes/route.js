import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Income from "@/model/Income";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const incomes = await Income.findAll(session.user.id, { page, search });
    return Response.json(incomes);
  } catch (error) {
    return Response.json({ error: error.message || "Failed to fetch incomes" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const incomeData = {
      ...data,
      wallet_id: data.walletId || null,
    };
    const income = await Income.create(incomeData, session.user.id);
    return Response.json(income, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to create income" }, { status: 400 });
  }
}