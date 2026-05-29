import fs from 'node:fs';
import { z } from 'zod';
import type { VenueDefinition } from '../adapters/venue.js';

const VenueSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['spot', 'perp', 'prediction']),
  enabled: z.boolean().default(false),
  description: z.string().optional(),
  contracts: z.record(z.string(), z.string()).optional(),
  rest: z.record(z.string(), z.string()).optional(),
}).passthrough();

const MarketsSchema = z.object({
  tokens: z.array(z.unknown()).default([]),
  venues: z.array(VenueSchema).default([]),
  pairs: z.array(z.unknown()).default([]),
});

export function loadMarketFile(path: string): { venues: VenueDefinition[] } {
  const raw = fs.readFileSync(path, 'utf8');
  const parsed = MarketsSchema.parse(JSON.parse(raw));
  return { venues: parsed.venues as VenueDefinition[] };
}
