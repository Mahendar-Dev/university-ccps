const prisma = require('../prisma/client');

// User ka apna referral code aur kitne log invite hue, dikhata hai
async function getMyReferrals(req, res) {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Jitne log is user ne invite kiye hain unki list
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referred: { select: { username: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Referral se ab tak kitne coins kamaye
    const earnings = await prisma.referralEarning.aggregate({
      where: { referrerId: userId },
      _sum: { amount: true }
    });

    res.json({
      referralCode: user.referralCode,
      totalInvited: referrals.length,
      totalEarned: (earnings._sum.amount || 0).toString(),
      invitedUsers: referrals.map((r) => ({
        username: r.referred.username,
        joinedAt: r.referred.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

module.exports = { getMyReferrals };
