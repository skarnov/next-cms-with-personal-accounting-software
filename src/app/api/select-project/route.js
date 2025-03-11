import Project from "@/model/Project";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const includeRelated = searchParams.get("includeRelated") === "true"; // Optional query parameter

  // Validate the slug
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
    // Fetch the project by slug
    const project = await Project.findBySlug(slug);

    // If no project is found, return a 404 error
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

    // Conditionally include `relatedProjects`
    const response = {
      success: true,
      data: includeRelated ? project : { ...project, relatedProjects: undefined },
    };

    // Return the project data as a JSON response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching project by slug:", error);

    // Return a 500 error for server-side issues
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