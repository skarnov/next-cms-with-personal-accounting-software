import pool from "../lib/db";
import xss from "xss";
import slugify from "slugify";

class Article {
  static async activeArticle(offset = 0, limit = 9) {
    try {
      // Fetch articles with pagination first
      const query = `
        SELECT 
          a.id AS article_id,
          a.title AS article_title,
          a.summary AS article_summary,
          a.image AS article_image,
          a.slug AS article_slug
        FROM 
          articles a
        WHERE 
          a.status = 'active'
        ORDER BY 
          a.id
        LIMIT ? OFFSET ?;
      `;
      const [articlesRows] = await pool.query(query, [limit, offset]);

      // Fetch total number of active articles
      const countQuery = `
        SELECT 
          COUNT(*) AS total
        FROM 
          articles a
        WHERE 
          a.status = 'active';
      `;
      const [totalRows] = await pool.query(countQuery);
      const totalArticles = totalRows[0].total;

      // Prepare a map for articles to handle tags later
      const articlesMap = new Map();

      // Fetch tags for those articles
      const tagsQuery = `
        SELECT 
          a.id AS article_id,
          t.id AS tag_id,
          t.name AS tag_name,
          t.slug AS tag_slug
        FROM 
          tags t
        JOIN 
          article_tags at ON t.id = at.fk_tag_id
        JOIN 
          articles a ON a.id = at.fk_article_id
        WHERE 
          a.id IN (?);
      `;
      const articleIds = articlesRows.map((article) => article.article_id);
      const [tagsRows] = await pool.query(tagsQuery, [articleIds]);

      // Populate articles with tags
      articlesRows.forEach((article) => {
        articlesMap.set(article.article_id, {
          ...article,
          tags: [],
        });
      });

      tagsRows.forEach((tag) => {
        if (articlesMap.has(tag.article_id)) {
          articlesMap.get(tag.article_id).tags.push({
            id: tag.tag_id,
            name: xss(tag.tag_name),
            slug: tag.tag_slug,
          });
        }
      });

      // Convert the map to an array of articles
      const articles = Array.from(articlesMap.values()).map((article) => ({
        ...article,
        article_title: xss(article.article_title),
        article_summary: xss(article.article_summary),
      }));

      // Return articles and total count
      return {
        articles,
        totalArticles,
      };
    } catch (error) {
      console.error("Error fetching active articles:", error);
      throw new Error("Failed to fetch active articles.");
    }
  }

  static async findBySlug(slug, includeRelated = false) {
    try {
      // Fetch Article Details
      const [articleRows] = await pool.query(
        `
        SELECT id, title, slug, image, summary, description, status, 
               created_at, updated_at, created_by, updated_by, deleted_at
        FROM articles 
        WHERE slug = ?
        LIMIT 1
        `,
        [slug]
      );

      // If no article is found, throw an error
      if (articleRows.length === 0) {
        throw new Error("Article not found.");
      }

      const article = articleRows[0];

      // Fetch Tags For The Article
      const [tagRows] = await pool.query(
        `
        SELECT t.id, t.name, t.slug 
        FROM tags t
        JOIN article_tags AS at ON t.id = at.fk_tag_id
        WHERE at.fk_article_id = ?
        `,
        [article.id]
      );

      // Fetch Related Articles (if requested)
      let relatedArticles = [];
      if (includeRelated) {
        const [relatedArticleRows] = await pool.query(
          `
          SELECT a.id, a.title, a.summary, a.slug, a.image
          FROM articles a
          JOIN article_tags at ON a.id = at.fk_article_id
          WHERE at.fk_tag_id IN (
            SELECT fk_tag_id FROM article_tags WHERE fk_article_id = ?
          ) AND a.id != ?
          GROUP BY a.id
          LIMIT 5
          `,
          [article.id, article.id]
        );

        // Fetch Tags For Related Articles
        for (const relatedArticle of relatedArticleRows) {
          const [tags] = await pool.query(
            `
            SELECT t.id, t.name 
            FROM tags t
            JOIN article_tags at ON t.id = at.fk_tag_id
            WHERE at.fk_article_id = ?
            `,
            [relatedArticle.id]
          );
          relatedArticle.tags = tags.map((tag) => ({
            id: tag.id,
            name: xss(tag.name),
          }));
        }

        relatedArticles = relatedArticleRows;
      }

      // Sanitize and return the article data
      const sanitizedArticle = {
        ...article,
        title: xss(article.title),
        summary: xss(article.summary),
        description: xss(article.description), // Use `description` instead of `content`
        tags: tagRows.map((tag) => ({
          id: tag.id,
          name: xss(tag.name),
          slug: tag.slug,
        })),
        relatedArticles,
      };

      return sanitizedArticle;
    } catch (error) {
      console.error("Error fetching article by slug:", error);
      throw new Error("Failed to fetch article.");
    }
  }

  static async create(articleData) {
    const { title, summary, image } = articleData;

    if (!title || typeof title !== "string" || title.trim() === "") {
      throw new Error("Title is required and must be a non-empty string.");
    }

    if (!summary || typeof summary !== "string" || summary.trim() === "") {
      throw new Error("Summary is required and must be a non-empty string.");
    }

    const sanitizedTitle = xss(title);
    const sanitizedSummary = xss(summary);
    const sanitizedImage = xss(image);

    const slug = slugify(sanitizedTitle, { lower: true, strict: true });

    try {
      const [result] = await pool.query("INSERT INTO articles (title, summary, image, slug) VALUES (?, ?, ?, ?)", [sanitizedTitle, sanitizedSummary, sanitizedImage, slug]);
      return result.insertId;
    } catch (error) {
      console.error("Error creating article:", error);
      throw new Error("Failed to create article.");
    }
  }

  static async update(id, articleData) {
    const { title, summary, image } = articleData;

    // Validate inputs
    if (!title || typeof title !== "string" || title.trim() === "") {
      throw new Error("Title is required and must be a non-empty string.");
    }

    if (!summary || typeof summary !== "string" || summary.trim() === "") {
      throw new Error("Summary is required and must be a non-empty string.");
    }

    // Sanitize inputs
    const sanitizedTitle = xss(title);
    const sanitizedSummary = xss(summary);
    const sanitizedImage = xss(image);

    // Generate a new slug if the title has changed
    const slug = slugify(sanitizedTitle, { lower: true, strict: true });

    try {
      await pool.query("UPDATE articles SET title = ?, summary = ?, image = ?, slug = ? WHERE id = ?", [sanitizedTitle, sanitizedSummary, sanitizedImage, slug, id]);
    } catch (error) {
      console.error("Error updating article:", error);
      throw new Error("Failed to update article.");
    }
  }

  static async delete(id) {
    try {
      await pool.query("DELETE FROM articles WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting article:", error);
      throw new Error("Failed to delete article.");
    }
  }
}

export default Article;