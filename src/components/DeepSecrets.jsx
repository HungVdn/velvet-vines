import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update, onValue } from 'firebase/database'
import { DEEP_SECRETS_DEFAULT } from '../data/defaults'
import logoOuroboros from '../assets/logo_ouroboros.png'

export default function DeepSecrets({ onBack, isAdmin, isModerator, userId, roomId, roomState, players, advanceTurn, localPlayers }) {
    const [cards, setCards] = useState(DEEP_SECRETS_DEFAULT)
    const cardIndex = roomState?.deepSecretsIndex || 0
    const activeTurnSlot = roomState?.activeTurnSlot || 0
    const playerSlots = roomState?.playerSlots || {}

    // Find who has the current turn
    const activePlayer = players.find((p, idx) => {
        const slot = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx
        return slot === activeTurnSlot
    })

    useEffect(() => {
        const contentRef = ref(db, 'content/deep-secrets')
        const unsubscribe = onValue(contentRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setCards(Array.isArray(data) ? data : Object.values(data))
            } else {
                setCards(DEEP_SECRETS_DEFAULT)
            }
        })
        return () => unsubscribe()
    }, [])

    const seenIndices = roomState?.deepSecretsSeen || []
    const isFinished = seenIndices.length >= cards.length && cards.length > 0
    // Check if ANY local player on this device has the turn
    const isMyTurn = localPlayers?.some(lp => lp.id === activePlayer?.id) || activePlayer?.id === userId
    const currentCard = cards[cardIndex % cards.length]
    const isRevealed = roomState?.deepSecretsRevealed || false

    const drawCard = (e) => {
        e.stopPropagation()
        if (!isAdmin && !isModerator && !isMyTurn) return
        if (isRevealed || isFinished) return

        const unseen = cards.map((_, i) => i).filter(i => !seenIndices.includes(i))
        if (unseen.length === 0) return

        const nextIndex = unseen[Math.floor(Math.random() * unseen.length)]

        update(ref(db, `rooms/${roomId}`), {
            deepSecretsIndex: nextIndex,
            deepSecretsRevealed: true,
            deepSecretsSeen: [...seenIndices, nextIndex]
        })
    }

    const handleAdvance = (e) => {
        e.stopPropagation()
        if (!isAdmin && !isModerator && !isMyTurn) return
        update(ref(db, `rooms/${roomId}`), { deepSecretsRevealed: false })
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
                    <h2 className="gold-text">Sâu Sắc & Chia Sẻ 🥂</h2>
                    <p style={{ margin: '1rem 0', fontSize: '0.9rem' }}>Tất cả các câu chuyện đã được kể.</p>
                    <p className="cheers-text">Cùng nâng ly vì sự chân thành! 🍻</p>
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
                    <div className={`premium-card card-back ${isMyTurn ? 'my-turn-card' : ''}`} onClick={drawCard}>
                        <img src={logoOuroboros} className="card-logo-img" alt="Ouroboros" />
                        <p className="tap-hint">{isMyTurn ? "Chạm để bốc bài" : `Chờ ${activePlayer?.nickname}...`}</p>
                    </div>
                ) : (
                    <div className={`premium-card game-card ${isMyTurn ? 'my-turn-card' : ''}`}>
                        <span className="card-type">{currentCard?.type}</span>
                        <p className="card-text" style={{ fontSize: getDynamicFontSize(currentCard?.text) }}>
                            {currentCard?.text}
                        </p>
                        <div className="action-stack">
                            {isAdmin || isModerator ? (
                                <button className="finish-btn" onClick={handleAdvance}>Xong - Qua lượt</button>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .game-stage-content { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        
        .my-turn-card { border-color: #fff !important; box-shadow: 0 0 30px rgba(175, 144, 67, 0.6) !important; animation: glowPulse 2.5s ease-in-out infinite; }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 20px rgba(175, 144, 67, 0.4); } 50% { box-shadow: 0 0 40px rgba(175, 144, 67, 0.8); } }
        
        .card-display {
          perspective: 1200px;
          cursor: pointer;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .game-card {
          width: 240px;
          height: 340px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: #EADDCA; /* Parchment */
          background-image: url("https://www.transparenttextures.com/patterns/old-paper.png");
          color: #2a1b0a;
          border: 1px solid #c2b280;
          padding: 0.8rem 2rem 1rem;
          margin: 0 auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.7);
          animation: cardSlide 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          border-radius: 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .game-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 30px 60px rgba(0,0,0,0.8);
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
            position: relative;
            border-radius: 4px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.8);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-back:hover {
          transform: translateY(-10px) rotateY(10deg);
          box-shadow: 0 25px 50px rgba(175, 144, 67, 0.2);
          border-color: var(--gold-light);
        }

        .card-logo-img {
          width: 120px;
          height: 120px;
          object-fit: contain;
          margin-bottom: 2rem;
          opacity: 0.8;
          transition: transform 0.3s ease;
        }

        .card-back:hover .card-logo-img {
          transform: scale(1.1) rotate(-5deg);
        }

        .tap-hint { 
          font-size: 0.85rem; 
          font-style: italic; 
          color: #5d4037; 
          font-weight: 500; 
          letter-spacing: 1px;
        }

        .card-back .tap-hint { 
          color: var(--gold); 
          opacity: 0.7; 
          text-transform: uppercase;
          font-family: var(--font-heading);
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

        @keyframes cardSlide {
          from { transform: translateY(40px) rotateX(20deg); opacity: 0; }
          to { transform: translateY(0) rotateX(0); opacity: 1; }
        }

        .action-stack {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            margin-top: auto;
            padding-bottom: 0;
        }

        @media (max-width: 600px) {
          .game-card, .card-back { width: 200px; height: 280px; }
          .card-text { font-size: 1.1rem; }
        }

        .turn-banner {
            width: 100%;
            text-align: center;
            padding: 8px;
            margin-bottom: 1rem;
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
