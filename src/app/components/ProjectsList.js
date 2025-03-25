"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ViewMoreProjects from "./ViewMoreProjects";

function ProjectCard({ project }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-transform hover:scale-105">
      <img src={project.project_image} alt={project.project_name} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2">{project.project_name}</h3>
        <p className="text-gray-300 mb-4">{project.project_summary}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags?.map((tag) => (
            <span key={tag.id} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
              {tag.name}
            </span>
          ))}
        </div>

        <Link href={`/project/${project.project_slug}`} className="text-lime-500 hover:text-lime-400 font-semibold inline-block" onClick={handleClick}>
          {isLoading ? "Loading..." : "View Project →"}
        </Link>
      </div>
    </div>
  );
}

export default function ProjectsList({ initialProjects, totalProjects }) {
  const [projects, setProjects] = useState(initialProjects);
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(false);
  const projectsSectionRef = useRef(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const handleViewMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects?offset=${visibleCount}&limit=9`);
      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();
      setProjects((prevProjects) => [...prevProjects, ...data.projects]);
      setVisibleCount((prevCount) => prevCount + 9);
    } catch (error) {
      console.error("Error fetching more projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowLess = () => {
    setProjects(initialProjects);
    setVisibleCount(9);
    projectsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const visibleProjects = projects.slice(0, visibleCount);

  return (
    <>
      {projects.length === 0 ? (
        <p className="text-white text-center">No projects found.</p>
      ) : (
        <>
          <div ref={projectsSectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.project_id} project={project} />
            ))}
          </div>

          <div className="text-center text-white mt-4">
            Showing {visibleProjects.length} of {totalProjects} projects
          </div>

          {totalProjects > 9 && <ViewMoreProjects showAll={visibleCount >= totalProjects} onClick={visibleCount >= totalProjects ? handleShowLess : handleViewMore} loading={loading} />}
        </>
      )}
    </>
  );
}