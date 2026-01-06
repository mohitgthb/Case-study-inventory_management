Inventory Management System – Backend Case Study

Candidate Name: Mohit Choudhari
Role Applied For: Backend Engineering Intern
Platform: StockFlow (B2B Inventory Management SaaS)

Overview

StockFlow is a B2B inventory management platform used by small businesses to manage products across multiple warehouses and handle supplier relationships. The system needs to be reliable, scalable, and consistent, as inventory and pricing data are business-critical.

This case study focuses on:

Debugging and improving an existing API

Designing a scalable database schema

Implementing a low-stock alert API

Making assumptions explicit due to incomplete requirements

Part 1: Code Review & Debugging
Original Problem

An API endpoint was provided for creating products and initializing inventory. The code compiles but fails in production under real-world conditions.

Issues Identified
1. SKU Uniqueness Not Enforced

No validation or database constraint ensures SKU uniqueness.

SKUs are required to be unique across the platform.

2. Product Incorrectly Tied to Warehouse

warehouse_id is stored directly in the Product model.

Products should exist independently and be stored in multiple warehouses.

3. Missing Transaction Handling

Product creation and inventory creation are committed separately.

If inventory creation fails, the product remains saved.

4. No Input Validation

Direct access to request fields without validation.

Missing or malformed input can cause runtime errors.

5. Price Precision Issues

Price values may be stored as floating-point numbers.

Financial data requires precise decimal handling.

6. Inventory Quantity Validation Missing

Initial inventory quantity can be negative or undefined.

Impact in Production

Duplicate SKUs can lead to incorrect order fulfillment and reporting.

Partial writes create inconsistent inventory states.

Negative or incorrect stock values break alerting logic.

Floating-point precision errors can cause billing discrepancies.

The system becomes unreliable at scale.

Fixes Implemented

Enforced SKU uniqueness using a database UNIQUE constraint.

Removed warehouse reference from Product and modeled inventory as a join table.

Used PostgreSQL transactions (ACID) to ensure atomic operations.

Added input validation for required fields.

Used NUMERIC(10,2) for price precision.

Validated inventory quantity to prevent invalid states.

Corrected Approach Summary

Product creation and inventory initialization are executed within a single database transaction. If any step fails, the entire operation is rolled back, ensuring data consistency.

Part 2: Database Design
Goals

Support multiple warehouses per company

Allow products in multiple warehouses

Track inventory changes over time

Support suppliers and product bundles

Ensure data integrity and scalability

Schema Design
companies

id (PK)

name

created_at

warehouses

id (PK)

company_id (FK → companies)

name

location

products

id (PK)

name

sku (UNIQUE)

price (NUMERIC)

product_type

is_bundle

inventory

id (PK)

product_id (FK → products)

warehouse_id (FK → warehouses)

quantity

UNIQUE (product_id, warehouse_id)

inventory_movements

id (PK)

inventory_id (FK → inventory)

change_quantity

reason

created_at

suppliers

id (PK)

name

contact_email

product_suppliers

product_id (FK)

supplier_id (FK)

Composite primary key

bundle_items

bundle_product_id

child_product_id

quantity

Design Decisions & Justification

Inventory is separated from Product to support multi-warehouse storage.

Inventory movements provide an audit trail and enable historical analysis.

Relational constraints prevent invalid or orphaned data.

Indexes on SKU, product_id, and warehouse_id improve query performance.

PostgreSQL was chosen for strong consistency and transactional guarantees.

Identified Gaps & Questions for Product Team

How is “recent sales activity” defined (days or quantity)?

Can a product have multiple suppliers? If yes, how is priority determined?

How should bundles affect child product inventory?

Are alerts generated per warehouse or aggregated per company?

Should deleted products be soft-deleted or hard-deleted?

Can warehouses transfer stock between themselves?

Part 3: Low-Stock Alerts API
Endpoint
GET /api/companies/{company_id}/alerts/low-stock

Assumptions

Recent sales = sales in the last 30 days

Low-stock threshold varies by product type

Alerts are generated per warehouse

Each product has a primary supplier

Days until stockout = current stock ÷ average daily sales

Business Logic

Fetch all inventories for warehouses under a company

Calculate average daily sales for each product

Skip products with no recent sales

Compare stock against threshold

Enrich alert with supplier information

Return structured alert response

Edge Cases Handled

Zero recent sales → no alert

Zero stock → immediate alert

Missing supplier → handled safely

Multiple warehouses → separate alerts

High data volume → query optimized with joins and indexes

Scalability Considerations

Indexes on frequently queried fields

Pagination for large alert responses

Background jobs for alert generation

Caching thresholds and sales data

Event-driven inventory updates

Sample Response Format
{
  "alerts": [
    {
      "product_id": 123,
      "product_name": "Widget A",
      "sku": "WID-001",
      "warehouse_id": 456,
      "warehouse_name": "Main Warehouse",
      "current_stock": 5,
      "threshold": 20,
      "days_until_stockout": 12,
      "supplier": {
        "id": 789,
        "name": "Supplier Corp",
        "contact_email": "orders@supplier.com"
      }
    }
  ],
  "total_alerts": 1
}

Future Improvements

Background workers for alert processing

Supplier reordering automation

Role-based access control

Soft deletes and audit logs

Redis caching for performance

Webhooks for supplier notifications
