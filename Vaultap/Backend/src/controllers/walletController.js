const crypto = require('crypto');
const prisma = require('../prisma/client');
const { mintTokens } = require('../blockchain/vaultCoin');

// Conversion rate aur fees - ek jagah define kiye hain taake aasani se badal sakein
const COINS_PER_USDT = 1000;      // 1000 coins = 1 USDT
const CONVERSION_FEE_PERCENT = 3; // coins -> USDT convert karne pe 3% fee
const WITHDRAWAL_FEE_PERCENT = 1; // USDT -> wallet bhejte waqt 1% fee

// WALLET CONNECT - user apna MetaMask address save kare
async function connectWallet(req, res) {
  try {
    const userId = req.userId;
    const { walletAddress } = req.body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Wallet address invalid hai' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { walletAddress }
    });

    res.json({ message: 'Wallet connect ho gaya', walletAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

// WALLET STATUS - connected address aur USDT balance dikhao
async function getWalletStatus(req, res) {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { coinBalance: true }
    });

    res.json({
      walletAddress: user.walletAddress,
      coinBalance: user.coinBalance.balance.toString(),
      usdtBalance: user.coinBalance.usdtBalance.toString(),
      conversionRate: COINS_PER_USDT,
      conversionFeePercent: CONVERSION_FEE_PERCENT,
      withdrawalFeePercent: WITHDRAWAL_FEE_PERCENT
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

// CONVERT - coins ko USDT mein convert karo, fee kaat kar
async function convertCoins(req, res) {
  try {
    const userId = req.userId;
    const { coinAmount } = req.body;
    const amount = Number(coinAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid coin amount daalo' });
    }

    const coinBalance = await prisma.coinBalance.findUnique({ where: { userId } });
    if (BigInt(amount) > coinBalance.balance) {
      return res.status(400).json({ error: 'Itne coins tumhare paas nahi hain' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Calculation: coins -> USDT (fee minus karke)
    const grossUsdt = amount / COINS_PER_USDT;
    const feeAmount = grossUsdt * (CONVERSION_FEE_PERCENT / 100);
    const netUsdt = grossUsdt - feeAmount;

    const result = await prisma.$transaction(async (tx) => {
      const updatedBalance = await tx.coinBalance.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          totalConverted: { increment: amount },
          usdtBalance: { increment: netUsdt }
        }
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'conversion',
          amount: -amount,
          balanceAfter: updatedBalance.balance
        }
      });

      const conversion = await tx.conversion.create({
        data: {
          userId,
          coinAmount: amount,
          usdtAmount: netUsdt,
          feePercent: CONVERSION_FEE_PERCENT,
          feeAmount,
          status: 'completed'
        }
      });

      return { updatedBalance, conversion };
    }, { timeout: 20000 });

    // Agar user ne wallet connect kar rakha hai, real Sepolia blockchain transaction
    // bhejo jo unke wallet mein VaultCoin tokens mint kare (netUsdt ke barabar)
    let onChainTxHash = null;
    console.log('Wallet address:', user.walletAddress);
    if (user.walletAddress) {
      try {
        console.log('Minting shuru ho raha hai...');
        const mintResult = await mintTokens(user.walletAddress, netUsdt);
        console.log('Mint successful, tx hash:', mintResult.txHash);
        onChainTxHash = mintResult.txHash;
        await prisma.conversion.update({
          where: { id: result.conversion.id },
          data: { onChainTxHash }
        });
      } catch (chainErr) {
        console.error('On-chain mint fail hua:', chainErr.message);
      }
    }

    res.json({
      message: 'Conversion ho gaya',
      coinBalance: result.updatedBalance.balance.toString(),
      usdtBalance: result.updatedBalance.usdtBalance.toString(),
      onChainTxHash,
      converted: {
        coinAmount: amount,
        feeAmount: feeAmount.toFixed(6),
        netUsdt: netUsdt.toFixed(6)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

// WITHDRAW - USDT ko connected wallet mein bhejo (abhi simulated hai)
async function withdraw(req, res) {
  try {
    const userId = req.userId;
    const { usdtAmount } = req.body;
    const amount = Number(usdtAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid USDT amount daalo' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { coinBalance: true }
    });

    if (!user.walletAddress) {
      return res.status(400).json({ error: 'Pehle apna wallet connect karo' });
    }

    const currentUsdt = Number(user.coinBalance.usdtBalance);
    if (amount > currentUsdt) {
      return res.status(400).json({ error: 'Itna USDT tumhare paas nahi hai' });
    }

    const feeAmount = amount * (WITHDRAWAL_FEE_PERCENT / 100);
    const netAmount = amount - feeAmount;
    const fakeTxHash = '0x' + crypto.randomBytes(32).toString('hex');

    const result = await prisma.$transaction(async (tx) => {
      const updatedBalance = await tx.coinBalance.update({
        where: { userId },
        data: { usdtBalance: { decrement: amount } }
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          toWalletAddress: user.walletAddress,
          usdtAmount: netAmount,
          feeAmount,
          txHash: fakeTxHash,
          status: 'completed'
        }
      });

      return { updatedBalance, withdrawal };
    }, { timeout: 20000 });

    res.json({
      message: 'Withdrawal complete (simulated - real blockchain send abhi implement nahi hui)',
      usdtBalance: result.updatedBalance.usdtBalance.toString(),
      withdrawal: {
        netAmount: netAmount.toFixed(6),
        feeAmount: feeAmount.toFixed(6),
        txHash: fakeTxHash,
        toWalletAddress: user.walletAddress
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kuch galat ho gaya, dobara try karo' });
  }
}

module.exports = { connectWallet, getWalletStatus, convertCoins, withdraw };
