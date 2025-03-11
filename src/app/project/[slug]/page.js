import { Suspense } from "react";
import Link from "next/link";
import RelatedProjectsSidebar from "../../components/RelatedProjectsSidebar";

async function fetchProjectDetails(slug) {
  const baseURL = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_LOCAL_URL;
  const res = await fetch(`${baseURL}/api/select-project?slug=${slug}&includeRelated=true`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch project.");
  }

  const { success, data: project, error } = await res.json();

  if (!success) {
    throw new Error(error || "Failed to fetch project.");
  }

  return project;
}

async function ProjectDetailsContent({ slug }) {
  const project = await fetchProjectDetails(slug);

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-white mb-6">{project.name}</h2>
          <img src={project.image} alt={project.name} className="w-full h-64 object-cover rounded-lg mb-6" />
          <div className="text-gray-300 text-lg mb-6" dangerouslySetInnerHTML={{ __html: project.description }} />
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span key={tag.id} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
                {tag.name}
              </span>
            ))}
          </div>
          <Link href="/" className="text-lime-500 hover:text-lime-400 font-semibold inline-block">
            ← Back to Projects
          </Link>
        </div>
        <RelatedProjectsSidebar relatedProjects={project.relatedProjects} />
      </div>
    </section>
  );
}

function Loading() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="h-12 bg-gray-800 rounded-lg w-1/2 mb-6 animate-pulse"></div>
        <div className="w-full h-64 bg-gray-800 rounded-lg mb-6 animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-800 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6">
          <div className="h-6 bg-gray-800 rounded-full w-16 animate-pulse"></div>
          <div className="h-6 bg-gray-800 rounded-full w-20 animate-pulse"></div>
          <div className="h-6 bg-gray-800 rounded-full w-24 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}

function ErrorBoundary({ children }) {
  try {
    return children;
  } catch (error) {
    return (
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <p className="text-white text-center">Something went wrong. Please try again later.</p>
          <Link href="/" className="text-lime-500 hover:text-lime-400 font-semibold inline-block mt-4">
            ← Back to Projects
          </Link>
        </div>
      </section>
    );
  }
}

export default function ProjectDetails({ params }) {
  const { slug } = params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <ProjectDetailsContent slug={slug} />
      </Suspense>
    </ErrorBoundary>
  );
}