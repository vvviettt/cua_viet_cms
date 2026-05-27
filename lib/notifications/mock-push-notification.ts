import type { AppMobileNotificationCategory } from "@/lib/app-mobile-notifications/constants";

export type MockPushNotificationPayload = {
  id: string;
  category: AppMobileNotificationCategory;
  title: string;
  content: string;
};

export type MockPushNotificationResult = {
  success: boolean;
  recipientCount: number;
  pushedAt: string;
};

/**
 * Giả lập gửi push/in-app notification tới toàn bộ người dùng app.
 * Thay bằng FCM / dịch vụ thật khi tích hợp backend push.
 */
export async function mockPushNotificationToUsers(
  payload: MockPushNotificationPayload,
): Promise<MockPushNotificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const recipientCount = 128 + (payload.id.charCodeAt(0) % 50);

  console.info("[mock-push-notification]", {
    notificationId: payload.id,
    category: payload.category,
    title: payload.title,
    recipientCount,
    at: new Date().toISOString(),
  });

  return {
    success: true,
    recipientCount,
    pushedAt: new Date().toISOString(),
  };
}
