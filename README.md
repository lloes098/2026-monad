# MONAD+

Wallet-native matching on Monad Testnet with ZK badges for private trust (balance & age), on-chain match economics and anti-ghosting, and optional Supabase chat.

MONAD+는 **Monad 테스트넷** 위에서 동작하는 **지갑 기반 매칭·채팅** 서비스입니다. **Circom + Groth16 영지식 증명**으로 잔액·나이 정보를 **노출하지 않고** 신뢰 배지를 만들고, **스마트 컨트랙트**로 좋아요·매칭·예치금·고스팅 페널티를 투명하게 기록합니다. 채팅은 **Supabase**(선택)로 동기화해 데모와 실사용 UX를 동시에 잡습니다.

## 서비스 개요

### 핵심 콘셉트

- **지갑이 신원**: 가입 대신 지갑 연결과 온체인 등록으로 참여를 표시합니다.
- **프라이버시 배지**: 잔액·생년월일은 공개하지 않고 **ZKP**로 “조건 충족”만 증명합니다.
- **매칭 규칙 온체인**: 상호 좋아요 시 매칭, 첫 메시지·만료·환급·슬래시를 컨트랙트가 집행합니다.
- **채팅은 가볍게**: 매칭 신뢰는 체인, 대화 저장은 **Supabase** `chat_messages`(환경 변수 있을 때).

### 서비스 플로우

1. **웰컴 / 지갑 연결**: MetaMask 등 인젝티드 지갑으로 Monad 테스트넷 연결.
2. **온체인 등록**: `MatchingEngine`에 프로필 등록(무료 또는 **0.01 MON** 예치금 등록).
3. **(선택) 배지**: 브라우저에서 **snarkjs**로 증명 생성 → `ZKPBadge` / `AdultBadge` / `AgeRangeBadge` 클레임.
4. **디스커버**: 카드 스와이프·좋아요; 카드에 **잔액·성인·나이대** 배지 표시.
5. **매칭 후 채팅**: Supabase 설정 시 스레드 키 기반 메시지 동기화; 첫 전송 시 온체인 `markFirstMessageSent` 연동.
6. **만료·평판**: 48시간 내 고스트 시 `expireMatch`로 **평판 감점·예치금 슬래시**; 양쪽 첫 메시지 완료 시 `claimRefund`.

## 기술 아키텍처

### 블록체인 스택

| 항목 | 내용 |
|------|------|
| 네트워크 | **Monad Testnet** (Chain ID: **10143**) |
| 스마트 컨트랙트 | **Solidity 0.8.28** (EVM Prague), **Hardhat 3** + **viem** |
| ZK | **Circom 2** 회로, **Groth16** 검증 컨트랙트, 프론트 **snarkjs** |
| 배포 | `npx hardhat run scripts/deploy.ts --network monadTestnet`, 나이 배지는 `scripts/deploy-age.ts` |

### 프론트엔드 스택

| 항목 | 내용 |
|------|------|
| 빌드 | **Vite 6** |
| UI | **React 19**, **TypeScript 5.8** |
| 라우팅 | **react-router-dom 7** |
| Web3 | **wagmi 2**, **viem 2**, **TanStack Query** |
| ZK 클라이언트 | **snarkjs** (`groth16.fullProve`) |
| 아이콘 | **Heroicons** |

### 백엔드 & 동기화 (선택)

| 항목 | 내용 |
|------|------|
| 메시지 저장 | **Supabase** (`chat_messages`, `thread_key` 기준) |
| 폴백 | Supabase 미설정 시 **로컬 시드 메시지**로 UI 시연 |

## 주요 기능

### Web3 통합

- **지갑 연결**: 인젝티드 지갑, Monad 테스트넷 정의(`wagmi.ts`).
- **컨트랙트 읽기/쓰기**: 등록, 좋아요, 매칭 상태, 첫 메시지, 만료, 환급, 배지 클레임.
- **환경 변수 주소**: 배포 후 출력 주소를 프론트 `.env`에 매핑.

### ZK 배지 시스템

