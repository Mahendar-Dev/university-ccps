const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma/client');

const REFERRAL_SIGNUP_BONUS = 500; // referrer ko milta hai jab uska invite kiya banda signup kare
const REFERRED_WELCOME_BONUS = 200; // naye user ko milta hai agar wo kisi ke referral se aaya

// Naya user register karne ke liye ek chota unique referral code generate karta hai
function generateReferralCode() {
  return uuidv4().slice(0, 8).toUpperCase();
}

// SIGNUP - naya account banane ke liye
async function signup(req, res) {
  try {
    const { username, email, password, referralCode } = req.body;

    // Basic validation - zaroori fields check karo
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email aur password zaroori hain' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password kam se kam 6 characters ka hona chahiye' });
    }

    // Check karo ke username ya email pehle se to nahi hai
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Username ya email pehle se registered hai' });
    }

    // Agar referral code diya gaya hai, check karo wo valid hai ya nahi
    let referrer = null;
    if (referralCode) {
      referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (!referrer) {
        return res.status(400).json({ error: 'Referral code invalid hai' });
      }
    }

    // Password ko hash karo - kabhi bhi plain password save nahi karte
    const passwordHash = await bcrypt.hash(password, 10);

    // Sab kuch ek transaction mein karo - user banao, referral link karo, bonuses do
    // Agar beech mein kuch fail ho to sab wapas ho jayega (koi half-complete data nahi banega)
    const result = await prisma.$transaction(async (tx) => {
      const welcomeBonus = referrer ? REFERRED_WELCOME_BONUS : 0;

      const user = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          referralCode: generateReferralCode(),
          referredBy: referrer ? referrer.id : null,
          coinBalance: { create: { balance: welcomeBonus, totalEarned: welcomeBonus } }
        }
      });

      // Agar referral se aaya hai, dono ko bonus do aur record banao
      if (referrer) {
        await tx.referral.create({
          data: { referrerId: referrer.id, referredId: user.id, level: 1 }
        });

        // Naye user ko welcome bonus - transaction log ke saath
        if (welcomeBonus > 0) {
          await tx.transaction.create({
            data: {
              userId: user.id,
              type: 'referral_welcome',
              amount: welcomeBonus,
              balanceAfter: welcomeBonus
            }
          });
        }

        // Referrer ko bonus coins do
        const referrerBalance = await tx.coinBalance.update({
          where: { userId: referrer.id },
          data: {
            balance: { increment: REFERRAL_SIGNUP_BONUS },
            totalEarned: { increment: REFERRAL_SIGNUP_BONUS }
          }
        });

        await tx.transaction.create({
          data: {
            userId: referrer.id,
            type: 'referral_bonus',
            amount: REFERRAL_SIGNUP_BONUS,
            balanceAfter: referrerBalance.balance
          }
        });

        await tx.referralEarning.create({
          data: { referrerId: referrer.id, sourceUserId: user.id, amount: REFERRAL_SIGNUP_BONUS }
        });
      }

      return user;
    }, { timeout: 15000 });

    // JWT token banao taake user turant logged-in state mein aa jaye
    const token = jwt.sign({ userId: result.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account ban gaya',
      token,
      user: { id: result.id, username: result.username, referralCode: result.referralCode }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

// LOGIN - existing account mein enter karne ke liye (email + password)
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email aur password zaroori hain' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Galat email ya password' });
    }

    // Password compare karo hash se
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Galat email ya password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, referralCode: user.referralCode }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

module.exports = { signup, login };
