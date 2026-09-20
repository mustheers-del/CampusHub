-- =========================================================================
-- GVMS College Portal - Safe Non-Destructive Database Migration & Installer
-- =========================================================================
-- This script is 100% safe to run on both an EXISTING CampusHub database
-- and a FRESH MySQL installation.
--
-- GUARANTEES:
-- 1. NO DROP TABLE, NO DROP DATABASE, NO TRUNCATE.
-- 2. Preserves ALL existing events and registrations without deleting any data.
-- 3. Safely adds new Phase 2 columns only if they do not already exist.
-- 4. Automatically sets default values for existing records:
--    - events: registration_type = 'Individual', max_group_size = 1
--    - registrations: registration_type = 'Individual', group_size = 1
-- 5. Does NOT insert fake or dummy sample data over your real database.
-- =========================================================================

CREATE DATABASE IF NOT EXISTS campushub;
USE campushub;

-- -------------------------------------------------------------------------
-- 1. Create `users` table (If Not Exists)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  course VARCHAR(100),
  year VARCHAR(50),
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------------
-- 2. Create base `events` table (If Not Exists - For Fresh Install)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue VARCHAR(150) NOT NULL,
  capacity INT NOT NULL,
  status VARCHAR(30) DEFAULT 'Upcoming',
  registration_type VARCHAR(20) DEFAULT 'Individual',
  max_group_size INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------------
-- 3. Create base `registrations` table (If Not Exists - For Fresh Install)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NULL,
  student_name VARCHAR(100) NOT NULL,
  student_email VARCHAR(150) NOT NULL,
  student_course VARCHAR(100),
  registration_type VARCHAR(20) DEFAULT 'Individual',
  group_name VARCHAR(150) NULL,
  group_size INT DEFAULT 1,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------------
-- 4. Create `registration_members` table (If Not Exists - Group Events)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registration_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT NOT NULL,
  member_name VARCHAR(100) NOT NULL,
  member_email VARCHAR(150) NOT NULL,
  member_phone VARCHAR(20),
  member_course VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------------------
-- 5. Safe Idempotent Schema Migration for Existing Databases
-- -------------------------------------------------------------------------
-- Define temporary stored procedure to safely add columns if missing
DELIMITER //

DROP PROCEDURE IF EXISTS AddColumnIfNotExists //
CREATE PROCEDURE AddColumnIfNotExists(
    IN p_tableName VARCHAR(64),
    IN p_columnName VARCHAR(64),
    IN p_columnDefinition VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = p_tableName 
          AND COLUMN_NAME = p_columnName
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', p_tableName, '` ADD COLUMN `', p_columnName, '` ', p_columnDefinition);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DROP PROCEDURE IF EXISTS AddForeignKeyIfNotExists //
CREATE PROCEDURE AddForeignKeyIfNotExists(
    IN p_tableName VARCHAR(64),
    IN p_constraintName VARCHAR(64),
    IN p_foreignKeySql VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = DATABASE() 
          AND TABLE_NAME = p_tableName 
          AND CONSTRAINT_NAME = p_constraintName
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', p_tableName, '` ADD CONSTRAINT `', p_constraintName, '` ', p_foreignKeySql);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- Execute safe migration commands for `events` table
CALL AddColumnIfNotExists('events', 'registration_type', "VARCHAR(20) DEFAULT 'Individual'");
CALL AddColumnIfNotExists('events', 'max_group_size', "INT DEFAULT 1");

-- Execute safe migration commands for `registrations` table
CALL AddColumnIfNotExists('registrations', 'user_id', "INT NULL");
CALL AddColumnIfNotExists('registrations', 'registration_type', "VARCHAR(20) DEFAULT 'Individual'");
CALL AddColumnIfNotExists('registrations', 'group_name', "VARCHAR(150) NULL");
CALL AddColumnIfNotExists('registrations', 'group_size', "INT DEFAULT 1");

-- Execute safe migration command for foreign key relationship (registrations -> users)
CALL AddForeignKeyIfNotExists('registrations', 'fk_registrations_users', 'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');

-- Clean up temporary procedures
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DROP PROCEDURE IF EXISTS AddForeignKeyIfNotExists;


-- -------------------------------------------------------------------------
-- 6. Set Defaults for Existing Records (Non-Destructive Data Preservation)
-- -------------------------------------------------------------------------
UPDATE events 
SET registration_type = 'Individual' 
WHERE registration_type IS NULL OR registration_type = '';

UPDATE events 
SET max_group_size = 1 
WHERE max_group_size IS NULL OR max_group_size < 1;

UPDATE registrations 
SET registration_type = 'Individual' 
WHERE registration_type IS NULL OR registration_type = '';

UPDATE registrations 
SET group_size = 1 
WHERE group_size IS NULL OR group_size < 1;


-- -------------------------------------------------------------------------
-- 7. Verification Summary Query
-- -------------------------------------------------------------------------
SELECT 'Migration completed safely!' AS status,
       (SELECT COUNT(*) FROM events) AS total_existing_events,
       (SELECT COUNT(*) FROM registrations) AS total_existing_registrations,
       (SELECT COUNT(*) FROM users) AS total_users;
