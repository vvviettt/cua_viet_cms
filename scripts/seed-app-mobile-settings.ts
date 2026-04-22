/**
 * Seed dữ liệu "Cài đặt app" (settings + FAQs) cho module Cài đặt.
 *
 * Chạy:
 * - npm run db:seed:app-settings
 * - FORCE=1 npm run db:seed:app-settings (xoá & seed lại FAQs)
 */
import "dotenv/config";
import { getDb } from "../lib/db";
import { appMobileFaqs } from "../lib/db/schema";
import {
  ensureAppMobileSettingsRow,
  listAppMobileFaqsForCms,
  updateAppMobileSettings,
  insertAppMobileFaq,
} from "../lib/db/app-mobile-settings";

type EditorJsDoc = { blocks: Array<Record<string, unknown>> };

const usageGuide: EditorJsDoc = {
  blocks: [
    {
      type: "header",
      data: { text: "Bắt đầu nhanh", level: 2 },
    },
    {
      type: "paragraph",
      data: {
        text:
          "Ứng dụng giúp tra cứu thông tin, gửi phản ánh/kiến nghị và sử dụng các tiện ích dịch vụ công ngay trên điện thoại.",
      },
    },
    {
      type: "list",
      data: {
        style: "ordered",
        items: [
          "Mở tab <b>Trang chủ</b> để xem các nhóm tiện ích.",
          "Chọn <b>Tin tức</b> để đọc thông báo mới nhất.",
          "Vào <b>Phản ánh &amp; kiến nghị</b> để gửi hồ sơ (cần đăng nhập).",
          "Vào <b>Cài đặt</b> để xem hướng dẫn, câu hỏi thường gặp và liên hệ hỗ trợ.",
        ],
      },
    },
    { type: "delimiter", data: {} },
    {
      type: "header",
      data: { text: "Gửi phản ánh/kiến nghị", level: 2 },
    },
    {
      type: "paragraph",
      data: {
        text:
          "Bạn có thể đính kèm hình ảnh, mô tả rõ địa điểm, thời gian và nội dung cần hỗ trợ. Hồ sơ sẽ được tiếp nhận và phản hồi theo trạng thái xử lý.",
      },
    },
    {
      type: "quote",
      data: {
        text:
          "Mẹo: Nội dung ngắn gọn, kèm ảnh rõ nét giúp xử lý nhanh hơn.",
        caption: "Gợi ý",
      },
    },
  ],
};

const terms: EditorJsDoc = {
  blocks: [
    {
      type: "header",
      data: { text: "Chính sách & điều khoản", level: 2 },
    },
    {
      type: "paragraph",
      data: {
        text:
          "Khi sử dụng ứng dụng, bạn đồng ý tuân thủ các điều khoản và quy định hiện hành. Dữ liệu cung cấp cần chính xác và hợp pháp.",
      },
    },
    {
      type: "list",
      data: {
        style: "unordered",
        items: [
          "Không gửi nội dung vi phạm pháp luật hoặc xúc phạm.",
          "Không mạo danh hoặc cung cấp thông tin sai lệch.",
          "Tôn trọng quyền riêng tư và dữ liệu cá nhân.",
        ],
      },
    },
    {
      type: "header",
      data: { text: "Bảo mật dữ liệu", level: 3 },
    },
    {
      type: "paragraph",
      data: {
        text:
          "Thông tin tài khoản được sử dụng để xác thực khi gửi phản ánh/kiến nghị và tra cứu hồ sơ. Chúng tôi không chia sẻ dữ liệu cá nhân trái quy định.",
      },
    },
  ],
};

const faqsSeed: Array<{ q: string; a: string }> = [
  {
    q: "Tôi quên mật khẩu thì làm gì?",
    a:
      "Tạm thời hãy liên hệ hotline hỗ trợ để được xác minh và hướng dẫn khôi phục tài khoản.",
  },
  {
    q: "Vì sao tôi không gửi được phản ánh?",
    a:
      "Hãy kiểm tra kết nối mạng, đăng nhập tài khoản công dân và thử lại. Nếu vẫn lỗi, chụp màn hình và gọi hotline để được hỗ trợ.",
  },
  {
    q: "Tin tức hiển thị không cập nhật?",
    a:
      "Kéo xuống để làm mới. Trường hợp mạng yếu, ứng dụng có thể dùng dữ liệu cache trong thời gian ngắn.",
  },
  {
    q: "Đường dây nóng hoạt động giờ nào?",
    a:
      "Hotline hỗ trợ giờ hành chính. Ngoài giờ, bạn vẫn có thể gửi phản ánh/kiến nghị để hệ thống tiếp nhận.",
  },
  {
    q: "Tôi có thể xoá tài khoản không?",
    a:
      "Liên hệ hotline hỗ trợ để được hướng dẫn. Việc xoá tài khoản có thể ảnh hưởng lịch sử hồ sơ đã gửi.",
  },
];

async function main() {
  getDb();
  const force = String(process.env.FORCE ?? "").trim() === "1";

  await ensureAppMobileSettingsRow();
  const existingFaqs = await listAppMobileFaqsForCms();
  if (!force && existingFaqs.length > 0) {
    console.log("Đã có FAQs — bỏ qua seed. Dùng FORCE=1 để seed lại.");
    process.exit(0);
  }

  // Settings: cập nhật các giá trị mặc định "như thật"
  await updateAppMobileSettings({
    allowCitizenRegister: true,
    supportHotline: "02333888888",
    usageGuideJson: JSON.stringify(usageGuide),
    termsJson: JSON.stringify(terms),
  });

  if (force && existingFaqs.length > 0) {
    await getDb().delete(appMobileFaqs);
  }

  let sort = 0;
  for (const f of faqsSeed) {
    await insertAppMobileFaq({
      question: f.q,
      answer: f.a,
      sortOrder: sort++,
      isActive: true,
    });
  }

  console.log("Đã seed Cài đặt app (settings + FAQs).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

