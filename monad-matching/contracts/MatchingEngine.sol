// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MatchingEngine {
    uint256 public constant MATCH_EXPIRY = 48 hours;
    int256 public constant GHOSTING_PENALTY = 1;

    struct MatchInfo {
        bool matched;
        uint256 timestamp;
        /// @notice `matches[from][to]` 기준: from이 to에게 첫 메시지를 보냈는지
        bool firstMessageSent;
        bool expired;
    }

    // A가 B를 좋아요 했는지
    mapping(address => mapping(address => bool)) public liked;

    // user1 기준 user2와의 매칭 정보
    mapping(address => mapping(address => MatchInfo)) public matches;

    // 간단한 평판 점수
    mapping(address => int256) public reputationScore;

    /// @notice 온체인에 “등록된 사용자”로 표시 (MVP: 메타데이터는 오프체인)
    mapping(address => bool) public registered;

    event ProfileRegistered(address indexed user);
    event Liked(address indexed from, address indexed to);
    event Matched(address indexed user1, address indexed user2, uint256 timestamp);
    event FirstMessageMarked(address indexed from, address indexed to, uint256 timestamp);
    event MatchExpired(address indexed user1, address indexed user2, uint256 timestamp);
    event ReputationChanged(address indexed user, int256 newScore);

    function registerProfile() external {
        require(!registered[msg.sender], "Already registered");
        registered[msg.sender] = true;
        emit ProfileRegistered(msg.sender);
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
        }
        if (!otherMatch.firstMessageSent) {
            reputationScore[other] -= GHOSTING_PENALTY;
            emit ReputationChanged(other, reputationScore[other]);
        }

        emit MatchExpired(msg.sender, other, block.timestamp);
    }

    function isMatched(address user1, address user2) external view returns (bool) {
        return matches[user1][user2].matched;
    }

    function getMatchTimestamp(address user1, address user2) external view returns (uint256) {
        require(matches[user1][user2].timestamp > 0, "No match record");
        return matches[user1][user2].timestamp;
    }

    /// @notice user1이 user2에게 첫 메시지를 보냈는지 (방향 있음)
    function hasFirstMessage(address user1, address user2) external view returns (bool) {
        return matches[user1][user2].firstMessageSent;
    }

    function isExpired(address user1, address user2) external view returns (bool) {
        return matches[user1][user2].expired;
    }
}