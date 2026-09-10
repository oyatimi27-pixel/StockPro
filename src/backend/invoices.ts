import { Router } from "express";
import { authenticate } from "./middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const invoices = await req.app.locals.db.all(`
      SELECT invoices.*, clients.name as client_name 
      FROM invoices 
      JOIN clients ON invoices.client_id = clients.id
      ORDER BY invoices.id DESC
    `);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Auto-generate invoice number
router.get("/util/next-number", async (req, res) => {
  try {
    const row = await req.app.locals.db.get("SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1");
    const year = new Date().getFullYear();
    let nextNum = 1;
    if (row && row.invoice_number.startsWith(`FA${year}`)) {
      const lastNum = parseInt(row.invoice_number.substring(6));
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    res.json({ next: `FA${year}${nextNum.toString().padStart(5, '0')}` });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const invoice = await req.app.locals.db.get(`
      SELECT invoices.*, clients.name as client_name, clients.address as client_address,
      clients.tax_id as client_tax_id, clients.phone as client_phone
      FROM invoices 
      JOIN clients ON invoices.client_id = clients.id
      WHERE invoices.id = ?
    `, [req.params.id]);
    
    if (!invoice) return res.status(404).json({ error: "Introuvable" });
    
    const items = await req.app.locals.db.all(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [req.params.id]);
    invoice.items = items;
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", async (req, res) => {
  const { invoice_number, date, time, client_id, total_ht, total_tva, fiscal_stamp, total_ttc, items, global_discount } = req.body;
  const db = req.app.locals.db;
  try {
    await db.run('BEGIN TRANSACTION');
    
    const result = await db.run(
      `INSERT INTO invoices (invoice_number, date, time, client_id, total_ht, total_tva, fiscal_stamp, total_ttc, global_discount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_number, date, time || '', client_id, total_ht, total_tva, fiscal_stamp, total_ttc, global_discount || 0]
    );
    
    const invoiceId = result.lastID;
    
    for (const item of items) {
      await db.run(
        `INSERT INTO invoice_items (invoice_id, product_id, designation, quantity, unit_price_ht, tva, total_ht, total_ttc, discount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.product_id, item.designation, item.quantity, item.unit_price_ht, item.tva, item.total_ht, item.total_ttc, item.discount || 0]
      );
      
      // Update stock
      await db.run(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [item.quantity, item.product_id]);
    }
    
    await db.run('COMMIT');
    res.json({ id: invoiceId });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: "Erreur lors de la création de la facture" });
  }
});

router.put("/:id", async (req, res) => {
  const { invoice_number, date, time, client_id, total_ht, total_tva, fiscal_stamp, total_ttc, items, global_discount } = req.body;
  const db = req.app.locals.db;
  try {
    await db.run('BEGIN TRANSACTION');
    
    // 1. Revert old stock
    const oldItems = await db.all(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [req.params.id]);
    for (const item of oldItems) {
      await db.run(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`, [item.quantity, item.product_id]);
    }
    
    // 2. Delete old items
    await db.run(`DELETE FROM invoice_items WHERE invoice_id = ?`, [req.params.id]);
    
    // 3. Update invoice
    await db.run(
      `UPDATE invoices SET invoice_number = ?, date = ?, time = ?, client_id = ?, total_ht = ?, total_tva = ?, fiscal_stamp = ?, total_ttc = ?, global_discount = ? WHERE id = ?`,
      [invoice_number, date, time || '', client_id, total_ht, total_tva, fiscal_stamp, total_ttc, global_discount || 0, req.params.id]
    );
    
    // 4. Insert new items and deduct stock
    for (const item of items) {
      await db.run(
        `INSERT INTO invoice_items (invoice_id, product_id, designation, quantity, unit_price_ht, tva, total_ht, total_ttc, discount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, item.product_id, item.designation, item.quantity, item.unit_price_ht, item.tva, item.total_ht, item.total_ttc, item.discount || 0]
      );
      await db.run(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [item.quantity, item.product_id]);
    }
    
    await db.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: "Erreur lors de la modification de la facture" });
  }
});

router.put("/:id/cancel", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const invoice = await db.get(`SELECT * FROM invoices WHERE id = ?`, [req.params.id]);
    if (!invoice) {
      return res.status(404).json({ error: "Facture introuvable" });
    }
    if (invoice.status === 'ANNULÉE') {
      return res.status(400).json({ error: "Facture déjà annulée" });
    }

    await db.run('BEGIN TRANSACTION');
    const items = await db.all(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [req.params.id]);
    
    for (const item of items) {
      if (item.product_id) {
        await db.run(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`, [item.quantity, item.product_id]);
      }
    }
    console.log("Stock restored");
    
    await db.run(`UPDATE invoices SET status = 'ANNULÉE' WHERE id = ?`, [req.params.id]);
    console.log("SQLite update success");
    console.log("Invoice moved to Archives");
    
    await db.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.run('ROLLBACK').catch(() => {});
    console.error("Cancel invoice error:", err);
    res.status(500).json({ error: "Erreur lors de l'annulation de la facture" });
  }
});

router.put("/:id/reactivate", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const invoice = await db.get(`SELECT * FROM invoices WHERE id = ?`, [req.params.id]);
    if (!invoice) {
      return res.status(404).json({ error: "Facture introuvable" });
    }
    if (invoice.status !== 'ANNULÉE') {
      return res.status(400).json({ error: "Facture n'est pas annulée" });
    }

    await db.run('BEGIN TRANSACTION');
    const items = await db.all(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [req.params.id]);
    
    for (const item of items) {
      if (item.product_id) {
        await db.run(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [item.quantity, item.product_id]);
      }
    }
    
    await db.run(`UPDATE invoices SET status = 'VALIDÉE' WHERE id = ?`, [req.params.id]);
    
    await db.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.run('ROLLBACK').catch(() => {});
    console.error("Reactivate invoice error:", err);
    res.status(500).json({ error: "Erreur lors de la réactivation de la facture" });
  }
});

export default router;
