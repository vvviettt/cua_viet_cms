"use client";

import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import { useEffect, useRef } from "react";

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
        tools: {
          header: Header,
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

