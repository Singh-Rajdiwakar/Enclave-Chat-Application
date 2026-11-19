import { useState } from "react";
import {
  XIcon,
  PlusIcon,
  CheckSquareIcon,
  SquareIcon,
  CalendarIcon,
  Trash2Icon,
  CheckIcon,
  ClockIcon,
  UserIcon,
} from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "../hooks/useTasks";
import { formatTime } from "../lib/utils";

export function TasksPanel({ chatId, currentUser, onClose }) {
  const [taskInput, setTaskInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");

  const { data: tasks = [], isLoading } = useTasks(chatId);
  const createTaskMutation = useCreateTask(chatId);
  const updateTaskMutation = useUpdateTask(chatId);
  const deleteTaskMutation = useDeleteTask(chatId);

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!taskInput.trim() || !chatId) return;

    createTaskMutation.mutate(
      {
        chatId,
        title: taskInput.trim(),
        dueDate: dueDateInput ? new Date(dueDateInput).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          setTaskInput("");
          setDueDateInput("");
        },
      }
    );
  };

  const handleToggle = (task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({
      taskId: task._id,
      data: { status: nextStatus },
    });
  };

  const handleDelete = (taskId) => {
    deleteTaskMutation.mutate(taskId);
  };

  return (
    <div className="w-84 sm:w-96 border-l border-white/[0.08] bg-[#11131A] flex flex-col h-full z-30 animate-in slide-in-from-right-3 duration-200">
      {/* HEADER */}
      <div className="h-16 px-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <CheckSquareIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] leading-tight">Chat Tasks</h3>
            <p className="meta-mono text-[10px] text-[var(--muted)]">
              {pendingTasks.length} pending • {completedTasks.length} completed
            </p>
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

      {/* CONTENT LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-8 text-center">
            <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[var(--accent)] animate-spin inline-block" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--muted)] font-mono space-y-2">
            <p>No tasks in this chat yet.</p>
            <p className="text-[11px] opacity-70">
              Hover on any message and click "Make Task", or add one below!
            </p>
          </div>
        ) : (
          <>
            {/* PENDING TASKS */}
            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <span className="meta-mono text-[10px] text-[var(--muted)] uppercase tracking-wider">
                  To Do ({pendingTasks.length})
                </span>
                {pendingTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition group"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        className="mt-0.5 text-[var(--muted)] hover:text-emerald-400 transition cursor-pointer shrink-0"
                      >
                        <SquareIcon className="w-4 h-4" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text)] font-medium leading-snug break-words">
                          {task.title}
                        </p>

                        {task.fromMessage?.text && (
                          <p className="mt-1 text-[10px] text-[var(--muted)] italic truncate border-l-2 border-purple-500/40 pl-1.5">
                            "{task.fromMessage.text}"
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-[var(--muted)]">
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-amber-400/90">
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span>By {task.creator?.name?.split(" ")[0] || "User"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(task._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-rose-400 transition cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COMPLETED TASKS */}
            {completedTasks.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <span className="meta-mono text-[10px] text-[var(--muted)] uppercase tracking-wider">
                  Completed ({completedTasks.length})
                </span>
                {completedTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] opacity-70 group flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        className="mt-0.5 text-emerald-400 transition cursor-pointer shrink-0"
                      >
                        <CheckSquareIcon className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-[var(--muted)] line-through truncate">
                        {task.title}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(task._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2Icon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD TASK INPUT */}
      <div className="p-3 border-t border-white/[0.08] bg-white/[0.02]">
        <form onSubmit={handleCreate} className="space-y-2">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="+ Add a new team task..."
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-400 rounded-xl text-xs text-[var(--text)] placeholder:text-[var(--muted)] px-3 py-2 outline-none transition"
          />
          <div className="flex items-center justify-between gap-2">
            <input
              type="date"
              value={dueDateInput}
              onChange={(e) => setDueDateInput(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg text-[10px] font-mono text-[var(--muted)] px-2 py-1 outline-none cursor-pointer"
              title="Set due date (optional)"
            />
            <button
              type="submit"
              disabled={!taskInput.trim() || createTaskMutation.isPending}
              className="h-7 px-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer disabled:opacity-40 shadow-xs"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
