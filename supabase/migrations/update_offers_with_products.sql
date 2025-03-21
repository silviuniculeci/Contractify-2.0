-- Add product-related columns to the offers table
ALTER TABLE offers
ADD COLUMN product_id UUID REFERENCES products(id),
ADD COLUMN license_type_id UUID REFERENCES license_types(id),
ADD COLUMN number_of_users INTEGER,
ADD COLUMN duration_months INTEGER,
ADD COLUMN value DECIMAL(10,2);

-- Create indexes for new columns
CREATE INDEX offers_product_id_idx ON offers(product_id);
CREATE INDEX offers_license_type_id_idx ON offers(license_type_id); 