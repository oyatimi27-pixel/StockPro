import { Router } from "express";
import { authenticate } from "./middleware.js";

export function createCrudRouter(tableName: string) {
  const router = Router();
  router.use(authenticate);

  router.get("/", async (req, res) => {
    try {
      const items = await req.app.locals.db.all(`SELECT * FROM ${tableName}`);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const data = { ...req.body };
      delete data.id; // Prevent updating/inserting id
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(',');
      const result = await req.app.locals.db.run(
        `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`,
        values
      );
      const newItem = await req.app.locals.db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [result.lastID]);
      res.json(newItem);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const data = { ...req.body };
      delete data.id; // Prevent updating id
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(k => `${k} = ?`).join(',');
      
      await req.app.locals.db.run(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        [...values, req.params.id]
      );
      
      const updatedItem = await req.app.locals.db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      res.json(updatedItem);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });



  return router;
}
