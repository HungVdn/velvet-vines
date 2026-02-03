import { useState, useEffect } from 'react'

const WILD_CARDS_DATA = [
    { type: 'Luật chơi', text: 'Nhấp môi Quý ông: Mỗi khi nam giới uống, họ phải nâng ly chúc mừng các quý cô sang trọng trong phòng.' },
    { type: 'Thử thách', text: 'Chuyên gia nếm rượu: Hãy bịt mắt và đoán đồ uống của người bên trái bạn. Nếu đoán sai, nhấp 2 hơi.' },
    { type: 'Nhấp môi', text: 'Giao lưu: Mọi người cùng nâng ly và nhấp một hơi.' },
    { type: 'Luật chơi', text: 'Sự im lặng là Vàng: Không ai được nói từ "Uống" hoặc "Nhấp". Vi phạm sẽ phải nhấp 1 hơi.' },
    { type: 'Thử thách', text: 'Giọng nói Nhung lụa: Nói bằng tông giọng "sang chảnh" nhất của bạn trong 3 vòng tới.' },
    { type: 'Nhấp môi', text: 'Thác đổ: Bắt đầu uống; người bên trái bạn không được dừng lại cho đến khi bạn dừng, và cứ thế tiếp tục.' },
    { type: 'Luật chơi', text: 'Ga lăng: Bạn phải kéo ghế cho bất kỳ ai đứng dậy. Quên ư? Nhấp môi.' },
    { type: 'Thử thách', text: 'Kẻ sành sỏi: Thuyết phục mọi người trong 30 giây tại sao bạn nên là "VIP của đêm nay".' },
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
            <button className="back-button" onClick={onBack}>← Sảnh chờ</button>

            <div className="game-header">
                <h2 className="gold-text">Lá Bài Hoang Dã</h2>
            </div>

            <div className="card-display" onClick={nextCard}>
                {currentCard && (
                    <div className="premium-card game-card">
                        <span className="card-type">{currentCard.type}</span>
                        <p className="card-text">{currentCard.text}</p>
                        <div className="card-footer">chạm để tiếp tục</div>
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
