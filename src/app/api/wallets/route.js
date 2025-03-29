import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Wallet from "@/model/Wallet";

export async function GET() {
  try {
    const wallets = await Wallet.findAll();
    return new Response(JSON.stringify(wallets), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch wallets",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { name } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({ success: false, error: "Wallet name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const newWallet = await Wallet.create(name, session.user.id);

    return new Response(JSON.stringify({ success: true, data: newWallet }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("POST error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create wallet",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}