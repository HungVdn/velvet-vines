import { useState } from 'react'

export default function Spotlight({ onBack }) {
    const [players, setPlayers] = useState([])
    const [playerName, setPlayerName] = useState('')
    const [isStarted, setIsStarted] = useState(false)
    const [currentQuestion, setCurrentQuestion] = useState('')

    const QUESTIONS = [
        "Ai có khả năng sẽ bao cả bàn nhất?",
        "Ai có khả năng sẽ là người đầu tiên nhảy nhót?",
        "Ai có khả năng sẽ quên thanh toán hóa đơn vào cuối buổi nhất?",
        "Ai có khả năng sẽ là người lái xe hộ (tỉnh táo nhất)?",
        "Ai có khả năng sẽ bắt đầu màn nâng ly chúc mừng?",
    ]

    const addPlayer = () => {
        if (playerName.trim()) {
            setPlayers([...players, playerName.trim()])
            setPlayerName('')
        }
    }

    const startGame = () => {
        if (players.length >= 2) {
            setIsStarted(true)
            nextRound()
        }
    }

    const nextRound = () => {
        const randomQuestion = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
        setCurrentQuestion(randomQuestion)
    }

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Sảnh chờ</button>
            <h2 className="gold-text">Tâm Điểm</h2>

            {!isStarted ? (
                <div className="setup-screen">
                    <p className="subtitle">Thêm ít nhất 2 khách mời để bắt đầu</p>
                    <div className="input-group">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Tên khách mời"
                            className="premium-input"
                        />
                        <button className="premium-button add-btn" onClick={addPlayer}>Thêm</button>
                    </div>
                    <div className="player-list">
                        {players.map((p, i) => (
                            <span key={i} className="player-tag">{p}</span>
                        ))}
                    </div>
                    <button className="premium-button start-btn" onClick={startGame}>Bắt đầu trò chơi</button>
                </div>
            ) : (
                <div className="question-screen">
                    <div className="premium-card game-card" onClick={nextRound}>
                        <p className="question">{currentQuestion}</p>
                        <div className="card-footer">3... 2... 1... Chỉ tay!</div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .setup-screen { width: 100%; max-width: 400px; margin-top: 2rem; }
        .input-group { display: flex; gap: 10px; margin-bottom: 2rem; }
        .premium-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--gold-dark);
          color: white;
          padding: 10px;
          border-radius: 4px;
        }
        .player-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 2rem; }
        .player-tag {
          background: var(--gold);
          color: #1a1a1a;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }
        .start-btn { width: 100%; }
        .game-card { min-height: 300px; display: flex; flex-direction: column; justify-content: center; cursor: pointer; border: 2px solid var(--gold); }
        .question { font-size: 1.8rem; font-family: var(--font-heading); }
        .card-footer { margin-top: 2rem; font-size: 0.8rem; color: var(--text-muted); }
      `}</style>
        </div>
    )
}
