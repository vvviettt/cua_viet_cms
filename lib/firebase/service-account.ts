import { existsSync, readFileSync } from "fs";
import path from "path";
import type admin from "firebase-admin";

import { logNotification } from "@/lib/log/notification-log";

/** File mặc định trong thư mục gốc CMS (gitignore). */
export const DEFAULT_FIREBASE_SERVICE_ACCOUNT_FILE = "firebase-service-account.json";

function resolveConfiguredAccountPath(): string {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  }
  return path.join(process.cwd(), DEFAULT_FIREBASE_SERVICE_ACCOUNT_FILE);
}

function resolveAccountPath(): string | null {
  const configured = resolveConfiguredAccountPath();
  return existsSync(configured) ? configured : null;
}

function readServiceAccountFile(filePath: string): admin.ServiceAccount | null {
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, string | undefined>;
    const projectId = parsed.project_id ?? parsed.projectId;
    const clientEmail = parsed.client_email ?? parsed.clientEmail;
    const privateKey = parsed.private_key ?? parsed.privateKey;
    if (!projectId || !clientEmail || !privateKey) {
      console.error("[firebase] File service account thiếu project_id / client_email / private_key.");
      return null;
    }
    logNotification("firebase:loaded-account-file", {
      filePath,
      projectId,
    });
    return parsed as admin.ServiceAccount;
  } catch (e) {
    console.error(`[firebase] Không đọc được ${filePath}:`, e);
    return null;
  }
}

function serviceAccountFromEnvFields(): admin.ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function serviceAccountFromEnvJson(): admin.ServiceAccount | null {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!jsonRaw) return null;
  try {
    return JSON.parse(jsonRaw) as admin.ServiceAccount;
  } catch (e) {
    console.error("[firebase] FIREBASE_SERVICE_ACCOUNT_JSON không hợp lệ:", e);
    return null;
  }
}

/** Đã có đủ cấu hình để khởi tạo Firebase Admin (chưa đọc/parse file). */
export function hasFirebaseServiceAccountConfig(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return true;
  if (
    process.env.FIREBASE_PROJECT_ID?.trim() &&
    process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
    process.env.FIREBASE_PRIVATE_KEY?.trim()
  ) {
    return true;
  }
  const filePath = resolveAccountPath();
  return filePath != null;
}

export function getFirebaseServiceAccountPathForLog(): string {
  return resolveConfiguredAccountPath();
}

/** Ưu tiên: file JSON → biến JSON một dòng → tách PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY. */
export function loadFirebaseServiceAccount(): admin.ServiceAccount | null {
  const configuredPath = resolveConfiguredAccountPath();
  const filePath = resolveAccountPath();
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() || existsSync(configuredPath)) {
    if (!filePath) {
      logNotification("firebase:file-missing", {
        resolvedPath: configuredPath,
        cwd: process.cwd(),
        hint: "Đặt file JSON đúng tên: .secrets/firebase-service-account.json",
      });
    } else {
      const fromFile = readServiceAccountFile(filePath);
      if (fromFile) return fromFile;
    }
  }

  const fromJson = serviceAccountFromEnvJson();
  if (fromJson) return fromJson;

  return serviceAccountFromEnvFields();
}
