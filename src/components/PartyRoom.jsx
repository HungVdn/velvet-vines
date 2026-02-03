import React, { useState, useRef, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update } from 'firebase/database'

export default function PartyRoom({ players, onBack, isAdmin, roomId, roomState }) {
    const [draggedId, setDraggedId] = useState(null)
    const sceneRef = useRef(null)

    // Map of playerId -> slotIndex (0 to N-1)
    const playerSlots = roomState?.playerSlots || {}
    const numPlayers = players.length
    const angleStep = 360 / numPlayers

    const getSlotAngle = (slotIndex) => slotIndex * angleStep

    const handleStartDrag = (e, id) => {
        if (!isAdmin) return
        setDraggedId(id)
    }

    const handleMouseMove = (e) => {
        if (!draggedId || !isAdmin || !sceneRef.current) return

        const rect = sceneRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY

        const angleRad = Math.atan2(clientY - centerY, clientX - centerX)
        let angleDeg = angleRad * (180 / Math.PI) + 90
        if (angleDeg < 0) angleDeg += 360

        // Calculate closest slot index
        const closestSlotIndex = Math.round(angleDeg / angleStep) % numPlayers
        const currentSlotIndex = playerSlots[draggedId] !== undefined ? playerSlots[draggedId] : players.findIndex(p => p.id === draggedId)

        if (closestSlotIndex !== currentSlotIndex) {
            // Find who is currently in the target slot
            const resolvedTargetId = players.find((p, idx) => {
                const sIdx = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx;
                return sIdx === closestSlotIndex && p.id !== draggedId;
            })?.id;

            const updates = {};
            updates[`rooms/${roomId}/playerSlots/${draggedId}`] = closestSlotIndex;
            if (resolvedTargetId) {
                updates[`rooms/${roomId}/playerSlots/${resolvedTargetId}`] = currentSlotIndex;
            }
            update(ref(db), updates);
        }
    }

    const handleEndDrag = () => {
        setDraggedId(null)
    }

    useEffect(() => {
        if (draggedId) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleEndDrag)
            window.addEventListener('touchmove', handleMouseMove)
            window.addEventListener('touchend', handleEndDrag)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleEndDrag)
            window.removeEventListener('touchmove', handleMouseMove)
            window.removeEventListener('touchend', handleEndDrag)
        }
    }, [draggedId, playerSlots])

    return (
        <div className="party-room animate-fade">
            <button className="back-button" onClick={onBack}>← Menu</button>
            <h2 className="gold-text" style={{ marginBottom: '2rem' }}>Phòng Tiệc Velvet</h2>

            <div className="scene-container" ref={sceneRef}>
                <div className="table-container">
                    <div className="table-surface">
                        <div className="table-inner">
                            <div className="table-shine"></div>
                        </div>
                    </div>
                </div>

                <div className="players-container">
                    {players.map((player, index) => {
                        const slotIndex = playerSlots[player.id] !== undefined ? playerSlots[player.id] : index;
                        const angle = getSlotAngle(slotIndex);
                        const radius = 180;
                        const isDragging = draggedId === player.id;

                        return (
                            <div
                                key={player.id}
                                className={`player-spot ${isDragging ? 'dragging' : ''} ${isAdmin ? 'admin-can-drag' : ''}`}
                                onMouseDown={(e) => handleStartDrag(e, player.id)}
                                onTouchStart={(e) => handleStartDrag(e, player.id)}
                                style={{
                                    transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)`,
                                    transition: isDragging ? 'transform 0.1s linear' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <div className="avatar">
                                    {player.nickname.charAt(0).toUpperCase()}
                                    {player.isAdmin && <span className="admin-crown">👑</span>}
                                </div>
                                <span className="nickname">{player.nickname}</span>
                                <div className="glass-indicator">🥂</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <style jsx>{`
                .party-room {
                    width: 100%;
                    min-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    user-select: none;
                }
                .scene-container {
                    position: relative;
                    width: 500px;
                    height: 500px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .table-container {
                    position: absolute;
                    width: 250px;
                    height: 250px;
                    z-index: 1;
                    pointer-events: none;
                }
                .table-surface {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
                    border-radius: 50%;
                    border: 4px solid var(--gold);
                    box-shadow: 0 0 50px rgba(212, 175, 55, 0.3), inset 0 0 20px rgba(0,0,0,0.8);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .table-inner {
                    width: 90%;
                    height: 90%;
                    border-radius: 50%;
                    border: 1px solid rgba(212, 175, 55, 0.1);
                    background: radial-gradient(circle at center, rgba(51, 51, 51, 0.5), transparent);
                    overflow: hidden;
                }
                .table-shine {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent);
                    animation: rotateShine 8s linear infinite;
                }
                @keyframes rotateShine {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .players-container {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    z-index: 2;
                }
                .player-spot {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    margin-top: -40px;
                    margin-left: -40px;
                    width: 80px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: default;
                }
                .admin-can-drag { cursor: grab; }
                .player-spot.dragging {
                    cursor: grabbing;
                    z-index: 10;
                    filter: brightness(1.2);
                }
                .avatar {
                    width: 65px;
                    height: 65px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid var(--gold);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: var(--gold-light);
                    font-weight: bold;
                    position: relative;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    animation: breathe 3s ease-in-out infinite;
                }
                @keyframes breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); border-color: var(--gold-light); }
                }
                .admin-crown {
                    position: absolute;
                    top: -18px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 1.2rem;
                }
                .nickname {
                    margin-top: 10px;
                    font-size: 0.9rem;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                    font-weight: 500;
                    white-space: nowrap;
                }
                .glass-indicator {
                    font-size: 1.2rem;
                    margin-top: 4px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }
                @media (max-width: 600px) {
                    .scene-container { transform: scale(0.7); }
                }
            `}</style>
        </div>
    )
}
