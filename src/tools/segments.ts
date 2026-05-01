import { z } from "zod";
import { klaviyo } from "../klaviyo.ts";

export const segmentTools = [
  {
    name: "list_segments",
    description: "List all segments with their member-count and definition status.",
    schema: z.object({
      page_size: z.number().int().min(1).max(100).optional(),
    }),
    handler: async (args: { page_size?: number }) => {
      const data = await klaviyo<any>({
        method: "GET",
        path: "/segments/",
        query: { "page[size]": args.page_size ?? 50 },
      });
      return (data.data ?? []).map((s: any) => ({
        id: s.id,
        name: s.attributes?.name,
        is_active: s.attributes?.is_active,
        is_processing: s.attributes?.is_processing,
        updated: s.attributes?.updated,
      }));
    },
  },
  {
    name: "get_segment",
    description: "Get a segment with full definition (conditions/filters).",
    schema: z.object({ segment_id: z.string() }),
    handler: async (args: { segment_id: string }) => {
      const data = await klaviyo<any>({
        method: "GET",
        path: `/segments/${args.segment_id}/`,
        query: { "additional-fields[segment]": "definition,profile_count" },
      });
      return data.data;
    },
  },
  {
    name: "create_segment",
    description: "Create a new segment. Definition uses Klaviyo's segment-condition schema.",
    schema: z.object({
      name: z.string(),
      definition: z.record(z.unknown()).describe("Segment definition object per Klaviyo API"),
    }),
    handler: async (args: { name: string; definition: Record<string, unknown> }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: "/segments/",
        body: {
          data: {
            type: "segment",
            attributes: { name: args.name, definition: args.definition },
          },
        },
      });
      return { id: data.data?.id, name: data.data?.attributes?.name };
    },
  },
];
