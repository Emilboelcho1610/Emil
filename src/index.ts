import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { templateTools } from "./tools/templates.ts";
import { flowTools } from "./tools/flows.ts";
import { campaignTools } from "./tools/campaigns.ts";
import { segmentTools } from "./tools/segments.ts";
import { listTools } from "./tools/lists.ts";
import { profileTools } from "./tools/profiles.ts";
import { metricTools } from "./tools/metrics.ts";

type Tool = {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  handler: (args: any) => Promise<unknown>;
};

const allTools: Tool[] = [
  ...templateTools,
  ...flowTools,
  ...campaignTools,
  ...segmentTools,
  ...listTools,
  ...profileTools,
  ...metricTools,
];

const byName = new Map(allTools.map((t) => [t.name, t]));

const server = new Server(
  { name: "klaviyo-feevra", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.schema, { target: "openApi3" }) as Record<string, unknown>,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = byName.get(req.params.name);
  if (!tool) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
    };
  }
  try {
    const args = tool.schema.parse(req.params.arguments ?? {});
    const result = await tool.handler(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { isError: true, content: [{ type: "text", text: message }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("klaviyo-feevra MCP listening on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
