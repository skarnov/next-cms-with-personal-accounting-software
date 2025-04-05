import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Dashboard from "@/model/dashboard";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await Dashboard.dashboardData();
    return Response.json(result);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json(
      {
        error: error.message || "Failed to fetch dashboard",
      },
      { status: 500 }
    );
  }
}