- **잔액 배지 (`ZKPBadge`)**: 비공개 잔액으로 **≥ 10 MON** 여부만 Groth16 증명 후 온체인 검증.
- **성인 배지 (`AdultBadge`)**: 출생 연·월은 비공개, 컨트랙트의 **현재 연·월(UTC)** 과 회로 공개 입력 일치 시 성인 증명.
- **나이대 배지 (`AgeRangeBadge`)**: 구간 만족 여부만 증명 후 **코드(10대~50대+)** 로 온체인 기록.

### 매칭·경제·평판 (`MatchingEngine`)

- **좋아요 / 상호 매칭**: `likeUser` — 양방향이면 `MatchInfo` 기록 및 이벤트 발생.
- **예치금**: `registerWithDeposit` — **0.01 MON** 고정; 고스트 시 `_slashDeposit` 가능.
- **첫 메시지**: `markFirstMessageSent` — 채팅에서 첫 전송 시 트랜잭션 연동.
- **환급**: `claimRefund` — 양쪽 첫 메시지 완료 후 파트너별 1회 환급.
- **만료**: `expireMatch` — **48시간** 경과 후, 미메시지 쪽 **평판 -1** 및 예치금 슬래시.

### 채팅 & 목업

- **원격 채팅**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 시 실시간 폴링(약 12초).
- **디스커버 / 매칭 목록**: 시연용 **목업 프로필·매칭 데이터**와 온체인 액션 병행.

## 스마트 컨트랙트

### 배포 주소

배포마다 달라집니다. 아래 스크립트 실행 후 콘솔에 출력된 주소를 프론트 `.env`에 넣습니다.

- `npm run deploy` → `MatchingEngine`, `ZKPBadge`, 잔액용 `Groth16Verifier`
- `npm run deploy:age` → `AdultBadge`, `AgeRangeBadge`, 연령용 Verifier들

### 프론트 환경 변수 (`frontend/.env`)

| 변수 | 설명 |
|------|------|
| `VITE_MATCHING_ENGINE_ADDRESS` | `MatchingEngine` |
| `VITE_ZKP_BADGE_ADDRESS` | `ZKPBadge` |
| `VITE_ADULT_BADGE_ADDRESS` | `AdultBadge` |
| `VITE_AGE_RANGE_BADGE_ADDRESS` | `AgeRangeBadge` |
| `VITE_MONAD_RPC_URL` | (선택) 기본값: 공개 테스트넷 RPC |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | (선택) 채팅 동기화 |

### 컨트랙트 상수·요약

`MatchingEngine.sol`

| 상수 | 값 |
|------|-----|
| `DEPOSIT` | 0.01 ether |
| `MATCH_EXPIRY` | 48 hours |
| `GHOSTING_PENALTY` | 1 (평판) |

`ZKPBadge.sol`

| 상수 | 값 |
|------|-----|
| `THRESHOLD` | 10 ether (잔액 증명 기준, 회로·프론트와 일치 필요) |

### 주요 함수

| 컨트랙트 | 함수 | 설명 |
|----------|------|------|
| `MatchingEngine` | `registerProfile` / `registerWithDeposit` | 온체인 등록 |
| `MatchingEngine` | `likeUser` | 좋아요 및 상호 매칭 처리 |
| `MatchingEngine` | `markFirstMessageSent` | 내가 상대에게 첫 메시지 보냄 표시 |
| `MatchingEngine` | `claimRefund` | 양쪽 첫 메시지 후 예치금 환급 |
| `MatchingEngine` | `expireMatch` | 만료 시 고스트 페널티 |
| `ZKPBadge` | `claimBadge` | Groth16 증명으로 잔액 배지 |
| `AdultBadge` | `claimAdultBadge` | 성인 ZKP 클레임 |
| `AgeRangeBadge` | `claimAgeRangeBadge` | 나이대 ZKP 클레임 |

## 네트워크 정보

### Monad Testnet

| 항목 | 값 |
|------|-----|
| Chain ID | **10143** (`0x279F`) |
| RPC (기본) | `https://testnet-rpc.monad.xyz` |
| Explorer (wagmi 설정) | `https://testnet-explorer.monad.xyz` |
| Native Token | **MON** (18 decimals) |

## Circom 회로

