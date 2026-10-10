const prisma = require('../prisma/client');

// Sabhi active quests dikhao, saath mein is user ka progress bhi
async function listQuests(req, res) {
  try {
    const userId = req.userId;

    const quests = await prisma.quest.findMany({ where: { isActive: true } });

    // Har quest ke liye is user ki progress row dhundo (agar nahi hai to bana do)
    const results = [];
    for (const quest of quests) {
      let userQuest = await prisma.userQuest.findFirst({
        where: { userId, questId: quest.id }
      });

      if (!userQuest) {
        userQuest = await prisma.userQuest.create({
          data: { userId, questId: quest.id }
        });
      }

      results.push({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        rewardAmount: quest.rewardAmount.toString(),
        targetValue: quest.targetValue,
        progress: userQuest.progress,
        status: userQuest.status
      });
    }

    res.json({ quests: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

// Jab quest complete ho jaye (progress >= target), user reward claim kar sakta hai
async function claimQuest(req, res) {
  try {
    const userId = req.userId;
    const { questId } = req.params;

    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest) {
      return res.status(404).json({ error: 'Quest nahi mila' });
    }

    const userQuest = await prisma.userQuest.findFirst({ where: { userId, questId } });
    if (!userQuest) {
      return res.status(404).json({ error: 'Quest progress nahi mila' });
    }
    if (userQuest.status === 'claimed') {
      return res.status(400).json({ error: 'Ye reward pehle hi claim ho chuka hai' });
    }
    // Server-side check - target poora hua ya nahi, client pe bharosa nahi karte
    if (quest.targetValue && userQuest.progress < quest.targetValue) {
      return res.status(400).json({ error: 'Quest abhi complete nahi hua' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.coinBalance.update({
        where: { userId },
        data: {
          balance: { increment: quest.rewardAmount },
          totalEarned: { increment: quest.rewardAmount }
        }
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'quest_reward',
          amount: quest.rewardAmount,
          balanceAfter: balance.balance
        }
      });

      const updatedUserQuest = await tx.userQuest.update({
        where: { id: userQuest.id },
        data: { status: 'claimed', claimedAt: new Date() }
      });

      return { balance, updatedUserQuest };
    }, { timeout: 10000 });

    res.json({
      message: 'Reward claim ho gaya',
      balance: result.balance.balance.toString(),
      questStatus: result.updatedUserQuest.status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

module.exports = { listQuests, claimQuest };
