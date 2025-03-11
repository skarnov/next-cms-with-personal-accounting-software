import Message from "@/model/Message";

// Fetch all messages
export async function GET() {
  try {
    const messages = await Message.findAll();
    return Response.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// Create a new message
export async function POST(request) {
  try {
    const { subject, email, message } = await request.json();

    // Validate required fields
    if (!subject || !email || !message) {
      return Response.json({ error: "Subject, email, and message are required" }, { status: 400 });
    }

    // Create the message in the database
    const messageId = await Message.create({ subject, email, message });

    // Return the created message ID and data
    return Response.json({ id: messageId, subject, email, message }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return Response.json({ error: "Failed to create message" }, { status: 500 });
  }
}
