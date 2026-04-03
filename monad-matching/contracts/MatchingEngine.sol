// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MatchingEngine {
    uint256 public constant MATCH_EXPIRY = 48 hours;
    int256 public constant GHOSTING_PENALTY = 1;

    struct MatchInfo {
        bool matched;
        uint256 timestamp;
        bool firstMessageSent;
        bool expired;
    }

    // A가 B를 좋아요 했는지
    mapping(address => mapping(address => bool)) public liked;

    // user1 기준 user2와의 매칭 정보
    mapping(address => mapping(address => MatchInfo)) public matches;

    // 간단한 평판 점수
    mapping(address => int256) public reputationScore;

    event Liked(address indexed from, address indexed to);
    event Matched(address indexed user1, address indexed user2, uint256 timestamp);
    event FirstMessageMarked(address indexed from, address indexed to, uint256 timestamp);
    event MatchExpired(address indexed user1, address indexed user2, uint256 timestamp);
    event ReputationChanged(address indexed user, int256 newScore);

    function likeUser(address target) external {
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
        MatchInfo storage otherMatch = matches[other][msg.sender];

        require(myMatch.matched, "Not matched");
        require(!myMatch.expired, "Match expired");
        require(!myMatch.firstMessageSent, "Already marked");

        myMatch.firstMessageSent = true;
        otherMatch.firstMessageSent = true;

        emit FirstMessageMarked(msg.sender, other, block.timestamp);
    }

    function expireMatch(address other) external {
        MatchInfo storage myMatch = matches[msg.sender][other];
        MatchInfo storage otherMatch = matches[other][msg.sender];

        require(myMatch.matched, "Not matched");
        require(!myMatch.expired, "Already expired");
        require(!myMatch.firstMessageSent, "First message already sent");
        require(
            block.timestamp >= myMatch.timestamp + MATCH_EXPIRY,
            "Match not expired yet"
        );

        myMatch.matched = false;
        myMatch.expired = true;

        otherMatch.matched = false;
        otherMatch.expired = true;

        reputationScore[msg.sender] -= GHOSTING_PENALTY;
        reputationScore[other] -= GHOSTING_PENALTY;

        emit MatchExpired(msg.sender, other, block.timestamp);
        emit ReputationChanged(msg.sender, reputationScore[msg.sender]);
        emit ReputationChanged(other, reputationScore[other]);
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