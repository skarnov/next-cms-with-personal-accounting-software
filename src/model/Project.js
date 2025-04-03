import pool from "../lib/db";
import xss from "xss";
import slugify from "slugify";

class Project {
  /**
   * Get active projects with pagination
   * @param {number} offset - Pagination offset
   * @param {number} limit - Number of projects per page
   * @returns {Promise<Object>} Object containing projects and total count
   */
  static async activeProject(offset = 0, limit = 9) {
    try {
      if (!Number.isInteger(Number(offset))) {
        throw new Error("Invalid offset parameter");
      }

      if (!Number.isInteger(Number(limit))) {
        throw new Error("Invalid limit parameter");
      }

      const [projectsRows] = await pool.query(
        `SELECT 
          p.id AS project_id,
          p.name AS project_name,
          p.summary AS project_summary,
          p.image AS project_image,
          p.slug AS project_slug
         FROM projects p
         WHERE p.status = 'active'
         ORDER BY p.id
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [totalRows] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM projects p
         WHERE p.status = 'active'`
      );
      const totalProjects = totalRows[0].total;

      const projectIds = projectsRows.map((project) => project.project_id);
      const [tagsRows] = await pool.query(
        `SELECT 
          p.id AS project_id,
          t.id AS tag_id,
          t.name AS tag_name,
          t.slug AS tag_slug
         FROM tags t
         JOIN project_tags pt ON t.id = pt.fk_tag_id
         JOIN projects p ON p.id = pt.fk_project_id
         WHERE p.id IN (?)`,
        [projectIds]
      );

      const projectsMap = new Map();
      projectsRows.forEach((project) => {
        projectsMap.set(project.project_id, {
          ...this.sanitizeProject(project),
          tags: [],
        });
      });

      tagsRows.forEach((tag) => {
        if (projectsMap.has(tag.project_id)) {
          projectsMap.get(tag.project_id).tags.push({
            id: tag.tag_id,
            name: xss(tag.tag_name),
            slug: tag.tag_slug,
          });
        }
      });

      return {
        projects: Array.from(projectsMap.values()),
        totalProjects,
      };
    } catch (error) {
      console.error("Project.activeProject error:", {
        offset,
        limit,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to fetch active projects");
    }
  }

  /**
   * Find project by slug
   * @param {string} slug - Project slug
   * @param {boolean} includeRelated - Whether to include related projects
   * @returns {Promise<Object>} Project details with tags and optional related projects
   */
  static async findBySlug(slug, includeRelated = false) {
    try {
      if (!slug?.trim()) {
        throw new Error("Slug is required");
      }

      const cleanSlug = xss(slug.trim());

      const [projectRows] = await pool.query(
        `SELECT id, name, slug, image, summary, description, status, 
                created_at, updated_at, created_by, updated_by, deleted_at
         FROM projects 
         WHERE slug = ?
         LIMIT 1`,
        [cleanSlug]
      );

      if (projectRows.length === 0) {
        throw new Error("Project not found");
      }

      const project = projectRows[0];

      const [tagRows] = await pool.query(
        `SELECT t.id, t.name, t.slug 
         FROM tags t
         JOIN project_tags pt ON t.id = pt.fk_tag_id
         WHERE pt.fk_project_id = ?`,
        [project.id]
      );

      let relatedProjects = [];
      if (includeRelated) {
        const [relatedProjectRows] = await pool.query(
          `SELECT p.id, p.name, p.summary, p.slug, p.image
           FROM projects p
           JOIN project_tags pt ON p.id = pt.fk_project_id
           WHERE pt.fk_tag_id IN (
             SELECT fk_tag_id FROM project_tags WHERE fk_project_id = ?
           ) AND p.id != ?
           GROUP BY p.id
           LIMIT 5`,
          [project.id, project.id]
        );

        for (const relatedProject of relatedProjectRows) {
          const [tags] = await pool.query(
            `SELECT t.id, t.name 
             FROM tags t
             JOIN project_tags pt ON t.id = pt.fk_tag_id
             WHERE pt.fk_project_id = ?`,
            [relatedProject.id]
          );
          relatedProject.tags = tags.map((tag) => ({
            id: tag.id,
            name: xss(tag.name),
          }));
        }

        relatedProjects = relatedProjectRows;
      }

      return {
        ...this.sanitize(project),
        tags: tagRows.map((tag) => ({
          id: tag.id,
          name: xss(tag.name),
          slug: tag.slug,
        })),
        relatedProjects,
      };
    } catch (error) {
      console.error("Project.findBySlug error:", {
        slug,
        includeRelated,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectData.name - Project name
   * @param {string} projectData.email - Project email
   * @returns {Promise<number>} ID of the created project
   */
  static async create(projectData) {
    let connection;
    try {
      connection = await pool.getConnection();

      const cleanData = this.sanitizeProjectData(projectData);
      const slug = slugify(cleanData.name, { lower: true, strict: true });

      const [result] = await connection.query(
        `INSERT INTO projects (name, email, slug) 
         VALUES (?, ?, ?)`,
        [cleanData.name, cleanData.email, slug]
      );

      return result.insertId;
    } catch (error) {
      console.error("Project.create error:", {
        projectData,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(error.message || "Failed to create project");
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Update a project
   * @param {number} id - Project ID
   * @param {Object} projectData - Project data
   * @returns {Promise<void>}
   */
  static async update(id, projectData) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid project ID format");
      }

      const cleanData = this.sanitizeProjectData(projectData);
      const slug = slugify(cleanData.name, { lower: true, strict: true });

      const [result] = await connection.query(
        `UPDATE projects 
         SET name = ?, email = ?, slug = ? 
         WHERE id = ?`,
        [cleanData.name, cleanData.email, slug, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Project not found");
      }
    } catch (error) {
      console.error("Project.update error:", {
        id,
        projectData,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Delete a project
   * @param {number} id - Project ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      if (!Number.isInteger(Number(id))) {
        throw new Error("Invalid project ID format");
      }

      const [result] = await connection.query(`DELETE FROM projects WHERE id = ?`, [id]);

      if (result.affectedRows === 0) {
        throw new Error("Project not found");
      }
    } catch (error) {
      console.error("Project.delete error:", {
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
   * Sanitize project data
   * @param {Object} data - Project data
   * @returns {Object} Sanitized project data
   * @throws {Error} If data is invalid
   */
  static sanitizeProjectData(data) {
    if (!data?.name?.trim()) {
      throw new Error("Name is required");
    }

    if (!data?.email?.trim() || !data.email.includes("@")) {
      throw new Error("Valid email is required");
    }

    return {
      name: xss(data.name.trim()),
      email: xss(data.email.trim()),
    };
  }

  /**
   * Sanitize project for output
   * @param {Object} project - Project data
   * @returns {Object} Sanitized project
   */
  static sanitize(project) {
    return {
      id: project.id,
      name: xss(project.name),
      slug: project.slug,
      email: project.email,
      image: project.image,
      summary: project.summary ? xss(project.summary) : null,
      description: project.description ? xss(project.description) : null,
      status: project.status,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }

  /**
   * Sanitize project list item for output
   * @param {Object} project - Project data
   * @returns {Object} Sanitized project
   */
  static sanitizeProject(project) {
    return {
      project_id: project.project_id,
      project_name: xss(project.project_name),
      project_summary: project.project_summary ? xss(project.project_summary) : null,
      project_image: project.project_image,
      project_slug: project.project_slug,
    };
  }
}

export default Project;