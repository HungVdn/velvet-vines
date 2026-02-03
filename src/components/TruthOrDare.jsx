import { useState, useEffect } from 'react'
import { TRUTH_OR_DARE_DATA } from '../data/truthOrDare'

export default function TruthOrDare({ onBack }) {
    const [currentCard, setCurrentCard] = useState(null)
    const [filter, setFilter] = useState('all') // 'all', 'truth', 'dare', 'drink'

    const getRandomCard = (type) => {
        let pool = TRUTH_OR_DARE_DATA
        if (type && type !== 'all') {
            pool = TRUTH_OR_DARE_DATA.filter(card => card.type === type)
        }
        const randomIndex = Math.floor(Math.random() * pool.length)
        setCurrentCard(pool[randomIndex])
    }

    useEffect(() => {
        getRandomCard()
    }, [])

    return (
        <div className="game-container animate-fade">
            <button className="back-button" onClick={onBack}>← Sảnh chờ</button>
            <h2 className="gold-text">Sự thật hay Thách thức</h2>

            <div className="filter-controls">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Ngẫu nhiên
                </button>
                <button
                    className={`filter-btn ${filter === 'truth' ? 'active' : ''}`}
                    onClick={() => setFilter('truth')}
                >
                    Sự thật
                </button>
                <button
                    className={`filter-btn ${filter === 'dare' ? 'active' : ''}`}
                    onClick={() => setFilter('dare')}
                >
                    Thách thức
                </button>
            </div>

            <div className="card-display" onClick={() => getRandomCard(filter)}>
                {currentCard && (
                    <div className="premium-card game-card">
                        <span className="card-type">
                            {currentCard.type === 'truth' ? 'Sự thật' :
                                currentCard.type === 'dare' ? 'Thách thức' : 'Nhấp môi'}
                        </span>
                        <p className="card-text">{currentCard.content}</p>
                        <div className="card-footer">chạm để tiếp tục</div>
                    </div>
                )}
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
