// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[] calldata _pubSignals
    ) external view returns (bool);
}

/// @notice 성인인증 ZKP 배지 (만 19세 이상)
contract AdultBadge {
    IGroth16Verifier public immutable verifier;

    /// @dev 증명 시점의 연/월 — 배포 시 설정, 주기적으로 갱신 가능
    uint256 public currentYear;
    uint256 public currentMonth;
    address public owner;

    mapping(address => bool) public isAdultVerified;

    event AdultVerified(address indexed user);

    constructor(address _verifier, uint256 _year, uint256 _month) {
        verifier = IGroth16Verifier(_verifier);
        currentYear = _year;
        currentMonth = _month;
        owner = msg.sender;
    }

    /// @notice 체인 위 현재 연월 갱신 (owner만)
    function updateCurrentDate(uint256 _year, uint256 _month) external {
        require(msg.sender == owner, "Not owner");
        require(_month >= 1 && _month <= 12, "Invalid month");
        currentYear = _year;
        currentMonth = _month;
    }

    /// @notice 성인 증명 제출
    /// pubSignals[0] = isAdult (1이어야 함)
    /// pubSignals[1] = currentYear
    /// pubSignals[2] = currentMonth
    function claimAdultBadge(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata pubSignals
    ) external {
        require(!isAdultVerified[msg.sender], "Already verified");
        require(pubSignals[0] == 1, "Proof: not adult");
        require(pubSignals[1] == currentYear, "Wrong year");
        require(pubSignals[2] == currentMonth, "Wrong month");

        uint256[] memory signals = new uint256[](3);
        signals[0] = pubSignals[0];
        signals[1] = pubSignals[1];
        signals[2] = pubSignals[2];

        require(verifier.verifyProof(a, b, c, signals), "Invalid proof");

        isAdultVerified[msg.sender] = true;
        emit AdultVerified(msg.sender);
    }
}

/// @notice 나이대 ZKP 배지 (10대/20대/30대 등)
contract AgeRangeBadge {
    IGroth16Verifier public immutable verifier;

    uint256 public currentYear;
    uint256 public currentMonth;
    address public owner;

    // 1=10대, 2=20대, 3=30대, 4=40대, 5=50대+
    mapping(address => uint8) public ageRange;

    event AgeRangeVerified(address indexed user, uint8 rangeCode);

    constructor(address _verifier, uint256 _year, uint256 _month) {
        verifier = IGroth16Verifier(_verifier);
        currentYear = _year;
        currentMonth = _month;
        owner = msg.sender;
    }

    function updateCurrentDate(uint256 _year, uint256 _month) external {
        require(msg.sender == owner, "Not owner");
        currentYear = _year;
        currentMonth = _month;
    }

    /// @notice 나이대 증명 제출
    /// pubSignals[0] = inRange (1이어야 함)
    /// pubSignals[1] = currentYear
    /// pubSignals[2] = currentMonth
    /// pubSignals[3] = ageRangeMin
    /// pubSignals[4] = ageRangeMax
    function claimAgeRangeBadge(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[5] calldata pubSignals
    ) external {
        require(ageRange[msg.sender] == 0, "Already verified");
        require(pubSignals[0] == 1, "Proof: not in range");
        require(pubSignals[1] == currentYear, "Wrong year");
        require(pubSignals[2] == currentMonth, "Wrong month");

        uint256[] memory signals = new uint256[](5);
        for (uint i = 0; i < 5; i++) signals[i] = pubSignals[i];

        require(verifier.verifyProof(a, b, c, signals), "Invalid proof");

        uint256 minAge = pubSignals[3];
        uint8 code = minAge < 20 ? 1
                   : minAge < 30 ? 2
                   : minAge < 40 ? 3
                   : minAge < 50 ? 4
                   : 5;

        ageRange[msg.sender] = code;
        emit AgeRangeVerified(msg.sender, code);
    }
}
