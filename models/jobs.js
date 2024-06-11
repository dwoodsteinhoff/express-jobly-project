"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    /** Create a Job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { title, salary, equity, company_handle }
     **/

    static async create(data) {
        const result = await db.query(
              `INSERT INTO jobs (title,
                                 salary,
                                 equity,
                                 company_handle)
               VALUES ($1, $2, $3, $4)
               RETURNING id, title, salary, equity, company_handle`,
            [
              data.title,
              data.salary,
              data.equity,
              data.company_handle,
            ]);
        let job = result.rows[0];
    
        return job;
      }

    /** Find all jobs (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - minSalary
   * - hasEquity (true returns only jobs with equity > 0, other values ignored)
   * - title (will find case-insensitive, partial matches)
   *
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   * */

    static async findAll({ minSalary, hasEquity, title }) {
        let query = `SELECT jobs.id,
                            jobs.title,
                            jobs.salary,
                            jobs.equity,
                            jobs.company_handle,
                            companies.name FROM jobs
                    LEFT JOIN companies ON companies.handle = jobs.company_handle`;

        let whereExpressions = [];
        let queryValues = [];

        // For each possible search term, add to whereExpressions and
        // queryValues so we can generate the right SQL

        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (hasEquity === true) {
            whereExpressions.push(`equity > 0`);
        }

        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        // Finalize query and return results

        query += " ORDER BY title";
        console.log(query)
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;
    }

   /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
        const jobRes = await db.query(
              `SELECT id,
                      title,
                      salary,
                      equity,
                      company_handle
               FROM jobs
               WHERE id = $1`, [id]);
    
        const job = jobRes.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        const companiesRes = await db.query(
              `SELECT handle,
                      name,
                      description,
                      num_employees,
                      logo_url
               FROM companies
               WHERE handle = $1`, [job.company_handle]);
    
        delete job.company_handle;
        job.company = companiesRes.rows[0];
    
        return job;
    }

   /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    title, 
                                    salary, 
                                    equity,
                                    company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        return job;
    }
    
  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;