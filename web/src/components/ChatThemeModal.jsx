import { useState, useEffect } from "react";
import { PaletteIcon, CheckIcon, XIcon, SparklesIcon } from "lucide-react";

export const TECH_THEMES = [
  {
    id: "indigo",
    name: "Cyber Indigo",
    badge: "Linear / Arc",
    accent: "#7C83FF",
    accent2: "#A78BFA",
    desc: "Refined purple-indigo neon gradient with dark glass.",
  },
  {
    id: "cyan",
    name: "Electric Cyan",
    badge: "Hacker / Tech",
    accent: "#22D3EE",
    accent2: "#06B6D4",
    desc: "Crisp electric cyan glow inspired by terminal HUDs.",
  },
  {
    id: "emerald",
    name: "Emerald Terminal",
    badge: "Dev Tool",
    accent: "#34D399",
    accent2: "#10B981",
    desc: "Minimalist emerald green code aesthetic.",
  },
  {
    id: "amber",
    name: "Warm Amber",
    badge: "Refined Gold",
    accent: "#F59E0B",
    accent2: "#D97706",
    desc: "Subtle warm amber accents on near-black surface.",
  },
];

export function ChatThemeModal({ isOpen, onClose }) {
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem("enclave_tech_theme") || "indigo";
  });

  useEffect(() => {
    const saved = localStorage.getItem("enclave_tech_theme") || "indigo";
    document.documentElement.setAttribute("data-tech-theme", saved);
  }, []);

  if (!isOpen) return null;

  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId);
    document.documentElement.setAttribute("data-tech-theme", themeId);
    localStorage.setItem("enclave_tech_theme", themeId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#11131A] border border-white/[0.08] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col text-[var(--text)]">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[var(--accent)]">
              <PaletteIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Theme & Accent</h3>
              <p className="text-xs text-[var(--muted)]">Dark + Glass + Neon Accent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.06] transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 4 TECH THEMES */}
        <div className="py-4 space-y-2.5">
          {TECH_THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                  isSelected
                    ? "bg-white/[0.06] border-[var(--accent)] shadow-sm"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
                }`}
              >
                {/* Color Swatch */}
                <div
                  className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center shadow-md relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                  }}
                >
                  {isSelected && <CheckIcon className="w-5 h-5 text-black stroke-[3]" />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[var(--text)]">{theme.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--muted)] border border-white/[0.06]">
                      {theme.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{theme.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs text-[var(--muted)] font-mono">Changes apply instantly</span>
          <button
            type="button"
            onClick={onClose}
            className="send-btn px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
