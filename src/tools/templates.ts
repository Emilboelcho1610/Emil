import { z } from "zod";
import { klaviyo } from "../klaviyo.ts";

export const templateTools = [
  {
    name: "list_templates",
    description: "List all email templates in Klaviyo. Returns id, name, and updated timestamp.",
    schema: z.object({
      page_size: z.number().int().min(1).max(100).optional().describe("Results per page (default 20)"),
    }),
    handler: async (args: { page_size?: number }) => {
      const data = await klaviyo<any>({
        method: "GET",
        path: "/templates/",
        query: { "page[size]": args.page_size ?? 20 },
      });
      const items = (data.data ?? []).map((t: any) => ({
        id: t.id,
        name: t.attributes?.name,
        editor_type: t.attributes?.editor_type,
        updated: t.attributes?.updated,
      }));
      return items;
    },
  },
  {
    name: "get_template",
    description: "Get a single template incl. full HTML body. Use before updating.",
    schema: z.object({
      template_id: z.string().describe("Klaviyo template id"),
    }),
    handler: async (args: { template_id: string }) => {
      const data = await klaviyo<any>({
        method: "GET",
        path: `/templates/${args.template_id}/`,
      });
      return data.data;
    },
  },
  {
    name: "create_template",
    description: "Create a new email template from raw HTML. Use this after designing in Artifacts.",
    schema: z.object({
      name: z.string().describe("Template name shown in Klaviyo"),
      html: z.string().describe("Full HTML body of the email"),
      text: z.string().optional().describe("Plain-text fallback (auto-generated if omitted)"),
    }),
    handler: async (args: { name: string; html: string; text?: string }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: "/templates/",
        body: {
          data: {
            type: "template",
            attributes: {
              name: args.name,
              editor_type: "CODE",
              html: args.html,
              text: args.text,
            },
          },
        },
      });
      return { id: data.data?.id, name: data.data?.attributes?.name };
    },
  },
  {
    name: "update_template",
    description: "Update an existing template's HTML or name.",
    schema: z.object({
      template_id: z.string(),
      name: z.string().optional(),
      html: z.string().optional(),
      text: z.string().optional(),
    }),
    handler: async (args: { template_id: string; name?: string; html?: string; text?: string }) => {
      const attributes: Record<string, unknown> = {};
      if (args.name !== undefined) attributes.name = args.name;
      if (args.html !== undefined) attributes.html = args.html;
      if (args.text !== undefined) attributes.text = args.text;

      const data = await klaviyo<any>({
        method: "PATCH",
        path: `/templates/${args.template_id}/`,
        body: {
          data: {
            type: "template",
            id: args.template_id,
            attributes,
          },
        },
      });
      return { id: data.data?.id, name: data.data?.attributes?.name };
    },
  },
  {
    name: "render_template",
    description: "Render a template with sample context to preview merge-tags. Returns rendered HTML.",
    schema: z.object({
      template_id: z.string(),
      context: z.record(z.unknown()).optional().describe("Sample variables to substitute"),
    }),
    handler: async (args: { template_id: string; context?: Record<string, unknown> }) => {
      const data = await klaviyo<any>({
        method: "POST",
        path: `/template-render/`,
        body: {
          data: {
            type: "template-render",
            attributes: {
              template_id: args.template_id,
              context: args.context ?? {},
            },
          },
        },
      });
      return data.data?.attributes;
    },
  },
];
