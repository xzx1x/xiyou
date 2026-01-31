import type { RowDataPacket } from "mysql2";
import type mysql from "mysql2/promise";

// 需要补齐的 users 表字段，避免旧库缺列。
const USER_COLUMNS: Array<{ name: string; definition: string }> = [
  { name: "gender", definition: "VARCHAR(16) NULL" },
  { name: "major", definition: "VARCHAR(128) NULL" },
  { name: "grade", definition: "VARCHAR(64) NULL" },
  { name: "avatar_url", definition: "VARCHAR(255) NULL" },
  { name: "is_disabled", definition: "TINYINT(1) NOT NULL DEFAULT 0" },
  { name: "disabled_reason", definition: "VARCHAR(255) NULL" },
  { name: "last_login_at", definition: "DATETIME NULL" },
];

// information_schema 查询的返回结构。
type ColumnNameRow = RowDataPacket & { columnName: string };
type IndexNameRow = RowDataPacket & { indexName: string; nonUnique: number };
type DuplicateNicknameRow = RowDataPacket & { nickname: string; count: number };

/**
 * 初始化数据库结构：创建核心表并补齐缺失字段。
 */
export async function ensureDatabaseSchema(
  connection: mysql.Connection,
  databaseName: string,
  collation: string,
): Promise<void> {
  await createUsersTable(connection, collation);
  await ensureUserColumns(connection, databaseName);
  await ensureUserIndexes(connection, databaseName);
  await createIdentityWhitelistTable(connection, collation);
  await createCounselorTables(connection, collation);
  await createAppointmentTables(connection, collation);
  await createAssessmentTables(connection, collation);
  await createFeedbackTables(connection, collation);
  await createChatTables(connection, collation);
  await createFriendTables(connection, collation);
  await createForumTables(connection, collation);
  await createReportTables(connection, collation);
  await createEvidenceTables(connection, collation);
  await createContentTables(connection, collation);
  await createNotificationTables(connection, collation);
  await createPasswordResetTables(connection, collation);
  await createLogTables(connection, collation);
}

/**
 * users 表：存放账号基础信息。
 */
