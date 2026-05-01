import { z } from "zod";
import { klaviyo } from "../klaviyo.ts";

export const metricTools = [
  {
    name: "list_metrics",
    description: "List available metrics (Opened Email, Clicked Email, Placed Order, etc.).",
    schema: z.object({}),
    handler: async () => {
      const data = await klaviyo<any>({ method: "GET", path: "/metrics/" });
      return (data.data ?? []).map((m: any) => ({
        id: m.id,
        name: m.attributes?.name,
        integration: m.attributes?.integration?.name,
      }));
    },
  },
  {
    name: "get_metric_aggregate",
    description: "Aggregate a metric (e.g. count Opened Email by day for the last 30 days).",
    schema: z.object({
      metric_id: z.string(),
      measurements: z.array(z.enum(["count", "sum_value", "unique"])).default(["count"]),
      interval: z.enum(["hour", "day", "week", "month"]).default("day"),
      start: z.string().describe("ISO-8601 start datetime"),
      end: z.string().describe("ISO-8601 end datetime"),
      timezone: z.string().default("Europe/Copenhagen"),
    }),
    handler: async (args: {
      metric_id: string;
      measurements: string[];
      interval: string;
      start: string;
      end: string;
      timezone: string;
    }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: "/metric-aggregates/",
        body: {
          data: {
            type: "metric-aggregate",
            attributes: {
              metric_id: args.metric_id,
              measurements: args.measurements,
              interval: args.interval,
              filter: [`greater-or-equal(datetime,${args.start})`, `less-than(datetime,${args.end})`],
              timezone: args.timezone,
            },
          },
        },
      });
      return data.data?.attributes;
    },
  },
];
