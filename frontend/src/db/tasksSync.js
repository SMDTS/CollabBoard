import * as tasksApi from "../api/tasks.js";
import { tasksDB, toDoc } from "./pouchdb.js";

// --- pulling remote state into PouchDB -------------------------------------

// Merge server tasks into the local db. We never overwrite a doc that has
// local work still in flight (pending) or that's sitting in conflict —
// those are only resolved through pushPendingDocs / resolveConflict.
export async function pullRemoteTasks() {
  const [remoteTasks, localState] = await Promise.all([
    tasksApi.fetchTasks(),
    tasksDB.allDocs({ include_docs: true }),
  ]);

  const localById = new Map(localState.rows.map((r) => [r.id, r.doc]));
  const remoteIds = new Set(remoteTasks.map((t) => String(t.id)));
  const writes = [];

  for (const task of remoteTasks) {
    const id = String(task.id);
    const existing = localById.get(id);

    if (!existing) {
      writes.push(toDoc(task));
      continue;
    }
    if (existing.syncStatus === "pending" || existing.syncStatus === "conflict") {
      continue; // local work takes priority until it's resolved
    }
    if (JSON.stringify({ ...existing, _id: undefined, _rev: undefined, syncStatus: undefined, pendingOp: undefined, serverVersion: undefined }) !==
        JSON.stringify({ ...task, id: undefined })) {
      writes.push(toDoc(task, { _rev: existing._rev }));
    }
  }

  // Tasks deleted on the server: drop any local doc that's fully synced.
  for (const doc of localById.values()) {
    if (!remoteIds.has(doc._id) && doc.syncStatus === "synced") {
      writes.push({ ...doc, _deleted: true });
    }
  }

  if (writes.length) await tasksDB.bulkDocs(writes);
}

// --- pushing local writes out to the API ------------------------------------

// Returns { conflicts: [{ taskId, localTask, serverTask }] } for anything
// that came back 409 during this push, so the caller can surface them.
export async function pushPendingDocs() {
  const { rows } = await tasksDB.allDocs({ include_docs: true });
  const pending = rows.map((r) => r.doc).filter((d) => d.syncStatus === "pending");
  const conflicts = [];

  for (const doc of pending) {
    try {
      if (doc.pendingOp === "create") {
        const { _id, _rev, syncStatus, pendingOp, serverVersion, ...task } = doc;
        const created = await tasksApi.createTask(task);
        // Server assigned a real id: move the doc from its temp local id to the real one.
        await tasksDB.remove(doc);
        await tasksDB.put(toDoc(created));
      } else if (doc.pendingOp === "update") {
        const { _id, _rev, syncStatus, pendingOp, serverVersion, ...patch } = doc;
        const updated = await tasksApi.updateTask(doc._id, patch);
        await tasksDB.put(toDoc(updated, { _rev: doc._rev }));
      } else if (doc.pendingOp === "delete") {
        await tasksApi.deleteTask(doc._id);
        await tasksDB.remove(doc);
      }
    } catch (err) {
      if (err.status === 409) {
        const serverTask = await resolveServerVersion(err, doc._id);
        await tasksDB.put({
          ...doc,
          syncStatus: "conflict",
          serverVersion: serverTask,
        });
        conflicts.push({ taskId: doc._id, localTask: doc, serverTask });
      } else {
        // Leave the doc pending; we'll retry next time we go online.
        console.error(`Sync failed for task ${doc._id}:`, err);
      }
    }
  }

  return { conflicts };
}

// Some APIs return the current server record inline on a 409 (e.g. under
// err.details or the parsed body). Fall back to a GET if it isn't there.
// Adjust this to match your actual 409 payload shape.
async function resolveServerVersion(err, taskId) {
  if (err.details && typeof err.details === "object" && !Array.isArray(err.details)) {
    return err.details;
  }
  return tasksApi.fetchTask(taskId);
}

// --- top-level orchestration -------------------------------------------------

export async function syncNow() {
  const { conflicts } = await pushPendingDocs();
  await pullRemoteTasks();
  return conflicts;
}

// Wires up "come back online" + a light polling fallback. Call the returned
// cleanup function on unmount.
export function startSyncLoop({ onConflicts, intervalMs = 30000 } = {}) {
  let cancelled = false;

  const run = async () => {
    if (cancelled || !navigator.onLine) return;
    try {
      const conflicts = await syncNow();
      if (conflicts.length && onConflicts) onConflicts(conflicts);
    } catch (err) {
      console.error("Background sync failed:", err);
    }
  };

  window.addEventListener("online", run);
  const interval = setInterval(run, intervalMs);
  run(); // attempt one immediately in case we're already online

  return () => {
    cancelled = true;
    window.removeEventListener("online", run);
    clearInterval(interval);
  };
}
