import {
  createEmailOutbox,
  updateEmailOutboxStatus,
} from "../repositories/emailOutboxRepository";
import {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRecord,
} from "../repositories/notificationRepository";
import { BadRequestError } from "../utils/errors";
import { sendEmail, type SmtpOverride } from "./emailService";

function toFriendlyEmailError(options?: { smtp?: SmtpOverride }) {
  if (options?.smtp) {
    return new BadRequestError("验证码发送失败，请检查 QQ 邮箱与 SMTP 授权码后重试");
  }
  return new Error("邮件服务暂时不可用，请稍后重试");
}

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
  options?: { throwOnFailure?: boolean; smtp?: SmtpOverride },
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
  const outbox = await createEmailOutbox({
    userId,
    email,
    subject,
    body: message,
  });
  try {
    await sendEmail({
      to: email,
      subject,
      text: message,
      smtp: options?.smtp,
    });
    await updateEmailOutboxStatus(outbox.id, "SENT");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    await updateEmailOutboxStatus(outbox.id, "FAILED", errorMessage);
    if (options?.throwOnFailure) {
      throw toFriendlyEmailError(options);
    }
  }
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

/**
 * 标记用户所有通知为已读。
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await markAllNotificationsRead(userId);
}
