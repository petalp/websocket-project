import { z } from "zod";
import { MatchStatus } from "../generated/prisma/enums.ts";



/** ISO-8601 coerced DateTime — matches Prisma's DateTime */
const dateTimeSchema = z.coerce
  .date({ error: () => ({ message: "Must be a valid ISO-8601 date string" }) });

// ============================================================
// MatchStatus Enum
// ============================================================

export const MatchStatusSchema = z.enum([MatchStatus.finished, MatchStatus.live, MatchStatus.scheduled], {
  error: () => ({
    message: "status must be one of: scheduled | live | finished",
  }),
});

export type MatchStatusType = z.infer<typeof MatchStatusSchema>;

export const CreateMatchSchema = z
  .object({
    sport: z
      .string({ error: "sport is required" })
      .trim()
      .min(2, "sport must be at least 2 characters")
      .max(50, "sport must not exceed 50 characters"),

    homeTeam: z
      .string({ error: "homeTeam is required" })
      .trim()
      .min(2, "homeTeam must be at least 2 characters")
      .max(100, "homeTeam must not exceed 100 characters"),

    awayTeam: z
      .string({ error: "awayTeam is required" })
      .trim()
      .min(2, "awayTeam must be at least 2 characters")
      .max(100, "awayTeam must not exceed 100 characters"),

    status: MatchStatusSchema.default(MatchStatus.scheduled),

    startTime: dateTimeSchema,

    endTime: dateTimeSchema.nullable(),

    homeScore: z
      .number()
      .int("homeScore must be an integer")
      .min(0, "homeScore cannot be negative")
      .default(0),

    awayScore: z
      .number()
      .int("awayScore must be an integer")
      .min(0, "awayScore cannot be negative")
      .default(0),
  })
  .refine(
    (data) => {
      if (data.endTime) return data.endTime > data.startTime;
      return true;
    },
    { message: "endTime must be after startTime", path: ["endTime"] }
  )
  .refine(
    (data) => data.homeTeam.toLowerCase() !== data.awayTeam.toLowerCase(),
    { message: "homeTeam and awayTeam must be different teams", path: ["awayTeam"] }
  );

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;

/**
 * UPDATE — all fields optional; same individual constraints apply.
 * Uses partial() so callers can PATCH any subset of fields.
 */
export const UpdateMatchSchema = z
  .object({
    sport: z.string().trim().min(2).max(50).optional(),

    homeTeam: z.string().trim().min(2).max(100).optional(),

    awayTeam: z.string().trim().min(2).max(100).optional(),

    status: MatchStatusSchema.optional(),

    startTime: dateTimeSchema.optional(),

    endTime: dateTimeSchema.optional().nullable(),

    homeScore: z
      .number()
      .int("homeScore must be an integer")
      .min(0, "homeScore cannot be negative")
      .optional(),

    awayScore: z
      .number()
      .int("awayScore must be an integer")
      .min(0, "awayScore cannot be negative")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime)
        return data.endTime > data.startTime;
      return true;
    },
    { message: "endTime must be after startTime", path: ["endTime"] }
  )
  .refine(
    (data) => {
      if (data.homeTeam && data.awayTeam)
        return data.homeTeam.toLowerCase() !== data.awayTeam.toLowerCase();
      return true;
    },
    { message: "homeTeam and awayTeam must be different teams", path: ["awayTeam"] }
  );

export type UpdateMatchInput = z.infer<typeof UpdateMatchSchema>;

/**
 * RESPONSE — the full shape returned from the DB / API layer.
 * Includes all DB-generated fields.
 */
