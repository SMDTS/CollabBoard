// src/jobs/weeklySummaryJob.js
import cron from "node-cron";
import * as taskRepository from "../repositories/taskRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { sendEmail } from "../utils/emailService.js";

// One query for every user's task/overdue counts, then email only the
// ones who opted in — rather than looping per-user and re-querying tasks
// each time.
export async function runWeeklySummary() {
  const summaries = await taskRepository.getWeeklySummaryForAllUsers();
  const summaryByUserId = new Map(summaries.map((s) => [s.assigneeId, s]));

  const users = await userRepository.findAll();
  const optedIn = users.filter((u) => u.preferences?.notifyWeekly);

  await Promise.all(
    optedIn.map((user) => {
      const summary = summaryByUserId.get(user.id) ?? { taskCount: 0, overdueCount: 0 };
      return sendEmail({
        to: user.email,
        subject: "Your weekly Flowty summary",
        text:
          `Hi ${user.name},\n\n` +
          `Here's your task summary for this week:\n\n` +
          `- ${summary.taskCount} task${summary.taskCount === 1 ? "" : "s"} assigned to you\n` +
          `- ${summary.overdueCount} overdue\n\n` +
          `Open Flowty to review your board.`,
      });
    })
  );

  return { notified: optedIn.length };
}

// Every Monday at 08:00 server time. Not started during tests (see
// server.js — this is only called from there, never from app.js, so
// Jest importing app.js for Supertest never schedules a real cron job).
export function startWeeklySummaryJob() {
  cron.schedule("0 8 * * 1", () => {
    runWeeklySummary().catch((err) => console.error("Weekly summary job failed:", err));
  });
  console.log("Weekly summary job scheduled (Mondays 08:00).");
}
