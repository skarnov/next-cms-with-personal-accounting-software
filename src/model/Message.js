import pool from "../lib/db";
import xss from "xss";

class Message {
  /**
   * Get all messages
   * @returns {Promise<Array>} List of messages
   */
  static async findAll() {
    try {
      const [rows] = await pool.query(
        `SELECT id, subject, email, message, status, 
                created_at, updated_at 
         FROM messages`
      );

      return rows.map((row) => this.sanitize(row));
    } catch (error) {
      console.error("Message.findAll error:", {
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to fetch messages");
    }
  }

  /**
   * Find message by ID
   * @param {number} id - Message ID
   * @returns {Promise<Object>} Message object
   */
  static async findById(id) {
    try {
      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid message ID format");
      }

      const [rows] = await pool.query(
        `SELECT id, subject, email, message, status, 
                created_at, updated_at 
         FROM messages 
         WHERE id = ? 
         LIMIT 1`,
        [id]
      );

      if (rows.length === 0) {
        throw new Error("Message not found");
      }

      return this.sanitize(rows[0]);
    } catch (error) {
      console.error("Message.findById error:", {
        id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @param {string} messageData.subject - Message subject
   * @param {string} messageData.email - Sender email
   * @param {string} messageData.message - Message content
   * @returns {Promise<number>} ID of created message
   */
  static async create(messageData) {
    let connection;
    try {
      connection = await pool.getConnection();

      const cleanData = this.sanitizeMessageData(messageData);

      const [result] = await connection.query(
        `INSERT INTO messages 
         (subject, email, message, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [cleanData.subject, cleanData.email, cleanData.message]
      );

      return result.insertId;
    } catch (error) {
      console.error("Message.create error:", {
        messageData,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || "Failed to create message");
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Update a message
   * @param {number} id - Message ID
   * @param {Object} messageData - Message data
   * @returns {Promise<void>}
   */
  static async update(id, messageData) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid message ID format");
      }

      const cleanData = this.sanitizeMessageData(messageData);

      const [result] = await connection.query(
        `UPDATE messages 
         SET subject = ?, email = ?, message = ?, updated_at = NOW() 
         WHERE id = ?`,
        [cleanData.subject, cleanData.email, cleanData.message, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Message not found");
      }
    } catch (error) {
      console.error("Message.update error:", {
        id,
        messageData,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Delete a message
   * @param {number} id - Message ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid message ID format");
      }

      const [result] = await connection.query(
        `DELETE FROM messages 
         WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Message not found");
      }
    } catch (error) {
      console.error("Message.delete error:", {
        id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Count unseen messages
   * @returns {Promise<number>} Count of unseen messages
   */
  static async countUnseen() {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS unseenCount 
         FROM messages 
         WHERE status = 'unseen'`
      );
      return rows[0].unseenCount;
    } catch (error) {
      console.error("Message.countUnseen error:", {
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to count unseen messages");
    }
  }

  /**
   * Sanitize message data
   * @param {Object} data - Message data
   * @returns {Object} Sanitized message data
   * @throws {Error} If data is invalid
   */
  static sanitizeMessageData(data) {
    if (!data?.subject?.trim()) {
      throw new Error("Subject is required");
    }

    if (!data?.email?.trim() || !data.email.includes("@")) {
      throw new Error("Valid email is required");
    }

    if (!data?.message?.trim()) {
      throw new Error("Message is required");
    }

    return {
      subject: xss(data.subject.trim()),
      email: xss(data.email.trim()),
      message: xss(data.message.trim()),
    };
  }

  /**
   * Sanitize message for output
   * @param {Object} message - Message data
   * @returns {Object} Sanitized message
   */
  static sanitize(message) {
    return {
      id: message.id,
      subject: xss(message.subject),
      email: xss(message.email),
      message: xss(message.message),
      status: message.status,
      created_at: message.created_at,
      updated_at: message.updated_at,
    };
  }
}

export default Message;