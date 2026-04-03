import type { SupabaseClient } from "@supabase/supabase-js";

import { MOCK_PROFILES } from "../data/mock";
import { shortAddress } from "./formatAddress";
import { formatRelativeTimeKo } from "./formatRelativeTimeKo";

export type InboxThreadRow = {
  threadKey: string;
  peerAddress: `0x${string}`;
  peerName: string;
  lastPreview: string;
  timeLabel: string;
  lastAtIso: string;
};

function peerNameForAddress(peerLower: string): string {
  const p = MOCK_PROFILES.find(
    (x) => x.targetAddress.toLowerCase() === peerLower,
  );
  return p?.name ?? shortAddress(peerLower);
}

function otherAddressInThread(threadKey: string, myLower: string): `0x${string}` | null {
  const parts = threadKey.split(":");
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (a === myLower) return b as `0x${string}`;
  if (b === myLower) return a as `0x${string}`;
  return null;
}

/**
 * 내 주소가 포함된 thread_key의 메시지를 Supabase에서 가져와 스레드별 최신 미리보기 목록으로 만듭니다.
 */
export async function loadChatInboxThreads(
  sb: SupabaseClient,
  myAddressLower: string,
): Promise<{ threads: InboxThreadRow[]; error: string | null }> {
  const my = myAddressLower.toLowerCase();
  const sel =
    "id, thread_key, body, created_at, sender_address";

  const [r1, r2] = await Promise.all([
    sb.from("chat_messages").select(sel).like("thread_key", `${my}:%`),
    sb.from("chat_messages").select(sel).like("thread_key", `%:${my}`),
  ]);

  if (r1.error) {
    console.error("[chats] Supabase inbox (prefix)", r1.error);
    return {
      threads: [],
      error: r1.error.message,
    };
  }
  if (r2.error) {
    console.error("[chats] Supabase inbox (suffix)", r2.error);
    return {
      threads: [],
      error: r2.error.message,
    };
  }

  const byId = new Map<
    string,
    {
      thread_key: string;
      body: string;
      created_at: string;
    }
  >();
  for (const row of [...(r1.data ?? []), ...(r2.data ?? [])]) {
    const r = row as {
      id: string;
      thread_key: string;
      body: string;
      created_at: string;
    };
    byId.set(r.id, r);
  }

  const latestByThread = new Map<
    string,
    { body: string; created_at: string }
  >();
  for (const row of byId.values()) {
    const prev = latestByThread.get(row.thread_key);
    const t = new Date(row.created_at).getTime();
    if (!prev || t > new Date(prev.created_at).getTime()) {
      latestByThread.set(row.thread_key, {
        body: row.body,
        created_at: row.created_at,
      });
    }
  }

  const threads: InboxThreadRow[] = [];
  for (const [threadKey, last] of latestByThread) {
    const peer = otherAddressInThread(threadKey, my);
    if (!peer) continue;
    threads.push({
      threadKey,
      peerAddress: peer,
      peerName: peerNameForAddress(peer),
      lastPreview: last.body,
      timeLabel: formatRelativeTimeKo(last.created_at),
      lastAtIso: last.created_at,
    });
  }

  threads.sort(
    (a, b) =>
      new Date(b.lastAtIso).getTime() - new Date(a.lastAtIso).getTime(),
  );

  return { threads, error: null };
}
