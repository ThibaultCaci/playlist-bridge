import type { Track } from "../types/track";

export type MatchStatus =
  | "matched"
  | "uncertain"
  | "unmatched";

export interface MatchResult {
  track?: Track;
  confidence: number;
  status: MatchStatus;
}