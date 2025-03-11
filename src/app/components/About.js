"use client";

import { useEffect, useState } from "react";

export default function About() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      const matrixCanvas = document.getElementById("matrix-canvas");
      const ctx = matrixCanvas.getContext("2d");

      matrixCanvas.width = window.innerWidth;
      matrixCanvas.height = window.innerHeight;

      const binary = "01010101010101010101010101010101";
      const columns = Math.floor(matrixCanvas.width / 20);
      const drops = Array(columns).fill(0);

      function drawMatrix() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

        ctx.fillStyle = "lime";
        ctx.font = "15px monospace";

        // Draw Binary Characters
        for (let i = 0; i < drops.length; i++) {
          const text = binary[Math.floor(Math.random() * binary.length)];
          const x = i * 20;
          const y = drops[i] * 20;

          ctx.fillText(text, x, y);

          // Reset Drop If It Reaches The Bottom
          if (y > matrixCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }

          // Move Drop Down
          drops[i]++;
        }
      }

      // Start The Animation
      const interval = setInterval(drawMatrix, 50);

      // Handle Window Resize
      const handleResize = () => {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
      };
      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        clearInterval(interval);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return (
    <section id="about" className="relative py-20 overflow-hidden">
      <canvas id="matrix-canvas" className="absolute inset-0 z-0" style={{ display: isClient ? "block" : "none" }} role="img" aria-label="Matrix-style binary code animation"></canvas>

      <div className="container mx-auto px-4 text-center max-w-7xl relative z-10">
        <h2 className="text-4xl font-bold text-white mb-6">About Me</h2>
        <div className="text-lg text-gray-300 leading-relaxed bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg">I am a Full Stack Software Engineer, System Analyst, and Cloud Computing specialist with expertise in designing and implementing scalable, business-driven solutions. With a strong foundation in PHP, JavaScript frameworks, and database management, I specialize in building end-to-end web applications while analyzing business requirements to deliver efficient systems. My experience in cloud platforms allows me to design and deploy modern, cost-effective infrastructure. I am passionate about leveraging technology to solve complex problems and drive business growth.</div>
      </div>
    </section>
  );
}