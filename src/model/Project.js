import pool from "../lib/db";
import xss from "xss";
import slugify from "slugify";

class Project {
  static async activeProject(offset = 0, limit = 9) {
    try {
      // Fetch projects with pagination first
      const query = `
        SELECT 
          p.id AS project_id,
          p.name AS project_name,
          p.summary AS project_summary,
          p.image AS project_image,
          p.slug AS project_slug
        FROM 
          projects p
        WHERE 
          p.status = 'active'
        ORDER BY 
          p.id
        LIMIT ? OFFSET ?;
      `;
      const [projectsRows] = await pool.query(query, [limit, offset]);

      // Fetch total number of active projects
      const countQuery = `
        SELECT 
          COUNT(*) AS total
        FROM 
          projects p
        WHERE 
          p.status = 'active';
      `;
      const [totalRows] = await pool.query(countQuery);
      const totalProjects = totalRows[0].total;

      // Prepare a map for projects to handle tags later
      const projectsMap = new Map();

      // Fetch tags for those projects
      const tagsQuery = `
        SELECT 
          p.id AS project_id,
          t.id AS tag_id,
          t.name AS tag_name,
          t.slug AS tag_slug
        FROM 
          tags t
        JOIN 
          project_tags pt ON t.id = pt.fk_tag_id
        JOIN 
          projects p ON p.id = pt.fk_project_id
        WHERE 
          p.id IN (?);
      `;
      const projectIds = projectsRows.map((project) => project.project_id);
      const [tagsRows] = await pool.query(tagsQuery, [projectIds]);

      // Populate projects with tags
      projectsRows.forEach((project) => {
        projectsMap.set(project.project_id, {
          ...project,
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

      // Convert the map to an array of projects
      const projects = Array.from(projectsMap.values()).map((project) => ({
        ...project,
      }));

      // Return projects and total count
      return {
        projects,
        totalProjects,
      };
    } catch (error) {
      console.error("Error fetching active projects:", error);
      throw new Error("Failed to fetch active projects.");
    }
  }

  static async findBySlug(slug, includeRelated = false) {
    try {
      // Fetch Project Details
      const [projectRows] = await pool.query(
        `
        SELECT id, name, slug, image, summary, description, status, 
               created_at, updated_at, created_by, updated_by, deleted_at
        FROM projects 
        WHERE slug = ?
        LIMIT 1
        `,
        [slug]
      );

      // If no project is found, throw an error
      if (projectRows.length === 0) {
        throw new Error("Project not found.");
      }

      const project = projectRows[0];

      // Fetch Tags For The Project
      const [tagRows] = await pool.query(
        `
        SELECT t.id, t.name, t.slug 
        FROM tags t
        JOIN project_tags pt ON t.id = pt.fk_tag_id
        WHERE pt.fk_project_id = ?
        `,
        [project.id]
      );

      // Fetch Related Projects (if requested)
      let relatedProjects = [];
      if (includeRelated) {
        const [relatedProjectRows] = await pool.query(
          `
          SELECT p.id, p.name, p.summary, p.slug, p.image
          FROM projects p
          JOIN project_tags pt ON p.id = pt.fk_project_id
          WHERE pt.fk_tag_id IN (
            SELECT fk_tag_id FROM project_tags WHERE fk_project_id = ?
          ) AND p.id != ?
          GROUP BY p.id
          LIMIT 5
          `,
          [project.id, project.id]
        );

        // Fetch Tags For Related Projects
        for (const relatedProject of relatedProjectRows) {
          const [tags] = await pool.query(
            `
            SELECT t.id, t.name 
            FROM tags t
            JOIN project_tags pt ON t.id = pt.fk_tag_id
            WHERE pt.fk_project_id = ?
            `,
            [relatedProject.id]
          );
          relatedProject.tags = tags.map((tag) => ({
            id: tag.id,
            name: xss(tag.name),
          }));
        }

        relatedProjects = relatedProjectRows;
      }

      // Sanitize and return the project data
      const sanitizedProject = {
        ...project,
        name: xss(project.name),
        summary: xss(project.summary),
        description: xss(project.description),
        tags: tagRows.map((tag) => ({
          id: tag.id,
          name: xss(tag.name),
          slug: tag.slug,
        })),
        relatedProjects,
      };

      return sanitizedProject;
    } catch (error) {
      console.error("Error fetching project by slug:", error);
      throw new Error("Failed to fetch project.");
    }
  }

  static async create(projectData) {
    const { name, email } = projectData;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("Name is required and must be a non-empty string.");
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error("Email is required and must be a valid email address.");
    }

    // Sanitize inputs
    const sanitizedName = xss(name);
    const sanitizedEmail = xss(email);

    // Generate a slug
    const slug = slugify(sanitizedName, { lower: true, strict: true });

    try {
      const [result] = await pool.query("INSERT INTO projects (name, email, slug) VALUES (?, ?, ?)", [sanitizedName, sanitizedEmail, slug]);
      return result.insertId;
    } catch (error) {
      console.error("Error creating project:", error);
      throw new Error("Failed to create project.");
    }
  }
}

export default Project;