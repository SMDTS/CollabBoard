import { MongoMemoryServer } from "mongodb-memory-server";

console.log("Downloading the MongoDB binary (one-time — this may take a while on a slow connection)...");
const mongo = await MongoMemoryServer.create();
await mongo.stop();
console.log("Done. The binary is now cached and future test runs will be fast.");