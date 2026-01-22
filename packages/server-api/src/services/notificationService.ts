import { createEmailOutbox } from "../repositories/emailOutboxRepository";
import {
  createNotification,
  listNotifications,
  markNotificationRead,
  type NotificationRecord,
} from "../repositories/notificationRepository";

/**
 * 创建站内通知，便于用户在消息中心查看。
 */
export async function notifyInApp(
  userId: string,
  title: string,
  message: string,
  link?: string | null,
): Promise<NotificationRecord> {
  return createNotification({
    userId,
    channel: "IN_APP",
    title,
    message,
    link,
  });
}

/**
 * 创建邮件通知队列，并同步写入通知中心。
 */
export async function notifyEmail(
  userId: string | null,
  email: string,
  subject: string,
  message: string,
): Promise<void> {
  if (userId) {
    await createNotification({
      userId,
      channel: "EMAIL",
      title: subject,
      message,
      link: null,
    });
  }
  await createEmailOutbox({
    userId,
    email,
    subject,
    body: message,
  });
}

/**
 * 获取用户通知列表。
 */
export async function getNotifications(userId: string) {
  return listNotifications(userId);
}

/**
 * 标记通知为已读。
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  await markNotificationRead(notificationId, userId);
}
