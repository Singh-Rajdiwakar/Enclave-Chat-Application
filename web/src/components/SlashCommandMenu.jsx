import { useEffect, useState } from "react";
import {
  BarChart3Icon,
  ClockIcon,
  DollarSignIcon,
  CodeIcon,
  CheckSquareIcon,
  SmileIcon,
  ZapIcon,
} from "lucide-react";

export const SLASH_COMMANDS = [
  {
    cmd: "/poll",
    label: "/poll [question]",
    desc: "Create an interactive team poll",
    icon: BarChart3Icon,
    color: "text-indigo-400 bg-indigo-500/15",
  },
  {
    cmd: "/remind",
    label: "/remind [time] [task]",
    desc: "Set a reminder (e.g. /remind 2h Call client)",
    icon: ClockIcon,
    color: "text-amber-400 bg-amber-500/15",
  },
  {
    cmd: "/split",
    label: "/split [amount] [@names]",
    desc: "Calculate bill split (e.g. /split 1200 @Amit @Priya)",
    icon: DollarSignIcon,
    color: "text-emerald-400 bg-emerald-500/15",
  },
  {
    cmd: "/code",
    label: "/code [lang] [snippet]",
    desc: "Send formatted code snippet",
    icon: CodeIcon,
    color: "text-cyan-400 bg-cyan-500/15",
  },
  {
    cmd: "/task",
    label: "/task [title]",
    desc: "Convert to a team task with checkbox",
    icon: CheckSquareIcon,
    color: "text-purple-400 bg-purple-500/15",
  },
  {
    cmd: "/shrug",
    label: "/shrug",
    desc: "Append ¯\\_(ツ)_/¯ to message",
    icon: SmileIcon,
    color: "text-pink-400 bg-pink-500/15",
  },
  {
    cmd: "/tableflip",
    label: "/tableflip",
    desc: "Append (╯°□°)╯︵ ┻━┻",
    icon: ZapIcon,
    color: "text-rose-400 bg-rose-500/15",
  },
];

export function SlashCommandMenu({ input, onSelect, onClose, selectedIndex, onHover }) {
  const query = input.slice(1).toLowerCase().split(" ")[0]; // query after '/'
  const filtered = SLASH_COMMANDS.filter((c) =>
    c.cmd.slice(1).toLowerCase().includes(query)
  );

  if (filtered.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-4 mb-2 w-72 sm:w-80 rounded-2xl bg-[#161922] border border-white/[0.15] shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2.5 border-b border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[var(--muted)] select-none bg-white/[0.02]">
        <span className="font-semibold text-[var(--accent)] tracking-wider">SLASH COMMANDS</span>
        <span className="opacity-70">↑↓ / Hover • Click to pick</span>
      </div>

      <div className="p-1.5 max-h-60 overflow-y-auto overscroll-contain">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={item.cmd}
              type="button"
              ref={(el) => {
                if (isSelected && el) {
                  el.scrollIntoView({ block: "nearest" });
                }
              }}
              onMouseEnter={() => onHover && onHover(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition cursor-pointer select-none ${
                isSelected
                  ? "bg-white/[0.12] text-white ring-1 ring-white/[0.2]"
                  : "text-[var(--text)]/85 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs font-semibold text-[var(--accent)] block truncate">
                  {item.label}
                </span>
                <span className="text-[11px] text-[var(--muted)] truncate block">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
