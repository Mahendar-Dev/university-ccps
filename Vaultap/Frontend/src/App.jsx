import { useState, useEffect } from 'react';
import Splash from './components/Splash';
import Loading from './components/Loading';
import Auth from './components/Auth';
import Game from './components/Game';
import Quests from './components/Quests';
import Referrals from './components/Referrals';
import Wallet from './components/Wallet';
import Convert from './components/Convert';
import Withdraw from './components/Withdraw';
import Background from './components/Background';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [screen, setScreen] = useState('game'); // 'game' | 'quests' | 'referrals' | 'wallet'
  const [syncedBalance, setSyncedBalance] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('vaultap_token');
    const savedUsername = localStorage.getItem('vaultap_username');
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    }
  }, []);

  // Login successful hone ke baad 2 second ka loading transition dikhao, phir Game screen
  function handleLoginSuccess(newToken, user) {
    setShowLoading(true);
    setTimeout(() => {
      setToken(newToken);
      setUsername(user.username);
      setShowLoading(false);
    }, 2000);
  }

  function handleLogout() {
    setToken(null);
    setUsername(null);
    setScreen('game');
  }

  function handleBalanceUpdate(newBalance) {
    setSyncedBalance(newBalance);
  }

  if (showSplash) {
    return (
      <>
        <Background />
        <Splash onDone={() => setShowSplash(false)} />
      </>
    );
  }

  if (showLoading) {
    return (
      <>
        <Background />
        <Loading />
      </>
    );
  }

  if (!token) {
    return (
      <>
        <Background />
        <Auth onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <Background />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {screen === 'game' && (
          <Game
            token={token}
            username={username}
            onLogout={handleLogout}
            onNavigate={setScreen}
            externalBalance={syncedBalance}
          />
        )}
        {screen === 'quests' && (
          <Quests
            token={token}
            onBack={() => setScreen('game')}
            onBalanceUpdate={handleBalanceUpdate}
          />
        )}
        {screen === 'referrals' && (
          <Referrals token={token} onBack={() => setScreen('game')} />
        )}
        {screen === 'wallet' && (
          <Wallet
            token={token}
            onBack={() => setScreen('game')}
            onNavigate={setScreen}
          />
        )}
        {screen === 'convert' && (
          <Convert
            token={token}
            onBack={() => setScreen('wallet')}
            onBalanceUpdate={handleBalanceUpdate}
          />
        )}
        {screen === 'withdraw' && (
          <Withdraw token={token} onBack={() => setScreen('wallet')} />
        )}
      </div>
    </>
  );
}

export default App;
