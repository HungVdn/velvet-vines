import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update } from 'firebase/database'

export default function AdminPanel({ players, onSelectMode, onRemovePlayer, onOpenEditor, isAdmin, isModerator, roomState, roomId, localPlayers, onAddPlayer, onRemoveLocalPlayer }) {
    const [isRolling, setIsRolling] = useState(false)
    const [rollingName, setRollingName] = useState('')

    const globalRandomTimestamp = roomState?.globalRandomTimestamp || null

    useEffect(() => {
        if (globalRandomTimestamp) {
            setIsRolling(true)
            let timer = 0
            const interval = setInterval(() => {
                if (players.length > 0) {
                    const randInd = Math.floor(Math.random() * players.length)
                    setRollingName(players[randInd]?.nickname)
                }
                timer += 100
                if (timer >= 2000) {
                    clearInterval(interval)
                    setIsRolling(false)
                }
            }, 100)
            return () => clearInterval(interval)
        }
    }, [globalRandomTimestamp, players])
    const modes = [
        { id: 'party-room', name: 'Mật Viện Velvet', editable: false },
        { id: 'wild-cards', name: 'Lá Bài Hoang Dã', editable: true },
        { id: 'truth-or-dare', name: 'Sự Thật & Thách Thức', editable: true },
        { id: 'spotlight', name: 'Tâm Điểm', editable: true },
        { id: 'trivia', name: 'Tiên Tri Tửu', editable: true },
        { id: 'deep-secrets', name: 'Khế Ước Linh Hồn', editable: true },
    ]

    const handleUpdatePasscode = (newPasscode) => {
        if (!isAdmin) return
        update(ref(db, `rooms/${roomId}`), { joinPasscode: newPasscode })
    }


    const handleResetSession = () => {
        if (!isAdmin && !isModerator) return
        if (window.confirm('Bạn có chắc muốn làm mới toàn bộ bài đã xem? Các trò chơi sẽ bắt đầu lại từ đầu.')) {
            update(ref(db, `rooms/${roomId}`), {
                wildCardsSeen: null,
                todSeen: null,
                spotlightSeen: null,
                triviaSeen: null,
                deepSecretsSeen: null,
                wildCardsIndex: 0,
                todIndex: 0,
                triviaIndex: 0,
                deepSecretsIndex: 0,
                spotlightStarted: false,
                spotlightRevealed: false,
                spotlightCountdownStartTime: null,
                wildCardsRevealed: false,
                todRevealed: false,
                deepSecretsRevealed: false,
                triviaFeedback: null
            })

            // Reset skip counts for all players
            players.forEach(p => {
                update(ref(db, `rooms/${roomId}/players/${p.id}`), { skipCount: 0 })
            })
        }
    }

    return (
        <div className="admin-panel animate-fade">
            <div className="admin-header">
                <h2 className="gold-text header-small">{isAdmin ? 'Chủ Tế' : 'Hộ Pháp'}</h2>
                {isAdmin && (
                    <div className="passcode-config">
                        <label>Mã vào: </label>
                        <input
                            type="text"
                            className="passcode-input"
                            value={roomState?.joinPasscode || 'ForeverAlone'}
                            onChange={(e) => handleUpdatePasscode(e.target.value)}
                        />
                    </div>
                )}
                {(roomState?.globalRandomTarget || isRolling) && (
                    <div className={`global-random-reveal ${isRolling ? 'rolling' : 'animate-bounce'}`}>
                        🎲 {isRolling ? 'Đang triệu hồi...' : 'Định Mệnh Gọi Tên'}: <span className="gold-text">{isRolling ? rollingName : roomState?.globalRandomTarget}</span>
                    </div>
                )}
            </div>

            <div className="admin-sections">
                <section className="mode-selector premium-card">
                    <div className="grimoire-corner tl"></div>
                    <div className="grimoire-corner tr"></div>
                    <div className="grimoire-corner bl"></div>
                    <div className="grimoire-corner br"></div>
                    <h3>Khởi Tạo Nghi Lễ</h3>
                    <div className="mode-buttons">
                        {modes.map(mode => (
                            <div key={mode.id} className="mode-btn-group">
                                <button
                                    className="premium-button mode-btn"
                                    onClick={() => onSelectMode(mode.id)}
                                >
                                    {mode.name}
                                </button>
                                {mode.editable && (
                                    <button
                                        className="edit-content-btn"
                                        onClick={() => onOpenEditor(mode.id)}
                                        title="Chỉnh sửa nội dung"
                                    >
                                        ✎
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="turn-settings" style={{ marginTop: '2rem' }}>
                        <h4 className="gold-text" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Cài đặt lượt chơi</h4>
                        <div className="direction-toggle">
                            <button
                                className={`toggle-btn ${roomState?.turnDirection !== 'ccw' ? 'active' : ''}`}
                                onClick={() => update(ref(db, `rooms/${roomId}`), { turnDirection: 'cw' })}
                            >
                                ↻ Xuôi
                            </button>
                            <button
                                className={`toggle-btn ${roomState?.turnDirection === 'ccw' ? 'active' : ''}`}
                                onClick={() => update(ref(db, `rooms/${roomId}`), { turnDirection: 'ccw' })}
                            >
                                ↺ Ngược
                            </button>
                        </div>
                        <button
                            className="premium-button"
                            style={{ width: '100%', marginTop: '10px', fontSize: '0.7rem', padding: '5px' }}
                            onClick={() => update(ref(db, `rooms/${roomId}`), { activeTurnSlot: 0 })}
                        >
                            Đặt lại lượt về vị trí 0
                        </button>
                    </div>

                    <div className="mode-settings" style={{ marginTop: '1.5rem' }}>
                        <h4 className="gold-text" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Quy Tắc Vĩnh Hằng</h4>
                        <div className="direction-toggle">
                            <button
                                className={`toggle-btn ${!roomState?.autoMode ? 'active' : ''}`}
                                onClick={() => update(ref(db, `rooms/${roomId}`), { autoMode: false })}
                            >
                                Thủ công
                            </button>
                            <button
                                className={`toggle-btn ${roomState?.autoMode ? 'active' : ''}`}
                                title="Hết 1 vòng sẽ tự chuyển game"
                                onClick={() => update(ref(db, `rooms/${roomId}`), { autoMode: true })}
                            >
                                Tự động
                            </button>
                        </div>
                    </div>

                    <div className="session-reset" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(191,149,63,0.15)' }}>
                        <button
                            className="premium-button reset-btn-danger"
                            onClick={handleResetSession}
                        >
                            Tái Khởi Toàn Bộ Nghi Lễ
                        </button>
                    </div>
                </section>

                {/* Local Players on This Device */}
                {localPlayers && localPlayers.length > 0 && (
                    <section className="local-players-section premium-card">
                        <div className="grimoire-corner tl"></div>
                        <div className="grimoire-corner tr"></div>
                        <div className="grimoire-corner bl"></div>
                        <div className="grimoire-corner br"></div>
                        <h3>Trên điện thoại này (<span className="magic-number">{localPlayers.length}</span>)</h3>
                        <div className="player-list-admin">
                            {localPlayers.map(lp => (
                                <div key={lp.id} className="player-row local-player">
                                    <span className="nickname-admin">
                                        📱 {lp.nickname}
                                        {lp.isDeviceOwner && <span className="device-owner-badge">Chủ</span>}
                                    </span>
                                    {!lp.isDeviceOwner && onRemoveLocalPlayer && (
                                        <button
                                            className="remove-btn"
                                            onClick={() => onRemoveLocalPlayer(lp.id)}
                                        >
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {onAddPlayer && (
                            <button
                                className="premium-button add-player-btn"
                                style={{ width: '100%', marginTop: '10px', fontSize: '0.75rem' }}
                                onClick={onAddPlayer}
                            >
                                + Thêm người chơi vào điện thoại này
                            </button>
                        )}
                    </section>
                )}

                <section className="player-management premium-card">
                    <div className="grimoire-corner tl"></div>
                    <div className="grimoire-corner tr"></div>
                    <div className="grimoire-corner bl"></div>
                    <div className="grimoire-corner br"></div>
                    <h3>Tất cả người chơi (<span className="magic-number">{players.length}</span>)</h3>
                    <div className="player-list-admin">
                        {players.map(player => {
                            const isOnMyDevice = localPlayers?.some(lp => lp.id === player.id)
                            return (
                                <div key={player.id} className={`player-row ${isOnMyDevice ? 'on-my-device' : ''}`}>
                                    <span className="nickname-admin">
                                        {isOnMyDevice && <span className="my-device-indicator">📱</span>}
                                        {player.nickname}
                                        {player.isAdmin && <span className="mini-gold-crown">👑</span>}
                                        {player.isModerator && <span className="mini-mod-badge">◈</span>}
                                    </span>
                                    {isAdmin && !player.isAdmin && !isOnMyDevice && (
                                        <button
                                            className="remove-btn"
                                            onClick={() => onRemovePlayer(player.id)}
                                        >
                                            Đuổi
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            <style jsx>{`
                .admin-panel { 
                    width: 100%; 
                    color: var(--text-main);
                    font-family: var(--font-body);
                }
                .admin-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 2rem; 
                    border-bottom: 1px solid var(--glass-border);
                    padding-bottom: 1rem;
                }
                .header-small { 
                    font-size: 1.2rem; 
                    margin: 0; 
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    font-family: var(--font-magic);
                }
                .passcode-config { 
                    background: rgba(255,255,255,0.02); 
                    padding: 6px 12px; 
                    border-radius: 2px; 
                    border: 1px solid rgba(191,149,63,0.1); 
                    display: flex; 
                    align-items: center; 
                    gap: 8px; 
                }
                .passcode-config label { font-size: 0.6rem; color: var(--gold-light); text-transform: uppercase; opacity: 0.6; }
                .passcode-input { 
                    background: transparent; 
                    border: none; 
                    color: var(--gold-light); 
                    border-bottom: 1px solid transparent; 
                    outline: none; 
                    width: 90px; 
                    font-size: 0.85rem; 
                    font-family: var(--font-magic);
                    transition: border-color 0.3s ease;
                }
                .passcode-input:focus { border-color: var(--gold); }
                
                .admin-sections { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 2rem; 
                }
                
                .premium-card {
                    background: rgba(15, 8, 25, 0.7);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(191,149,63,0.1);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.8);
                    position: relative;
                    padding: 2.5rem 1.5rem 1.5rem;
                }

                .grimoire-corner {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(191,149,63,0.4);
                    pointer-events: none;
                }
                .grimoire-corner.tl { top: 0; left: 0; border-right: none; border-bottom: none; }
                .grimoire-corner.tr { top: 0; right: 0; border-left: none; border-bottom: none; }
                .grimoire-corner.bl { bottom: 0; left: 0; border-right: none; border-top: none; }
                .grimoire-corner.br { bottom: 0; right: 0; border-left: none; border-top: none; }

                .magic-number {
                    font-family: 'EB Garamond', serif;
                    font-size: 1.4rem;
                    color: var(--gold-light);
                    font-style: italic;
                }

                .nickname-admin {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                }

                .mini-gold-crown { font-size: 0.8rem; filter: drop-shadow(0 0 5px var(--gold)); }
                .mini-mod-badge { color: var(--gold); font-size: 0.7rem; opacity: 0.7; }

                .mode-selector, .player-management { 
                    margin-bottom: 2rem;
                    border-radius: 4px;
                }
                
                .mode-selector h3, .player-management h3 { 
                    font-size: 0.9rem; 
                    margin-bottom: 1.2rem; 
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    color: var(--gold);
                    font-family: var(--font-magic);
                    opacity: 0.8;
                }
                
                .mode-buttons { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 10px; 
                }
                
                .mode-btn-group { 
                    display: flex; 
                    gap: 6px; 
                    width: 100%; 
                    position: relative;
                }
                
                .mode-btn { 
                    flex: 1; 
                    text-align: center; 
                    padding: 14px 8px; 
                    font-size: 0.75rem; 
                    border-radius: 2px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(191,149,63,0.1);
                    color: var(--text-main);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                
                .mode-btn:hover {
                    border-color: var(--gold);
                    background: rgba(191,149,63,0.05);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                
                .edit-content-btn { 
                    background: transparent;
                    border: 1px solid rgba(191,149,63,0.1); 
                    color: var(--gold-dark); 
                    width: 32px; 
                    border-radius: 2px; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                }
                .edit-content-btn:hover {
                    color: var(--gold-light);
                    border-color: var(--gold);
                    background: rgba(255,255,255,0.05);
                }

                .player-list-admin { 
                    display: flex;
                    flex-direction: column;
                    gap: 8px; 
                }
                
                .player-row { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    background: rgba(255,255,255,0.02); 
                    padding: 12px 15px; 
                    border-radius: 2px; 
                    font-size: 0.8rem; 
                    border: 1px solid rgba(191,149,63,0.05);
                }
                
                .remove-btn { 
                    background: transparent;
                    color: #ff5252; 
                    border: 1px solid rgba(255,82,82,0.2); 
                    padding: 3px 8px; 
                    border-radius: 2px; 
                    cursor: pointer; 
                    font-size: 0.6rem; 
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    transition: all 0.2s ease;
                }
                .remove-btn:hover { background: #ff5252; color: white; border-color: #ff5252; }
                
                .turn-settings, .mode-settings { 
                    padding-top: 1.5rem; 
                    border-top: 1px solid rgba(191,149,63,0.1); 
                }
                
                .direction-toggle { 
                    display: flex; 
                    gap: 10px; 
                }
                
                .toggle-btn { 
                    flex: 1; 
                    background: transparent; 
                    border: 1px solid rgba(191,149,63,0.15); 
                    color: var(--gold-dark); 
                    padding: 8px; 
                    border-radius: 2px; 
                    cursor: pointer; 
                    font-size: 0.7rem; 
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    transition: all 0.4s ease;
                }
                
                .toggle-btn.active { 
                    background: rgba(191,149,63,0.1);
                    border-color: var(--gold); 
                    color: var(--gold-light); 
                    font-weight: 800;
                    box-shadow: inset 0 0 10px rgba(191,149,63,0.1);
                }
                
                .reset-btn-danger {
                    width: 100%; 
                    background: transparent;
                    border: 1px solid rgba(255,82,82,0.3);
                    color: #ff5252; 
                    border: none;
                    text-shadow: none;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 400;
                    margin-top: 1rem;
                }
                
                .reset-btn-danger:hover {
                    background: #8e0000;
                    color: white;
                    border-color: #8e0000;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(198,40,40,0.3);
                }

                @media (max-width: 600px) {
                    .mode-buttons { grid-template-columns: 1fr 1fr; }
                    .premium-card { padding: 1.5rem; }
                }

                .local-players-section { background: rgba(191,149,63,0.05); border-color: rgba(191,149,63,0.2); }
                .local-player { background: rgba(191,149,63,0.08); }
                .device-owner-badge { font-size: 0.6rem; background: var(--gold-gradient); color: #000; padding: 2px 6px; border-radius: 2px; margin-left: 8px; font-weight: 700; }
                .my-device-indicator { margin-right: 6px; }
                .on-my-device { border-color: rgba(191,149,63,0.3); background: rgba(191,149,63,0.05); }
                .add-player-btn { background: rgba(191,149,63,0.15); border: 1px dashed rgba(191,149,63,0.4); color: var(--gold-light); }

                .global-random-reveal {
                    background: rgba(191,149,63,0.15);
                    border: 1px solid var(--gold);
                    padding: 8px 15px;
                    border-radius: 4px;
                    color: white;
                    font-weight: 700;
                    box-shadow: 0 0 20px rgba(191,149,63,0.3);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 0.8rem;
                }

                .global-random-reveal.rolling {
                    border-style: solid;
                    background: rgba(191,149,63,0.3);
                    box-shadow: 0 0 30px rgba(191,149,63,0.5);
                    animation: rollingBorderGlobal 0.2s infinite;
                }
                @keyframes rollingBorderGlobal {
                    0% { border-color: var(--gold); }
                    50% { border-color: #ff2864; }
                    100% { border-color: var(--gold); }
                }
            `}</style>
        </div>
    )
}
