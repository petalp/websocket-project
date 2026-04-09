import type { Match } from "../generated/prisma/client.ts";
import { MatchStatus } from "../generated/prisma/enums.ts";

export function getMatchStatus(
  startTime: Date,
  endTime: Date,
  now = new Date(),
): "live" | "scheduled" | "finished" | null {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) {
    return MatchStatus.scheduled;
  }
  if (now > end) {
    return MatchStatus.finished;
  }

  return MatchStatus.live;
}


export async function synMatchStatus(match:Match, updateStatus:(matchSatus:MatchStatus)=>void){
    const nextStatus = getMatchStatus(match.startTime, match.endTime as Date) 

    if(!nextStatus){
        return match.status
    }

    if(match.status !== nextStatus){
        await updateStatus(nextStatus)
        match.status = nextStatus
    }

    return match.status
}