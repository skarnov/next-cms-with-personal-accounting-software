import Article from "@/model/Article";

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
    // Fetch the article by slug
    const article = await Article.findBySlug(slug, includeRelated);

    // If no article is found, return a 404 error
    if (!article) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Article not found.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the article data as a JSON response
    return new Response(
      JSON.stringify({
        success: true,
        data: article,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching article by slug:", error);

    // Return a 500 error for server-side issues
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch article.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}