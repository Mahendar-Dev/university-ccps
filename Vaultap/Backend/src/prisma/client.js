const { PrismaClient } = require('@prisma/client');

// Ek hi Prisma instance poori app mein use hogi
const prisma = new PrismaClient();

module.exports = prisma;
