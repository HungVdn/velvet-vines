import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update, onValue } from 'firebase/database'
import { TRUTH_OR_DARE_DATA as DEFAULT_TOD } from '../data/truthOrDare'

export default function TruthOrDare({ onBack, isAdmin, isModerator, roomId, roomState }) {
    const [cards, setCards] = useState(DEFAULT_TOD)
    const cardIndex = roomState?.todIndex || 0
    const filter = roomState?.todFilter || 'all'

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

    const getRandomCard = (type) => {
        if (!isAdmin && !isModerator) return

        let pool = cards
        if (type && type !== 'all') {
            pool = cards.filter(card => card.type === type)
        }

        if (pool.length === 0) pool = cards // Fallback

        // eslint-disable-next-line react-hooks/purity
        const randomCard = pool[Math.floor(Math.random() * pool.length)]
        const globalIndex = cards.findIndex(c =>
            (c.id && c.id === randomCard.id) ||
            (c.content && c.content === randomCard.content)
        )

        update(ref(db, `rooms/${roomId}`), {
            todIndex: globalIndex,
            todFilter: type
        })
    }

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Sảnh chờ</button>
            <h2 className="gold-text">Sự thật hay Thách thức</h2>

            <div className="filter-controls">
                {['all', 'truth', 'dare'].map((f) => (
                    <button
                        key={f}
                        className={`filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => getRandomCard(f)}
                        disabled={!isAdmin && !isModerator}
                    >
                        {f === 'all' ? 'Ngẫu nhiên' : f === 'truth' ? 'Sự thật' : 'Thách thức'}
                    </button>
                ))}
            </div>

            <div className="card-display" onClick={() => getRandomCard(filter)}>
                {currentCard && (
                    <div className="premium-card game-card">
                        <span className="card-type">
                            {currentCard.type === 'truth' ? 'Sự thật' :
                                currentCard.type === 'dare' ? 'Thách thức' : 'Nhấp môi'}
                        </span>
                        <p className="card-text">{currentCard.content}</p>
                        {(isAdmin || isModerator) && <div className="card-footer">chạm để tiếp tục</div>}
                    </div>
                )}
                {!isAdmin && !isModerator && <div className="card-footer">Đang đợi Quản trị viên...</div>}
            </div>

            <style jsx>{`
                .filter-controls {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 2rem;
                    justify-content: center;
                }
                .filter-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--gold-dark);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                }
                .filter-btn.active {
                    background: var(--gold);
                    color: #1a1a1a;
                    border-color: var(--gold);
                }
                .game-card {
                    min-height: 400px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    border: 2px solid var(--gold);
                    cursor: pointer;
                }
                .card-type {
                    font-family: var(--font-heading);
                    color: var(--gold);
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    font-size: 0.8rem;
                    margin-bottom: 2rem;
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
                }
            `}</style>
        </div>
    )
}
