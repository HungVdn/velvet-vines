export default function AdminPanel({ roomId, players, onSelectMode, onRemovePlayer }) {
    const modes = [
        { id: 'wild-cards', name: 'Lá Bài Hoang Dã' },
        { id: 'truth-or-dare', name: 'Sự thật hay Thách thức' },
        { id: 'spotlight', name: 'Tâm Điểm' },
        { id: 'spin-sip', name: 'Vòng Quay Nhấp Môi' },
        { id: 'trivia', name: 'Đố Vui Nhậu Nhẹt' },
    ]

    return (
        <div className="admin-panel animate-fade">
            <div className="admin-header">
                <h2 className="gold-text">Bảng Điều Khiển Admin</h2>
                <div className="room-info">
                    Mã phòng: <span className="room-code">{roomId}</span>
                </div>
            </div>

            <div className="admin-grid">
                <section className="mode-selector premium-card">
                    <h3>Chọn trò chơi</h3>
                    <div className="mode-buttons">
                        {modes.map(mode => (
                            <button
                                key={mode.id}
                                className="premium-button"
                                onClick={() => onSelectMode(mode.id)}
                            >
                                {mode.name}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="player-management premium-card">
                    <h3>Người chơi ({players.length})</h3>
                    <div className="player-list-admin">
                        {players.map(player => (
                            <div key={player.id} className="player-row">
                                <span>{player.nickname} {player.isAdmin ? '(Admin)' : ''}</span>
                                {!player.isAdmin && (
                                    <button
                                        className="remove-btn"
                                        onClick={() => onRemovePlayer(player.id)}
                                    >
                                        Đuổi
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <style jsx>{`
                .admin-panel { margin-top: 2rem; width: 100%; max-width: 800px; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .room-code { color: var(--gold); font-weight: bold; letter-spacing: 2px; background: rgba(212,175,55,0.1); padding: 4px 12px; border-radius: 4px; border: 1px solid var(--gold-dark); }
                .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .mode-buttons { display: flex; flex-direction: column; gap: 10px; margin-top: 1rem; }
                .player-list-admin { display: flex; flex-direction: column; gap: 10px; margin-top: 1rem; }
                .player-row { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; }
                .remove-btn { background: #c62828; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
                @media (max-width: 600px) {
                    .admin-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    )
}
