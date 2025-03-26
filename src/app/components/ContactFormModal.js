"use client";

import { useState } from "react";

export default function ContactFormModal({ onClose }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject, email, message }),
      });

      if (!response.ok) throw new Error("Failed to save message.");

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-lime-500">
        <h3 className="text-2xl font-bold text-white mb-6">Email Me</h3>

        {isSubmitted ? (
          <div className="text-center">
            <p className="text-lime-500 mb-4">Thank you for reaching out! I'll get back to you soon.</p>
            <button onClick={onClose} className="bg-lime-500 text-gray-900 px-6 py-2 rounded-lg hover:bg-lime-600 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500" required />
            <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500" required />
            <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-3 mb-6 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 h-32" required></textarea>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-lime-500 text-gray-900 px-6 py-2 rounded-lg hover:bg-lime-600 transition-colors flex items-center justify-center min-w-20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}