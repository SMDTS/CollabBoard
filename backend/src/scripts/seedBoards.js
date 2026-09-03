import { connectDB } from "../db/connect.js";
import { Board } from "../models/Board.js";

const exampleBoards = [
  { name: "Product Launch", description: "Website redesign, launch checklist, and go-live tasks." },
  { name: "Mobile App Sprint", description: "iOS/Android sprint work — bugs, features, and polish." },
  { name: "Marketing Site", description: "Content, SEO, and campaign landing pages." },
];

async function seed() {
  await connectDB();

  for (const data of exampleBoards) {
    const exists = await Board.findOne({ name: data.name });
    if (exists) {
      console.log(`Skipping "${data.name}" — already exists`);
      continue;
    }
    const board = await Board.create(data);
    console.log(`Created "${board.name}" (${board.id})`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});