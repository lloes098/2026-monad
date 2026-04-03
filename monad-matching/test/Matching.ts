import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("MatchingEngine", function () {
  it("서로 좋아요하면 매칭되어야 한다", async function () {
    const { viem } = await network.connect();

    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.likeUser([user2.account.address], {
      account: user1.account,
    });

    await contract.write.likeUser([user1.account.address], {
      account: user2.account,
    });

    const matched1 = await contract.read.isMatched([
      user1.account.address,
      user2.account.address,
    ]);

    const matched2 = await contract.read.isMatched([
      user2.account.address,
      user1.account.address,
    ]);

    assert.equal(matched1, true);
    assert.equal(matched2, true);

    const timestamp = await contract.read.getMatchTimestamp([
      user1.account.address,
      user2.account.address,
    ]);

    assert.ok(Number(timestamp) > 0);
  });

  it("한쪽만 좋아요하면 매칭되면 안 된다", async function () {
    const { viem } = await network.connect();

    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.likeUser([user2.account.address], {
      account: user1.account,
    });

    const matched = await contract.read.isMatched([
      user1.account.address,
      user2.account.address,
    ]);

    assert.equal(matched, false);
  });

  it("첫 메시지를 보내면 firstMessageSent가 true가 되어야 한다", async function () {
    const { viem } = await network.connect();

    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.likeUser([user2.account.address], {
      account: user1.account,
    });

    await contract.write.likeUser([user1.account.address], {
      account: user2.account,
    });

    await contract.write.markFirstMessageSent([user2.account.address], {
      account: user1.account,
    });

    const sent = await contract.read.hasFirstMessage([
      user1.account.address,
      user2.account.address,
    ]);

    assert.equal(sent, true);
  });

  it("48시간이 지나고 첫 메시지가 없으면 매칭이 만료되어야 한다", async function () {
    const { viem } = await network.connect();

    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.likeUser([user2.account.address], {
      account: user1.account,
    });

    await contract.write.likeUser([user1.account.address], {
      account: user2.account,
    });

    await publicClient.transport.request({
      method: "evm_increaseTime",
      params: [48 * 60 * 60 + 1],
    });

    await publicClient.transport.request({
      method: "evm_mine",
      params: [],
    });

    await contract.write.expireMatch([user2.account.address], {
      account: user1.account,
    });

    const matched = await contract.read.isMatched([
      user1.account.address,
      user2.account.address,
    ]);

    const expired = await contract.read.isExpired([
      user1.account.address,
      user2.account.address,
    ]);

    const rep1 = await contract.read.reputationScore([user1.account.address]);
    const rep2 = await contract.read.reputationScore([user2.account.address]);

    assert.equal(matched, false);
    assert.equal(expired, true);
    assert.equal(Number(rep1), -1);
    assert.equal(Number(rep2), -1);
  });

  it("첫 메시지를 보냈으면 만료되면 안 된다", async function () {
    const { viem } = await network.connect();

    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.likeUser([user2.account.address], {
      account: user1.account,
    });

    await contract.write.likeUser([user1.account.address], {
      account: user2.account,
    });

    await contract.write.markFirstMessageSent([user2.account.address], {
      account: user1.account,
    });

    await publicClient.transport.request({
      method: "evm_increaseTime",
      params: [48 * 60 * 60 + 1],
    });

    await publicClient.transport.request({
      method: "evm_mine",
      params: [],
    });

    let reverted = false;

    try {
      await contract.write.expireMatch([user2.account.address], {
        account: user1.account,
      });
    } catch {
      reverted = true;
    }

    assert.equal(reverted, true);
  });
});
