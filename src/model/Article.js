import pool from "../lib/db";
import xss from "xss";
import slugify from "slugify";

class Article {
  /**
   * Get active articles with pagination
   * @param {number} offset - Pagination offset
   * @param {number} limit - Number of articles per page
   * @returns {Promise<Object>} Object containing articles and total count
   */
  static async activeArticle(offset = 0, limit = 9) {
    try {
      if (!Number.isInteger(Number(offset)) || !Number.isInteger(Number(limit))) {
        throw new Error("Invalid pagination parameters");
      }

      const [articlesRows] = await pool.query(
        `SELECT 
          a.id AS article_id,
          a.title AS article_title,
          a.summary AS article_summary,
          a.image AS article_image,
          a.slug AS article_slug
         FROM articles a
         WHERE a.status = 'active'
         ORDER BY a.id
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [totalRows] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM articles a
         WHERE a.status = 'active'`
      );
      const totalArticles = totalRows[0].total;

      const articleIds = articlesRows.map((article) => article.article_id);
      const [tagsRows] = await pool.query(
        `SELECT 
          a.id AS article_id,
          t.id AS tag_id,
          t.name AS tag_name,
          t.slug AS tag_slug
         FROM tags t
         JOIN article_tags at ON t.id = at.fk_tag_id
         JOIN articles a ON a.id = at.fk_article_id
         WHERE a.id IN (?)`,
        [articleIds]
      );

      const articlesMap = new Map();
      articlesRows.forEach((article) => {
        articlesMap.set(article.article_id, {
          ...this.sanitizeArticle(article),
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

      return {
        articles: Array.from(articlesMap.values()),
        totalArticles,
      };
    } catch (error) {
      console.error("Article.activeArticle error:", {
        offset,
        limit,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to fetch active articles");
    }
  }

  /**
   * Find article by slug
   * @param {string} slug - Article slug
   * @param {boolean} includeRelated - Whether to include related articles
   * @returns {Promise<Object>} Article details with tags and optional related articles
   */
  static async findBySlug(slug, includeRelated = false) {
    try {
      if (!slug?.trim()) {
        throw new Error("Slug is required");
      }

      const cleanSlug = xss(slug.trim());

      const [articleRows] = await pool.query(
        `SELECT id, title, slug, image, summary, description, status, 
                created_at, updated_at, created_by, updated_by, deleted_at
         FROM articles 
         WHERE slug = ?
         LIMIT 1`,
        [cleanSlug]
      );

      if (articleRows.length === 0) {
        throw new Error("Article not found");
      }

      const article = articleRows[0];

      const [tagRows] = await pool.query(
        `SELECT t.id, t.name, t.slug 
         FROM tags t
         JOIN article_tags AS at ON t.id = at.fk_tag_id
         WHERE at.fk_article_id = ?`,
        [article.id]
      );

      let relatedArticles = [];
      if (includeRelated) {
        const [relatedArticleRows] = await pool.query(
          `SELECT a.id, a.title, a.summary, a.slug, a.image
           FROM articles a
           JOIN article_tags at ON a.id = at.fk_article_id
           WHERE at.fk_tag_id IN (
             SELECT fk_tag_id FROM article_tags WHERE fk_article_id = ?
           ) AND a.id != ?
           GROUP BY a.id
           LIMIT 5`,
          [article.id, article.id]
        );

        for (const relatedArticle of relatedArticleRows) {
          const [tags] = await pool.query(
            `SELECT t.id, t.name 
             FROM tags t
             JOIN article_tags at ON t.id = at.fk_tag_id
             WHERE at.fk_article_id = ?`,
            [relatedArticle.id]
          );
          relatedArticle.tags = tags.map((tag) => ({
            id: tag.id,
            name: xss(tag.name),
          }));
        }

        relatedArticles = relatedArticleRows;
      }

      return {
        ...this.sanitize(article),
        tags: tagRows.map((tag) => ({
          id: tag.id,
          name: xss(tag.name),
          slug: tag.slug,
        })),
        relatedArticles,
      };
    } catch (error) {
      console.error("Article.findBySlug error:", {
        slug,
        includeRelated,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new article
   * @param {Object} articleData - Article data
   * @param {string} articleData.title - Article title
   * @param {string} articleData.summary - Article summary
   * @param {string} articleData.image - Article image URL
   * @returns {Promise<number>} ID of the created article
   */
  static async create(articleData) {
    let connection;
    try {
      connection = await pool.getConnection();

      const cleanData = this.sanitizeArticleData(articleData);
      const slug = slugify(cleanData.title, { lower: true, strict: true });

      const [result] = await connection.query(
        `INSERT INTO articles (title, summary, image, slug) 
         VALUES (?, ?, ?, ?)`,
        [cleanData.title, cleanData.summary, cleanData.image, slug]
      );

      return result.insertId;
    } catch (error) {
      console.error("Article.create error:", {
        articleData,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || "Failed to create article");
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Update an article
   * @param {number} id - Article ID
   * @param {Object} articleData - Article data
   * @returns {Promise<void>}
   */
  static async update(id, articleData) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid article ID format");
      }

      const cleanData = this.sanitizeArticleData(articleData);
      const slug = slugify(cleanData.title, { lower: true, strict: true });

      const [result] = await connection.query(
        `UPDATE articles 
         SET title = ?, summary = ?, image = ?, slug = ? 
         WHERE id = ?`,
        [cleanData.title, cleanData.summary, cleanData.image, slug, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Article not found");
      }
    } catch (error) {
      console.error("Article.update error:", {
        id,
        articleData,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Delete an article
   * @param {number} id - Article ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid article ID format");
      }

      const [result] = await connection.query(`DELETE FROM articles WHERE id = ?`, [id]);

      if (result.affectedRows === 0) {
        throw new Error("Article not found");
      }
    } catch (error) {
      console.error("Article.delete error:", {
        id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Sanitize article data
   * @param {Object} data - Article data
   * @returns {Object} Sanitized article data
   * @throws {Error} If data is invalid
   */
  static sanitizeArticleData(data) {
    if (!data?.title?.trim()) {
      throw new Error("Title is required");
    }

    if (!data?.summary?.trim()) {
      throw new Error("Summary is required");
    }

    return {
      title: xss(data.title.trim()),
      summary: xss(data.summary.trim()),
      image: data.image ? xss(data.image.trim()) : null,
    };
  }

  /**
   * Sanitize article for output
   * @param {Object} article - Article data
   * @returns {Object} Sanitized article
   */
  static sanitize(article) {
    return {
      id: article.id,
      title: xss(article.title),
      slug: article.slug,
      image: article.image,
      summary: xss(article.summary),
      description: article.description ? xss(article.description) : null,
      status: article.status,
      created_at: article.created_at,
      updated_at: article.updated_at,
    };
  }

  /**
   * Sanitize article list item for output
   * @param {Object} article - Article data
   * @returns {Object} Sanitized article
   */
  static sanitizeArticle(article) {
    return {
      article_id: article.article_id,
      article_title: xss(article.article_title),
      article_summary: xss(article.article_summary),
      article_image: article.article_image,
      article_slug: article.article_slug,
    };
  }
}

export default Article;