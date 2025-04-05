"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ContactFormModal = dynamic(() => import("./ContactFormModal"), {
  ssr: false,
});

export default function ContactButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="bg-transparent border-2 border-lime-500 text-lime-500 px-8 py-4 rounded-full font-semibold hover:bg-lime-500 hover:text-gray-900 transition transform hover:scale-105">
        Email Me
      </button>
      {isModalOpen && <ContactFormModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}