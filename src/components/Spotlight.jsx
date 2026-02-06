import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update, onValue } from 'firebase/database'
import { SPOTLIGHT_DEFAULT } from '../data/defaults'
import logoOuroboros from '../assets/logo_ouroboros.png'

export default function Spotlight({ onBack, isAdmin, isModerator, roomId, roomState, advanceTurn, players, userId, localPlayers }) {
    const playerSlots = roomState?.playerSlots || {}
    const activeTurnSlot = roomState?.activeTurnSlot || 0
    const activePlayer = players.find((p, idx) => {
        const slot = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx
        return slot === activeTurnSlot
    })
    const isMyTurn = localPlayers?.some(lp => lp.id === activePlayer?.id) || activePlayer?.id === userId
    const [questions, setQuestions] = useState(SPOTLIGHT_DEFAULT)
    const [localCountdown, setLocalCountdown] = useState(null)
    const isStarted = roomState?.spotlightStarted || false
    const isRevealed = roomState?.spotlightRevealed || false
    const countdownStartTime = roomState?.spotlightCountdownStartTime || null
    const currentQuestion = roomState?.spotlightQuestion || ''

    useEffect(() => {
        const contentRef = ref(db, 'content/spotlight')
        const unsubscribe = onValue(contentRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setQuestions(Array.isArray(data) ? data : Object.values(data))
            } else {
                setQuestions(SPOTLIGHT_DEFAULT)
            }
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        let interval;
        if (countdownStartTime) {
            interval = setInterval(() => {
                const now = Date.now()
                const elapsed = Math.floor((now - countdownStartTime) / 1000)
                const remaining = 5 - elapsed
                if (remaining <= 0) {
                    setLocalCountdown(0)
                    clearInterval(interval)
                } else {
                    setLocalCountdown(remaining)
                }
            }, 100)
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLocalCountdown(null)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [countdownStartTime])

    const startGame = () => {
        if (!isAdmin && !isModerator) return
        const randomQ = questions[Math.floor(Math.random() * questions.length)]
        update(ref(db, `rooms/${roomId}`), {
            spotlightStarted: true,
            spotlightRevealed: false,
            spotlightCountdownStartTime: null,
            spotlightQuestion: randomQ.content || randomQ
        })
    }

    const revealQuestion = () => {
        if (!isAdmin && !isModerator) return
        update(ref(db, `rooms/${roomId}`), { spotlightRevealed: true })
    }

    const startCountdown = () => {
        if (!isAdmin && !isModerator) return
        update(ref(db, `rooms/${roomId}`), { spotlightCountdownStartTime: Date.now() })
    }

    const nextRound = () => {
        if (!isAdmin && !isModerator) return
        const randomQ = questions[Math.floor(Math.random() * questions.length)]
        update(ref(db, `rooms/${roomId}`), {
            spotlightQuestion: randomQ.content || randomQ,
            spotlightRevealed: false,
            spotlightCountdownStartTime: null
        })
        advanceTurn()
    }

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Sảnh chờ</button>
            <h2 className="gold-text">Tâm Điểm</h2>
            <div className={`turn-banner ${isMyTurn ? 'my-turn' : ''}`}>
                {isMyTurn ? "Tâm điểm là bạn! 🌟" : `Tâm điểm: ${activePlayer?.nickname}`}
            </div>

            {!isStarted ? (
                <div className="setup-screen">
                    <div className="premium-card waiting-card">
                        <p className="subtitle">
                            {isAdmin || isModerator ? "Sẵn sàng chưa? Nhấn để bắt đầu!" : "Đang đợi Quản trị viên bắt đầu..."}
                        </p>
                        {(isAdmin || isModerator) && (
                            <button className="premium-button start-btn" onClick={startGame}>Bắt đầu trò chơi</button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="question-screen animate-fade">
                    {!isRevealed ? (
                        <div className={`premium-card card-back ${isAdmin || isModerator ? 'admin-can-reveal' : ''}`} onClick={revealQuestion}>
                            <img src={logoOuroboros} className="card-logo-img" alt="Ouroboros" />
                            <p className="tap-hint">{isAdmin || isModerator ? "Chạm để lật bài" : "Đang chờ chủ xị..."}</p>
                        </div>
                    ) : (
                        <div className="premium-card game-card">
                            <span className="card-type">Tâm Điểm</span>
                            <p className="card-text">{currentQuestion}</p>

                            <div className="countdown-area">
                                {localCountdown === null ? (
                                    (isAdmin || isModerator) && (
                                        <button className="start-timer-btn" onClick={startCountdown}>
                                            Bắt đầu Đếm ngược ⏱
                                        </button>
                                    )
                                ) : localCountdown > 0 ? (
                                    <div className="timer-display active">
                                        <span className="timer-num">{localCountdown}</span>
                                        <span className="timer-label">Chỉ tay sau...</span>
                                    </div>
                                ) : (
                                    <div className="timer-display finished animate-bounce">
                                        <span className="timer-done">CHỈ TAY! ☝️</span>
                                    </div>
                                )}
                            </div>

                            <div className="action-stack">
                                {(isAdmin || isModerator) && (
                                    <button className="finish-btn" onClick={nextRound}>Xong - Qua lượt</button>
                                )}
                            </div>
                        </div>
                    )}
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
        .start-btn { width: 100%; border-radius: 4px; }
        
        .game-card { 
            width: 240px;
            height: 340px;
            display: flex; 
            flex-direction: column; 
            justify-content: flex-start;
            align-items: center; 
            text-align: center; 
            background: #EADDCA; /* Parchment */
            background-image: url("https://www.transparenttextures.com/patterns/old-paper.png");
            color: #2a1b0a;
            border: 1px solid #c2b280;
            padding: 0.8rem 2rem 1rem;
            margin: 0 auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            border-radius: 4px;
            animation: cardIn 0.5s cubic-bezier(0.23, 1, 0.32, 1);
            transition: transform 0.3s ease-out;
        }

        @keyframes cardIn { 
          from { transform: translateY(40px) scale(0.9); opacity: 0; } 
          to { transform: translateY(0) scale(1); opacity: 1; } 
        }

        .card-type {
          font-family: var(--font-heading);
          color: #795548;
          text-transform: uppercase;
          letter-spacing: 3px;
          font-size: 0.75rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid rgba(121, 85, 72, 0.2);
          padding-bottom: 8px;
          font-weight: 700;
          width: 80%;
        }

        .card-text { 
           line-height: 1.4; 
           color: #2a1b0a; 
           font-weight: 700; 
           font-family: var(--font-body);
           flex-grow: 1;
           display: flex;
           align-items: center;
           justify-content: center;
           width: 100%;
           font-size: 1.1rem;
        }
        
        .card-back {
            width: 240px;
            height: 340px;
            background: #2a1b0a;
            color: var(--gold);
            border: 4px double var(--gold);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin: 0 auto;
            border-radius: 4px;
            position: relative;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-back:hover { transform: translateY(-8px) scale(1.02); border-color: var(--gold-light); }
        
        .card-logo-img {
          width: 120px;
          height: 120px;
          object-fit: contain;
          margin-bottom: 2rem;
          opacity: 0.8;
          transition: transform 0.3s ease;
          animation: rotateSlow 60s linear infinite;
        }
        @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .tap-hint { font-size: 0.85rem; font-style: italic; color: var(--gold-light); opacity: 0.8; margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 1px; }

        .countdown-area { margin: 1rem 0; min-height: 80px; display: flex; align-items: center; justify-content: center; }
        
        .start-timer-btn {
            background: #2a1b0a;
            color: var(--gold);
            border: 1px solid var(--gold);
            padding: 8px 16px;
            border-radius: 2px;
            font-family: var(--font-heading);
            font-weight: 800;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            font-size: 0.7rem;
        }
        .start-timer-btn:hover { background: var(--gold); color: #2a1b0a; transform: translateY(-2px); }
        
        .timer-display { display: flex; flex-direction: column; align-items: center; }
        .timer-num { font-size: 3rem; font-family: var(--font-magic); color: #8e0000; line-height: 1; }
        .timer-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 2px; color: #795548; font-weight: 700; }
        .timer-done { font-size: 1.8rem; font-family: var(--font-magic); color: #8e0000; font-weight: 900; letter-spacing: 1px; }

        .action-stack {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            margin-top: auto;
            padding-bottom: 0;
        }

        .finish-btn {
            width: 100%;
            background: #2a1b0a;
            color: var(--gold);
            border: 1px solid var(--gold);
            padding: 8px 20px;
            border-radius: 2px;
            font-weight: bold;
            font-family: var(--font-heading);
            font-size: 0.75rem;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 5px 15px rgba(0,0,0,0.4);
        }

        .finish-btn:hover { 
          background: var(--gold); 
          color: #2a1b0a; 
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(175, 144, 67, 0.3);
        }
        
        @media (max-width: 600px) {
          .game-card, .card-back { width: 220px; height: 320px; }
          .card-text { font-size: 1rem; }
        }

        .turn-banner {
            width: 100%;
            text-align: center;
            padding: 8px;
            margin-bottom: 2rem;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--glass-border);
            color: var(--gold-light);
            font-family: var(--font-heading);
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 0.9rem;
            border-radius: 4px;
        }
        .turn-banner.my-turn {
            background: rgba(191,149,63,0.15);
            border-color: var(--gold);
            color: var(--gold);
            font-weight: 700;
            box-shadow: 0 0 15px rgba(191,149,63,0.2);
            animation: pulseBanner 2s infinite;
        }
        @keyframes pulseBanner { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
      `}</style>
        </div>
    )
}