async function createUsersTable(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      identity_code VARCHAR(64) NOT NULL UNIQUE,
      nickname VARCHAR(100) NULL,
      gender VARCHAR(16) NULL,
      major VARCHAR(128) NULL,
      grade VARCHAR(64) NULL,
      avatar_url VARCHAR(255) NULL,
      is_disabled TINYINT(1) NOT NULL DEFAULT 0,
      disabled_reason VARCHAR(255) NULL,
      last_login_at DATETIME NULL,
      role ENUM('USER', 'COUNSELOR', 'ADMIN') NOT NULL DEFAULT 'USER',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_users_nickname (nickname)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * identity_whitelist 表：维护允许注册的学号/工号。
 */
async function createIdentityWhitelistTable(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS identity_whitelist (
      identity_code VARCHAR(64) NOT NULL PRIMARY KEY,
      default_role ENUM('USER', 'COUNSELOR', 'ADMIN') NOT NULL DEFAULT 'USER',
      description VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 心理师申请、档案与档期表。
 */
async function createCounselorTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS counselor_applications (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      qualifications TEXT NULL,
      motivation TEXT NULL,
      attachment_urls TEXT NULL,
      review_reason TEXT NULL,
      reviewed_by VARCHAR(36) NULL,
      reviewed_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_counselor_app_user (user_id),
      KEY idx_counselor_app_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS counselor_profiles (
      user_id VARCHAR(36) NOT NULL PRIMARY KEY,
      bio TEXT NULL,
      specialties TEXT NULL,
      service_mode ENUM('ONLINE', 'OFFLINE', 'BOTH') NOT NULL DEFAULT 'BOTH',
      office_location VARCHAR(255) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS counselor_schedules (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      counselor_id VARCHAR(36) NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      mode ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'ONLINE',
      location VARCHAR(255) NULL,
      status ENUM('AVAILABLE', 'BOOKED', 'CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
      cancel_reason VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_schedule_counselor (counselor_id),
      KEY idx_schedule_status (status),
      KEY idx_schedule_time (start_time, end_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 预约与咨询记录表。
 */
async function createAppointmentTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      counselor_id VARCHAR(36) NOT NULL,
      schedule_id VARCHAR(36) NOT NULL,
      status ENUM('BOOKED', 'CANCELLED_BY_USER', 'CANCELLED_BY_COUNSELOR', 'COMPLETED') NOT NULL DEFAULT 'BOOKED',
      user_note TEXT NULL,
      counselor_note TEXT NULL,
      cancel_reason TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      cancelled_at DATETIME NULL,
      completed_at DATETIME NULL,
      KEY idx_appointment_user (user_id),
      KEY idx_appointment_counselor (counselor_id),
      KEY idx_appointment_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS consultation_records (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      appointment_id VARCHAR(36) NOT NULL UNIQUE,
      user_id VARCHAR(36) NOT NULL,
      counselor_id VARCHAR(36) NOT NULL,
      summary TEXT NULL,
      counselor_feedback TEXT NULL,
      homework TEXT NULL,
      follow_up_plan TEXT NULL,
      assessment_summary TEXT NULL,
      issue_category VARCHAR(64) NULL,
      is_crisis TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_record_user (user_id),
      KEY idx_record_counselor (counselor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 心理测评结果表。
 */
async function createAssessmentTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS assessment_results (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type ENUM('PHQ9', 'GAD7') NOT NULL,
      score INT NOT NULL,
      level VARCHAR(50) NOT NULL,
      answers TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_assessment_user (user_id),
      KEY idx_assessment_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 咨询反馈表。
 */
async function createFeedbackTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS appointment_feedback (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      appointment_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      counselor_id VARCHAR(36) NOT NULL,
      rating INT NOT NULL,
      comment TEXT NULL,
      liked TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_feedback_counselor (counselor_id),
      KEY idx_feedback_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 聊天相关表。
 */
async function createChatTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      type ENUM('DIRECT') NOT NULL DEFAULT 'DIRECT',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_message_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_participants (
      thread_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (thread_id, user_id),
      KEY idx_chat_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      thread_id VARCHAR(36) NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      KEY idx_chat_thread (thread_id),
      KEY idx_chat_sender (sender_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 好友关系表。
 */
async function createFriendTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      requester_id VARCHAR(36) NOT NULL,
      target_id VARCHAR(36) NOT NULL,
      status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_friend_request_target (target_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS friends (
      user_id VARCHAR(36) NOT NULL,
      friend_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, friend_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 论坛帖子/评论/点赞表。
 */
async function createForumTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      author_id VARCHAR(36) NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
      review_reason TEXT NULL,
      reviewed_by VARCHAR(36) NULL,
      reviewed_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_forum_post_status (status),
      KEY idx_forum_post_author (author_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS forum_comments (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      post_id VARCHAR(36) NOT NULL,
      author_id VARCHAR(36) NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_forum_comment_post (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS forum_likes (
      post_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 举报与处理表。
 */
async function createReportTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      reporter_id VARCHAR(36) NOT NULL,
      target_type ENUM('POST', 'COMMENT', 'USER', 'COUNSELOR') NOT NULL,
      target_id VARCHAR(36) NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('PENDING', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
      action_taken VARCHAR(255) NULL,
      resolved_by VARCHAR(36) NULL,
      resolved_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_report_status (status),
      KEY idx_report_target (target_type, target_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 存证占位表，用于后续链上存证对接。
 */
async function createEvidenceTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS evidence_records (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      target_type ENUM('APPOINTMENT', 'CONSULTATION', 'ASSESSMENT', 'FEEDBACK', 'FORUM_POST', 'REPORT', 'CONTENT', 'COUNSELOR_APPLICATION') NOT NULL,
      target_id VARCHAR(36) NOT NULL,
      summary TEXT NULL,
      status ENUM('PENDING', 'RECORDED') NOT NULL DEFAULT 'PENDING',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_evidence_target (target_type, target_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 内容/资源管理表。
 */
async function createContentTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS content_items (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      type ENUM('ARTICLE', 'VIDEO', 'NOTICE') NOT NULL,
      title VARCHAR(200) NOT NULL,
      summary TEXT NULL,
      content TEXT NULL,
      cover_url VARCHAR(255) NULL,
      status ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
      created_by VARCHAR(36) NOT NULL,
      updated_by VARCHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      published_at DATETIME NULL,
      KEY idx_content_type (type),
      KEY idx_content_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 通知与邮件外发队列表。
 */
async function createNotificationTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      channel ENUM('IN_APP', 'EMAIL') NOT NULL DEFAULT 'IN_APP',
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(255) NULL,
      read_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_notification_user (user_id),
      KEY idx_notification_read (read_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS email_outbox (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(200) NOT NULL,
      body TEXT NOT NULL,
      status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME NULL,
      error_message TEXT NULL,
      KEY idx_email_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 密码重置相关表。
 */
async function createPasswordResetTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_reset_user (user_id),
      KEY idx_reset_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 请求日志表。
 */
async function createLogTables(
  connection: mysql.Connection,
  collation: string,
) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      method VARCHAR(16) NOT NULL,
      path VARCHAR(255) NOT NULL,
      status INT NOT NULL,
      duration_ms INT NOT NULL,
      ip VARCHAR(64) NULL,
      user_agent VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_log_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE ${collation}
  `);
}

/**
 * 补齐 users 表缺失字段，防止旧库写入失败。
 */
async function ensureUserColumns(
  connection: mysql.Connection,
  databaseName: string,
): Promise<void> {
  const [rows] = await connection.query<ColumnNameRow[]>(
    `SELECT COLUMN_NAME AS columnName
     FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'users'`,
    [databaseName],
  );
  // 现有列名集合，用于判定哪些字段需要补充。
  const existing = new Set(rows.map((row) => row.columnName));
  for (const column of USER_COLUMNS) {
    if (!existing.has(column.name)) {
      await connection.query(
        `ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`,
      );
    }
  }
}

/**
 * 补齐 users 表昵称唯一索引，避免重复昵称写入。
 */
async function ensureUserIndexes(
  connection: mysql.Connection,
  databaseName: string,
): Promise<void> {
  const [indexes] = await connection.query<IndexNameRow[]>(
    `SELECT INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique
     FROM information_schema.statistics
     WHERE table_schema = ? AND table_name = 'users' AND column_name = 'nickname'`,
    [databaseName],
  );
  const hasUniqueNickname = indexes.some(
    (row) => row.nonUnique === 0 && row.indexName !== "PRIMARY",
  );
  if (hasUniqueNickname) {
    return;
  }

  const [duplicates] = await connection.query<DuplicateNicknameRow[]>(
    `SELECT nickname, COUNT(*) AS count
     FROM users
     WHERE nickname IS NOT NULL AND nickname <> ''
     GROUP BY nickname
     HAVING COUNT(*) > 1
     LIMIT 1`,
  );
  if (duplicates.length > 0) {
    const duplicate = duplicates[0]!;
    throw new Error(
      `昵称 "${duplicate.nickname}" 存在 ${duplicate.count} 条重复记录，请先处理后再启动服务。`,
    );
  }

  await connection.query(
    "ALTER TABLE users ADD UNIQUE KEY idx_users_nickname (nickname)",
  );
}
