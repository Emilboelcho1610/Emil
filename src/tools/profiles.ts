import { z } from "zod";
import { klaviyo } from "../klaviyo.ts";

export const profileTools = [
  {
    name: "search_profiles",
    description: "Search profiles by email, phone or external id.",
    schema: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      external_id: z.string().optional(),
    }),
    handler: async (args: { email?: string; phone?: string; external_id?: string }) => {
      const filters: string[] = [];
      if (args.email) filters.push(`equals(email,"${args.email}")`);
      if (args.phone) filters.push(`equals(phone_number,"${args.phone}")`);
      if (args.external_id) filters.push(`equals(external_id,"${args.external_id}")`);
      if (filters.length === 0) throw new Error("Provide at least one of email/phone/external_id");
      const data = await klaviyo<any>({
        method: "GET",
        path: "/profiles/",
        query: { filter: filters.length > 1 ? `or(${filters.join(",")})` : filters[0] },
      });
      return (data.data ?? []).map((p: any) => ({
        id: p.id,
        email: p.attributes?.email,
        phone: p.attributes?.phone_number,
        first_name: p.attributes?.first_name,
        last_name: p.attributes?.last_name,
        created: p.attributes?.created,
      }));
    },
  },
];
