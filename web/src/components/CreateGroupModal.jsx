import { useState } from "react";
import { UsersIcon, CheckIcon, PlusIcon, XIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import { useCreateGroupChat } from "../hooks/useChats";

const PRESET_GROUP_ICONS = [
  "https://api.dicebear.com/7.x/identicon/svg?seed=Rocket",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Team",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Nexus",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Alpha",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Infinity",
];

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_GROUP_ICONS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers = [] } = useUsers();
  const createGroupMutation = useCreateGroupChat();

  if (!isOpen) return null;

  const toggleMember = (id) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberIds.size === 0) return;

    createGroupMutation.mutate(
      {
        name: groupName.trim(),
        avatar: selectedAvatar,
        participantIds: Array.from(selectedMemberIds),
      },
      {
        onSuccess: (newGroup) => {
          setGroupName("");
          setSelectedMemberIds(new Set());
          onClose();
          if (onGroupCreated) onGroupCreated(newGroup);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#11131A] border border-white/[0.08] w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] text-[var(--text)]">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[var(--accent)]">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Create Group</h3>
              <p className="text-xs text-[var(--muted)]">Multi-user real-time chat</p>
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

        <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-4 overflow-hidden flex-1">
          {/* GROUP NAME & AVATAR ROW */}
          <div className="flex items-center gap-3">
            <img
              src={selectedAvatar}
              alt="Group Avatar"
              className="w-12 h-12 rounded-xl border border-white/[0.1] object-cover shrink-0 shadow-sm bg-white/[0.04]"
            />
            <div className="flex-1 min-w-0">
              <label className="text-xs text-[var(--muted)] mb-1 block font-mono">GROUP NAME</label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Project Team, Core Devs..."
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[var(--accent)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--muted)] px-3.5 py-2 outline-none transition"
                autoFocus
              />
            </div>
          </div>

          {/* AVATAR PRESETS */}
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block font-mono">CHOOSE ICON</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_GROUP_ICONS.map((icon, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(icon)}
                  className={`w-9 h-9 rounded-xl p-0.5 border transition cursor-pointer shrink-0 ${
                    selectedAvatar === icon
                      ? "border-[var(--accent)] scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={icon} alt="" className="w-full h-full rounded-lg object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* PARTICIPANTS SELECTOR */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-white/[0.08] pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[var(--muted)] font-mono">
                MEMBERS ({selectedMemberIds.size} SELECTED)
              </label>
            </div>

            {/* Search filter */}
            <div className="relative mb-2 shrink-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-[var(--accent)] rounded-lg text-xs text-[var(--text)] placeholder:text-[var(--muted)] pl-8 pr-3 py-1.5 outline-none transition"
              />
            </div>

            {/* User Checklist */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[140px] max-h-[200px]">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted)] text-xs">No contacts found</div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedMemberIds.has(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleMember(user._id)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "bg-[var(--accent)]/10 border-[var(--accent)]/30"
                          : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={user.avatar || "https://avatar.iran.liara.run/public"}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate leading-tight text-[var(--text)]">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-[var(--muted)] truncate font-mono">{user.email}</p>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? "bg-[var(--accent)] text-black"
                            : "border border-white/[0.2]"
                        }`}
                      >
                        {isSelected && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04] transition cursor-pointer"
              disabled={createGroupMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || selectedMemberIds.size === 0 || createGroupMutation.isPending}
              className="send-btn h-8 px-3.5 rounded-lg flex items-center gap-1.5 text-xs font-medium cursor-pointer transition disabled:opacity-40"
            >
              {createGroupMutation.isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <PlusIcon className="w-3.5 h-3.5" />
              )}
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
