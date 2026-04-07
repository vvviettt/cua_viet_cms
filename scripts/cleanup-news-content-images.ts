import { config } from "dotenv";
import { cleanupOrphanNewsContentImages } from "../lib/news/cleanup-orphan-content-images";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const result = await cleanupOrphanNewsContentImages();
  console.log(
    JSON.stringify(
      {
        deletedCount: result.deletedCount,
        cutoffIso: result.cutoffIso,
        errors: result.errors,
      },
      null,
      2,
    ),
  );
  if (result.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
