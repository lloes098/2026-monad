// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IZKVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[1] calldata _pubSignals
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

    function claimBadge(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c
    ) external {
        require(!hasBadge[msg.sender], "Already has badge");

        uint256[1] memory pubSignals;
        pubSignals[0] = THRESHOLD;

        require(verifier.verifyProof(a, b, c, pubSignals), "Invalid proof");

        hasBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender);
    }
}
