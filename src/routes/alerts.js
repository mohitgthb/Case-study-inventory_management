const express = require("express");
const router = express.Router();
const pool = require("../db");
const { getAvgDailySales, getThreshold } = require("./utils/sales");

router.get("/api/companies/:companyId/alerts/low-stock", async (req, res) => {
  const { companyId } = req.params;

  const result = await pool.query(
    `
    SELECT 
      i.quantity,
      p.id AS product_id,
      p.name AS product_name,
      p.sku,
      p.product_type,
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.contact_email
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    JOIN warehouses w ON w.id = i.warehouse_id
    LEFT JOIN product_suppliers ps ON ps.product_id = p.id
    LEFT JOIN suppliers s ON s.id = ps.supplier_id
    WHERE w.company_id = $1
    `,
    [companyId]
  );

  const alerts = [];

  for (const row of result.rows) {
    const avgDailySales = await getAvgDailySales(row.product_id);
    if (avgDailySales === 0) continue;

    const threshold = getThreshold(row.product_type);

    if (row.quantity < threshold) {
      alerts.push({
        product_id: row.product_id,
        product_name: row.product_name,
        sku: row.sku,
        warehouse_id: row.warehouse_id,
        warehouse_name: row.warehouse_name,
        current_stock: row.quantity,
        threshold,
        days_until_stockout: Math.floor(row.quantity / avgDailySales),
        supplier: row.supplier_id
          ? {
              id: row.supplier_id,
              name: row.supplier_name,
              contact_email: row.contact_email
            }
          : null
      });
    }
  }

  res.json({
    alerts,
    total_alerts: alerts.length
  });
});

module.exports = router;
