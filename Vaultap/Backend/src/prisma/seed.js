// Ye script database mein kuch shuruaati quests daal deta hai
// Chalane ka tareeka: node prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quests = [
    {
      title: 'Login Streak',
      description: 'Aaj login karo aur bonus paao',
      type: 'daily',
      rewardAmount: 50,
      resetInterval: 'daily'
    },
    {
      title: '500 Taps',
      description: 'Aaj 500 baar tap karo',
      type: 'milestone',
      rewardAmount: 300,
      targetValue: 500,
      resetInterval: 'daily'
    },
    {
      title: 'Join Telegram Channel',
      description: 'Hamare official Telegram channel join karo',
      type: 'social',
      rewardAmount: 100,
      resetInterval: 'once'
    }
  ];

  for (const q of quests) {
    await prisma.quest.create({ data: q });
  }

  console.log('Quests seed ho gayi!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
