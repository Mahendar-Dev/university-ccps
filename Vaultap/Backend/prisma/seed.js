// Ye script database mein shuruaati quests daal deta hai (20+ quests, mix of daily/milestone/social)
// Chalane ka tareeka: node prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quests = [
    // Daily quests - roz reset hoti hain, user har din nayi milti hain
    { title: 'Daily Login', description: 'Login karo aaj aur bonus paao', type: 'daily', rewardAmount: 50, resetInterval: 'daily' },
    { title: 'Login Streak - 3 Days', description: '3 din lagatar login karo', type: 'daily', rewardAmount: 150, resetInterval: 'daily' },
    { title: 'Login Streak - 7 Days', description: '7 din lagatar login karo', type: 'daily', rewardAmount: 500, resetInterval: 'daily' },
    { title: 'Morning Tap', description: 'Subah sabse pehle tap karo', type: 'daily', rewardAmount: 30, resetInterval: 'daily' },
    { title: 'Evening Tap', description: 'Shaam ko tap karke aao', type: 'daily', rewardAmount: 30, resetInterval: 'daily' },
    { title: 'Daily Check-in', description: 'Roz app kholo', type: 'daily', rewardAmount: 20, resetInterval: 'daily' },
    { title: 'Weekend Bonus', description: 'Weekend pe login karo', type: 'daily', rewardAmount: 100, resetInterval: 'daily' },

    // Milestone quests - tap count based
    { title: '100 Taps', description: 'Aaj 100 baar tap karo', type: 'milestone', rewardAmount: 60, targetValue: 100, resetInterval: 'daily' },
    { title: '250 Taps', description: 'Aaj 250 baar tap karo', type: 'milestone', rewardAmount: 150, targetValue: 250, resetInterval: 'daily' },
    { title: '500 Taps', description: 'Aaj 500 baar tap karo', type: 'milestone', rewardAmount: 300, targetValue: 500, resetInterval: 'daily' },
    { title: '1000 Taps', description: 'Aaj 1000 baar tap karo', type: 'milestone', rewardAmount: 700, targetValue: 1000, resetInterval: 'daily' },
    { title: '2000 Taps Challenge', description: 'Ek din mein 2000 taps ka challenge', type: 'milestone', rewardAmount: 1500, targetValue: 2000, resetInterval: 'daily' },
    { title: 'Tap Master', description: 'Total 5000 taps ka milestone', type: 'milestone', rewardAmount: 3000, targetValue: 5000, resetInterval: 'once' },
    { title: 'Tap Legend', description: 'Total 10000 taps ka milestone', type: 'milestone', rewardAmount: 6000, targetValue: 10000, resetInterval: 'once' },

    // Social quests - one-time tasks
    { title: 'Join Telegram Channel', description: 'Hamare official Telegram channel join karo', type: 'social', rewardAmount: 100, resetInterval: 'once' },
    { title: 'Follow on Twitter/X', description: 'Vaultap ko Twitter pe follow karo', type: 'social', rewardAmount: 100, resetInterval: 'once' },
    { title: 'Join Discord Server', description: 'Community Discord join karo', type: 'social', rewardAmount: 120, resetInterval: 'once' },
    { title: 'Subscribe on YouTube', description: 'YouTube channel subscribe karo', type: 'social', rewardAmount: 100, resetInterval: 'once' },
    { title: 'Share on Facebook', description: 'Vaultap ko Facebook pe share karo', type: 'social', rewardAmount: 80, resetInterval: 'once' },
    { title: 'Invite 1 Friend', description: 'Apne referral code se 1 dost ko invite karo', type: 'social', rewardAmount: 200, resetInterval: 'once' },
    { title: 'Invite 5 Friends', description: 'Apne referral code se 5 dost invite karo', type: 'social', rewardAmount: 1000, resetInterval: 'once' },
    { title: 'Connect Wallet', description: 'Apna crypto wallet connect karo', type: 'social', rewardAmount: 150, resetInterval: 'once' },
    { title: 'First Conversion', description: 'Pehli baar coins ko USDT mein convert karo', type: 'social', rewardAmount: 100, resetInterval: 'once' },
    { title: 'Complete Your Profile', description: 'Apni profile poori karo', type: 'social', rewardAmount: 50, resetInterval: 'once' },
    { title: 'Leave a Review', description: 'App store pe review chhodo', type: 'social', rewardAmount: 150, resetInterval: 'once' },
  ];

  for (const q of quests) {
    await prisma.quest.create({ data: q });
  }

  console.log(`${quests.length} quests seed ho gayi!`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
