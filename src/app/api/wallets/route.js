import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Wallet from "@/model/Wallet";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await Wallet.findAllByUser(session.user.id);
    return Response.json(wallets);
  } catch (error) {
    console.error("GET /api/wallets error:", error);
    return Response.json({ error: error.message || "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    const newWallet = await Wallet.create(name, session.user.id);

    return Response.json(newWallet, { status: 201 });
  } catch (error) {
    console.error("POST /api/wallets error:", error);
    return Response.json({ error: error.message || "Failed to create wallet" }, { status: error.message.includes("required") ? 400 : 500 });
  }
}