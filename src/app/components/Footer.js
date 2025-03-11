"use client";

import { useEffect } from "react";

export default function Footer() {
  useEffect(() => {
    const backToTopButton = document.getElementById("back-to-top");

    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopButton.classList.remove("hidden");
      } else {
        backToTopButton.classList.add("hidden");
      }
    });

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    return () => {
      window.removeEventListener("scroll", () => {});
      backToTopButton.removeEventListener("click", () => {});
    };
  }, []);

  return (
    <>
      <footer className="bg-gray-800 text-white py-6 text-center">
        <p>© Shaik Obydullah. All Rights Reserved.</p>
      </footer>

      <button id="back-to-top" className="fixed bottom-8 right-8 bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-gray-200 transition hidden">
        ↑
      </button>
    </>
  );
}