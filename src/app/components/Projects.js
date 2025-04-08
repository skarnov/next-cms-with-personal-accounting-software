import { Suspense } from 'react';
import ProjectsList from './ProjectsList';

async function fetchProjects(offset = 0, limit = 9) {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const res = await fetch(`${baseURL}/api/projects?offset=${offset}&limit=${limit}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.status}`);
  }

  return await res.json();
}

export const revalidate = 3600;

async function ProjectsContent() {
  const data = await fetchProjects();
  const { projects, totalProjects } = data;

  if (!projects || projects.length === 0) {
    return (
      <section id="projects" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Projects</h2>
          <p className="text-gray-300 text-center">No projects available at this time.</p>
        </div>
      </section>
    );
  }

  return (
    <ProjectsList 
      initialProjects={projects} 
      totalProjects={totalProjects} 
    />
  );
}

function ProjectsLoading() {
  return (
    <section id="projects" className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full animate-pulse">
              <div className="bg-gray-700 h-48 w-full"></div>
              <div className="p-6">
                <div className="bg-gray-700 h-6 w-3/4 mb-4 rounded"></div>
                <div className="bg-gray-700 h-4 w-full mb-2 rounded"></div>
                <div className="bg-gray-700 h-4 w-5/6 mb-2 rounded"></div>
                <div className="bg-gray-700 h-4 w-2/3 mb-4 rounded"></div>
                <div className="flex gap-2 mb-4">
                  <div className="bg-gray-700 h-6 w-16 rounded-full"></div>
                  <div className="bg-gray-700 h-6 w-16 rounded-full"></div>
                </div>
                <div className="bg-gray-700 h-5 w-24 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Projects</h2>
        <Suspense fallback={<ProjectsLoading />}>
          <ProjectsContent />
        </Suspense>
      </div>
    </section>
  );
}