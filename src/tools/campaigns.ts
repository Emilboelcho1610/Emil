import { z } from "zod";
import { klaviyo } from "../klaviyo.ts";

export const campaignTools = [
  {
    name: "list_campaigns",
    description: "List campaigns. Filter by channel (email/sms) and/or status.",
    schema: z.object({
      channel: z.enum(["email", "sms", "mobile_push"]).optional(),
      status: z.enum(["Draft", "Queued", "Sent", "Sending", "Cancelled"]).optional(),
      page_size: z.number().int().min(1).max(50).optional(),
    }),
    handler: async (args: { channel?: string; status?: string; page_size?: number }) => {
      const filters = [`equals(messages.channel,"${args.channel ?? "email"}")`];
      if (args.status) filters.push(`equals(status,"${args.status}")`);
      const data = await klaviyo<any>({
        method: "GET",
        path: "/campaigns/",
        query: { filter: `and(${filters.join(",")})`, "page[size]": args.page_size ?? 25 },
      });
      return (data.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.attributes?.name,
        status: c.attributes?.status,
        scheduled_at: c.attributes?.scheduled_at,
        send_time: c.attributes?.send_time,
      }));
    },
  },
  {
    name: "create_campaign",
    description: "Create a new email campaign (in Draft). Combine with a template for content.",
    schema: z.object({
      name: z.string(),
      subject: z.string(),
      from_email: z.string().email(),
      from_label: z.string(),
      template_id: z.string().describe("Template id to use for the email body"),
      list_or_segment_id: z.string().describe("Send to this list or segment"),
    }),
    handler: async (args: {
      name: string;
      subject: string;
      from_email: string;
      from_label: string;
      template_id: string;
      list_or_segment_id: string;
    }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: "/campaigns/",
        body: {
          data: {
            type: "campaign",
            attributes: {
              name: args.name,
              audiences: { included: [args.list_or_segment_id] },
              "campaign-messages": {
                data: [
                  {
                    type: "campaign-message",
                    attributes: {
                      definition: {
                        channel: "email",
                        label: args.name,
                        content: {
                          subject: args.subject,
                          from_email: args.from_email,
                          from_label: args.from_label,
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      });
      return { id: data.data?.id, name: data.data?.attributes?.name };
    },
  },
  {
    name: "schedule_campaign",
    description: "Schedule a draft campaign to send at a specific time. ISO-8601 UTC.",
    schema: z.object({
      campaign_id: z.string(),
      send_at: z.string().describe("ISO-8601 timestamp, e.g. 2026-11-27T05:00:00Z"),
    }),
    handler: async (args: { campaign_id: string; send_at: string }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: `/campaign-send-jobs/`,
        body: {
          data: {
            type: "campaign-send-job",
            attributes: { send_strategy: { method: "static", datetime: args.send_at } },
            relationships: { campaign: { data: { type: "campaign", id: args.campaign_id } } },
          },
        },
      });
      return data.data;
    },
  },
  {
    name: "send_campaign_test",
    description: "Send a test email of a campaign to specific addresses (no charge, doesn't go to audience).",
    schema: z.object({
      campaign_message_id: z.string().describe("Campaign-message id (not campaign id)"),
      emails: z.array(z.string().email()).min(1),
    }),
    handler: async (args: { campaign_message_id: string; emails: string[] }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: `/campaign-message-assign-template/`,
        body: {
          data: {
            type: "campaign-message-send-test",
            attributes: { emails: args.emails },
            relationships: {
              "campaign-message": { data: { type: "campaign-message", id: args.campaign_message_id } },
            },
          },
        },
      });
      return data;
    },
  },
];
