import { useState, useEffect, useRef } from "react";
import {
  SearchIcon,
  MessageSquareIcon,
  UsersIcon,
  BookmarkIcon,
  PaletteIcon,
  PhoneIcon,
  VideoIcon,
  BarChart3Icon,
  ArrowRightIcon,
  CommandIcon,
} from "lucide-react";

export function CommandPalette({
  isOpen,
  onClose,
  chats = [],
  onSelectChat,
  onNewChat,
  onNewGroup,
  onOpenSavedMessages,
  onOpenPoll,
  onSwitchTheme,
  onStartCall,
  activeChat,
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via parent or event
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Static commands
  const defaultCommands = [
    {
      id: "cmd-saved",
      title: "Saved Messages (Notes to self)",
      category: "Personal",
      icon: BookmarkIcon,
      action: () => {
        onOpenSavedMessages();
        onClose();
      },
    },
    {
      id: "cmd-new-chat",
      title: "Start New Direct Chat",
      category: "Actions",
      icon: MessageSquareIcon,
      action: () => {
        onNewChat();
        onClose();
      },
    },
    {
      id: "cmd-new-group",
      title: "Create Multi-User Group",
      category: "Actions",
      icon: UsersIcon,
      action: () => {
        onNewGroup();
        onClose();
      },
    },
    {
      id: "cmd-poll",
      title: "Create Quick Poll / Vote",
      category: "Actions",
      icon: BarChart3Icon,
      action: () => {
        onOpenPoll();
        onClose();
      },
    },
    {
      id: "cmd-theme-indigo",
      title: "Switch Theme: Cyber Indigo (Linear style)",
      category: "Themes",
      icon: PaletteIcon,
      action: () => {
        onSwitchTheme("indigo");
        onClose();
      },
    },
    {
      id: "cmd-theme-cyan",
      title: "Switch Theme: Electric Cyan (Terminal)",
      category: "Themes",
      icon: PaletteIcon,
      action: () => {
        onSwitchTheme("cyan");
        onClose();
      },
    },
    {
      id: "cmd-theme-emerald",
      title: "Switch Theme: Emerald Terminal (Dev tool)",
      category: "Themes",
      icon: PaletteIcon,
      action: () => {
        onSwitchTheme("emerald");
        onClose();
      },
    },
    {
      id: "cmd-theme-amber",
      title: "Switch Theme: Warm Amber (Gold accent)",
      category: "Themes",
      icon: PaletteIcon,
      action: () => {
        onSwitchTheme("amber");
        onClose();
      },
    },
  ];

  if (activeChat) {
    defaultCommands.unshift(
      {
        id: "cmd-voice-call",
        title: `Start Voice Call with ${activeChat.participant?.name || "Participant"}`,
        category: "Calling",
        icon: PhoneIcon,
        action: () => {
          onStartCall(false);
          onClose();
        },
      },
      {
        id: "cmd-video-call",
        title: `Start Video Call with ${activeChat.participant?.name || "Participant"}`,
        category: "Calling",
        icon: VideoIcon,
        action: () => {
          onStartCall(true);
          onClose();
        },
      }
    );
  }

  // Chats matching search
  const chatCommands = chats
    .filter((c) => {
      const name = c.participant?.name || "";
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .map((c) => ({
      id: `chat-${c._id}`,
      title: `Jump to: ${c.participant?.name || "Chat"}`,
      category: "Conversations",
      icon: c.isGroup ? UsersIcon : MessageSquareIcon,
      avatar: c.participant?.avatar,
      action: () => {
        onSelectChat(c._id);
        onClose();
      },
    }));

  const filteredCommands = [
    ...chatCommands,
    ...defaultCommands.filter((cmd) => cmd.title.toLowerCase().includes(search.toLowerCase())),
  ];

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) selected.action();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#11131A] border border-white/[0.1] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-[var(--text)] flex flex-col"
      >
        {/* INPUT BAR */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <SearchIcon className="w-4 h-4 text-[var(--muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search conversations..."
            className="flex-1 bg-transparent border-none text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
          />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--muted)] border border-white/[0.06]">
            ESC
          </span>
        </div>

        {/* RESULTS LIST */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted)] font-mono">No matching commands</div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;

              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? "bg-white/[0.08] text-[var(--text)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2.5px] before:rounded-r before:bg-linear-to-b before:from-[var(--accent)] before:to-[var(--accent-2)]"
                      : "text-[var(--text)]/85 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {cmd.avatar ? (
                      <img src={cmd.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isSelected ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} />
                    )}
                    <span className="truncate font-medium">{cmd.title}</span>
                  </div>
                  <span className="meta-mono text-[10px] text-[var(--muted)] shrink-0 ml-2">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div className="flex items-center gap-1">
            <CommandIcon className="w-3 h-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
