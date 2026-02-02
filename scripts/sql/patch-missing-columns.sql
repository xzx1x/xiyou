SET @db = DATABASE();

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'consultation_records'
        AND COLUMN_NAME = 'issue_category'
    ),
    'SELECT 1',
    'ALTER TABLE consultation_records ADD COLUMN issue_category VARCHAR(64) NULL AFTER assessment_summary'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'consultation_records'
        AND COLUMN_NAME = 'is_crisis'
    ),
    'SELECT 1',
    'ALTER TABLE consultation_records ADD COLUMN is_crisis TINYINT(1) NOT NULL DEFAULT 0 AFTER issue_category'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'forum_comments'
        AND COLUMN_NAME = 'parent_id'
    ),
    'SELECT 1',
    'ALTER TABLE forum_comments ADD COLUMN parent_id VARCHAR(36) NULL AFTER author_id'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'forum_comments'
        AND INDEX_NAME = 'idx_forum_comment_parent'
    ),
    'SELECT 1',
    'CREATE INDEX idx_forum_comment_parent ON forum_comments (parent_id)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'reports'
        AND COLUMN_NAME = 'attachment_url'
    ),
    'SELECT 1',
    'ALTER TABLE reports ADD COLUMN attachment_url VARCHAR(255) NULL AFTER reason'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
