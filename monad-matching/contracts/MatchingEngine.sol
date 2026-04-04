// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MatchingEngine {
    uint256 public constant MATCH_EXPIRY = 48 hours;
    int256 public constant GHOSTING_PENALTY = 1;
    uint256 public constant DEPOSIT = 0.01 ether;

    struct MatchInfo {
        bool matched;
        uint256 timestamp;
        bool firstMessageSent;
        bool expired;
    }

    mapping(address => mapping(address => bool)) public liked;
    mapping(address => mapping(address => MatchInfo)) public matches;
    mapping(address => int256) public reputationScore;
    mapping(address => bool) public registered;

    // Escrow
    mapping(address => uint256) public deposits;
    mapping(address => mapping(address => bool)) public refunded;

    event ProfileRegistered(address indexed user);
    event Liked(address indexed from, address indexed to);
    event Matched(address indexed user1, address indexed user2, uint256 timestamp);
    event FirstMessageMarked(address indexed from, address indexed to, uint256 timestamp);
    event MatchExpired(address indexed user1, address indexed user2, uint256 timestamp);
    event ReputationChanged(address indexed user, int256 newScore);
    event Deposited(address indexed user, uint256 amount);
    event Refunded(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount);

    /// @notice 예치금 없이 등록 (하위 호환)
    function registerProfile() external {
        require(!registered[msg.sender], "Already registered");
        registered[msg.sender] = true;
        emit ProfileRegistered(msg.sender);
    }

    /// @notice 예치금과 함께 등록 (DEPOSIT = 0.01 MON)
    function registerWithDeposit() external payable {
        require(!registered[msg.sender], "Already registered");
        require(msg.value == DEPOSIT, "Wrong deposit amount");
        registered[msg.sender] = true;
        deposits[msg.sender] += msg.value;
        emit ProfileRegistered(msg.sender);
        emit Deposited(msg.sender, msg.value);
    }

    function likeUser(address target) external {
        require(registered[msg.sender], "Not registered");
        require(target != address(0), "Invalid address");
        require(target != msg.sender, "Cannot like yourself");
        require(!liked[msg.sender][target], "Already liked");

        liked[msg.sender][target] = true;
        emit Liked(msg.sender, target);

        if (liked[target][msg.sender]) {
            uint256 matchedAt = block.timestamp;

            matches[msg.sender][target] = MatchInfo({
                matched: true,
                timestamp: matchedAt,
                firstMessageSent: false,
                expired: false
            });

            matches[target][msg.sender] = MatchInfo({
                matched: true,
                timestamp: matchedAt,
                firstMessageSent: false,
                expired: false
            });

            emit Matched(msg.sender, target, matchedAt);
        }
    }

    function markFirstMessageSent(address other) external {
        MatchInfo storage myMatch = matches[msg.sender][other];

        require(myMatch.matched, "Not matched");
        require(!myMatch.expired, "Match expired");
        require(!myMatch.firstMessageSent, "Already marked");

        myMatch.firstMessageSent = true;
        emit FirstMessageMarked(msg.sender, other, block.timestamp);
    }

    /// @notice 매칭 + 양쪽 첫 메시지 확인 후 예치금 환급
    function claimRefund(address partner) external {
        require(matches[msg.sender][partner].matched, "Not matched");
        require(matches[msg.sender][partner].firstMessageSent, "You haven't sent first message");
        require(matches[partner][msg.sender].firstMessageSent, "Partner hasn't sent first message");
        require(!refunded[msg.sender][partner], "Already refunded");
        require(deposits[msg.sender] > 0, "No deposit to refund");

        refunded[msg.sender][partner] = true;
        uint256 amount = deposits[msg.sender];
        deposits[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Refund failed");
        emit Refunded(msg.sender, amount);
    }

    function expireMatch(address other) external {
        MatchInfo storage myMatch = matches[msg.sender][other];
        MatchInfo storage otherMatch = matches[other][msg.sender];

        require(myMatch.matched, "Not matched");
        require(!myMatch.expired, "Already expired");
        require(
            !(myMatch.firstMessageSent && otherMatch.firstMessageSent),
            "Both messaged"
        );
        require(
            block.timestamp >= myMatch.timestamp + MATCH_EXPIRY,
            "Match not expired yet"
        );

        myMatch.matched = false;
        myMatch.expired = true;
        otherMatch.matched = false;
        otherMatch.expired = true;

        if (!myMatch.firstMessageSent) {
            reputationScore[msg.sender] -= GHOSTING_PENALTY;
            emit ReputationChanged(msg.sender, reputationScore[msg.sender]);
            _slashDeposit(msg.sender);
        }
        if (!otherMatch.firstMessageSent) {
            reputationScore[other] -= GHOSTING_PENALTY;
            emit ReputationChanged(other, reputationScore[other]);
            _slashDeposit(other);
        }

        emit MatchExpired(msg.sender, other, block.timestamp);
    }

    function _slashDeposit(address ghoster) internal {
        uint256 amount = deposits[ghoster];
        if (amount == 0) return;
        deposits[ghoster] = 0;
        // 예치금 소각 (컨트랙트에 잠금)
        emit Slashed(ghoster, amount);
    }

    function isMatched(address user1, address user2) external view returns (bool) {
        return matches[user1][user2].matched;
    }

    function getMatchTimestamp(address user1, address user2) external view returns (uint256) {
        require(matches[user1][user2].timestamp > 0, "No match record");
        return matches[user1][user2].timestamp;
    }

    function hasFirstMessage(address user1, address user2) external view returns (bool) {
        return matches[user1][user2].firstMessageSent;
    }

    function isExpired(address user1, address user2) external view returns (bool) {
        return matches[user1][user2].expired;
    }
}
