import Header from "./components/Header";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Articles from "./components/Articles";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <About />
      <Skills />
      <Projects />
      <Articles />
      <Contact />
      <Footer />
    </>
  );
}