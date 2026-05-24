"use client";

import type { MatcherObjectPattern } from "@ckeditor/ckeditor5-engine";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  FileRepository,
  FindAndReplace,
  Font,
  GeneralHtmlSupport,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  Underline,
  type Editor,
} from "ckeditor5";
import vi from "ckeditor5/translations/vi.js";

import "ckeditor5/ckeditor5.css";

import { useMemo, useEffect, useState } from "react";

import {
  richTextJsonToInitialHtml,
  sanitizeAppMobileRichHtmlForFlutter,
} from "@/lib/app-mobile-rich-text";

const UPLOAD_URL = "/api/cms/app-mobile/upload-rich-text-media";

/** Cho phép thẻ/attribute khi dán; không khai báo `classes` (app Flutter không dùng class CSS). */
const HTML_SUPPORT_ALLOW: MatcherObjectPattern[] = [
  { name: /.*/, attributes: true, styles: true },
];
const HTML_SUPPORT_DISALLOW: MatcherObjectPattern[] = [
  { name: "script" },
  { attributes: [{ key: /^on[\w-]+$/i, value: true }] },
];

function supabaseRichTextImageUploadAdapter(editor: Editor) {
  const fileRepo = editor.plugins.get(FileRepository);
  fileRepo.createUploadAdapter = (loader) => ({
    upload: () =>
      loader.file.then(
        (file) =>
          new Promise<{ default: string }>((resolve, reject) => {
            if (!file) {
              reject(new Error("Không có tệp."));
              return;
            }
            const fd = new FormData();
            fd.append("image", file);
            void fetch(UPLOAD_URL, { method: "POST", body: fd })
              .then((r) => r.json())
              .then((data: { success?: number; file?: { url?: string } }) => {
                if (data?.success === 1 && data.file?.url) {
                  resolve({ default: data.file.url });
                } else {
                  reject(new Error("Tải ảnh thất bại."));
                }
              })
              .catch(reject);
          }),
      ),
    abort: () => { },
  });
}

export type AppRichTextEditorHandle = {
  save: () => Promise<{ html: string }>;
};

type Props = {
  initialJson: string | null;
  editorRef: React.MutableRefObject<AppRichTextEditorHandle | null>;
  placeholder: string;
  minHeightClassName?: string;
};

