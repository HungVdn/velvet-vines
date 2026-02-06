import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update, onValue } from 'firebase/database'
import { TRUTH_OR_DARE_DATA as DEFAULT_TOD } from '../data/truthOrDare'
import logoOuroboros from '../assets/logo_ouroboros.png'

export default function TruthOrDare({ onBack, isAdmin, isModerator, userId, roomId, roomState, players, advanceTurn, onSkip, userSkipCount, localPlayers }) {
    const [cards, setCards] = useState(DEFAULT_TOD)
    const cardIndex = roomState?.todIndex || 0
    const filter = roomState?.todFilter || 'all'
    const activeTurnSlot = roomState?.activeTurnSlot || 0
    const playerSlots = roomState?.playerSlots || {}

    // Find who has the current turn
    const activePlayer = players.find((p, idx) => {
        const slot = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx
        return slot === activeTurnSlot
    })
    // Check if ANY local player on this device has the turn
    const isMyTurn = localPlayers?.some(lp => lp.id === activePlayer?.id) || activePlayer?.id === userId
    const seenIndices = roomState?.todSeen || []
    const isFinished = seenIndices.length >= cards.length && cards.length > 0
    const isRevealed = roomState?.todRevealed || false

    useEffect(() => {
        const contentRef = ref(db, 'content/truth-or-dare')
        const unsubscribe = onValue(contentRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setCards(Array.isArray(data) ? data : Object.values(data))
            } else {
                setCards(DEFAULT_TOD)
            }
        })
        return () => unsubscribe()
    }, [])

    const currentCard = cards[cardIndex % cards.length]

    const getRandomCard = () => {
        if (!isAdmin && !isModerator && !isMyTurn) return
        if (isRevealed || isFinished) return

        // --- Smart Dealer Logic (Streak Breaker) ---
        const last3Indices = seenIndices.slice(-3)
        const last3Types = last3Indices.map(idx => cards[idx]?.type)

        let targetType = null
        if (last3Types.length === 3) {
            if (last3Types.every(t => t === 'truth')) targetType = 'dare'
            if (last3Types.every(t => t === 'dare')) targetType = 'truth'
        }

        // If no streak, prioritize the type with fewer occurrences in history to keep balance
        if (!targetType) {
            const historyTypes = seenIndices.map(idx => cards[idx]?.type)
            const truthCount = historyTypes.filter(t => t === 'truth').length
            const dareCount = historyTypes.filter(t => t === 'dare').length

            if (truthCount > dareCount) targetType = 'dare'
            else if (dareCount > truthCount) targetType = 'truth'
            else targetType = Math.random() > 0.5 ? 'truth' : 'dare'
        }

        const pool = cards.map((c, i) => ({ ...c, originalIndex: i }))
        let unseenPool = pool.filter(c => !seenIndices.includes(c.originalIndex) && c.type === targetType)

        // Fallback: If target pool is empty, take any unseen card
        if (unseenPool.length === 0) {
            unseenPool = pool.filter(c => !seenIndices.includes(c.originalIndex))
        }

        if (unseenPool.length === 0) return // Pool exhausted

        const nextPoolItem = unseenPool[Math.floor(Math.random() * unseenPool.length)]
        const globalIndex = nextPoolItem.originalIndex

        update(ref(db, `rooms/${roomId}`), {
            todIndex: globalIndex,
            todFilter: targetType,
            todRevealed: true,
            todSeen: [...seenIndices, globalIndex]
        })
    }

    const handleFinish = (e) => {
        e.stopPropagation()
        if (!isAdmin && !isModerator && !isMyTurn) return
        update(ref(db, `rooms/${roomId}`), { todRevealed: false })
        advanceTurn()
    }

    const getDynamicFontSize = (text) => {
        if (!text) return '1.25rem'
        const length = text.length
        if (length < 25) return '1.5rem'
        if (length < 50) return '1.25rem'
        if (length < 80) return '1.1rem'
        if (length < 120) return '0.95rem'
        return '0.85rem'
    }

    if (isFinished) {
        return (
            <div className="game-stage-content animate-fade">
                <div className="premium-card completion-card">
                    <h2 className="gold-text">Tuyệt vời! 🥂</h2>
                    <p style={{ margin: '1rem 0', fontSize: '0.9rem' }}>Tất cả thử thách Sự Thật hay Thách Thức đã xong.</p>
                    <p className="cheers-text">Mọi người cùng DÔ nào! 🍻</p>
                    {(isAdmin || isModerator) && (
                        <button className="finish-btn" onClick={onBack}>Kết thúc game</button>
                    )}
                </div>
                <style jsx>{`
                    .game-stage-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
                    .completion-card { padding: 2rem; text-align: center; border: 2px solid var(--gold); background: rgba(0,0,0,0.9); border-radius: 20px; width: 250px; }
                    .cheers-text { font-size: 1.2rem; margin-top: 1rem; font-weight: bold; color: var(--gold); }
                    .finish-btn { margin-top: 1.5rem; background: var(--gold); color: #000; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
                `}</style>
            </div>
        )
    }

    return (
        <div className="game-stage-content animate-fade">
            <div className={`turn-banner ${isMyTurn ? 'my-turn' : ''}`}>
                {isMyTurn ? "Lượt của bạn! 👊" : `Lượt của: ${activePlayer?.nickname}`}
            </div>
            <div className="card-display">
                {!isRevealed ? (
                    <div className={`premium-card card-back ${isMyTurn ? 'my-turn-card' : ''}`} onClick={getRandomCard}>
                        <img src={logoOuroboros} className="card-logo-img" alt="Ouroboros" />
                        <p className="tap-hint">{isMyTurn ? "Chạm để rút bài" : `Chờ ${activePlayer?.nickname}...`}</p>
                    </div>
                ) : (
                    <div className={`premium-card game-card ${isMyTurn ? 'my-turn-card' : ''}`}>
                        <span className="card-type">
                            {currentCard?.type === 'truth' ? 'Sự thật' :
                                currentCard?.type === 'dare' ? 'Thách thức' : 'Nhấp môi'}
                        </span>
                        <p className="card-text" style={{ fontSize: getDynamicFontSize(currentCard?.content) }}>{currentCard?.content}</p>
                        <div className="action-stack">
                            {(isAdmin || isModerator) && (
                                <button className="finish-btn" onClick={handleFinish}>Xong - Qua lượt</button>
                            )}
                            {isMyTurn && (
                                <button
                                    className="skip-penalty-btn"
                                    onClick={onSkip}
                                    disabled={userSkipCount >= 3}
                                >
                                    {userSkipCount >= 3 ? "Hết lượt bỏ qua" : `Bỏ lượt (+${userSkipCount + 1} Nhấp) 🍷`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {!isAdmin && !isModerator && !isMyTurn && !isRevealed && <div className="card-footer-wait">Đang đợi {activePlayer?.nickname}...</div>}
            </div>

            <style jsx>{`
        .game-stage-content { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        
        .card-display {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            perspective: 1200px;
        }

        .my-turn-card { border-color: #fff !important; box-shadow: 0 0 30px rgba(175, 144, 67, 0.6) !important; animation: glowPulse 2.5s ease-in-out infinite; }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 20px rgba(175, 144, 67, 0.4); } 50% { box-shadow: 0 0 40px rgba(175, 144, 67, 0.8); } }

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

        .card-back:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: var(--gold-light);
        }

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
        }

        .card-logo-img {
          width: 120px;
          height: 120px;
          object-fit: contain;
          margin-bottom: 2rem;
          opacity: 0.8;
          transition: transform 0.3s ease;
        }

        .tap-hint { 
          font-size: 0.85rem; 
          font-style: italic; 
          color: var(--gold-light); 
          opacity: 0.8; 
          margin-top: 1.5rem; 
          text-transform: uppercase;
          letter-spacing: 1px;
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

        .action-stack {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            margin-top: auto;
            padding-bottom: 0;
        }

        .skip-penalty-btn {
            background: rgba(42, 27, 10, 0.05);
            border: 1px solid rgba(175, 144, 67, 0.3);
            color: #795548;
            padding: 8px 16px;
            border-radius: 2px;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            font-family: var(--font-heading);
            cursor: pointer;
            font-weight: 700;
            position: relative;
            overflow: hidden;
            width: 100%;
        }

        .skip-penalty-btn::before {
            content: "";
            position: absolute;
            top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(142, 0, 0, 0.1), transparent);
            transition: 0.5s;
        }

        .skip-penalty-btn:hover:not(:disabled)::before {
            left: 100%;
        }

        .skip-penalty-btn:hover:not(:disabled) {
            background: rgba(142, 0, 0, 0.08);
            border-color: #8e0000;
            color: #8e0000;
            box-shadow: 0 4px 12px rgba(142, 0, 0, 0.1);
            transform: translateY(-1px);
        }

        .skip-penalty-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            border-style: dotted;
        }

        .card-footer-wait {
            margin-top: 2rem;
            color: var(--gold-dark);
            font-size: 0.8rem;
            font-style: italic;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        @media (max-width: 600px) {
          .game-card, .card-back { width: 220px; height: 320px; }
          .card-text { font-size: 1.1rem; }
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
