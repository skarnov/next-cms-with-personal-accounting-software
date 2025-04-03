import pool from "../lib/db";
import xss from "xss";

class Message {
  static async findAll() {
    try {
      const [rows] = await pool.query("SELECT * FROM messages");

      return rows.map((row) => ({
        ...row,
        subject: xss(row.subject),
        email: xss(row.email),
        message: xss(row.message),
      }));
    } catch (error) {
      console.error("Error fetching all messages:", error);
      throw new Error("Failed to fetch messages.");
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query("SELECT * FROM messages WHERE id = ?", [id]);

      if (rows.length === 0) {
        throw new Error("Message not found.");
      }

      return {
        ...rows[0],
        subject: xss(rows[0].subject),
        email: xss(rows[0].email),
        message: xss(rows[0].message),
      };
    } catch (error) {
      console.error("Error fetching message by ID:", error);
      throw new Error("Failed to fetch message.");
    }
  }

  static async create(messageData) {
    const { subject, email, message } = messageData;

    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      throw new Error("Subject is required and must be a non-empty string.");
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error("Email is required and must be a valid email address.");
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      throw new Error("Message is required and must be a non-empty string.");
    }

    const sanitizedSubject = xss(subject);
    const sanitizedEmail = xss(email);
    const sanitizedMessage = xss(message);

    try {
      const [result] = await pool.query("INSERT INTO messages (subject, email, message, created_at) VALUES (?, ?, ?, ?)", [sanitizedSubject, sanitizedEmail, sanitizedMessage, new Date()]);
      return result.insertId;
    } catch (error) {
      console.error("Error creating message:", error);
      throw new Error("Failed to create message.");
    }
  }

  static async update(id, messageData) {
    const { subject, email, message } = messageData;

    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      throw new Error("Subject is required and must be a non-empty string.");
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error("Email is required and must be a valid email address.");
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      throw new Error("Message is required and must be a non-empty string.");
    }

    const sanitizedSubject = xss(subject);
    const sanitizedEmail = xss(email);
    const sanitizedMessage = xss(message);

    try {
      await pool.query("UPDATE messages SET subject = ?, email = ?, message = ?, updated_at = ? WHERE id = ?", [sanitizedSubject, sanitizedEmail, sanitizedMessage, new Date(), id]);
    } catch (error) {
      console.error("Error updating message:", error);
      throw new Error("Failed to update message.");
    }
  }

  static async delete(id) {
    try {
      await pool.query("DELETE FROM messages WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting message:", error);
      throw new Error("Failed to delete message.");
    }
  }

  static async countUnseen() {
    try {
      const [rows] = await pool.query("SELECT COUNT(*) AS unseenCount FROM messages WHERE status = 'unseen'");
      return rows[0].unseenCount;
    } catch (error) {
      console.error("Error counting unseen messages:", error);
      throw new Error("Failed to count unseen messages.");
    }
  }
}

export default Message;