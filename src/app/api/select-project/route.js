import Project from "@/model/Project";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const includeRelated = searchParams.get("includeRelated") === "true";

  if (!slug) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Slug is required.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const project = await Project.findBySlug(slug, includeRelated);

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project not found.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = {
      success: true,
      data: includeRelated ? project : { ...project, relatedProjects: undefined },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching project by slug:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch project.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}