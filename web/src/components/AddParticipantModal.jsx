import { useState } from "react";
import { UsersIcon, SearchIcon, UserPlusIcon, CheckIcon, XIcon } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import { useSocketStore } from "../lib/socket";
import { useCallStore } from "../lib/callStore";

export function AddParticipantModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [invitedIds, setInvitedIds] = useState(new Set());
  const { data: allUsers = [] } = useUsers();
  const { onlineUsers } = useSocketStore();
  const { partner, peers = [], inviteUser } = useCallStore();

  if (!isOpen) return null;

  // Set of IDs already in the call
  const activeCallIds = new Set([
    partner?._id,
    ...peers.map((p) => p.peerId || p.user?._id),
  ].filter(Boolean));

  const filteredUsers = allUsers.filter((u) => {
    // Exclude users already participating
    if (activeCallIds.has(u._id)) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
  });

  const handleInvite = (user) => {
    inviteUser(user);
    setInvitedIds((prev) => new Set([...prev, user._id]));
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#11131A] border border-white/[0.08] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] text-[var(--text)]">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[var(--accent)]">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Add People to Call</h3>
              <p className="text-xs text-[var(--muted)]">Invite more participants</p>
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

        {/* SEARCH BAR */}
        <div className="relative my-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[var(--accent)] rounded-xl pl-9 pr-4 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition"
            autoFocus
          />
        </div>

        {/* USER LIST */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[160px] max-h-[300px]">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted)] text-xs font-mono">
              {searchQuery ? "No contacts match search" : "No other contacts available"}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isInvited = invitedIds.has(user._id);
              const isOnline = onlineUsers.has(user._id);

              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar || "https://avatar.iran.liara.run/public"}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-white/10"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-black" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-[var(--text)] truncate">{user.name}</h4>
                      <p className="text-xs text-[var(--muted)] truncate meta-mono">
                        {isOnline ? "Online" : user.email || "Offline"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInvite(user)}
                    disabled={isInvited}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium gap-1.5 shrink-0 transition cursor-pointer flex items-center ${
                      isInvited
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "send-btn"
                    }`}
                  >
                    {isInvited ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Invited</span>
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
