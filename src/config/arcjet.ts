import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";
import { systemConfig } from "./sysConfig.ts";


export const aj = arcjet({
  key: systemConfig.ARCJET_APIKEY,
  rules: [
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", 
      allow: [
        "CATEGORY:SEARCH_ENGINE", 
        "POSTMAN",
        "CATEGORY:GOOGLE",
      ],
    }),
    
    tokenBucket({
      mode: "LIVE",
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
  ],
});
