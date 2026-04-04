pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * 비공개: balance (wei)
 * 공개: threshold — 증명 시 동일 값이 publicSignals 로 나가며, 온체인 THRESHOLD 와 일치해야 통과
 * valid === 1 인 경우만 만족 가능 (balance >= threshold)
 */
template BalanceProof() {
    signal input balance;
    signal input threshold;
    signal output valid;

    component gte = GreaterEqThan(252);
    gte.in[0] <== balance;
    gte.in[1] <== threshold;
    valid <== gte.out;

    component ok = IsZero();
    ok.in <== 1 - valid;
    ok.out === 1;
}

component main {public [threshold]} = BalanceProof();
