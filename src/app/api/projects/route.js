import Project from "@/model/Project";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset")) || 0;
    const limit = parseInt(searchParams.get("limit")) || 9;

    const { projects, totalProjects } = await Project.activeProject(offset, limit);
    return Response.json({ projects, totalProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, description } = await request.json();

    if (!name || !description) {
      return Response.json({ error: "Name and description are required" }, { status: 400 });
    }

    const projectId = await Project.create({ name, description });
    return Response.json({ id: projectId, name, description }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return Response.json({ error: "Failed to create project" }, { status: 500 });
  }
}