| 회로 | 역할 |
|------|------|
| `circuits/balance_proof.circom` | 비공개 `balance`, 공개 `threshold`, `balance >= threshold` 제약 |
| `contracts/age_check.circom` | 만 19세 이상 여부 (`isAdult`) |
| `contracts/age_range.circom` | 선택 나이 구간 만족 여부 |

빌드: 루트에서 `npm run zkp:build`, 나이 회로는 `npm run zkp:build:age` — 생성물을 프론트 `public/zkp` 등에 두고 시연합니다.

## 프로젝트 구조

```text
monad-matching/
├── README.md                 # 본 문서
├── hardhat.config.ts         # 네트워크·Solidity 프로파일
├── package.json              # 루트 스크립트 (deploy, zkp:build)
├── contracts/                # Solidity + 일부 .circom
│   ├── MatchingEngine.sol
│   ├── ZKPBadge.sol
│   ├── AgeBadge.sol
│   ├── Groth16Verifier.sol / AgeCheckVerifier.sol / AgeRangeVerifier.sol
│   ├── age_check.circom
│   └── age_range.circom
├── circuits/
│   └── balance_proof.circom
├── scripts/
│   ├── deploy.ts             # MatchingEngine + ZKPBadge + balance verifier
│   ├── deploy-age.ts         # AdultBadge + AgeRangeBadge + age verifiers
│   ├── zkp-build.sh
│   └── zkp-build-age.sh
├── test/
│   └── Matching.ts           # 매칭 엔진 테스트
└── frontend/                 # Vite + React 앱
    ├── src/
    │   ├── pages/            # Discover, Chats, Matches, Chat, Profile, Welcome …
    │   ├── hooks/            # useMatchingEngine, useZKPBadge, useAgeBadge, …
    │   ├── abis/
    │   ├── lib/              # contracts, supabaseClient, zkpConstants, …
    │   └── wagmi.ts
    └── public/zkp/           # wasm / zkey (빌드 산출물)
```

## Monad 블록체인 활용

- **EVM 호환**: Hardhat·viem·wagmi 등 기존 스택으로 빠른 이터레이션.
- **테스트넷 실거래**: 좋아요·배지·예치금·환급을 **실제 트랜잭션**으로 시연 가능.
- **저비용 상호작용 설계**: 매칭 상태는 온체인에 두고, 채팅 페이로드는 오프체인으로 분리해 **가스와 UX** 균형.

## 차별화 포인트

1. **프라이버시 친화 신뢰**: 금액·생년월일을 올리지 않고 **ZK**로 “조건만” 공개.
2. **고스팅 비용화**: 시간 제한 + 예치금 + 평판으로 **약속 이행** 인센티브.
3. **풀스택 데모**: 온체인 매칭 + (선택) Supabase 채팅 + 목업 디스커버로 **심사위원이 바로 따라하기 좋은** 플로우.
4. **검증 가능한 규칙**: 매칭·만료·슬래시·환급이 **컨트랙트 코드**에 고정.

## 로컬 실행

```bash
# 의존성 (루트 + 프론트)
cd monad-matching && npm install
cd frontend && npm install && cd ..

# ZKP 아티팩트 (잔액 회로)
npm run zkp:build

# 프론트
npm run frontend:dev
```

루트 `.env`에 `MONAD_RPC_URL`, `PRIVATE_KEY` 등을 설정한 뒤 `npm run deploy`로 배포하고, 출력 주소를 `frontend/.env`에 반영합니다.

## 라이브 데모

- 배포 URL: _(Vercel 등 배포 후 기입)_
- 준비물: MetaMask, Monad 테스트넷, 테스트 **MON**, (선택) Supabase 프로젝트

**권장 시연 순서**: 지갑 연결 → 등록(또는 예치 등록) → ZKP 배지 1개 → 디스커버에서 좋아요 → 매칭 후 채팅 → 첫 메시지 온체인 표시.

## 라이선스

ISC (루트 `package.json` 기준). 서브모듈·벤더(`circom` 등)는 각자 라이선스를 따릅니다.

---

**MONAD+** — Monad 위에서 **신뢰는 증명으로, 약속은 컨트랙트로.**
