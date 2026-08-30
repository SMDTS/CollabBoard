export const users = [];

export let nextUserId = 1;
export function bumpUserId() {
  return nextUserId++;
}
