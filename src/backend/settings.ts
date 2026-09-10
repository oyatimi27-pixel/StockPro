import { Router } from "express";
import { authenticate } from "./middleware.js";
import multer from "multer";
import path from "path";

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get("/", async (req, res) => {
  try {
    const settings = await req.app.locals.db.get("SELECT * FROM settings LIMIT 1");
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/", async (req, res) => {
  const data = { ...req.body };
  delete data.id;
  const keys = Object.keys(data);
  const values = Object.values(data);
  if (keys.length === 0) {
    return res.json({});
  }
  const setClause = keys.map(k => `${k} = ?`).join(',');
  try {
    await req.app.locals.db.run(`UPDATE settings SET ${setClause} WHERE id = (SELECT id FROM settings LIMIT 1)`, values);
    const updated = await req.app.locals.db.get("SELECT * FROM settings LIMIT 1");
    res.json(updated);
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/logo", upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier fourni" });
  
  const base64Logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  try {
    await req.app.locals.db.run(`UPDATE settings SET logo_path = ? WHERE id = (SELECT id FROM settings LIMIT 1)`, [base64Logo]);
    res.json({ logo_path: base64Logo });
  } catch (err) {
    console.error("Logo upload error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
