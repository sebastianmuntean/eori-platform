-- Create a view for stock levels calculated from stock movements
-- Note: This view uses the stock_movement_type enum values: 'in', 'out', 'transfer', 'adjustment', 'return'
CREATE OR REPLACE VIEW "stock_levels" AS
SELECT 
    sm.warehouse_id,
    sm.product_id,
    w.parish_id,
    SUM(CASE 
        WHEN sm.type::text = 'in' THEN sm.quantity::numeric
        WHEN sm.type::text = 'out' THEN -sm.quantity::numeric
        WHEN sm.type::text = 'transfer' AND sm.destination_warehouse_id IS NOT NULL THEN -sm.quantity::numeric
        WHEN sm.type::text = 'transfer' AND sm.destination_warehouse_id IS NULL THEN sm.quantity::numeric
        WHEN sm.type::text = 'adjustment' THEN sm.quantity::numeric
        WHEN sm.type::text = 'return' THEN sm.quantity::numeric
        ELSE 0
    END) AS quantity,
    SUM(CASE 
        WHEN sm.type::text = 'in' THEN COALESCE(sm.total_value::numeric, 0)
        WHEN sm.type::text = 'out' THEN -COALESCE(sm.total_value::numeric, 0)
        WHEN sm.type::text = 'transfer' AND sm.destination_warehouse_id IS NOT NULL THEN -COALESCE(sm.total_value::numeric, 0)
        WHEN sm.type::text = 'transfer' AND sm.destination_warehouse_id IS NULL THEN COALESCE(sm.total_value::numeric, 0)
        WHEN sm.type::text = 'adjustment' THEN COALESCE(sm.total_value::numeric, 0)
        WHEN sm.type::text = 'return' THEN COALESCE(sm.total_value::numeric, 0)
        ELSE 0
    END) AS total_value,
    MAX(sm.movement_date) AS last_movement_date,
    MAX(sm.created_at) AS last_updated_at
FROM stock_movements sm
JOIN warehouses w ON sm.warehouse_id = w.id
GROUP BY sm.warehouse_id, sm.product_id, w.parish_id
HAVING SUM(CASE 
    WHEN sm.type::text = 'in' THEN sm.quantity::numeric
    WHEN sm.type::text = 'out' THEN -sm.quantity::numeric
    WHEN sm.type::text = 'transfer' AND sm.destination_warehouse_id IS NOT NULL THEN -sm.quantity::numeric
    WHEN sm.type::text = 'transfer' AND sm.destination_warehouse_id IS NULL THEN sm.quantity::numeric
    WHEN sm.type::text = 'adjustment' THEN sm.quantity::numeric
    WHEN sm.type::text = 'return' THEN sm.quantity::numeric
    ELSE 0
END) != 0;

