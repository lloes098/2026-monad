import { Link } from "react-router-dom";
import { useAccount, useWriteContract, useReadContract } from "wagmi";

import { matchingEngineAbi } from "../abis/matchingEngine";
import { useMyMatches, type OnChainMatch } from "../hooks/useMyMatches";
import { getMatchingEngineAddress } from "../lib/contracts";
import type { Address } from "viem";

function statusLabel(status: OnChainMatch["status"]) {
  switch (status) {
    case "messaged":
      return "첫 메시지 완료";
    case "active":
      return "응답 대기";
    case "expired":
      return "만료";
  }
}

function RefundButton({ peerAddress, contractAddress }: { peerAddress: Address; contractAddress: Address }) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const { data: myDeposit } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "deposits",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: alreadyRefunded } = useReadContract({
    address: contractAddress,
    abi: matchingEngineAbi,
    functionName: "refunded",
    args: address ? [address, peerAddress] : undefined,
    query: { enabled: Boolean(address) },
  });

  if (!myDeposit || myDeposit === 0n || alreadyRefunded) return null;

  return (
    <button
      type="button"
      className="btn btn--outline btn--full"
      disabled={isPending}
      onClick={() =>
        writeContract({
          address: contractAddress,
          abi: matchingEngineAbi,
          functionName: "claimRefund",
          args: [peerAddress],
        })
      }
    >
      {isPending ? "환급 중…" : "예치금 환급 받기"}
    </button>
  );
}

export function MatchesPage() {
  const { isConnected } = useAccount();
  const contractAddress = getMatchingEngineAddress();
  const { matches, loading, error, refetch } = useMyMatches();

  return (
    <div className="page">
      <div className="page__hero">
        <h1 className="page__h">매칭</h1>
        <p className="page__lede">
          48시간 내 첫 메시지가 없으면 양쪽 평판이 감소해요.
        </p>
      </div>

      {!isConnected ? (
        <p className="banner banner--warn">지갑을 연결하면 온체인 매칭 목록이 표시돼요.</p>
      ) : !contractAddress ? (
        <p className="banner banner--warn">
          VITE_MATCHING_ENGINE_ADDRESS 가 설정되지 않아 매칭 목록을 불러올 수 없어요.
        </p>
      ) : loading ? (
        <p className="empty-state">매칭 목록 불러오는 중…</p>
      ) : error ? (
        <div>
          <p className="banner banner--warn">{error}</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void refetch()}
          >
            다시 시도
          </button>
        </div>
      ) : matches.length === 0 ? (
        <p className="empty-state">아직 매칭이 없어요. 발견 탭에서 좋아요를 보내보세요.</p>
      ) : (
        <ul className="match-list">
          {matches.map((m) => (
            <li key={m.peerAddress} className="match-card">
              <div className="match-card__row">
                <div>
                  <p className="match-card__name">{m.peerName}</p>
                  <p className="match-card__addr">{m.peerAddress}</p>
                </div>
                <span
                  className={`pill pill--${m.status === "expired" ? "muted" : "accent"}`}
                >
                  {statusLabel(m.status)}
                </span>
              </div>

              <div className="match-card__meta">
                <span>매칭 {m.matchedAtLabel}</span>
                {!m.expired ? (
                  <span>
                    내 첫 메시지{" "}
                    {m.iSentFirst ? "온체인 기록됨" : "아직"}
                    {" · "}
                    상대방{" "}
                    {m.peerSentFirst ? "기록됨" : "아직"}
                  </span>
                ) : (
                  <span>만료 처리됨</span>
                )}
              </div>

              {!m.expired ? (
                <div className="timer">
                  <div className="timer__labels">
                    <span>48시간 윈도우</span>
                    <span>{m.timeLeftPercent}% 남음</span>
                  </div>
                  <div className="timer__track">
                    <div
                      className="timer__fill"
                      style={{ width: `${m.timeLeftPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="match-card__note">
                  고스트 방지: 양쪽 평판 <strong>−1</strong>
                </p>
              )}

              {!m.expired ? (
                <div className="match-card__actions">
                  <Link
                    className="btn btn--outline btn--full"
                    to={`/chat/${m.peerAddress}`}
                  >
                    채팅 열기
                  </Link>
                  {m.iSentFirst && m.peerSentFirst && contractAddress && (
                    <RefundButton
                      peerAddress={m.peerAddress}
                      contractAddress={contractAddress}
                    />
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
