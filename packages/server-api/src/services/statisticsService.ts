import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database";

// 统计结果中的问题分类项结构。
export type IssueCategoryStat = {
  category: string;
  total: number;
};

// 统计结果中的测评分布项结构。
export type AssessmentDistributionStat = {
  type: string;
  level: string;
  total: number;
};

/**
 * 获取心理师个人服务统计数据。
 */
export async function getCounselorStats(counselorId: string) {
  const [appointmentRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
            SUM(status = 'COMPLETED') AS completed,
            SUM(status IN ('CANCELLED_BY_USER', 'CANCELLED_BY_COUNSELOR')) AS cancelled
     FROM appointments WHERE counselor_id = ?`,
    [counselorId],
  );
  // 预约统计汇总。
  const appointmentStats = appointmentRows[0] ?? { total: 0, completed: 0, cancelled: 0 };

  const [feedbackRows] = await pool.execute<RowDataPacket[]>(
    "SELECT AVG(rating) AS averageRating, COUNT(*) AS total FROM appointment_feedback WHERE counselor_id = ?",
    [counselorId],
  );
  // 满意度统计汇总。
  const feedbackStats = feedbackRows[0] ?? { averageRating: null, total: 0 };

  const [issueRows] = await pool.execute<RowDataPacket[]>(
    `SELECT issue_category AS category, COUNT(*) AS total
     FROM consultation_records
     WHERE counselor_id = ? AND issue_category IS NOT NULL AND issue_category <> ''
     GROUP BY issue_category
     ORDER BY total DESC
     LIMIT 5`,
    [counselorId],
  );
  const issueCategories: IssueCategoryStat[] = issueRows.map((row) => ({
    category: row.category,
    total: Number(row.total ?? 0),
  }));

  const [crisisRows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM consultation_records WHERE counselor_id = ? AND is_crisis = 1",
    [counselorId],
  );
  // 危机事件统计。
  const crisisCount = Number(crisisRows[0]?.total ?? 0);

  return {
    appointments: {
      total: Number(appointmentStats.total ?? 0),
      completed: Number(appointmentStats.completed ?? 0),
      cancelled: Number(appointmentStats.cancelled ?? 0),
    },
    feedback: {
      averageRating: feedbackStats.averageRating
        ? Number(feedbackStats.averageRating)
        : null,
      total: Number(feedbackStats.total ?? 0),
    },
    issueCategories,
    crisisCount,
  };
}

/**
 * 获取管理员全局统计数据。
 */
export async function getAdminStats() {
  const [appointmentRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
            SUM(status = 'COMPLETED') AS completed,
            SUM(status IN ('CANCELLED_BY_USER', 'CANCELLED_BY_COUNSELOR')) AS cancelled
     FROM appointments`,
  );
  // 预约全量统计。
  const appointmentStats = appointmentRows[0] ?? { total: 0, completed: 0, cancelled: 0 };

  const [feedbackRows] = await pool.execute<RowDataPacket[]>(
    "SELECT AVG(rating) AS averageRating, COUNT(*) AS total FROM appointment_feedback",
  );
  // 满意度全量统计。
  const feedbackStats = feedbackRows[0] ?? { averageRating: null, total: 0 };

  const [issueRows] = await pool.execute<RowDataPacket[]>(
    `SELECT issue_category AS category, COUNT(*) AS total
     FROM consultation_records
     WHERE issue_category IS NOT NULL AND issue_category <> ''
     GROUP BY issue_category
     ORDER BY total DESC
     LIMIT 10`,
  );
  const issueCategories: IssueCategoryStat[] = issueRows.map((row) => ({
    category: row.category,
    total: Number(row.total ?? 0),
  }));

  const [assessmentRows] = await pool.execute<RowDataPacket[]>(
    `SELECT type, level, COUNT(*) AS total
     FROM assessment_results
     GROUP BY type, level`,
  );
  const assessmentDistribution: AssessmentDistributionStat[] =
    assessmentRows.map((row) => ({
      type: row.type,
      level: row.level,
      total: Number(row.total ?? 0),
    }));

  const [crisisRows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM consultation_records WHERE is_crisis = 1",
  );
  // 危机事件全量统计。
  const crisisCount = Number(crisisRows[0]?.total ?? 0);

  const total = Number(appointmentStats.total ?? 0);
  const completed = Number(appointmentStats.completed ?? 0);
  // 完成率，避免除以 0。
  const completionRate = total > 0 ? Number((completed / total).toFixed(2)) : 0;

  return {
    appointments: {
      total,
      completed,
      cancelled: Number(appointmentStats.cancelled ?? 0),
      completionRate,
    },
    feedback: {
      averageRating: feedbackStats.averageRating
        ? Number(feedbackStats.averageRating)
        : null,
      total: Number(feedbackStats.total ?? 0),
    },
    issueCategories,
    assessmentDistribution,
    crisisCount,
  };
}
