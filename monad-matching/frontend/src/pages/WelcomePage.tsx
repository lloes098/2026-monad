import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";

import { WalletConnectButton } from "../components/WalletConnectButton";

/** 지갑 연결 전용 랜딩 (탭바 없음) */
export function WelcomePage() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) navigate("/", { replace: true });
  }, [isConnected, navigate]);

  return (
    <div className="welcome">
      <div className="welcome__inner">
        <p className="welcome__logo">monad+</p>
        <h1 className="welcome__h">매칭을 시작해 볼까요?</h1>
        <p className="welcome__lede">
          지갑을 연결한 뒤 <strong>온체인 등록</strong>으로 참가를 표시하고, 좋아요와
          매칭을 기록해요.
        </p>
        <div className="welcome__cta">
          <WalletConnectButton />
        </div>
        <p className="welcome__skip">
          <Link to="/" className="welcome__link">
            일단 둘러보기 →
          </Link>
        </p>
      </div>
    </div>
  );
}
