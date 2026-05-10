"use client";

import type EditorJS from "@editorjs/editorjs";
import type { BlockToolConstructable, I18nDictionary, OutputData } from "@editorjs/editorjs";
import { useEffect, useRef } from "react";

/** Chuỗi giao diện Editor.js + các tool (theo khóa tiếng Anh gốc của từng package). */
const editorJsMessagesVi: I18nDictionary = {
  toolNames: {
    Text: "Đoạn văn",
    Link: "Liên kết",
    Bold: "Đậm",
    Italic: "Nghiêng",
    Heading: "Tiêu đề",
    "Unordered List": "Danh sách không đánh số",
    "Ordered List": "Danh sách đánh số",
    Checklist: "Danh sách kiểm tra",
    Quote: "Trích dẫn",
    Delimiter: "Dòng phân cách",
    Image: "Ảnh",
    Embed: "Nhúng",
  },
  tools: {
    link: {
      "Add a link": "Thêm liên kết",
    },
    stub: {
      Error: "Lỗi",
      "The block can not be displayed correctly.": "Khối nội dung này không hiển thị đúng.",
    },
    header: {
      "Heading 1": "Tiêu đề 1",
      "Heading 2": "Tiêu đề 2",
      "Heading 3": "Tiêu đề 3",
      "Heading 4": "Tiêu đề 4",
      "Heading 5": "Tiêu đề 5",
      "Heading 6": "Tiêu đề 6",
    },
    quote: {
      "Enter a quote": "Nhập trích dẫn",
      "Enter a caption": "Nhập chú thích",
      "Align Left": "Căn trái",
      "Align Center": "Căn giữa",
    },
    embed: {
      "Enter a caption": "Nhập chú thích",
    },
    image: {
      Caption: "Chú thích",
      "Select an Image": "Chọn ảnh",
      "With border": "Viền",
      "Stretch image": "Kéo giãn ảnh",
      "With background": "Nền",
      "With caption": "Có chú thích",
      // Ký tự apostrophe giống bản gốc @editorjs/image (U+2019)
      "Couldn\u2019t upload image. Please try another.":
        "Không tải được ảnh. Vui lòng thử ảnh khác.",
    },
  },
  blockTunes: {
    delete: {
      Delete: "Xóa",
      "Click to delete": "Nhấn để xóa",
    },
    moveUp: {
      "Move up": "Chuyển lên",
    },
    moveDown: {
      "Move down": "Chuyển xuống",
    },
  },
  ui: {
    toolbar: {
      toolbox: {
        Add: "Thêm",
      },
    },
    popover: {
      Filter: "Lọc",
      "Nothing found": "Không tìm thấy",
      "Convert to": "Chuyển thành",
    },
    blockTunes: {
      toggler: {
        "Click to tune": "Nhấn để chỉnh",
        "or drag to move": "hoặc kéo để di chuyển",
      },
    },
    inlineToolbar: {
      converter: {
        "Convert to": "Chuyển thành",
      },
    },
  },
};

export type EditorJsHandle = {
  save: () => Promise<OutputData>;
};

type Props = {
  initialJson: string | null;
  editorRef: React.MutableRefObject<EditorJsHandle | null>;
  placeholder: string;
  minHeightClassName?: string;
};

export function AppEditorJsField({
  initialJson,
  editorRef,
  placeholder,
  minHeightClassName = "min-h-[280px]",
}: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    let cancelled = false;
    const holder = holderRef.current;
    if (!holder) return;

    void (async () => {
      const [
        { default: EditorJSConstructor },
        { default: Header },
        { default: List },
        { default: Quote },
        { default: Delimiter },
        { default: ImageTool },
        { default: Embed },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/quote"),
        import("@editorjs/delimiter"),
        import("@editorjs/image"),
        import("@editorjs/embed"),
      ]);

      if (cancelled || !holderRef.current) return;

      let initial: OutputData = { blocks: [] };
      if (initialJson) {
        try {
          initial = JSON.parse(initialJson) as OutputData;
        } catch {
          /* ignore */
        }
      }

      const editor = new EditorJSConstructor({
        holder,
        i18n: {
          messages: editorJsMessagesVi,
        },
        tools: {
          header: {
            class: Header as unknown as BlockToolConstructable,
            config: { placeholder: "Nhập tiêu đề" },
          },
          list: List,
          quote: Quote,
          delimiter: Delimiter,
          image: {
            class: ImageTool,
            config: {
              endpoints: {
                byFile: "/api/cms/news/upload-media",
                byUrl: "/api/cms/news/upload-media",
              },
              field: "image",
              types: "image/*",
              captionPlaceholder: "Chú thích ảnh",
              features: {
                caption: "optional",
                border: true,
                stretch: true,
              },
            },
          },
          // @ts-expect-error — @editorjs/embed khai báo module tối giản (types/editorjs-shims.d.ts)
          embed: Embed,
        },
        data: initial,
        placeholder,
      });

      coreRef.current = editor;
      await editor.isReady;

      if (cancelled) {
        await editor.destroy();
        coreRef.current = null;
        return;
      }

      editorRef.current = {
        save: () => editor.save(),
      };
    })();

    return () => {
      cancelled = true;
      editorRef.current = null;
      const inst = coreRef.current;
      coreRef.current = null;
      if (inst) {
        void inst.isReady.then(() => inst.destroy()).catch(() => {});
      }
    };
  }, [initialJson, editorRef, placeholder]);

  return (
    <div
      ref={holderRef}
      className={`${minHeightClassName} rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm`}
    />
  );
}

