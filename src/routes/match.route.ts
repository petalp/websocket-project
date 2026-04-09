import { Router, type Request, type Response } from "express";
import {
  CreateMatchSchema,
  ListMatchesQuerySchema,
} from "../utils/validation.ts";
import { prisma } from "../config/db.ts";
import { getMatchStatus } from "../utils/matchStatus.ts";
import { MatchStatus } from "../generated/prisma/enums.ts";

const matchRoute: Router = Router();

matchRoute.get("/", async (req: Request, res: Response) => {
  const parsedMatchQuery = ListMatchesQuerySchema.safeParse(req.query);
  if (!parsedMatchQuery.success) {
    res.status(402).json({ message: JSON.stringify(parsedMatchQuery.error) });
  }

  try {
    if (parsedMatchQuery.success) {
      const limit = Math.min(parsedMatchQuery.data?.limit ?? 50, 100);
      console.log(parsedMatchQuery.data.page);
      const skip = parsedMatchQuery.data.page ? 1 : undefined;
      const status = parsedMatchQuery.data.status
        ? parsedMatchQuery.data.status
        : MatchStatus.scheduled;
      const sport = parsedMatchQuery.data.sport
        ? parsedMatchQuery.data.sport
        : "football";
      const getMatches = await prisma.match.findMany({
        take: limit,
        skip: skip,
        ...(skip && {
          cursor: {
            id: parsedMatchQuery.data.page,
          },
        }),
        where: {
          status,
          sport,
        },
      });
      res.status(200).json({ message: "successful", data: getMatches });
    } else {
      res.status(402).json({ message: JSON.stringify(parsedMatchQuery.error) });
    }
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to create match.", details: JSON.stringify(e) });
  }

  res.status(200).json({ message: "Everything is ok" });
});

matchRoute.post("/", async (req: Request, res: Response) => {
  const validateMatch = CreateMatchSchema.safeParse(req.body);

  if (!validateMatch.success) {
    res.status(402).json({ message: JSON.stringify(validateMatch.error) });
  }

  try {
    if (validateMatch.data) {
      const status = getMatchStatus(
        validateMatch.data.startTime,
        validateMatch.data.endTime as Date,
      );
      const createMatch = await prisma.match.create({
        data: {
          ...validateMatch.data,
          startTime: new Date(validateMatch.data.startTime),
          endTime: new Date(validateMatch.data.endTime as Date),
          homeScore: validateMatch.data.homeScore ?? 0,
          awayScore: validateMatch.data.awayScore ?? 0,
          status: status ? status : validateMatch.data.status,
        },
      });
      res
        .status(201)
        .json({ message: "match is succesfully created", data: createMatch });
    }
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to create match.", details: JSON.stringify(e) });
  }
});

export default matchRoute;
