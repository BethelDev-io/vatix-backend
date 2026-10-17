/**
 * Market-Created Event Parser
 *
 * Parses and validates raw market-created events from the Soroban contract.
 */

export interface RawMarketCreatedEvent {
  id?: unknown;
  question?: unknown;
  endTime?: unknown;
  oracleAddress?: unknown;
  status?: unknown;
  [key: string]: unknown;
}

export interface ParsedMarketCreatedEvent {
  id: string;
  question: string;
  endTime: string;
  oracleAddress: string;
  status: string;
  rawPayload: RawMarketCreatedEvent;
}

export type ParseResult =
  | { success: true; data: ParsedMarketCreatedEvent }
  | { success: false; error: string };

const ORACLE_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;
const NUMERIC_STRING_REGEX = /^\d+$/;
const MAX_DATE_MS = 8.64e15;

function normalizeEndTime(value: unknown): string | null {
  if (typeof value === "number") {
    const ms = value * 1000;
    if (!Number.isFinite(ms) || Math.abs(ms) > MAX_DATE_MS) {
      return null;
    }
    return new Date(ms).toISOString();
  }

  if (typeof value === "string") {
    if (NUMERIC_STRING_REGEX.test(value)) {
      const ms = Number(value) * 1000;
      if (!Number.isFinite(ms) || Math.abs(ms) > MAX_DATE_MS) {
        return null;
      }
      return new Date(ms).toISOString();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  }

  return null;
}

export function parseMarketCreatedEvent(
  raw: RawMarketCreatedEvent
): ParseResult {
  try {
    if (!raw || typeof raw !== "object") {
      return { success: false, error: "Invalid payload: expected an object" };
    }

    if (typeof raw.id !== "string" || raw.id.length === 0) {
      return { success: false, error: "Invalid or missing field: id" };
    }

    if (typeof raw.question !== "string" || raw.question.length === 0) {
      return { success: false, error: "Invalid or missing field: question" };
    }

    if (raw.endTime === undefined || raw.endTime === null) {
      return { success: false, error: "Invalid or missing field: endTime" };
    }

    const endTime = normalizeEndTime(raw.endTime);
    if (endTime === null) {
      return { success: false, error: "Invalid or missing field: endTime" };
    }

    if (
      typeof raw.oracleAddress !== "string" ||
      !ORACLE_ADDRESS_REGEX.test(raw.oracleAddress)
    ) {
      return {
        success: false,
        error: "Invalid oracle address format",
      };
    }

    const status =
      typeof raw.status === "string" && raw.status.toUpperCase() === "ACTIVE"
        ? "ACTIVE"
        : "ACTIVE";

    return {
      success: true,
      data: {
        id: raw.id,
        question: raw.question,
        endTime,
        oracleAddress: raw.oracleAddress,
        status,
        rawPayload: raw,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse market-created event: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
