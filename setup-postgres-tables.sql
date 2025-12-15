-- PostgreSQL Database Setup for Presale Contribution System
-- Run this script in Railway PostgreSQL database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "fullName" VARCHAR(255) NOT NULL,
    "staffId" VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "involvedAccountNames" TEXT,
    "involvedSaleNames" TEXT,
    "involvedSaleEmails" TEXT,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    "canViewOthers" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "accountName" VARCHAR(255),
    "saleName" VARCHAR(255),
    "saleEmail" VARCHAR(255),
    "contributionType" VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    impact TEXT,
    effort TEXT,
    "estimatedImpactValue" DECIMAL(10,2),
    "contributionMonth" VARCHAR(7),
    status VARCHAR(20) DEFAULT 'draft',
    tags TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "contributionMonth")
);

-- Complex, Big, or Challenging Projects 2025
CREATE TABLE IF NOT EXISTS complex_projects (
    id VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "projectName" VARCHAR(500) NOT NULL,
    "salesName" VARCHAR(255) NOT NULL,
    "accountName" VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    "keySuccessFactors" TEXT,
    "reasonsForLoss" TEXT,
    "lessonsLearned" TEXT NOT NULL,
    "suggestionsForImprovement" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions("userId");
CREATE INDEX IF NOT EXISTS idx_contributions_month ON contributions("contributionMonth");
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users("staffId");

-- Insert default admin user
INSERT INTO users ("fullName", "staffId", email, password, "involvedAccountNames", "involvedSaleNames", "involvedSaleEmails", role, status, "canViewOthers", "createdAt", "updatedAt")
VALUES (
    'Admin User',
    'ADMIN001',
    'admin@company.com',
    '$2b$10$rQZ8K9L2vF3xH4jK5l6m7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9',
    '["G-Able Account"]',
    '["Sales Team A"]',
    '["sales@g-able.com"]',
    'admin',
    'active',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert default regular user
INSERT INTO users ("fullName", "staffId", email, password, "involvedAccountNames", "involvedSaleNames", "involvedSaleEmails", role, status, "canViewOthers", "createdAt", "updatedAt")
VALUES (
    'Regular User',
    'USER001',
    'user@company.com',
    '$2b$10$rQZ8K9L2vF3xH4jK5l6m7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9',
    '["Client Account"]',
    '["Sales Team B"]',
    '["client@g-able.com"]',
    'user',
    'active',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Verify tables were created
SELECT 'Users table:' as table_name, count(*) as row_count FROM users
UNION ALL
SELECT 'Contributions table:' as table_name, count(*) as row_count FROM contributions;
