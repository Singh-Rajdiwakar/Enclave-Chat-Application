import { useState } from "react";
import { UsersIcon, SearchIcon, XIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";
import { useUsers } from "../hooks/useUsers";

export function NewChatModal({ onStartChat, isPending, isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { onlineUsers } = useSocketStore();
  const { data: allUsers = [] } = useUsers();
  const isOnline = (id) => onlineUsers.has(id);

  if (!isOpen) return null;

  const handleStartChat = (participantId) => {
    onStartChat(participantId);
    setSearchQuery("");
    onClose();
  };

  const searchResults = allUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#11131A] border border-white/[0.08] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] text-[var(--text)]">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[var(--accent)]">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">New Chat</h3>
              <p className="text-xs text-[var(--muted)]">Search contacts to start messaging</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.06] transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative my-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[var(--accent)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--muted)] pl-9 pr-3.5 py-2 outline-none transition"
            autoFocus
          />
        </div>

        {/* USER LIST */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-72">
          {searchResults.length === 0 ? (
            <div className="py-8 text-center text-[var(--muted)] text-xs font-mono">No users found</div>
          ) : (
            searchResults.map((u) => (
              <button
                key={u._id}
                onClick={() => handleStartChat(u._id)}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition cursor-pointer disabled:opacity-50"
              >
                <div className="relative shrink-0">
                  <img src={u.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                  {isOnline(u._id) && (
                    <span className="absolute bottom-0 right-0 flex h-2 w-2 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-[var(--text)]">{u.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate meta-mono">{u.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
