import { z } from "zod";
import { klaviyo } from "../klaviyo.ts";

export const flowTools = [
  {
    name: "list_flows",
    description: "List all flows with status (live/draft/manual).",
    schema: z.object({
      status: z.enum(["live", "draft", "manual"]).optional(),
      page_size: z.number().int().min(1).max(50).optional(),
    }),
    handler: async (args: { status?: string; page_size?: number }) => {
      const query: Record<string, string | number> = { "page[size]": args.page_size ?? 50 };
      if (args.status) query.filter = `equals(status,"${args.status}")`;
      const data = await klaviyo<any>({ method: "GET", path: "/flows/", query });
      return (data.data ?? []).map((f: any) => ({
        id: f.id,
        name: f.attributes?.name,
        status: f.attributes?.status,
        trigger_type: f.attributes?.trigger_type,
        updated: f.attributes?.updated,
      }));
    },
  },
  {
    name: "get_flow",
    description: "Get a flow's full configuration including actions and conditions.",
    schema: z.object({
      flow_id: z.string(),
    }),
    handler: async (args: { flow_id: string }) => {
      const data = await klaviyo<any>({
        method: "GET",
        path: `/flows/${args.flow_id}/`,
        query: { include: "flow-actions" },
      });
      return data;
    },
  },
  {
    name: "update_flow_status",
    description: "Set a flow live, draft, or manual. Use carefully — going live triggers sends.",
    schema: z.object({
      flow_id: z.string(),
      status: z.enum(["live", "draft", "manual"]),
    }),
    handler: async (args: { flow_id: string; status: string }) => {
      const data = await klaviyo<any>({
        method: "PATCH",
        path: `/flows/${args.flow_id}/`,
        body: {
          data: {
            type: "flow",
            id: args.flow_id,
            attributes: { status: args.status },
          },
        },
      });
      return { id: data.data?.id, status: data.data?.attributes?.status };
    },
  },
];
