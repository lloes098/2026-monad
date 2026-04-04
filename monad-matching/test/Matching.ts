import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("MatchingEngine", function () {
  it("등록하지 않으면 좋아요할 수 없다", async function () {
    const { viem } = await network.connect();

    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    let reverted = false;
    try {
      await contract.write.likeUser([user2.account.address], {
        account: user1.account,
      });
    } catch {
      reverted = true;
    }

    assert.equal(reverted, true);
  });

  it("서로 좋아요하면 매칭되어야 한다", async function () {
    const { viem } = await network.connect();

    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.registerProfile({ account: user1.account });
    await contract.write.registerProfile({ account: user2.account });

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

    await contract.write.registerProfile({ account: user1.account });
    await contract.write.registerProfile({ account: user2.account });

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

    await contract.write.registerProfile({ account: user1.account });
    await contract.write.registerProfile({ account: user2.account });

    await contract.write.likeUser([user2.account.address], {
      account: user1.account,
    });

    await contract.write.likeUser([user1.account.address], {
      account: user2.account,
    });

    await contract.write.markFirstMessageSent([user2.account.address], {
      account: user1.account,
    });

    const sent12 = await contract.read.hasFirstMessage([
      user1.account.address,
      user2.account.address,
    ]);

    const sent21 = await contract.read.hasFirstMessage([
      user2.account.address,
      user1.account.address,
    ]);

    assert.equal(sent12, true);
    assert.equal(sent21, false);
  });

  it("48시간이 지나고 첫 메시지가 없으면 매칭이 만료되어야 한다", async function () {
    const { viem } = await network.connect();

    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.registerProfile({ account: user1.account });
    await contract.write.registerProfile({ account: user2.account });

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

  it("한쪽만 첫 메시지를 보냈으면 48시간 후 상대만 평판이 깎인다", async function () {
    const { viem } = await network.connect();

    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.registerProfile({ account: user1.account });
    await contract.write.registerProfile({ account: user2.account });

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

    await contract.write.expireMatch([user2.account.address], {
      account: user1.account,
    });

    const rep1 = await contract.read.reputationScore([user1.account.address]);
    const rep2 = await contract.read.reputationScore([user2.account.address]);

    assert.equal(Number(rep1), 0);
    assert.equal(Number(rep2), -1);
  });

  it("양쪽 모두 첫 메시지를 보냈으면 고스팅 만료를 호출할 수 없다", async function () {
    const { viem } = await network.connect();

    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    const user1 = walletClients[0];
    const user2 = walletClients[1];

    const contract = await viem.deployContract("MatchingEngine");

    await contract.write.registerProfile({ account: user1.account });
    await contract.write.registerProfile({ account: user2.account });

    await contract.write.likeUser([user2.account.address], {
      account: user1.account,
    });

    await contract.write.likeUser([user1.account.address], {
      account: user2.account,
    });

    await contract.write.markFirstMessageSent([user2.account.address], {
      account: user1.account,
    });

    await contract.write.markFirstMessageSent([user1.account.address], {
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
