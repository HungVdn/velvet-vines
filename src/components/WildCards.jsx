import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update, onValue } from 'firebase/database'
import { WILD_CARDS_DEFAULT } from '../data/defaults'

export default function WildCards({ onBack, isAdmin, isModerator, roomId, roomState }) {
  const [cards, setCards] = useState(WILD_CARDS_DEFAULT)
  const cardIndex = roomState?.wildCardsIndex || 0

  useEffect(() => {
    const contentRef = ref(db, 'content/wild-cards')
    const unsubscribe = onValue(contentRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setCards(Array.isArray(data) ? data : Object.values(data))
      } else {
        setCards(WILD_CARDS_DEFAULT)
      }
    })
    return () => unsubscribe()
  }, [])

  const currentCard = cards[cardIndex % cards.length]

  const nextCard = () => {
    if (!isAdmin && !isModerator) return
    const nextIndex = (cardIndex + 1) % cards.length
    update(ref(db, `rooms/${roomId}`), { wildCardsIndex: nextIndex })
  }

  return (
    <div className="game-container animate-fade">
      <button className="back-button" onClick={onBack}>← Sảnh chờ</button>

      <div className="game-header">
        <h2 className="gold-text">Lá Bài Hoang Dã</h2>
      </div>

      <div className="card-display" onClick={nextCard}>
        {currentCard && (
          <div className="premium-card game-card">
            <span className="card-type">{currentCard.type}</span>
            <p className="card-text">{currentCard.text}</p>
            {(isAdmin || isModerator) && <div className="card-footer">chạm để tiếp tục</div>}
          </div>
        )}
      </div>

      <style jsx>{`
        .game-header { margin-bottom: 2rem; }
        .card-display {
          perspective: 1000px;
          cursor: pointer;
          width: 100%;
          max-width: 350px;
        }
        .game-card {
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border: 2px solid var(--gold);
          animation: cardSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .card-type {
          font-family: var(--font-heading);
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.8rem;
          margin-bottom: 2rem;
          opacity: 0.8;
        }
        .card-text {
          font-size: 1.4rem;
          line-height: 1.6;
          padding: 0 1rem;
        }
        .card-footer {
          margin-top: 3rem;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        @keyframes cardSlide {
          from { transform: translateY(20px) rotateX(10deg); opacity: 0; }
          to { transform: translateY(0) rotateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
