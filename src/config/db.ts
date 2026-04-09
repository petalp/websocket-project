import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { systemConfig } from "./sysConfig.ts";

const adapter = new PrismaPg({connectionString:systemConfig.DATABASE_URL})

export const prisma = new PrismaClient({adapter, log:["info", "query"]})
