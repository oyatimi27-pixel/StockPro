import { Router } from "express";
import { authenticate } from "./middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const productsCount = await db.get("SELECT COUNT(*) as count FROM products");
    const clientsCount = await db.get("SELECT COUNT(*) as count FROM clients");
    const suppliersCount = await db.get("SELECT COUNT(*) as count FROM suppliers");
    const invoicesCount = await db.get("SELECT COUNT(*) as count FROM invoices");
    
    // Revenue calculations
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const dailyRevenue = await db.get("SELECT SUM(total_ttc) as total FROM invoices WHERE date LIKE ?", [`${today}%`]);
    const monthlyRevenue = await db.get("SELECT SUM(total_ttc) as total FROM invoices WHERE date >= ?", [firstDayOfMonth]);
    
    // Low stock
    const lowStockProducts = await db.all("SELECT * FROM products WHERE stock_quantity <= min_stock LIMIT 10");
    
    // Sales chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const rev = await db.get("SELECT SUM(total_ttc) as total FROM invoices WHERE date LIKE ?", [`${dateStr}%`]);
      chartData.push({
        name: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        date: dateStr,
        Ventes: rev.total || 0
      });
    }
    
    res.json({
      counts: {
        products: productsCount.count,
        clients: clientsCount.count,
        suppliers: suppliersCount.count,
        invoices: invoicesCount.count
      },
      revenue: {
        daily: dailyRevenue.total || 0,
        monthly: monthlyRevenue.total || 0
      },
      lowStock: lowStockProducts,
      chartData
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
