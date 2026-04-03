/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONAD_RPC_URL?: string;
  /** 배포된 MatchingEngine 컨트랙트 주소 (0x + 40 hex) */
  readonly VITE_MATCHING_ENGINE_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
