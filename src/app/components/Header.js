"use client";

import React, { useEffect, useState } from "react";

export default function Header() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 0);
  }, []);

  return (
    <>
      <header className={`header-bg relative py-32 text-center text-white overflow-hidden transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="header-overlay absolute inset-0"></div>
        <div className="circle-transition"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-white/10 rounded-full animate-pulse"></div>
          <div className="w-96 h-96 bg-white/5 rounded-full absolute animate-pulse delay-500"></div>
        </div>
        <div className="header-content container mx-auto px-6 relative z-20">
          <h1 className="text-5xl font-bold mb-4">Shaik Obydullah</h1>
          <p className="text-xl mb-8">Full Stack Software Engineer | System Analyst | Cloud Computing</p>
          <a href="#projects" className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition">
            View My Work
          </a>
        </div>
      </header>
    </>
  );
}