import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";

const modules: {
  title: string;
  desc: string;
  href: string;
  soon?: boolean;
}[] = [
    {
      title: "Quản lý lịch làm việc",
      desc: "Lập và cập nhật lịch trực, lịch họp, lịch làm việc;",
      href: "/lich-lam-viec",
    },
    {
      title: "Cán bộ, công nhân viên",
      desc: "Quản lý danh sách, hồ sơ và thông tin cán bộ, công chức, người lao động.",
      href: "/can-bo",
    },
    {
      title: "Phản ánh, kiến nghị",
      desc: "Theo dõi và cập nhật trạng thái xử lý phản ánh, kiến nghị do người dân gửi qua ứng dụng.",
      href: "/phan-anh-kien-nghi",
    },
    {
      title: "Đường dây nóng",
      desc: "Quản lý danh sách số điện thoại các dịch vụ công để hiển thị trên ứng dụng và cổng thông tin.",
      href: "/duong-day-nong",
    },
    {
      title: "Tin tức",
      desc: "Soạn, đăng và quản lý bài viết hiển thị ra cổng công khai.",
      href: "/tin-tuc",
    },
    {
      title: "Danh mục & trang tĩnh",
      desc: "Cập nhật nội dung các mục cố định trên website.",
      href: "#",
      soon: true,
    },
    {
      title: "Phương tiện",
      desc: "Tải lên và quản lý hình ảnh, tệp đính kèm.",
      href: "#",
      soon: true,
    },
  ];

export default async function AdminHomePage() {
  const session = await getSession();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10">
      <header className="border-b border-zinc-200 pb-8">
        <p className="text-sm font-medium text-(--portal-primary)">Bảng điều khiển</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Xin chào{session?.name ? `, ${session.name}` : ""}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">{SITE.description}</p>
      </header>

      <section className="mt-10">
        
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const cardClass =
              "flex h-full flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 transition-colors";
            const interactiveClass =
              m.href !== "#"
                ? " hover:border-[var(--portal-primary)] hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portal-primary)]"
                : "";

            const inner = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900">{m.title}</h3>
                  {m.soon ? (
                    <span className="shrink-0 rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">
                      Sắp có
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{m.desc}</p>
                {m.href !== "#" ? (
                  <span className="mt-4 text-sm font-medium text-[var(--portal-primary)]">Mở module →</span>
                ) : null}
              </>
            );

            return (
              <li key={m.title}>
                {m.href !== "#" ? (
                  <Link href={m.href} className={`${cardClass}${interactiveClass}`}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cardClass}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
