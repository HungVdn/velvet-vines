import { useState, useEffect } from 'react'

const WILD_CARDS_DATA = [
    { type: 'Rule', text: 'Gentleman\'s Sip: Every time a man drinks, he must toast to the refined ladies of the lounge.' },
    { type: 'Dare', text: 'The Sommelier: Blindfold yourself and guess the drink of the person to your left. If you fail, take 2 sips.' },
    { type: ' Sip', text: 'Social: Everyone raises their glass for a group sip.' },
    { type: 'Rule', text: 'The Golden Silence: No one can say the word "Drink" or "Sip". Penalty is 1 sip.' },
    { type: 'Dare', text: 'The Velvet Voice: Speak in your most "sophisticated" accent for the next 3 rounds.' },
    { type: 'Sip', text: 'Waterfall: Start drinking; the person to your left can\'t stop until you do, and so on.' },
    { type: 'Rule', text: 'Chivalry: You must pull out the chair for anyone who gets up. Forget? Sip.' },
    { type: 'Dare', text: 'The Lounge Lizard: Give a 30-second smooth-talking pitch for why you should be the "VIP of the Night".' },
]

export default function WildCards({ onBack }) {
    const [currentCard, setCurrentCard] = useState(null)
    const [deck, setDeck] = useState([])

    useEffect(() => {
        shuffleDeck()
    }, [])

    const shuffleDeck = () => {
        const shuffled = [...WILD_CARDS_DATA].sort(() => Math.random() - 0.5)
        setDeck(shuffled)
        setCurrentCard(shuffled[0])
    }

    const nextCard = () => {
        const currentIndex = deck.indexOf(currentCard)
        if (currentIndex < deck.length - 1) {
            setCurrentCard(deck[currentIndex + 1])
        } else {
            shuffleDeck()
        }
    }

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Lobby</button>

            <div className="game-header">
                <h2 className="gold-text">Wild Cards</h2>
            </div>

            <div className="card-display" onClick={nextCard}>
                {currentCard && (
                    <div className="premium-card game-card">
                        <span className="card-type">{currentCard.type}</span>
                        <p className="card-text">{currentCard.text}</p>
                        <div className="card-footer">tap to continue</div>
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
