import { z } from "zod";
import { klaviyo } from "../klaviyo.ts";

export const listTools = [
  {
    name: "list_lists",
    description: "List all subscription lists.",
    schema: z.object({
      page_size: z.number().int().min(1).max(100).optional(),
    }),
    handler: async (args: { page_size?: number }) => {
      const data = await klaviyo<any>({
        method: "GET",
        path: "/lists/",
        query: { "page[size]": args.page_size ?? 50 },
      });
      return (data.data ?? []).map((l: any) => ({
        id: l.id,
        name: l.attributes?.name,
        opt_in_process: l.attributes?.opt_in_process,
        created: l.attributes?.created,
      }));
    },
  },
  {
    name: "create_list",
    description: "Create a new subscription list.",
    schema: z.object({ name: z.string() }),
    handler: async (args: { name: string }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: "/lists/",
        body: { data: { type: "list", attributes: { name: args.name } } },
      });
      return { id: data.data?.id, name: data.data?.attributes?.name };
    },
  },
];
