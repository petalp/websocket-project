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
  
  try {
    if (parsedMatchQuery.success) {
      const limit = Math.min(parsedMatchQuery.data?.limit ?? 50, 100);
      const cursor = parsedMatchQuery.data.page;
      const skip = cursor ? 1 : undefined;

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
            id: cursor,
          },
        }),
        where: {
          status,
          sport,
        },
      });
      res.status(200).json({ message: "successful", data: getMatches });
    } else {
      res.status(400).json({ message: JSON.stringify(parsedMatchQuery.error) });
    }
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to create match.", details: JSON.stringify(e) });
  }

});

matchRoute.post("/", async (req: Request, res: Response) => {
  const validateMatch = CreateMatchSchema.safeParse(req.body);

  if (!validateMatch.success) {
    res.status(402).json({ message: JSON.stringify(validateMatch.error) });
  }

  try {
    if (validateMatch.data) {
    const endTime = validateMatch.data.endTime 
        ? new Date(validateMatch.data.endTime) 
        : null;
    const status = endTime 
       ? getMatchStatus(validateMatch.data.startTime, endTime) 
       : MatchStatus.scheduled;

      const createMatch = await prisma.match.create({
        data: {
          ...validateMatch.data,
          startTime: new Date(validateMatch.data.startTime),
          endTime: endTime,
          homeScore: validateMatch.data.homeScore ?? 0,
          awayScore: validateMatch.data.awayScore ?? 0,
          status: status ? status : validateMatch.data.status,
        },
      });
      if(res.app.locals.broadcastMatchCreated){
          res.app.locals.broadcastMatchCreated(createMatch)
      }
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
