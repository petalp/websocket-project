import { type Request, type Response, type NextFunction } from "express";
import { aj } from "../config/arcjet.ts";


async function arcjetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const decision = await aj.protect(req, { requested: 5 }); // Deduct 5 tokens from the bucket
  console.log("Arcjet decision", decision);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      res.status(401).json({ messsage: "Too many request" });
      return;
    } else if (decision.reason.isBot()) {
      res.status(429).json({ error: "no bot allowed" });
      return;
    } else {
      res.status(403).json({ message: decision.reason });
      return;
    }
  }

  next();
}

export default arcjetMiddleware;
