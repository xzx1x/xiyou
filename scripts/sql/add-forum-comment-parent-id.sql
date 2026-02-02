ALTER TABLE forum_comments
  ADD COLUMN parent_id VARCHAR(36) NULL AFTER author_id;

CREATE INDEX idx_forum_comment_parent ON forum_comments (parent_id);
