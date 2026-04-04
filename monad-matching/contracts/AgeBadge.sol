// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// AgeCheck: 3 public signals (isAdult, currentYear, currentMonth)
interface IAgeCheckVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[3] calldata _pubSignals
    ) external view returns (bool);
}

// AgeRange: 5 public signals (inRange, currentYear, currentMonth, ageRangeMin, ageRangeMax)
interface IAgeRangeVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[5] calldata _pubSignals
    ) external view returns (bool);
}

/// @notice 성인인증 ZKP 배지 (만 19세 이상)
contract AdultBadge {
    IAgeCheckVerifier public immutable verifier;

    uint256 public currentYear;
    uint256 public currentMonth;
    address public owner;

    mapping(address => bool) public isAdultVerified;

    event AdultVerified(address indexed user);

    constructor(address _verifier, uint256 _year, uint256 _month) {
        verifier = IAgeCheckVerifier(_verifier);
        currentYear = _year;
        currentMonth = _month;
        owner = msg.sender;
    }

    function updateCurrentDate(uint256 _year, uint256 _month) external {
        require(msg.sender == owner, "Not owner");
        require(_month >= 1 && _month <= 12, "Invalid month");
        currentYear = _year;
        currentMonth = _month;
    }

    /// pubSignals: [isAdult, currentYear, currentMonth]
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
        require(verifier.verifyProof(a, b, c, pubSignals), "Invalid proof");

        isAdultVerified[msg.sender] = true;
        emit AdultVerified(msg.sender);
    }
}

/// @notice 나이대 ZKP 배지 (10대/20대/30대 등)
contract AgeRangeBadge {
    IAgeRangeVerifier public immutable verifier;

    uint256 public currentYear;
    uint256 public currentMonth;
    address public owner;

    mapping(address => uint8) public ageRange;

    event AgeRangeVerified(address indexed user, uint8 rangeCode);

    constructor(address _verifier, uint256 _year, uint256 _month) {
        verifier = IAgeRangeVerifier(_verifier);
        currentYear = _year;
        currentMonth = _month;
        owner = msg.sender;
    }

    function updateCurrentDate(uint256 _year, uint256 _month) external {
        require(msg.sender == owner, "Not owner");
        currentYear = _year;
        currentMonth = _month;
    }

    /// pubSignals: [inRange, currentYear, currentMonth, ageRangeMin, ageRangeMax]
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
        require(verifier.verifyProof(a, b, c, pubSignals), "Invalid proof");

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
