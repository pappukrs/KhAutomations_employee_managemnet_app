CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    task_date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'completed')) NOT NULL,
    comments TEXT,
    amount_received DECIMAL(10, 2) CHECK (amount_received >= 0),
    remaining_amount DECIMAL(10, 2) CHECK (remaining_amount >= 0),
    total_amount DECIMAL(10, 2) CHECK (total_amount >= 0),
    latitude DECIMAL(9, 6),  -- For storing latitude values
    longitude DECIMAL(9, 6), -- For storing longitude values
    created_by UUID NOT NULL,
    submission_status VARCHAR(50) DEFAULT 'in_process',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add a trigger to update the `updated_at` column on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