export function AppCKEditorField({
  initialJson,
  editorRef,
  placeholder,
  minHeightClassName = "min-h-[360px]",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const initialData = useMemo(() => richTextJsonToInitialHtml(initialJson), [initialJson]);

  const editorConfig = useMemo((): import("ckeditor5").EditorConfig => ({
      licenseKey: "GPL" as const,
      placeholder,
      language: "vi",
      translations: [vi],
      plugins: [
        Essentials,
        GeneralHtmlSupport,
        Autoformat,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        Subscript,
        Superscript,
        Code,
        Font,
        Alignment,
        RemoveFormat,
        Paragraph,
        Heading,
        Link,
        List,
        BlockQuote,
        Image,
        ImageCaption,
        ImageStyle,
        ImageToolbar,
        ImageUpload,
        ImageResize,
        LinkImage,
        HorizontalLine,
        MediaEmbed,
        Table,
        TableToolbar,
        TableCaption,
        TableProperties,
        TableCellProperties,
        TableColumnResize,
        Indent,
        IndentBlock,
        PasteFromOffice,
        TextTransformation,
        CodeBlock,
        FindAndReplace,
        SourceEditing,
        supabaseRichTextImageUploadAdapter,
      ],
      htmlSupport: {
        allow: HTML_SUPPORT_ALLOW,
        disallow: HTML_SUPPORT_DISALLOW,
      },
      toolbar: {
        shouldNotGroupWhenFull: true,
        items: [
          "undo",
          "redo",
          "|",
          "findAndReplace",
          "sourceEditing",
          "|",
          "heading",
          "|",
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "subscript",
          "superscript",
          "code",
          "|",
          "fontColor",
          "fontBackgroundColor",
          "fontSize",
          "removeFormat",
          "|",
          "alignment",
          "|",
          "link",
          "bulletedList",
          "numberedList",
          "outdent",
          "indent",
          "|",
          "blockQuote",
          "insertTable",
          "horizontalLine",
          "codeBlock",
          "|",
          "uploadImage",
          "mediaEmbed",
        ],
      },
      fontSize: {
        options: [10, 12, 14, "default", 18, 20, 24, 28],
        supportAllValues: false,
      },
      fontColor: {
        colors: [
          { color: "#000000", label: "Đen" },
          { color: "#374151", label: "Xám đậm" },
          { color: "#dc2626", label: "Đỏ" },
          { color: "#ea580c", label: "Cam" },
          { color: "#ca8a04", label: "Vàng" },
          { color: "#16a34a", label: "Xanh lá" },
          { color: "#2563eb", label: "Xanh dương" },
          { color: "#7c3aed", label: "Tím" },
        ],
        columns: 4,
      },
      fontBackgroundColor: {
        colors: [
          { color: "#fef08a", label: "Vàng nhạt" },
          { color: "#bbf7d0", label: "Xanh nhạt" },
          { color: "#bfdbfe", label: "Xanh dương nhạt" },
          { color: "#fbcfe8", label: "Hồng nhạt" },
          { color: "#e5e7eb", label: "Xám nhạt" },
          { color: "#ffffff", label: "Trắng" },
        ],
        columns: 3,
      },
      alignment: {
        options: ["left", "center", "right", "justify"],
      },
      image: {
        toolbar: [
          "imageStyle:inline",
          "imageStyle:wrapText",
          "imageStyle:breakText",
          "|",
          "toggleImageCaption",
          "imageTextAlternative",
          "|",
          "linkImage",
        ],
      },
      table: {
        contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
      },
      heading: {
        options: [
          { model: "paragraph" as const, title: "Đoạn văn", class: "ck-heading_paragraph" },
          { model: "heading2" as const, view: "h2", title: "Tiêu đề 2", class: "ck-heading_heading2" },
          { model: "heading3" as const, view: "h3", title: "Tiêu đề 3", class: "ck-heading_heading3" },
          { model: "heading4" as const, view: "h4", title: "Tiêu đề 4", class: "ck-heading_heading4" },
        ],
      },
    }),
    [placeholder],
  );

  if (!mounted) {
    return (
      <div
        className={`${minHeightClassName} flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-500 shadow-sm`}
      >
        Đang tải trình soạn thảo…
      </div>
    );
  }

  /**
   * Không bọc border/padding ngoài — ClassicEditor đã có khung toolbar + vùng soạn.
   * Đồng bộ viền/góc với input form qua biến CKEditor (tránh hai lớp khung chồng nhau).
   */
  const ckTheme =
    "text-zinc-900 [--ck-color-base-border:#d4d4d8] [--ck-color-toolbar-border:#e4e4e7] [--ck-rounded-corners-radius:0.5rem]";

  /**
   * Grid `1fr` + `minmax(0,…)` cho hàng duy nhất: chiều cao bám `minHeightClassName`, vùng soạn kéo giãn
   * (chỉ `min-h` + flex con thường không đủ vì container không có height xác định).
   */
  const ckFillHeight =
    "grid grid-cols-1 [grid-template-rows:minmax(0,1fr)] [&>div]:min-h-0 [&>div]:flex [&>div]:flex-col [&_.ck.ck-editor]:flex [&_.ck.ck-editor]:min-h-0 [&_.ck.ck-editor]:flex-1 [&_.ck.ck-editor]:flex-col [&_.ck.ck-editor__top]:shrink-0 [&_.ck.ck-editor__main]:flex [&_.ck.ck-editor__main]:min-h-0 [&_.ck.ck-editor__main]:flex-1 [&_.ck.ck-editor__main]:flex-col [&_.ck-editor__editable]:min-h-[12rem] [&_.ck-editor__editable]:flex-1 [&_.ck-editor__editable]:overflow-auto";

  return (
    <div className={`app-ckeditor-wrap ${minHeightClassName} ${ckTheme} ${ckFillHeight}`}>
      <CKEditor
        editor={ClassicEditor}
        config={editorConfig}
        data={initialData}
        onReady={(editor) => {
          editorRef.current = {
            save: async () => ({
              html: sanitizeAppMobileRichHtmlForFlutter(editor.getData()),
            }),
          };
        }}
        onAfterDestroy={() => {
          editorRef.current = null;
        }}

      />
    </div>
  );
}
