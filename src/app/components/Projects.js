import { Suspense } from "react";
import ProjectsList from "./ProjectsList";

async function fetchProjects(offset = 0, limit = 9) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_LOCAL_URL;
    const res = await fetch(`${baseURL}/api/projects?offset=${offset}&limit=${limit}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
}

async function ProjectsContent() {
  const { projects, totalProjects } = await fetchProjects(0, 9);

  if (!projects || projects.length === 0) {
    return (
      <section id="projects" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Projects</h2>
          <p className="text-gray-300 text-center">No projects found.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Projects</h2>
        <ProjectsList initialProjects={projects} totalProjects={totalProjects} />
      </div>
    </section>
  );
}

function ErrorBoundary({ children }) {
  try {
    return children;
  } catch (error) {
    return (
      <section id="projects" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Projects</h2>
          <p className="text-red-500 text-center">Failed to load projects.</p>
        </div>
      </section>
    );
  }
}

export default function Projects() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <section id="projects" className="py-20 bg-gray-900">
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-white mb-12 text-center">Projects</h2>
              <p className="text-gray-300 text-center">Loading...</p>
            </div>
          </section>
        }
      >
        <ProjectsContent />
      </Suspense>
    </ErrorBoundary>
  );
}