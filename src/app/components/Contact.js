import ContactButton from "./ContactButton";
import { FaLinkedinIn, FaGithub } from "react-icons/fa";

export default function Contact() {
  return (
    <section id="contact" className="relative bg-gray-900 py-24 overflow-hidden">
      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-5xl font-bold text-white mb-6">Let's Work Together!</h2>
        <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
          I’m always excited to collaborate on new projects, explore job opportunities, or just chat about ideas. Reach out, and let’s create something extraordinary together!
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          {/* Interactive Button (Client Component) */}
          <ContactButton />
          <a
            href="#projects"
            className="bg-transparent border-2 border-lime-500 text-lime-500 px-8 py-4 rounded-full font-semibold hover:bg-lime-500 hover:text-gray-900 transition transform hover:scale-105"
          >
            View My Work
          </a>
        </div>
        <div className="mt-12 flex justify-center space-x-6">
          <a href="https://www.linkedin.com/in/shaik-obydullah/" target="_blank" className="text-gray-300 hover:text-lime-500 transition">
            <FaLinkedinIn className="text-2xl" />
          </a>
          <a href="https://github.com/skarnov" target="_blank" className="text-gray-300 hover:text-lime-500 transition">
            <FaGithub className="text-2xl" />
          </a>
        </div>
      </div>
    </section>
  );
}