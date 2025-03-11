import Article from "@/model/Article";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset")) || 0;
    const limit = parseInt(searchParams.get("limit")) || 9;

    // Fetch articles with pagination
    const { articles, totalArticles } = await Article.activeArticle(offset, limit);
    return Response.json({ articles, totalArticles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return Response.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, description } = await request.json();

    if (!name || !description) {
      return Response.json({ error: "Name and description are required" }, { status: 400 });
    }

    const articleId = await Article.create({ name, description });
    return Response.json({ id: articleId, name, description }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return Response.json({ error: "Failed to create article" }, { status: 500 });
  }
}