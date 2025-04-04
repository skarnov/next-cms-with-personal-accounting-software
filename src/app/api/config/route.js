import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ConfigService from "@/lib/configService";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const names = searchParams.getAll("name");

    const configs = {};
    for (const name of names) {
      switch (name) {
        case "paginate_rows":
          configs[name] = await ConfigService.getPaginateRows();
          break;
        case "default_currency":
          configs[name] = await ConfigService.getDefaultCurrency();
          break;
        case "currencies":
          configs[name] = await ConfigService.getCurrencies();
          break;
        default:
          configs[name] = await ConfigService.getConfig(name);
      }
    }

    return Response.json(configs);
  } catch (error) {
    console.error("Config API error:", error);
    return Response.json({ error: error.message || "Failed to fetch config" }, { status: 500 });
  }
}