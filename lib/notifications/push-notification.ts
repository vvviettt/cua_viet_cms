import type { AppMobileNotificationCategory } from "@/lib/app-mobile-notifications/constants";
import {
  deleteFcmTokensByValues,
  listAllFcmTokens,
} from "@/lib/db/app-push-device-tokens";
import { logNotification, logNotificationError } from "@/lib/log/notification-log";
import { getFirebaseMessaging, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { mockPushNotificationToUsers } from "@/lib/notifications/mock-push-notification";

export type PushNotificationPayload = {
  id: string;
  category: AppMobileNotificationCategory;
  title: string;
  content: string;
};

export type PushNotificationResult = {
  success: boolean;
  recipientCount: number;
  pushedAt: string;
  mode: "fcm" | "mock";
  failureCount?: number;
};

const FCM_BATCH_SIZE = 500;

function summaryBody(content: string, max = 180): string {
  const t = content.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

async function sendFcmBatch(
  tokens: string[],
  payload: PushNotificationPayload,
): Promise<{ successCount: number; invalidTokens: string[] }> {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    throw new Error("Firebase Messaging chưa được cấu hình.");
  }

  let successCount = 0;
  const invalidTokens: string[] = [];

  for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
    const batch = tokens.slice(i, i + FCM_BATCH_SIZE);
    const res = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title: payload.title,
        body: summaryBody(payload.content),
      },
      data: {
        notificationId: payload.id,
        category: payload.category,
        title: payload.title,
        content: summaryBody(payload.content, 500),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "app_notifications",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    successCount += res.successCount;
    res.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = r.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        const bad = batch[idx];
        if (bad) invalidTokens.push(bad);
      }
    });
  }

  return { successCount, invalidTokens };
}

/**
 * Gửi push tới mọi thiết bị đã đăng ký token FCM.
 * Nếu Firebase Admin chưa cấu hình trên máy chủ → mock (dev).
 */
export async function pushNotificationToUsers(
  payload: PushNotificationPayload,
): Promise<PushNotificationResult> {
  const firebaseConfigured = isFirebaseAdminConfigured();
  logNotification("push:start", {
    notificationId: payload.id,
    title: payload.title,
    firebaseConfigured,
  });

  if (!firebaseConfigured) {
    logNotification("push:mock", {
      notificationId: payload.id,
      reason: "Firebase Admin chưa cấu hình (file .env / service account)",
    });
    const mock = await mockPushNotificationToUsers(payload);
    return { ...mock, mode: "mock" };
  }

  const tokens = await listAllFcmTokens();
  logNotification("push:tokens", {
    notificationId: payload.id,
    tokenCount: tokens.length,
  });

  if (tokens.length === 0) {
    logNotification("push:no-devices", {
      notificationId: payload.id,
      hint: "App chưa đăng ký FCM token — mở app trên thiết bị thật, kiểm tra log [push] phía Flutter.",
    });
    return {
      success: true,
      recipientCount: 0,
      pushedAt: new Date().toISOString(),
      mode: "fcm",
    };
  }

  try {
    const { successCount, invalidTokens } = await sendFcmBatch(tokens, payload);
    if (invalidTokens.length > 0) {
      await deleteFcmTokensByValues(invalidTokens);
      logNotification("push:removed-invalid-tokens", {
        count: invalidTokens.length,
      });
    }
    const result: PushNotificationResult = {
      success: true,
      recipientCount: successCount,
      failureCount: tokens.length - successCount - invalidTokens.length,
      pushedAt: new Date().toISOString(),
      mode: "fcm",
    };
    logNotification("push:fcm-done", {
      notificationId: payload.id,
      ...result,
    });
    return result;
  } catch (e) {
    logNotificationError("push:fcm-error", { notificationId: payload.id }, e);
    return {
      success: false,
      recipientCount: 0,
      pushedAt: new Date().toISOString(),
      mode: "fcm",
    };
  }
}
