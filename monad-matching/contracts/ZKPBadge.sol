// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IZKVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) external view returns (bool);
}

contract ZKPBadge {
    IZKVerifier public immutable verifier;
    mapping(address => bool) public hasBadge;

    /// @notice 프론트·회로·증명에서 동일 값 사용 (10 MON)
    uint256 public constant THRESHOLD = 10 ether;

    event BadgeClaimed(address indexed user);

    constructor(address _verifier) {
        verifier = IZKVerifier(_verifier);
    }

    /// @notice `pubSignals`는 snarkjs `fullProve` 결과와 동일한 순서·값이어야 합니다 (회로 공개 입력·출력).
    function claimBadge(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata pubSignals
    ) external {
        require(!hasBadge[msg.sender], "Already has badge");

        uint256 t0 = pubSignals[0];
        uint256 t1 = pubSignals[1];
        require(
            (t0 == THRESHOLD && t1 == 1) || (t0 == 1 && t1 == THRESHOLD),
            "bad threshold/valid"
        );

        require(verifier.verifyProof(a, b, c, pubSignals), "Invalid proof");

        hasBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender);
    }
}
