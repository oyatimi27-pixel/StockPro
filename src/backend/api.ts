import { Router } from "express";
import authRoutes from "./auth.js";
import { createCrudRouter } from "./crud.js";
import invoicesRoutes from "./invoices.js";
import dashboardRoutes from "./dashboard.js";
import settingsRoutes from "./settings.js";

const router = Router();

// Theme preference endpoints (unauthenticated for instant access)
router.get("/theme", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const setting = await db.get("SELECT theme FROM settings LIMIT 1");
    res.json({ theme: setting?.theme || 'light' });
  } catch (err) {
    res.json({ theme: 'light' });
  }
});

router.put("/theme", async (req, res) => {
  const { theme } = req.body;
  if (theme !== 'light' && theme !== 'dark') {
    return res.status(400).json({ error: "Thème invalide" });
  }
  try {
    const db = req.app.locals.db;
    await db.run("UPDATE settings SET theme = ? WHERE id = (SELECT id FROM settings LIMIT 1)", [theme]);
    try {
      await db.run("UPDATE users SET theme = ?", [theme]);
    } catch (e) {}
    res.json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.use("/auth", authRoutes);
router.use("/products", createCrudRouter("products"));
router.use("/clients", createCrudRouter("clients"));
router.use("/suppliers", createCrudRouter("suppliers"));
router.use("/invoices", invoicesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);

export default router;
