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
    const search = searchParams.get("search") || "";

    const result = await Cashbook.findAll({
      page,
      pageSize,
      search
    });

    return Response.json(result);
  } catch (error) {
    console.error("Cashbook API error:", error);
    return Response.json(
      {
        error: error.message || "Failed to fetch cashbook",
      },
      { status: 500 }
    );
  }
}