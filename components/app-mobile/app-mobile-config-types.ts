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
};

export type AppMobileListSection = {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  items: AppMobileListItem[];
};
