import type { LiveClientAllGameData } from "./types.js";

export async function fetchLiveClientData(
  url: string
): Promise<LiveClientAllGameData> {
  const response = await fetch(url, {
    // Live Client API는 로컬 HTTPS 인증서 문제 때문에 Node 환경에서 실패할 수 있음
  });

  if (!response.ok) {
    throw new Error(`Live Client API request failed: ${response.status}`);
  }

  return response.json() as Promise<LiveClientAllGameData>;
}