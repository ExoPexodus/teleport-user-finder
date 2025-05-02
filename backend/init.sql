
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    roles TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending')),
    manager VARCHAR(255),
    portal VARCHAR(50)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_portal ON users(portal);

-- Insert sample data
INSERT INTO users (id, name, roles, created_date, last_login, status, manager, portal)
VALUES 
    ('1', 'alice', 'admin,developer', '2023-01-15', '2023-05-01 14:30:00', 'active', 'david', 'kocharsoft'),
    ('2', 'bob', 'developer', '2023-02-20', '2023-05-02 09:15:00', 'active', 'fiona', 'igzy'),
    ('3', 'charlie', 'support,readonly', '2023-03-05', '2023-04-28 16:45:00', 'active', 'david', 'maxicus'),
    ('4', 'dana', 'developer,devops', '2023-01-10', '2023-04-30 11:20:00', 'active', 'fiona', 'kocharsoft'),
    ('5', 'evan', 'readonly', '2023-04-12', NULL, 'pending', NULL, 'igzy'),
    ('6', 'fiona', 'admin', '2022-11-08', '2023-05-01 08:45:00', 'active', NULL, 'maxicus'),
    ('7', 'george', 'developer,support', '2023-02-15', '2023-04-15 13:30:00', 'inactive', 'david', 'kocharsoft')
ON CONFLICT (id) DO NOTHING;
