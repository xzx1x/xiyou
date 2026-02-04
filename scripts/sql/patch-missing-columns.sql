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
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'revoked_at'
    ),
    'SELECT 1',
    'ALTER TABLE chat_messages ADD COLUMN revoked_at DATETIME NULL AFTER read_at'
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
        AND TABLE_NAME = 'chat_messages'
        AND COLUMN_NAME = 'revoked_by'
    ),
    'SELECT 1',
    'ALTER TABLE chat_messages ADD COLUMN revoked_by VARCHAR(36) NULL AFTER revoked_at'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS chat_message_deletions (
  message_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id),
  KEY idx_chat_message_delete_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

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

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'assessment_results'
    ),
    'ALTER TABLE assessment_results MODIFY COLUMN type ENUM(''PHQ9'',''GAD7'',''MOOD'',''ANXIETY'',''STRESS'',''SLEEP'',''SOCIAL'') NOT NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'assessment_results'
    ),
    'UPDATE assessment_results SET type = ''MOOD'' WHERE type IN (''PHQ9'',''PHQ-9'',''DEPRESSION'')',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'assessment_results'
    ),
    'UPDATE assessment_results SET type = ''ANXIETY'' WHERE type IN (''GAD7'',''GAD-7'')',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'assessment_results'
    ),
    'ALTER TABLE assessment_results MODIFY COLUMN type ENUM(''MOOD'',''ANXIETY'',''STRESS'',''SLEEP'',''SOCIAL'') NOT NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
