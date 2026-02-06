import { useState } from 'react'
import logoOuroboros from '../assets/logo_ouroboros.png'

export default function Lobby({ onJoin }) {
  const [nickname, setNickname] = useState('')
  const [passcode, setPasscode] = useState('')

  const handleAction = () => {
    if (!nickname.trim()) return alert('Nghi lễ yêu cầu một Thánh Danh để bắt đầu!')
    if (!passcode.trim()) return alert('Lời Chân Ngôn không chính xác, bí mật vẫn sẽ bị khóa!')

    onJoin({ nickname, passcode })
  }

  return (
    <div className="game-container animate-fade lobby-screen">
      <div className="sacred-watermark">
        <img src={logoOuroboros} alt="" />
      </div>

      <div className="ritual-embers-bg">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="ritual-ember" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      <header className="hero">
        <h1 className="gold-foil main-title">Mật Viện Velvet</h1>
        <p className="subtitle">Nơi Nghi Lễ Bắt Đầu & Sự Thật Được Khai Mở</p>
        <div className="shimmer-divider"></div>
      </header>

      <div className="setup-card premium-card glass-morphism float-magic">
        <div className="input-group-vertical">
          <label>Thánh Danh</label>
          <input
            type="text"
            placeholder="VD: Quý Ngài Bóng Đêm..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="premium-input"
          />
        </div>

        <div className="input-group-vertical">
          <label>Lời Chân Ngôn</label>
          <input
            type="password"
            placeholder="Thì thầm lời mật mã..."
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="premium-input"
          />
        </div>

        <button className="premium-button join-btn" onClick={handleAction}>
          Khai Mở Nghi Lễ
        </button>
      </div>

      <style jsx>{`
                .lobby-screen { 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: center; 
                  min-height: 100vh;
                  min-height: 100dvh;
                  padding: 2rem 1rem;
                  width: 100%;
                  position: relative;
                  overflow: hidden;
                }
                .sacred-watermark {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 80vh;
                  height: 80vh;
                  opacity: 0.15;
                  pointer-events: none;
                  z-index: 0;
                }
                .sacred-watermark img {
                  width: 100%;
                  height: 100%;
                  animation: slowRotate 120s linear infinite;
                  filter: blur(2px);
                }
                @keyframes slowRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .hero {
                  text-align: center;
                  margin-bottom: 3rem;
                  width: 100%;
                  max-width: 90vw;
                  z-index: 1;
                }
                .main-title {
                  font-size: clamp(2.2rem, 12vw, 5rem);
                  line-height: 1.1;
                  margin-bottom: 0.5rem;
                  font-family: var(--font-magic);
                  letter-spacing: 8px;
                  text-transform: uppercase;
                }
                .subtitle {
                  font-size: clamp(0.9rem, 4vw, 1.2rem);
                  opacity: 0.7;
                  font-family: var(--font-body);
                  font-style: italic;
                  letter-spacing: 1px;
                }
                .shimmer-divider {
                  height: 1px;
                  width: 150px;
                  margin: 1.5rem auto 0;
                  background: var(--gold-gradient);
                  box-shadow: 0 0 10px var(--gold);
                }
                .setup-card { 
                  width: 100%; 
                  max-width: 440px; 
                  padding: clamp(1.5rem, 6vw, 3.5rem);
                  display: flex; 
                  flex-direction: column; 
                  gap: 1.8rem; 
                  z-index: 1;
                  background: rgba(10, 5, 20, 0.8);
                  border: 1px solid var(--glass-border);
                  box-shadow: 0 30px 60px rgba(0,0,0,0.9), 0 0 20px rgba(191, 149, 63, 0.1);
                }
                .input-group-vertical { display: flex; flex-direction: column; gap: 10px; text-align: left; }
                .input-group-vertical label { font-size: 0.8rem; color: var(--gold-light); text-transform: uppercase; letter-spacing: 2px; }
                .premium-input { 
                  background: rgba(255,255,255,0.03); 
                  border: 1px solid var(--glass-border); 
                  color: white; 
                  padding: 16px; 
                  border-radius: 4px; 
                  font-size: 1.1rem; 
                  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                  font-family: var(--font-body);
                }
                .premium-input:focus { 
                  outline: none; 
                  border-color: var(--gold-light); 
                  background: rgba(255,255,255,0.06); 
                  box-shadow: 0 0 20px rgba(191, 149, 63, 0.15);
                  transform: translateY(-1px);
                }
                .join-btn { 
                  margin-top: 1rem; 
                  padding: 20px; 
                  font-size: 1.2rem; 
                  border-radius: 4px; 
                  background: var(--gold-gradient);
                  color: #050208;
                  font-weight: 800;
                  border: none;
                  box-shadow: 0 10px 30px rgba(191, 149, 63, 0.2);
                }
                .join-btn:hover {
                  transform: translateY(-3px) scale(1.02);
                  box-shadow: 0 15px 40px rgba(191, 149, 63, 0.4);
                }
                
                .gold-foil {
                  background: var(--gold-gradient);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  animation: shimmer 15s linear infinite;
                  background-size: 200% auto;
                }
                @keyframes shimmer { to { background-position: 200% center; } }
            `}</style>
    </div>
  )
}
