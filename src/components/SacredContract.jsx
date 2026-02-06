import React from 'react'
import { GAME_RULES, GLOBAL_OATH } from '../data/defaults'
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

export default function SacredContract({ gameMode, onSign, players, signatures, currentUserId, hasSigned, showGlobalOath }) {
    const rule = GAME_RULES[gameMode]
    const signedCount = Object.keys(signatures || {}).length
    const totalCount = players?.length || 0

    return (
        <div className="sacred-contract-overlay animate-fade">
            <div className="contract-parchment animate-scale-in">
                <div className="parchment-rings top"></div>

                <div className="contract-header">
                    <img src={logoOuroboros} alt="" className="contract-ouroboros" />
                    <h2 className="sacred-title">
                        {showGlobalOath ? GLOBAL_OATH.title : "MỆNH LỆNH TRÒ CHƠI"}
                    </h2>
                    <p className="contract-subtitle">
                        {showGlobalOath ? GLOBAL_OATH.description : "Hãy thấu hiểu luật lệ trước khi nhập cuộc:"}
                    </p>
                </div>

                <div className="contract-body">
                    {showGlobalOath && (
                        <div className="clauses-container">
                            {GLOBAL_OATH.clauses.map((clause, idx) => (
                                <div key={idx} className="clause-item">
                                    <span className="clause-number">{idx + 1}.</span>
                                    <p className="clause-text">{clause}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mode-specific-rule">
                        <p className="game-name-ritual">-{gameMode?.replace('-', ' ').toUpperCase()}-</p>
                        <div className="sacred-rule-text">
                            "{rule}"
                        </div>
                    </div>

                    {!hasSigned ? (
                        <div className="universal-ritual">
                            {showGlobalOath
                                ? '"Thanh tẩy tâm trí, chấp nhận sự thật. Kẻ phá vỡ khế ước sẽ phải đối mặt với linh hồn oán than."'
                                : '"Tuân thủ luật lệ, giữ gìn danh dự. Cuộc vui chỉ trọn vẹn khi mọi linh hồn đồng lòng."'}
                        </div>
                    ) : (
                        <div className="waiting-list-container">
                            <div className="waiting-header">
                                <p className="waiting-title">
                                    {players?.filter(p => !signatures?.[p.id]).length > 0
                                        ? "Đang đợi các linh hồn điểm chỉ..."
                                        : "Tất cả đã sẵn sàng để 'tẩy trần'..."}
                                </p>
                                <div className="ritual-count">
                                    {signedCount}/{totalCount}
                                </div>
                            </div>
                            <div className="signature-list">
                                {players?.map(p => (
                                    <div key={p.id} className={`signature-item ${signatures?.[p.id] ? 'signed-item' : 'unsigned-item'}`}>
                                        <div className="sig-ui">
                                            {signatures?.[p.id] ? (
                                                <div className="blood-mark">
                                                    <BloodSeal seed={p.id} size={35} />
                                                </div>
                                            ) : (
                                                <div className="awaiting-circle"></div>
                                            )}
                                        </div>
                                        <span className="sig-name">{p.nickname}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="contract-footer">
                    {!hasSigned && (
                        <button className="sign-blood-btn" onClick={onSign}>
                            Hạ Ấn Bất Diệt 🩸
                        </button>
                    )}
                </div>

                <div className="parchment-rings bottom"></div>
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
                    max-width: 480px;
                    background: #f4ecd8;
                    background-image: url("https://www.transparenttextures.com/patterns/old-paper.png");
                    padding: 3rem 2rem;
                    border-radius: 8px;
                    box-shadow: 0 40px 120px rgba(0,0,0,0.9);
                    border: 2px solid #8c7851;
                    text-align: center;
                    position: relative;
                    max-height: 90vh;
                    overflow-y: auto;
                    scrollbar-width: none;
                }

                .contract-parchment::-webkit-scrollbar { display: none; }

                .parchment-rings {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 80%;
                    height: 15px;
                    border: 4px double #8c7851;
                    border-radius: 50%;
                    opacity: 0.3;
                }
                .parchment-rings.top { top: 15px; }
                .parchment-rings.bottom { bottom: 15px; }

                .contract-header {
                    margin-bottom: 2rem;
                }

                .contract-subtitle {
                    font-family: var(--font-body);
                    font-size: 0.8rem;
                    color: #5d4037;
                    font-style: italic;
                    margin-top: 0.5rem;
                }

                .clauses-container {
                    text-align: left;
                    margin-bottom: 2.5rem;
                    padding: 0 1rem;
                    border-bottom: 1px solid rgba(140, 120, 81, 0.3);
                    padding-bottom: 2rem;
                }

                .clause-item {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 1rem;
                }

                .clause-number {
                    font-family: var(--font-magic);
                    color: #8e0000;
                    font-weight: 900;
                    font-size: 1rem;
                }

                .clause-text {
                    font-family: var(--font-body);
                    font-size: 0.85rem;
                    line-height: 1.5;
                    color: #2a1b0a;
                    margin: 0;
                    opacity: 0.9;
                }

                .mode-specific-rule {
                    margin-bottom: 2rem;
                }

                .contract-ouroboros {
                    width: 70px;
                    height: 70px;
                    opacity: 0.9;
                    margin-bottom: 0.5rem;
                    filter: sepia(1) saturate(5) hue-rotate(-50deg) drop-shadow(0 0 10px rgba(142, 0, 0, 0.4));
                }

                .sacred-title {
                    font-family: var(--font-magic);
                    color: #4a3410;
                    font-size: 1.6rem;
                    letter-spacing: 5px;
                    text-transform: uppercase;
                    margin: 0;
                    text-shadow: 1px 1px 1px rgba(0,0,0,0.1);
                }

                .contract-body {
                    position: relative;
                }

                .contract-body::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 200px;
                    height: 200px;
                    background: #8c7851;
                    mask: url('../assets/logo_ouroboros.png') no-repeat center;
                    -webkit-mask: url('../assets/logo_ouroboros.png') no-repeat center;
                    mask-size: contain;
                    -webkit-mask-size: contain;
                    opacity: 0.05;
                    pointer-events: none;
                }

                .game-name-ritual {
                    font-family: var(--font-heading);
                    font-size: 0.8rem;
                    letter-spacing: 4px;
                    color: #8c7851;
                    margin-bottom: 1rem;
                    font-weight: 800;
                    text-transform: uppercase;
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
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    max-height: 250px;
                    overflow-y: auto;
                    padding: 10px;
                }

                .signature-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.4s ease;
                }

                .signature-item.signed-item {
                    transform: scale(1.05);
                }

                .sig-ui {
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(42, 27, 10, 0.05);
                    border-radius: 50%;
                    border: 1px solid rgba(140, 120, 81, 0.2);
                    position: relative;
                }

                .awaiting-circle {
                    width: 25px;
                    height: 25px;
                    border: 2px dashed #8c7851;
                    border-radius: 50%;
                    opacity: 0.4;
                    animation: rotate 10s linear infinite;
                }

                .blood-mark {
                    animation: stampEffect 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes stampEffect {
                    0% { transform: scale(3); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .sig-name {
                    font-weight: 700;
                    color: #2a1b0a;
                    font-size: 0.75rem;
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
