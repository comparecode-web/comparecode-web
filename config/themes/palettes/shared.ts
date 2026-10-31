import { ensureContrast, mix } from "../color";
import type { ThemeColorRoles } from "../paletteSchema";

const SUPPORT_HEART_BASE = "#e11d48";

type SupportHeartRoles = Pick<ThemeColorRoles, "supportHeart" | "supportHeartHover" | "supportHeartContent">;

export function supportHeartRoles(page: string, surface: string, textPrimary: string, content: string, base = SUPPORT_HEART_BASE): SupportHeartRoles {
  const supportHeart = ensureContrast(base, [page, surface], 4.5, textPrimary);
  return {
    supportHeart,
    supportHeartHover: ensureContrast(mix(supportHeart, textPrimary, 0.35), [page, surface], 4.5, textPrimary),
    supportHeartContent: content
  };
}
