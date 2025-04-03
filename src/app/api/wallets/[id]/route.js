import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Wallet from "@/model/Wallet";

const validateWalletId = (id) => {
  if (!id || isNaN(Number(id))) {
    throw new Error("Invalid wallet ID");
  }
};

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    validateWalletId(params.id);
    const wallet = await Wallet.findByIdAndUser(params.id, session.user.id);
    return Response.json(wallet);
  } catch (error) {
    console.error(`GET /api/wallets/${params.id} error:`, error);
    const status = error.message.includes("not found") ? 404 : error.message.includes("Invalid") ? 400 : 500;
    return Response.json({ error: error.message }, { status });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    validateWalletId(params.id);
    const { name } = await request.json();

    const updatedWallet = await Wallet.update(params.id, name, session.user.id);

    return Response.json(updatedWallet);
  } catch (error) {
    console.error(`PUT /api/wallets/${params.id} error:`, error);
    const status = error.message.includes("not found") ? 404 : error.message.includes("required") ? 400 : error.message.includes("Invalid") ? 400 : 500;
    return Response.json({ error: error.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    validateWalletId(params.id);
    await Wallet.delete(params.id, session.user.id);

    return Response.json({
      success: true,
      id: params.id,
    });
  } catch (error) {
    console.error(`DELETE /api/wallets/${params.id} error:`, error);
    const status = error.message.includes("not found") ? 404 : error.message.includes("Invalid") ? 400 : 500;
    return Response.json({ error: error.message }, { status });
  }
}