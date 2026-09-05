import { config } from "../config.js";
import { connectDb } from "../db/connect.js";
import { Board } from "../models/Board.js";
import { User } from "../models/User.js";

const exampleBoards = [
  { name: "Product Launch", description: "Website redesign, launch checklist, and go-live tasks." },
  { name: "Mobile App Sprint", description: "iOS/Android sprint work — bugs, features, and polish." },
  { name: "Marketing Site", description: "Content, SEO, and campaign landing pages." },
];

async function seed() {
  await connectDb(config.mongoUri);

  // Boards now require an owner. Seed data has no "current user" to draw
  // on, so we hand ownership to whichever account is passed via
  // SEED_OWNER_EMAIL, falling back to the first registered user.
  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  const owner = ownerEmail ? await User.findOne({ email: ownerEmail }) : await User.findOne().sort({ createdAt: 1 });

  if (!owner) {
    console.error(
      "No user found to own the seed boards. Register a user first, then re-run " +
        "(optionally set SEED_OWNER_EMAIL=you@example.com)."
    );
    process.exit(1);
  }

  for (const data of exampleBoards) {
    const exists = await Board.findOne({ name: data.name });
    if (exists) {
      console.log(`Skipping "${data.name}" — already exists`);
      continue;
    }
    const board = await Board.create({ ...data, owner: owner._id, members: [] });
    console.log(`Created "${board.name}" (${board.id}) owned by ${owner.email}`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});