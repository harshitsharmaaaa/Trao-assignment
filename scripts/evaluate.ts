import { parseArgs } from "util";
import fs from "fs/promises";
import { BatchInputSchema, BatchOutput, BatchKitResult } from "@/schemas/batch.schema";
import { runPipeline } from "@/lib/pipeline/orchestrator";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: { type: "string" },
      output: { type: "string" },
      help: { type: "boolean" },
    },
    strict: false,
    allowPositionals: true,
  });

  const inputPath = typeof values.input === "string" ? values.input : undefined;
  const outputPath = typeof values.output === "string" ? values.output : undefined;

  if (values.help || !inputPath || !outputPath) {
    console.log("Usage: npm run evaluate -- --input <cases.json> --output <kits.json>");
    process.exit(0);
  }

  const rawInput = await fs.readFile(inputPath, "utf-8");
  const cases = BatchInputSchema.parse(JSON.parse(rawInput));

  const kitResults: BatchKitResult[] = [];

  for (const c of cases) {
    console.log(`[Batch Evaluator] Processing case: ${c.id} (${c.company_url})...`);
    try {
      const res = await runPipeline(
        {
          jd: c.jd,
          company_url: c.company_url,
          days: c.days,
        },
        { allowLocalUrls: true }
      );

      if (res.status === "ok" && res.kit) {
        kitResults.push({
          id: c.id,
          status: "ok",
          kit: res.kit,
          error: null,
        });
      } else {
        kitResults.push({
          id: c.id,
          status: "failed",
          kit: null,
          error: res.error || { code: "UNKNOWN_ERROR", message: "Generation failed" },
        });
      }
    } catch (err: any) {
      console.error(`[Batch Evaluator] Error processing case ${c.id}:`, err);
      kitResults.push({
        id: c.id,
        status: "failed",
        kit: null,
        error: { code: "CASE_EXECUTION_ERROR", message: err.message || "Execution exception" },
      });
    }
  }

  const output: BatchOutput = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    kits: kitResults,
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`[Batch Evaluator] Successfully processed ${kitResults.length} cases and wrote output to ${outputPath}`);
}

main().catch((err) => {
  console.error("[Batch Evaluator] Fatal error:", err);
  process.exit(1);
});

