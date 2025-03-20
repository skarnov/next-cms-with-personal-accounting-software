import { FaPhp, FaSearch, FaWordpress, FaLaravel, FaProjectDiagram, FaJsSquare, FaDatabase, FaReact, FaPython, FaAws, FaDocker, FaNodeJs, FaGit } from "react-icons/fa";
import { SiPostgresql, SiReact, SiCodeigniter, SiMysql, SiGithubactions, SiBootstrap, SiMongodb, SiTailwindcss, SiTypescript, SiJenkins, SiGooglecloud, SiDigitalocean, SiAlpinedotjs, SiLivewire } from "react-icons/si";

const icons = {
  FaPhp, FaSearch, FaWordpress, FaLaravel, FaProjectDiagram, FaJsSquare, FaDatabase, FaReact, FaPython, FaAws, FaDocker, FaNodeJs, FaGit,
  SiPostgresql, SiReact, SiCodeigniter, SiMysql, SiGithubactions, SiBootstrap, SiMongodb, SiTailwindcss, SiTypescript, SiJenkins, SiGooglecloud, SiDigitalocean, SiAlpinedotjs, SiLivewire
};

const iconClass = "text-4xl text-white";

const skills = {
  frontend: [
    { name: "React.js", icon: <icons.FaReact className={iconClass} aria-label="React.js" />, description: "Experienced in building modern, dynamic user interfaces using hooks, state management, and functional components." },
    { name: "Next.js", icon: <icons.FaJsSquare className={iconClass} aria-label="Next.js" />, description: "Proficient in building SEO-friendly, fast-loading frontends with Next.js, leveraging server-side rendering and static site generation for optimal performance and user experience." },
    { name: "Tailwind CSS", icon: <icons.SiTailwindcss className={iconClass} aria-label="Tailwind CSS" />, description: "Proficient in creating responsive, modern user interfaces, enabling faster development and consistent design across projects." },
    { name: "Alpine.js", icon: <icons.SiAlpinedotjs className={iconClass} aria-label="Alpine.js" />, description: "Experienced in creating interactive components like modals, dropdowns, and forms using Alpine.js." },
    { name: "Bootstrap", icon: <icons.SiBootstrap className={iconClass} aria-label="Bootstrap" />, description: "Skilled in building responsive, mobile-first web interfaces that deliver fast, flexible, and user-friendly experiences using Bootstrap CSS framework." },
    { name: "React Native", icon: <icons.SiReact className={iconClass} aria-label="React Native" />, description: "Experienced in building cross-platform mobile applications using React Native, leveraging reusable components and native APIs for high-performance apps." },
  ],
  backend: [
    { name: "PHP", icon: <icons.FaPhp className={iconClass} aria-label="PHP" />, description: "Highly skilled in modern PHP development, including Composer, PSR standards, and OOP. Experienced in building custom PHP frameworks, RESTful APIs, and scalable backend systems for complex web applications." },
    { name: "Laravel", icon: <icons.FaLaravel className={iconClass} aria-label="Laravel" />, description: "Experienced in developing scalable applications with Laravel, including building RESTful APIs and optimizing performance for clean, maintainable code." },
    { name: "Laravel Livewire", icon: <icons.SiLivewire className={iconClass} aria-label="Laravel Livewire" />, description: "Experienced in Laravel Livewire for building dynamic, reactive UIs with real-time updates, seamless form handling, and tight integration with Laravel Blade." },
    { name: "Node.js", icon: <icons.FaNodeJs className={iconClass} aria-label="Node.js" />, description: "Experienced in backend development with Node.js, leveraging its non-blocking I/O model to build scalable, high-performance server-side applications." },
    { name: "Python & Flask", icon: <icons.FaPython className={iconClass} aria-label="Python & Flask" />, description: "Experienced in Python and Flask, developing efficient web applications and performing data analysis using libraries like Pandas, NumPy, and Matplotlib." },
    { name: "CodeIgniter", icon: <icons.SiCodeigniter className={iconClass} aria-label="CodeIgniter" />, description: "Experienced in CodeIgniter for building scalable, secure, and maintainable MVC-based web applications." },
  ],
  databases: [
    { name: "MySQL", icon: <icons.SiMysql className={iconClass} aria-label="MySQL" />, description: "Experienced in MySQL database management, including query optimization, indexing, and performance tuning for scalable and efficient applications." },
    { name: "PostgreSQL", icon: <icons.SiPostgresql className={iconClass} aria-label="PostgreSQL" />, description: "Expert in spatial data with PostGIS, advanced query optimization using parallel queries and leveraging features like Foreign Data Wrappers for high-performance data management." },
    { name: "Oracle Database", icon: <icons.FaDatabase className={iconClass} aria-label="Oracle Database" />, description: "Experienced in Oracle database management, including database design, performance tuning, and complex query optimization for scalable and efficient enterprise applications." },
    { name: "MongoDB", icon: <icons.SiMongodb className={iconClass} aria-label="MongoDB" />, description: "Proficient in MongoDB, using its NoSQL capabilities for scalable, flexible data storage and efficient querying." },
  ],
  devops: [
    { name: "Docker", icon: <icons.FaDocker className={iconClass} aria-label="Docker" />, description: "Experienced in containerizing applications with Docker, ensuring consistency across environments and simplifying deployment." },
    { name: "CI/CD Implementation", icon: <icons.SiGithubactions className={iconClass} aria-label="CI/CD Implementation" />, description: "Proficient in implementing automated CI/CD pipelines for continuous integration, testing, and deployment to streamline development workflows." },
    { name: "AWS", icon: <icons.FaAws className={iconClass} aria-label="AWS" />, description: "Proficient in AWS cloud services, including EC2, S3, Lambda, and RDS, for building scalable, secure, and cost-effective cloud applications." },
    { name: "DigitalOcean", icon: <icons.SiDigitalocean className={iconClass} aria-label="DigitalOcean" />, description: "Skilled in deploying applications on DigitalOcean, utilizing Droplets, Kubernetes, and managed databases for scalable hosting solutions." },
    { name: "GCP", icon: <icons.SiGooglecloud className={iconClass} aria-label="GCP" />, description: "Proficient in Google Cloud Platform (GCP), including services like Compute Engine, Cloud Storage, and Kubernetes Engine for building and managing cloud infrastructure." },
  ],
  tools: [
    { name: "Git & GitHub", icon: <icons.FaGit className={iconClass} aria-label="Git & GitHub" />, description: "Experienced in version control with Git and GitHub, including branching, merging, and collaborating on code with teams." },
    { name: "TypeScript", icon: <icons.SiTypescript className={iconClass} aria-label="TypeScript" />, description: "Strong knowledge of TypeScript, including advanced types, interfaces, and generics for building scalable and maintainable applications." },
    { name: "Design Pattern", icon: <icons.FaProjectDiagram className={iconClass} aria-label="Design Pattern" />, description: "Strong understanding of software design patterns, specializing in creating scalable and maintainable architecture." },
  ],
  other: [
    { name: "SEO", icon: <icons.FaSearch className={iconClass} aria-label="SEO" />, description: "Proficient in Search Engine Optimization (SEO), including on-page optimization, keyword research, and technical SEO to improve website visibility and rankings." },
    { name: "WordPress Theme Development", icon: <icons.FaWordpress className={iconClass} aria-label="WordPress Theme Development" />, description: "Experienced in developing custom WordPress themes, ensuring responsive design, cross-browser compatibility, and adherence to WordPress coding standards." },
  ],
};

const allSkills = Object.values(skills).flat();

export default function Skills() {
  return (
    <section id="skills" className="bg-gray-800 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-6 text-center">Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allSkills.map((skill) => (
            <div key={skill.name} className="bg-gray-700 p-6 rounded-lg shadow-md text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-4">{skill.icon}</div>
              <h3 className="text-xl font-semibold mt-4 text-white">{skill.name}</h3>
              <p className="text-gray-300 mt-2">{skill.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}