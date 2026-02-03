import { useState } from 'react'
import './App.css'
import WildCards from './components/WildCards'
import Spotlight from './components/Spotlight'
import SpinSip from './components/SpinSip'
import DrunkTrivia from './components/DrunkTrivia'

function App() {
  const [gameMode, setGameMode] = useState(null)

  const modes = [
    { id: 'wild-cards', name: 'Lá Bài Hoang Dã', description: 'Luật chơi, Thử thách & Nhấp môi' },
    { id: 'spotlight', name: 'Tâm Điểm', description: 'Ai dễ làm gì nhất...' },
    { id: 'spin-sip', name: 'Vòng Quay Nhấp Môi', description: 'Vòng quay May mắn (hoặc Say xỉn)' },
    { id: 'trivia', name: 'Đố Vui Nhậu Nhẹt', description: 'Trắc nghiệm Tốc độ' },
  ]

  const renderGame = () => {
    switch (gameMode) {
      case 'wild-cards': return <WildCards onBack={() => setGameMode(null)} />
      case 'spotlight': return <Spotlight onBack={() => setGameMode(null)} />
      case 'spin-sip': return <SpinSip onBack={() => setGameMode(null)} />
      case 'trivia': return <DrunkTrivia onBack={() => setGameMode(null)} />
      default: return null
    }
  }

  return (
    <div className="app-container">
      {!gameMode ? (
        <div className="menu-screen animate-fade">
          <header className="hero">
            <h1 className="gold-text">Nhung & Rượu</h1>
            <p className="subtitle">Trò chơi Sang trọng cho Đêm nay</p>
          </header>

          <main className="mode-grid">
            {modes.map(mode => (
              <div
                key={mode.id}
                className="premium-card mode-card"
                onClick={() => setGameMode(mode.id)}
              >
                <h3>{mode.name}</h3>
                <p>{mode.description}</p>
              </div>
            ))}
          </main>
        </div>
      ) : (
        <div className="game-screen animate-fade">
          {renderGame()}
        </div>
      )}
    </div>
  )
}

export default App
