import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-erp-key';

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = req.app.locals.db;
  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, theme: user.theme }, SECRET_KEY, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, theme: user.theme } });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/theme", async (req, res) => {
  const { userId, theme } = req.body;
  const db = req.app.locals.db;
  try {
    await db.run("UPDATE users SET theme = ? WHERE id = ?", [theme, userId]);
    res.json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
