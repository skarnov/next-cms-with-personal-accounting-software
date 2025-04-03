import Article from "@/model/Article";

export async function GET(request, { params }) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const includeRelated = searchParams.get("includeRelated") === "true";

  try {
    const article = await Article.findBySlug(slug, includeRelated);

    if (!article) {
      return Response.json({ success: false, error: "Article not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: {
        ...article,
        created_at: article.created_at?.toISOString(),
        updated_at: article.updated_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching article:", {
      slug,
      error: error.message,
      stack: error.stack,
    });
    return Response.json({ success: false, error: "Failed to fetch article" }, { status: 500 });
  }
}