import { klaviyo } from "./klaviyo.ts";

async function main() {
  console.log("Pinging Klaviyo API…");
  const data = await klaviyo<any>({
    method: "GET",
    path: "/templates/",
    query: { "page[size]": 5 },
  });
  const templates = (data.data ?? []) as any[];
  console.log(`OK — found ${templates.length} template(s):`);
  for (const t of templates) {
    console.log(`  • ${t.id}  ${t.attributes?.name}`);
  }
  console.log("\nIf you see this, your API key works and MCP will too.");
}

main().catch((err) => {
  console.error("Smoke test failed:", err.message);
  process.exit(1);
});
