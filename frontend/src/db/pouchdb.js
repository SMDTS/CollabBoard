import PouchDB from "pouchdb-browser";

// One local database, persisted in IndexedDB by pouchdb-browser.
// Every task is stored as a PouchDB doc with _id === task.id (as a string).
export const tasksDB = new PouchDB("flowty-tasks");

// Sync bookkeeping lives on the doc itself, alongside the task fields.
// - syncStatus: "synced" | "pending" | "conflict"
// - pendingOp:  "create" | "update" | "delete" | null
// - serverVersion: the server's copy of the task, only set while syncStatus === "conflict"
// These are plain (non "_"-prefixed) fields so PouchDB doesn't treat them specially.

export function toDoc(task, extra = {}) {
  return {
    ...task,
    _id: String(task.id),
    syncStatus: "synced",
    pendingOp: null,
    serverVersion: null,
    ...extra,
  };
}

// Strip PouchDB/sync-only fields back out so the rest of the app just sees a "task".
export function toTask(doc) {
  // eslint-disable-next-line no-unused-vars
  const { _id, _rev, syncStatus, pendingOp, serverVersion, ...rest } = doc;
  return { ...rest, id: doc.id ?? _id };
}

export function newLocalId() {
  // crypto.randomUUID is available in all evergreen browsers + secure contexts.
  return `local-${crypto.randomUUID()}`;
}
