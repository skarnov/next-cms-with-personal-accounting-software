import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Cashbook from "@/model/Cashbook";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 50;

    const result = await Cashbook.findAll(session.user.id, {
      page,
      pageSize,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: error.message || "Failed to fetch cashbook",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const cashbookData = {
      ...data,
      wallet_id: data.walletId || null,
    };
    const cashbook = await Expense.create(cashbookData, session.user.id);
    return Response.json(cashbook, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to create cashbook" }, { status: 400 });
  }
}