import { Router, type Request, type Response } from "express";
import {
  CreateCommentarySchema,
  MatchIdParamSchema,
  ListCommentaryQuerySchema,
} from "../utils/validation.ts";
import { prisma } from "../config/db.ts";
import { Prisma } from "../generated/prisma/client.ts";

const commentaryRoute: Router = Router();

commentaryRoute.get("/:id", async (req: Request, res: Response) => {
  const parsedParams = MatchIdParamSchema.safeParse({
    matchId: Number(req.params.id),
  });

  const parsedQuery = ListCommentaryQuerySchema.safeParse(req.query);

  if (!parsedParams.success || !parsedQuery.success) {
    return res
      .status(400)
      .json({
        message: JSON.stringify({
          paramsError: parsedParams.success ? null : parsedParams.error,
          queryError: parsedQuery.success ? null : parsedQuery.error,
        }),
      });
  }

  try {
    const limit = Math.min(parsedQuery.data.limit ?? 50, 200);
    const page = parsedQuery.data.page ?? 1;
    const skip = (page - 1) * limit;

    const commentaries = await prisma.commentary.findMany({
      take: limit,
      skip,
      where: {
        matchId: parsedParams.data.matchId,
        ...(parsedQuery.data.eventType && {
          eventType: parsedQuery.data.eventType,
        }),
      },
      orderBy: [
        { minute: "asc" },
        { sequence: "asc" },
        { id: "asc" },
      ],
    });

    res.status(200).json({ message: "successful", data: commentaries });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch commentary.",
      details: JSON.stringify(error),
    });
  }
});

commentaryRoute.post("/:id", async (req: Request, res: Response) => {
  console.log(req.params.id)
  const parsedParams = MatchIdParamSchema.safeParse({
    matchId: Number(req.params.id),
  });

  if (!parsedParams.success) {
    return res.status(400).json({ message: parsedParams.error });
  }

  const parsedBody = CreateCommentarySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ message: parsedBody.error });
  }

  if (parsedBody.data.matchId !== parsedParams.data.matchId) {
    return res.status(400).json({
      message: "matchId in params and body must match",
    });
  }

  try {
    const createdCommentary = await prisma.commentary.create({
      data: {
        ...parsedBody.data,
        metadata:
          parsedBody.data.metadata === null
            ? Prisma.JsonNull
            : ((parsedBody.data.metadata as unknown as Prisma.InputJsonValue) ??
              undefined),
      },
    });

    if(res.app.locals.broadcastMatchCommentary){
      res.app.locals.broadcastMatchCommentary(createdCommentary.matchId, createdCommentary)
    }

    res.status(201).json({
      message: "commentary created successfully",
      data: createdCommentary,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create commentary.",
      details: error,
    });
  }
});

export default commentaryRoute;
