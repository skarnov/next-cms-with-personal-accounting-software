import Message from "@/model/Message";

export async function GET() {
  try {
    const unseenCount = await Message.countUnseen();
    return Response.json({ count: unseenCount });
  } catch (error) {
    console.error("Error fetching unseen message count:", error);
    return Response.json({ error: "Failed to fetch unseen message count" }, { status: 500 });
  }
}