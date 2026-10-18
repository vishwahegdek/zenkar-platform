-- 1. Rename category "Door - Door Frames" or "Door Frames" to "Doors & Frames"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM product_categories WHERE name = 'Door - Door Frames') THEN
        UPDATE product_categories SET name = 'Doors & Frames' WHERE name = 'Door - Door Frames';
    ELSIF EXISTS (SELECT 1 FROM product_categories WHERE name = 'Door Frames') THEN
        UPDATE product_categories SET name = 'Doors & Frames' WHERE name = 'Door Frames';
    ELSIF NOT EXISTS (SELECT 1 FROM product_categories WHERE name = 'Doors & Frames') THEN
        INSERT INTO product_categories (name) VALUES ('Doors & Frames');
    END IF;
END $$;

-- 2. Ensure "Furniture" category exists
INSERT INTO product_categories (name)
VALUES ('Furniture')
ON CONFLICT (name) DO NOTHING;

-- 3. Seed / Update the 6 products under "Doors & Frames"
DO $$
DECLARE
    doors_frames_cat_id INTEGER;
BEGIN
    SELECT id INTO doors_frames_cat_id FROM product_categories WHERE name = 'Doors & Frames' LIMIT 1;
    
    -- Product 1: Door Frame
    IF EXISTS (SELECT 1 FROM products WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'door frame') THEN
        UPDATE products SET name = 'Door Frame', default_unit_price = 0, is_deleted = false 
        WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'door frame';
    ELSE
        INSERT INTO products (name, default_unit_price, category_id, is_deleted)
        VALUES ('Door Frame', 0, doors_frames_cat_id, false);
    END IF;

    -- Product 2: Single Door
    IF EXISTS (SELECT 1 FROM products WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'single door') THEN
        UPDATE products SET name = 'Single Door', default_unit_price = 0, is_deleted = false 
        WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'single door';
    ELSE
        INSERT INTO products (name, default_unit_price, category_id, is_deleted)
        VALUES ('Single Door', 0, doors_frames_cat_id, false);
    END IF;

    -- Product 3: Double door
    IF EXISTS (SELECT 1 FROM products WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'double door') THEN
        UPDATE products SET name = 'Double door', default_unit_price = 0, is_deleted = false 
        WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'double door';
    ELSE
        INSERT INTO products (name, default_unit_price, category_id, is_deleted)
        VALUES ('Double door', 0, doors_frames_cat_id, false);
    END IF;

    -- Product 4: Window Frame
    IF EXISTS (SELECT 1 FROM products WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'window frame') THEN
        UPDATE products SET name = 'Window Frame', default_unit_price = 0, is_deleted = false 
        WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'window frame';
    ELSE
        INSERT INTO products (name, default_unit_price, category_id, is_deleted)
        VALUES ('Window Frame', 0, doors_frames_cat_id, false);
    END IF;

    -- Product 5: Window shutters
    IF EXISTS (SELECT 1 FROM products WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'window shutters') THEN
        UPDATE products SET name = 'Window shutters', default_unit_price = 0, is_deleted = false 
        WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'window shutters';
    ELSE
        INSERT INTO products (name, default_unit_price, category_id, is_deleted)
        VALUES ('Window shutters', 0, doors_frames_cat_id, false);
    END IF;

    -- Product 6: Door Frame with attached window
    IF EXISTS (SELECT 1 FROM products WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'door frame with attached window') THEN
        UPDATE products SET name = 'Door Frame with attached window', default_unit_price = 0, is_deleted = false 
        WHERE category_id = doors_frames_cat_id AND LOWER(TRIM(name)) = 'door frame with attached window';
    ELSE
        INSERT INTO products (name, default_unit_price, category_id, is_deleted)
        VALUES ('Door Frame with attached window', 0, doors_frames_cat_id, false);
    END IF;
END $$;
