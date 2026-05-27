import admin from "firebase-admin";

import { logNotification, logNotificationError } from "@/lib/log/notification-log";
import {
  getFirebaseServiceAccountPathForLog,
  hasFirebaseServiceAccountConfig,
  loadFirebaseServiceAccount,
} from "./service-account";

let initAttempted = false;

export function isFirebaseAdminConfigured(): boolean {
  return hasFirebaseServiceAccountConfig();
}

export function getFirebaseAdmin(): admin.app.App | null {
  if (!isFirebaseAdminConfigured()) return null;

  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (initAttempted) return null;
  initAttempted = true;

  try {
    const account = loadFirebaseServiceAccount();
    if (!account) {
      logNotificationError("firebase:load-account-failed", {
        pathEnv: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "(default file)",
        resolvedPath: getFirebaseServiceAccountPathForLog(),
        hint: "File phải tồn tại và đúng tên (vd. .secrets/firebase-service-account.json), không phải *.example.json.",
      });
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert(account),
    });
    const projectId =
      (account as { project_id?: string }).project_id ??
      (account as { projectId?: string }).projectId;
    logNotification("firebase:initialized", { projectId });
    return admin.app();
  } catch (e) {
    logNotificationError("firebase:init-failed", {}, e);
    return null;
  }
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const app = getFirebaseAdmin();
  if (!app) return null;
  return admin.messaging(app);
}
