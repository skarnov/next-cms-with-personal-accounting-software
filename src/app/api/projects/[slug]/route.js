import Project from "@/model/Project";

export async function GET(request, { params }) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const includeRelated = searchParams.get("includeRelated") === "true";

  try {
    if (!slug) {
      return Response.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    const project = await Project.findBySlug(slug, includeRelated);

    if (!project) {
      return Response.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const responseData = {
      ...project,
      created_at: project.created_at?.toISOString(),
      updated_at: project.updated_at?.toISOString(),
      ...(includeRelated
        ? {
            relatedProjects: project.relatedProjects?.map((p) => ({
              ...p,
              created_at: p.created_at?.toISOString(),
              updated_at: p.updated_at?.toISOString(),
            })),
          }
        : {}),
    };

    return Response.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching project:", {
      slug,
      error: error.message,
      stack: error.stack,
    });
    return Response.json({ success: false, error: "Failed to fetch project" }, { status: 500 });
  }
}