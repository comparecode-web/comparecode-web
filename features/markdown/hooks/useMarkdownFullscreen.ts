import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspaceSidebar } from "@/components/layout/WorkspaceSidebarContext";
import { useToastStore } from "@/store/useToastStore";
import { markdownEditorTabExitEvent } from "@/features/markdown/hooks/useMarkdownKeyboardShortcuts";

type FullscreenSession = "native" | "expanded";

interface PrefixedDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface PrefixedElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

function getFullscreenElement(): Element | null {
  const prefixed = document as PrefixedDocument;
  return document.fullscreenElement ?? prefixed.webkitFullscreenElement ?? null;
}

async function requestDocumentFullscreen(): Promise<boolean> {
  const prefixed = document as PrefixedDocument;
  const root = document.documentElement as PrefixedElement;
  const isEnabled = document.fullscreenEnabled || prefixed.webkitFullscreenEnabled;

  try {
    if (isEnabled && root.requestFullscreen) {
      await root.requestFullscreen();
      return true;
    }

    if (isEnabled && root.webkitRequestFullscreen) {
      await root.webkitRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function exitDocumentFullscreen() {
  const prefixed = document as PrefixedDocument;
  if (document.exitFullscreen) {
    void document.exitFullscreen().catch(() => undefined);
  } else {
    void prefixed.webkitExitFullscreen?.();
  }
}

export function useMarkdownFullscreen() {
  const { setFocusMode } = useWorkspaceSidebar();
  const pushToast = useToastStore((state) => state.pushToast);
  const [session, setSession] = useState<FullscreenSession | null>(null);
  const sessionRef = useRef<FullscreenSession | null>(null);

  const finish = useCallback(() => {
    if (!sessionRef.current) {
      return;
    }

    sessionRef.current = null;
    setSession(null);
    setFocusMode(false);
    window.dispatchEvent(new Event(markdownEditorTabExitEvent));
  }, [setFocusMode]);

  const enter = useCallback(async () => {
    if (sessionRef.current) {
      return;
    }

    setFocusMode(true);
    sessionRef.current = "expanded";
    setSession("expanded");

    if (await requestDocumentFullscreen()) {
      if (sessionRef.current) {
        sessionRef.current = "native";
        setSession("native");
      } else {
        exitDocumentFullscreen();
      }
      return;
    }

    pushToast({
      message: "Full screen is not available here, so the workspace is expanded instead. Browser controls stay visible.",
      tone: "info",
      icon: "info",
      dedupeKey: "markdown-fullscreen-fallback"
    });
  }, [pushToast, setFocusMode]);

  const exit = useCallback(() => {
    if (sessionRef.current === "native" && getFullscreenElement()) {
      exitDocumentFullscreen();
      return;
    }

    finish();
  }, [finish]);

  const toggle = useCallback(() => {
    if (sessionRef.current) {
      exit();
    } else {
      void enter();
    }
  }, [enter, exit]);

  useEffect(() => {
    const handleChange = () => {
      if (sessionRef.current === "native" && !getFullscreenElement()) {
        finish();
      }
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, [finish]);

  useEffect(() => {
    if (session !== "expanded") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) {
        return;
      }

      finish();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [finish, session]);

  useEffect(() => () => {
    if (sessionRef.current === "native" && getFullscreenElement()) {
      exitDocumentFullscreen();
    }

    if (sessionRef.current) {
      sessionRef.current = null;
      setFocusMode(false);
    }
  }, [setFocusMode]);

  return { isFullscreen: session !== null, toggleFullscreen: toggle, exitFullscreen: exit };
}
