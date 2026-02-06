import React from 'react'
import { GAME_RULES } from '../data/defaults'
import logoOuroboros from '../assets/logo_ouroboros.png'

// Skill: algorithmic-art - Procedural Ritual Sigils
const BloodSeal = ({ seed, size = 40 }) => {
    // Deterministic random based on string seed
    const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const getP = (offset, range) => (hash * (offset + 1)) % range

    // Generate 3 unique paths based on seed
    const paths = [0, 1, 2].map(i => {
        const x1 = 10 + getP(i * 10, 20)
        const y1 = 10 + getP(i * 15, 20)
        const x2 = 10 + getP(i * 20, 20)
        const y2 = 10 + getP(i * 25, 20)
        const cx = 20 + getP(i * 30, 5) - 2.5
        const cy = 20 + getP(i * 35, 5) - 2.5
        return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
    })

    return (
        <svg width={size} height={size} viewBox="0 0 40 40" className="blood-seal-svg">
            <filter id="blood-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
            </filter>
            <g filter="url(#blood-blur)">
                {paths.map((d, i) => (
                    <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke="#8e0000"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="sigil-stroke"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                ))}
                <circle cx="20" cy="20" r="15" fill="none" stroke="#8e0000" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
            </g>
            <style jsx>{`
                .blood-seal-svg {
                    filter: drop-shadow(0 0 2px rgba(142, 0, 0, 0.4));
                }
                .sigil-stroke {
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                    animation: drawSigil 2s ease-out forwards;
                }
                @keyframes drawSigil {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </svg>
    )
}

export default function SacredContract({ gameMode, onSign, players, signatures, currentUserId, hasSigned }) {
    const rule = GAME_RULES[gameMode]
    const signedCount = Object.keys(signatures || {}).length
    const totalCount = players?.length || 0

    return (
        <div className="sacred-contract-overlay animate-fade">
            <div className="contract-parchment animate-scale-in">
                <div className="contract-header">
                    <img src={logoOuroboros} alt="" className="contract-ouroboros" />
                    <h2 className="sacred-title">Khế Ước Vĩnh Hằng</h2>
                </div>

                <div className="contract-body">
                    <p className="game-name-ritual">-{gameMode?.replace('-', ' ').toUpperCase()}-</p>
                    <div className="sacred-rule-text">
                        "{rule}"
                    </div>

                    {!hasSigned ? (
                        <div className="universal-ritual">
                            "Thanh tẩy tâm trí, chấp nhận sự thật. Kẻ phá vỡ khế ước sẽ tan biến vào bóng tối."
                        </div>
                    ) : (
                        <div className="waiting-list-container">
                            <div className="waiting-header">
                                <p className="waiting-title">
                                    {players?.filter(p => !signatures?.[p.id]).length > 0
                                        ? "Đang đợi linh hồn lạc lối..."
                                        : "Nghi thức sắp bắt đầu..."}
                                </p>
                                <div className="ritual-count">
                                    {signedCount}/{totalCount}
                                </div>
                            </div>
                            <div className="signature-list">
                                {players?.filter(p => !signatures?.[p.id]).map(p => (
                                    <div key={p.id} className="signature-item unsigned-item">
                                        <span className="sig-name">{p.nickname}</span>
                                        <div className="sig-ui">
                                            <span className="sig-status-text">Đang đợi</span>
                                            <BloodSeal seed={p.id} size={30} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="contract-footer">
                    {!hasSigned && (
                        <button className="sign-blood-btn" onClick={onSign}>
                            Thực Thi Ấn Chú 🩸
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .sacred-contract-overlay {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 200;
                    padding: 1rem;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(5px);
                }

                .contract-parchment {
                    width: 100%;
                    max-width: 440px;
                    background: #EADDCA;
                    background-image: url("https://www.transparenttextures.com/patterns/old-paper.png");
                    padding: 2.5rem;
                    border-radius: 4px;
                    box-shadow: 0 30px 100px rgba(0,0,0,0.9);
                    border: 1px solid #c2b280;
                    text-align: center;
                    position: relative;
                }

                .contract-header {
                    margin-bottom: 2rem;
                    position: relative;
                }

                .contract-ouroboros {
                    width: 80px;
                    height: 80px;
                    opacity: 0.8;
                    margin-bottom: 0.5rem;
                }

                .sacred-title {
                    font-family: var(--font-magic);
                    color: #2a1b0a;
                    font-size: 1.8rem;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    margin: 0;
                }

                .game-name-ritual {
                    font-family: var(--font-heading);
                    font-size: 0.9rem;
                    letter-spacing: 3px;
                    color: #795548;
                    margin-bottom: 1.5rem;
                    font-weight: 700;
                }

                .sacred-rule-text {
                    font-family: var(--font-body);
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: #2a1b0a;
                    font-weight: 700;
                    margin-bottom: 2rem;
                    font-style: italic;
                    padding: 0 1rem;
                }

                .universal-ritual {
                    font-size: 0.8rem;
                    color: #8e0000;
                    font-family: var(--font-heading);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .contract-footer {
                    margin-top: 2rem;
                    min-height: 60px;
                }

                .sign-blood-btn {
                    background: transparent;
                    border: 2px solid #8e0000;
                    color: #8e0000;
                    padding: 12px 24px;
                    font-family: var(--font-heading);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }

                .sign-blood-btn:hover {
                    background: #8e0000;
                    color: #fff;
                    box-shadow: 0 0 20px rgba(142, 0, 0, 0.4);
                }

                .waiting-list-container {
                    margin-top: 1rem;
                    border-top: 1px solid rgba(121, 85, 72, 0.3);
                    padding-top: 1.5rem;
                }

                .waiting-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding: 0 0.5rem;
                }

                .waiting-title {
                    font-family: var(--font-heading);
                    font-size: 0.8rem;
                    color: #795548;
                    font-style: italic;
                    margin: 0;
                }

                .ritual-count {
                    font-family: var(--font-heading);
                    font-size: 0.9rem;
                    font-weight: 800;
                    color: #8e0000;
                    background: rgba(142, 0, 0, 0.1);
                    padding: 2px 10px;
                    border-radius: 4px;
                    border: 1px solid rgba(142, 0, 0, 0.2);
                }

                .signature-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 10px;
                    max-height: 250px;
                    overflow-y: auto;
                    padding: 5px;
                    margin: 0 -5px;
                }

                /* Custom scrollbar for the ancient feel */
                .signature-list::-webkit-scrollbar {
                    width: 5px;
                }
                .signature-list::-webkit-scrollbar-track {
                    background: rgba(121, 85, 72, 0.05);
                }
                .signature-list::-webkit-scrollbar-thumb {
                    background: #8e0000;
                    border-radius: 10px;
                }

                .signature-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    background: rgba(42, 27, 10, 0.05);
                    border-radius: 4px;
                    font-family: var(--font-heading);
                    border: 1px solid transparent;
                    transition: all 0.3s ease;
                }

                .signature-item.unsigned-item {
                    background: rgba(42, 27, 10, 0.03);
                    border: 1px dashed rgba(121, 85, 72, 0.3);
                    color: #5d4037;
                    opacity: 0.8;
                }

                .sig-name {
                    font-weight: 700;
                    color: #2a1b0a;
                    font-size: 0.85rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .sig-ui {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .sig-status-text {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.6;
                }

                .sig-status {
                    font-size: 1.1rem;
                    margin-left: 8px;
                    filter: drop-shadow(0 0 5px rgba(142, 0, 0, 0.2));
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
