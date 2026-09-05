import { createContext, useContext, useEffect, useRef, useState } from "react";
import { tasksDB, toDoc, toTask, newLocalId } from "../db/pouchdb.js";
import { pushPendingDocs, startSyncLoop, syncNow } from "../db/tasksSync.js";
import { useToast } from "./ToastContext.jsx";

const TasksStateContext = createContext(null);
const TasksActionsContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasksById, setTasksById] = useState(new Map());
  const [conflicts, setConflicts] = useState([]); // [{ taskId, localTask, serverTask }]
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const showToast = useToast();
  const changesRef = useRef(null);

  // Live view of PouchDB: every local write, and every doc pulled from the
  // server, flows through here and updates the UI — this is what makes the
  // app work offline (state never depends on a network round trip).
  useEffect(() => {
    changesRef.current = tasksDB
      .changes({ since: 0, live: true, include_docs: true })
      .on("change", (change) => {
        setTasksById((prev) => {
          const next = new Map(prev);
          if (change.deleted) next.delete(change.id);
          else next.set(change.id, change.doc);
          return next;
        });
      })
      .on("error", (err) => {
        console.error("PouchDB changes feed error:", err);
      });

    return () => changesRef.current?.cancel();
  }, []);

  // Bootstrap: pull whatever the server has (best-effort — fine if it fails
  // because we're offline, PouchDB already has whatever was there before).
  useEffect(() => {
    syncNow().catch(() => {
      /* offline at startup, or API unreachable — background loop will retry */
    });
  }, []);

  // Push pending writes when we come back online, and poll lightly while
  // online in case the API changed something out from under us.
  useEffect(() => {
    const stop = startSyncLoop({
      onConflicts: (newConflicts) => {
        setConflicts((prev) => [
          ...prev.filter((c) => !newConflicts.some((n) => n.taskId === c.taskId)),
          ...newConflicts,
        ]);
      },
    });
    return stop;
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Best-effort immediate sync after a local write; failures just leave the
  // doc "pending" for the background loop to retry, so this is safe to ignore.
  const trySync = () => {
    if (!navigator.onLine) return;
    pushPendingDocs()
      .then(({ conflicts: newConflicts }) => {
        if (newConflicts.length) {
          setConflicts((prev) => [
            ...prev.filter((c) => !newConflicts.some((n) => n.taskId === c.taskId)),
            ...newConflicts,
          ]);
        }
      })
      .catch((err) => console.error("Immediate sync failed:", err));
  };

  const addTask = async (columnId, title, boardId, assignee = "Sarah") => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = { id: newLocalId(), title: trimmed, assignee, columnId, boardId };
    try {
      await tasksDB.put(toDoc(task, { syncStatus: "pending", pendingOp: "create" }));
      trySync();
    } catch (err) {
      showToast(err.message || "Couldn't create the task", "error");
    }
  };

  const moveTask = async (taskId, newColumnId) => {
    await patchLocalTask(taskId, { columnId: newColumnId }, showToast, "Couldn't move the task");
    trySync();
  };

  const updateTask = async (taskId, patch) => {
    await patchLocalTask(taskId, patch, showToast, "Couldn't update the task");
    trySync();
  };

  const deleteTask = async (taskId) => {
    try {
      const doc = await tasksDB.get(String(taskId));
      if (doc.pendingOp === "create") {
        // Never made it to the server — safe to just drop it.
        await tasksDB.remove(doc);
      } else {
        await tasksDB.put({ ...doc, syncStatus: "pending", pendingOp: "delete" });
      }
      trySync();
    } catch (err) {
      showToast(err.message || "Couldn't delete the task", "error");
    }
  };

  // resolution: "keepLocal" | "keepServer" | a merged task object
  const resolveConflict = async (taskId, resolution) => {
    const doc = await tasksDB.get(String(taskId));
    setConflicts((prev) => prev.filter((c) => c.taskId !== taskId));

    if (resolution === "keepServer") {
      await tasksDB.put(toDoc(doc.serverVersion, { _rev: doc._rev }));
      return;
    }

    const nextTask =
      resolution === "keepLocal" ? toTask(doc) : { ...toTask(doc), ...resolution };
    await tasksDB.put(
      toDoc(nextTask, { _rev: doc._rev, syncStatus: "pending", pendingOp: "update" })
    );
    trySync();
  };

  const visibleTasks = Array.from(tasksById.values())
    .filter((doc) => doc.pendingOp !== "delete")
    .map(toTask);

  return (
    <TasksStateContext.Provider value={{ tasks: visibleTasks, conflicts, isOnline }}>
      <TasksActionsContext.Provider
        value={{ addTask, moveTask, deleteTask, updateTask, resolveConflict }}
      >
        {children}
      </TasksActionsContext.Provider>
    </TasksStateContext.Provider>
  );
}

async function patchLocalTask(taskId, patch, showToast, errorMessage) {
  try {
    const doc = await tasksDB.get(String(taskId));
    await tasksDB.put({
      ...doc,
      ...patch,
      syncStatus: "pending",
      pendingOp: doc.pendingOp === "create" ? "create" : "update",
    });
  } catch (err) {
    showToast(err.message || errorMessage, "error");
  }
}

export function useTasks() {
  return useContext(TasksStateContext).tasks;
}

export function useTaskConflicts() {
  return useContext(TasksStateContext).conflicts;
}

export function useIsOnline() {
  return useContext(TasksStateContext).isOnline;
}

export function useTasksActions() {
  return useContext(TasksActionsContext);
}