export const MatchResponseSchema = z.object({
  id:        z.number(),
  sport:     z.string(),
  homeTeam:  z.string(),
  awayTeam:  z.string(),
  status:    MatchStatusSchema,
  startTime: dateTimeSchema,
  endTime:   dateTimeSchema.nullable(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  createdAt: dateTimeSchema,
});

export type MatchResponse = z.infer<typeof MatchResponseSchema>;


export const CommentaryMetadataSchema = z
  .record(z.string(), z.unknown())
  .nullable()
  .optional();

export type CommentaryMetadata = z.infer<typeof CommentaryMetadataSchema>;


export const CreateCommentarySchema = z.object({
  matchId: z.number({error:"matchId is required"}).int("matchId must be an integer"),
  minute: z
    .number({ error: "minute is required" })
    .int("minute must be an integer")
    .min(0,   "minute cannot be negative")
    .max(180, "minute cannot exceed 180"),

  sequence: z
    .number({ error: "sequence is required" })
    .int("sequence must be an integer")
    .min(0, "sequence cannot be negative"),

  period: z
    .string({ error: "period is required" })
    .trim()
    .min(1,  "period must not be empty")
    .max(20, "period must not exceed 20 characters"),

  eventType: z
    .string({ error: "eventType is required" })
    .trim()
    .min(1,  "eventType must not be empty")
    .max(50, "eventType must not exceed 50 characters"),

  actor: z
    .string()
    .trim()
    .min(1,   "actor must not be empty if provided")
    .max(100, "actor must not exceed 100 characters")
    .optional()
    .nullable(),

  team: z
    .string()
    .trim()
    .min(1,   "team must not be empty if provided")
    .max(100, "team must not exceed 100 characters")
    .optional()
    .nullable(),

  message: z
    .string({ error: "message is required" })
    .trim()
    .min(1,    "message must not be empty")
    .max(1000, "message must not exceed 1000 characters"),

  metadata: CommentaryMetadataSchema,

  tags: z
    .array(
      z.string().trim().min(1, "tag must not be empty").max(50, "tag must not exceed 50 characters")
    )
    .max(20, "tags array must not exceed 20 items")
    .default([]),
});

export type CreateCommentaryInput = z.infer<typeof CreateCommentarySchema>;

/**
 * UPDATE — all fields optional; same individual constraints apply.
 */
export const UpdateCommentarySchema = z.object({
  minute: z
    .number()
    .int("minute must be an integer")
    .min(0)
    .max(180)
    .optional(),

  sequence: z
    .number()
    .int("sequence must be an integer")
    .min(0)
    .optional(),

  period: z.string().trim().min(1).max(20).optional(),

  eventType: z.string().trim().min(1).max(50).optional(),

  actor: z.string().trim().min(1).max(100).optional().nullable(),

  team: z.string().trim().min(1).max(100).optional().nullable(),

  message: z.string().trim().min(1).max(1000).optional(),

  metadata: CommentaryMetadataSchema,

  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .optional(),
});

export type UpdateCommentaryInput = z.infer<typeof UpdateCommentarySchema>;

/**
 * RESPONSE — full shape returned from the DB / API layer.
 */
export const CommentaryResponseSchema = z.object({
  id:       z.number(),
  matchId:  z.number(),
  minute:    z.number().int().min(0).max(180),
  sequence:  z.number().int().min(0),
  period:    z.string(),
  eventType: z.string(),
  actor:     z.string().nullable(),
  team:      z.string().nullable(),
  message:   z.string(),
  metadata:  CommentaryMetadataSchema,
  tags:      z.array(z.string()),
  createdAt: dateTimeSchema,
});

export type CommentaryResponse = z.infer<typeof CommentaryResponseSchema>;

// ============================================================
// Param & Query Schemas — for route-level validation
// ============================================================

/** :matchId route param */
export const MatchIdParamSchema = z.object({
  matchId: z.number(),
});

/** :commentaryId route param */
export const CommentaryIdParamSchema = z.object({
  commentaryId: z.number(),
});

/** GET /matches?status=live&sport=football&page=1&limit=20 */
export const ListMatchesQuerySchema = z.object({
  status: MatchStatusSchema.optional(),

  sport: z.string().trim().min(1).max(50).optional(),

  page: z.coerce
    .number()
    .int()
    .min(1, "page must be at least 1").optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1,   "limit must be at least 1")
    .max(100, "limit must not exceed 100").optional()

});

export type ListMatchesQuery = z.infer<typeof ListMatchesQuerySchema>;

/** GET /matches/:matchId/commentary?eventType=goal&page=1&limit=50 */
export const ListCommentaryQuerySchema = z.object({
  eventType: z.string().trim().min(1).max(50).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200, "limit must not exceed 200")
    .default(50),
});

export type ListCommentaryQuery = z.infer<typeof ListCommentaryQuerySchema>;