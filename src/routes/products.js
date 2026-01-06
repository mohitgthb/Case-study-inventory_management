const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/api/products", async (req, res) => {
  const {
    name,
    sku,
    price,
    product_type,
    warehouse_id,
    initial_quantity
  } = req.body;

  if (!name || !sku || !price || !warehouse_id || initial_quantity == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      `INSERT INTO products (name, sku, price, product_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, sku, price, product_type]
    );

    const productId = productResult.rows[0].id;

    const inventoryResult = await client.query(
      `INSERT INTO inventory (product_id, warehouse_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [productId, warehouse_id, initial_quantity]
    );

    await client.query(
      `INSERT INTO inventory_movements (inventory_id, change_quantity, reason)
       VALUES ($1, $2, 'initial stock')`,
      [inventoryResult.rows[0].id, initial_quantity]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Product created",
      product_id: productId
    });

  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      return res.status(409).json({ error: "SKU must be unique" });
    }

    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
