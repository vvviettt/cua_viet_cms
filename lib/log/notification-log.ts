const PREFIX = "[notifications]";

/** Log luồng thông báo / push (terminal `npm run dev`). */
export function logNotification(
  step: string,
  data?: Record<string, unknown>,
): void {
  if (data && Object.keys(data).length > 0) {
    console.info(PREFIX, step, data);
  } else {
    console.info(PREFIX, step);
  }
}

export function logNotificationError(
  step: string,
  data?: Record<string, unknown>,
  err?: unknown,
): void {
  console.error(PREFIX, step, data ?? {}, err);
}
