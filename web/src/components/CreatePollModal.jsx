import { useState } from "react";
import { BarChart3Icon, PlusIcon, Trash2Icon, XIcon, CheckIcon } from "lucide-react";

export function CreatePollModal({ isOpen, onClose, onCreatePoll }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!validQuestion || validOptions.length < 2) {
      alert("Please provide a question and at least 2 valid options.");
      return;
    }

    const pollData = {
      question: validQuestion,
      options: validOptions.map((text, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text,
        votes: [],
      })),
    };

    onCreatePoll(pollData);
    setQuestion("");
    setOptions(["", ""]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#11131A] border border-white/[0.08] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col text-[var(--text)]">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[var(--accent)]">
              <BarChart3Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Create Poll</h3>
              <p className="text-xs text-[var(--muted)]">Ask a question & collect quick votes</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* QUESTION */}
          <div>
            <label className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider block mb-1">
              Question
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. When should we deploy to production?"
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[var(--accent)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--muted)] px-3.5 py-2.5 outline-none transition"
              autoFocus
            />
          </div>

          {/* OPTIONS */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider block">
              Options (2 to 6)
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 bg-white/[0.03] border border-white/[0.06] focus:border-[var(--accent)] rounded-xl text-xs text-[var(--text)] placeholder:text-[var(--muted)] px-3 py-2 outline-none transition"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Remove option"
                  >
                    <Trash2Icon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-1 flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline cursor-pointer font-mono"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Add another option</span>
              </button>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="send-btn h-9 px-4 rounded-xl flex items-center gap-1.5 text-xs font-medium cursor-pointer transition"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Send Poll</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
