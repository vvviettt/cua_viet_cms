export type AppMobileListBanner = {
  id: string;
  sortOrder: number;
  isActive: boolean;
  previewSrc: string;
  fileName: string;
};

export type AppMobileListItem = {
  id: string;
  sectionId: string;
  label: string;
  kind: "native" | "webview";
  routeId: string | null;
  webUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  isDefaultFavorite: boolean;
};

export type AppMobileListSection = {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  items: AppMobileListItem[];
};

export type AppMobileListShellTab = {
  id: string;
  tabKey: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type AppMobileListHomeBannerItem = {
  id: string;
  sectionId: string;
  label: string;
  kind: "native" | "webview";
  routeId: string | null;
  webUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type AppMobileListHomeBannerSection = {
  id: string;
  ctaKey: "apply_online" | "lookup_result";
  title: string;
  kind: "native" | "webview";
  routeId: string | null;
  webUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  items: AppMobileListHomeBannerItem[];
};
