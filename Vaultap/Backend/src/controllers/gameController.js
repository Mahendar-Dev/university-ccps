const prisma = require('../prisma/client');

const COINS_PER_TAP = 1;
const ENERGY_PER_TAP = 1;

// TAP - jab user coin kamane ke liye tap kare
async function tap(req, res) {
  try {
    const userId = req.userId; // authMiddleware se aata hai

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User nahi mila' });
    }

    // Server-side check - agar energy khatam hai to tap na chalne do
    // Ye zaroori hai warna koi bhi client-side se fake taps bhej sakta hai
    if (user.energy < ENERGY_PER_TAP) {
      return res.status(400).json({ error: 'Energy khatam ho gayi, thodi der baad try karo' });
    }

    // Ek hi transaction mein energy kam karo, coin badhao, aur log entry banao
    // Isse data consistent rehta hai (sab kuch ek saath save ya kuch bhi nahi)
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { energy: user.energy - ENERGY_PER_TAP }
      });

      const balance = await tx.coinBalance.update({
        where: { userId },
        data: {
          balance: { increment: COINS_PER_TAP },
          totalEarned: { increment: COINS_PER_TAP }
        }
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'tap_earn',
          amount: COINS_PER_TAP,
          balanceAfter: balance.balance
        }
      });

      // Agar koi "milestone" type quest active hai (e.g. "500 taps karo"), uska progress badhao
      // pending status wali quests hi update hoti hain, claimed ke baad nahi
      await tx.userQuest.updateMany({
        where: {
          userId,
          status: 'pending',
          quest: { type: 'milestone' }
        },
        data: { progress: { increment: 1 } }
      });

      return { updatedUser, balance };
    }, { timeout: 20000 });

    res.json({
      balance: result.balance.balance.toString(),
      energy: result.updatedUser.energy
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

// Current balance aur energy dekhne ke liye
async function getStatus(req, res) {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { coinBalance: true }
    });

    res.json({
      balance: user.coinBalance.balance.toString(),
      energy: user.energy,
      energyMax: user.energyMax
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

module.exports = { tap, getStatus };
