import React, { useState, useRef, useEffect } from 'react'
import { db } from '../firebase'
import { ref, update } from 'firebase/database'
import logoOuroboros from '../assets/logo_ouroboros.png'
import Ouroboros3D from './Ouroboros3D'

export default function PartyRoom({ players, onBack, isAdmin, roomId, roomState, activeGame, localPlayers, onAddPlayer, onRemoveLocalPlayer }) {
    const [draggedId, setDraggedId] = useState(null)
    const [pulsePos, setPulsePos] = useState(null)
    const [wispSlot, setWispSlot] = useState(null)
    const [isRitualActive, setIsRitualActive] = useState(false)
    const lastHandledTsRef = useRef(0)
    const sceneRef = useRef(null)
    const ritualTimeoutRef = useRef(null)

    // Map of playerId -> slotIndex (0 to N-1)
    const playerSlots = roomState?.playerSlots || {}
    const activeTurnSlot = roomState?.activeTurnSlot || 0
    const numPlayers = players.length
    const angleStep = 360 / Math.max(numPlayers, 1)

    const getSlotAngle = (slotIndex) => slotIndex * angleStep

    // Cinematic Ritual Trigger
    useEffect(() => {
        const startTs = roomState?.gameStartTimestamp || 0
        const penaltyTs = roomState?.penaltyRitualTimestamp || 0

        // 1. Handle NEW Penalty Ritual (Highest Priority)
        if (penaltyTs > 0 && penaltyTs > lastHandledTsRef.current) {
            lastHandledTsRef.current = penaltyTs
            const targetSlot = roomState?.penaltyRitualSlot || 0

            setIsRitualActive(true)
            let startTime = Date.now()
            const duration = 2800

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = elapsed / duration

                if (progress < 1) {
                    const totalSpins = 5
                    const easedProgress = progress < 0.2
                        ? Math.pow(progress / 0.2, 2) * 0.2
                        : 1 - Math.pow(1 - progress, 2.2)

                    const currentPos = (easedProgress * totalSpins * (numPlayers || 1)) + (targetSlot || 0)
                    setWispSlot(currentPos % (numPlayers || 1))
                    requestAnimationFrame(animate)
                } else {
                    setWispSlot(null)
                    ritualTimeoutRef.current = setTimeout(() => {
                        setIsRitualActive(false)
                    }, 800)
                }
            }
            requestAnimationFrame(animate)
            return
        }

        // 2. Handle NEW Game Start Ritual (Only if no active penalty and it's fresh)
        if (!penaltyTs && startTs > 0 && startTs > lastHandledTsRef.current) {
            lastHandledTsRef.current = startTs
            const targetSlot = roomState?.activeTurnSlot || 0

            setIsRitualActive(true)
            let startTime = Date.now()
            const duration = 2800

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = elapsed / duration

                if (progress < 1) {
                    const totalSpins = 5
                    const easedProgress = progress < 0.2
                        ? Math.pow(progress / 0.2, 2) * 0.2
                        : 1 - Math.pow(1 - progress, 2.2)

                    const currentPos = (easedProgress * totalSpins * (numPlayers || 1)) + (targetSlot || 0)
                    setWispSlot(currentPos % (numPlayers || 1))
                    requestAnimationFrame(animate)
                } else {
                    setWispSlot(null)
                    ritualTimeoutRef.current = setTimeout(() => {
                        setIsRitualActive(false)
                    }, 800)
                }
            }
            requestAnimationFrame(animate)
        }
        // CRITICAL: We do NOT have activeTurnSlot in dependencies.
        // We only respond to ritual events (Start or Penalty).
    }, [roomState?.gameStartTimestamp, roomState?.penaltyRitualTimestamp, roomState?.penaltyRitualSlot, roomState?.activeTurnSlot, numPlayers])

    // Effect for turn transition pulse
    useEffect(() => {
        if (activeTurnSlot !== undefined) {
            setPulsePos(activeTurnSlot)
            const timer = setTimeout(() => setPulsePos(null), 1000)
            return () => clearTimeout(timer)
        }
    }, [activeTurnSlot])

    const handleStartDrag = (e, id) => {
        if (!isAdmin) return
        setDraggedId(id)
    }
    // ... (handleMouseMove and handleEndDrag remain the same logic, but with angleStep check)
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
            const updates = {};
            updates[`rooms/${roomId}/playerSlots/${draggedId}`] = closestSlotIndex;

            // Swap if someone else is there
            const targetPlayer = players.find((p, idx) => {
                const sIdx = playerSlots[p.id] !== undefined ? playerSlots[p.id] : idx;
                return sIdx === closestSlotIndex && p.id !== draggedId;
            });
            if (targetPlayer) {
                updates[`rooms/${roomId}/playerSlots/${targetPlayer.id}`] = currentSlotIndex;
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

            <div className="ritual-embers-bg">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="ritual-ember" style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 12}s`,
                        animationDuration: `${10 + Math.random() * 10}s`
                    }}></div>
                ))}
            </div>

            <header className="room-header">
                <h1 className="header-title gold-foil">Mật Viện Velvet</h1>
            </header>

            {roomState?.activeTurnSlot !== undefined && (
                <div className="turn-indicator-pill gold-foil">
                    Linh hồn dẫn dắt: {players[roomState.activeTurnSlot]?.nickname || '...'}
                </div>
            )}

            <div className={`scene-container ${activeGame ? 'game-active' : ''}`} ref={sceneRef}>
                <div className="table-container">
                    <div className="table-surface">
                        <Ouroboros3D />
                        <div className="table-inner">
                            <div className="grain-overlay"></div>
                            <div className="table-shine"></div>
                            {activeGame && (
                                <div className={`game-stage ${isRitualActive ? 'ritual-hidden' : 'animate-scale-in'}`}>
                                    {activeGame}
                                </div>
                            )}
                        </div>
                        {pulsePos !== null && !isRitualActive && (
                            <div
                                className="turn-pulse"
                                style={{ transform: `rotate(${getSlotAngle(pulsePos)}deg)` }}
                            ></div>
                        )}
                    </div>
                </div>

                <div className="players-container">
                    {players.map((player, index) => {
                        const slotIndex = playerSlots[player.id] !== undefined ? playerSlots[player.id] : index;
                        const angle = getSlotAngle(slotIndex);

                        // Dynamic Geometry for Large Covens
                        const playerCount = players.length;
                        const baseRadius = activeGame ? 285 : 200;
                        const dynamicRadius = playerCount > 10
                            ? baseRadius + (playerCount - 10) * 12 // Expand 12px per extra player
                            : baseRadius;

                        // Scale down if crowded
                        const avatarScale = playerCount > 12 ? 0.85 : 1;

                        const radius = dynamicRadius;
                        const isDragging = draggedId === player.id;
                        const isActiveTurn = activeTurnSlot === slotIndex;
                        const isOnMyDevice = localPlayers?.some(lp => lp.id === player.id);


                        return (
                            <div
                                key={player.id}
                                className={`player-spot ${isDragging ? 'dragging' : ''} ${isAdmin ? 'admin-can-drag' : ''} ${isActiveTurn ? 'active-turn' : ''} ${isOnMyDevice ? 'on-my-device' : ''} ${isRitualActive ? 'ritual-active' : ''}`}
                                onMouseDown={(e) => handleStartDrag(e, player.id)}
                                onTouchStart={(e) => handleStartDrag(e, player.id)}
                                style={{
                                    transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg) scale(${avatarScale})`,
                                    transition: isDragging ? 'transform 0.1s linear' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}
                            >
                                <div className="avatar-frame">
                                    <div className="avatar">
                                        {player.nickname.charAt(0).toUpperCase()}
                                    </div>
                                    <img src={logoOuroboros} className="ouroboros-frame" alt="" />
                                    {player.isAdmin && <span className="admin-crown">👑</span>}
                                    {isOnMyDevice && <span className="my-device-badge">📱</span>}
                                    {isActiveTurn && <div className="turn-glow-ring"></div>}
                                    {(player.skipCount > 0 && roomState?.gameMode === 'truth-or-dare') && (
                                        <div className={`skip-badge ${player.skipCount >= 3 ? 'limit-reached' : ''}`}>
                                            {player.skipCount}/3
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {isRitualActive && wispSlot !== null && (
                    <div
                        className="magic-wisp"
                        style={{
                            left: '50%',
                            top: '50%',
                            marginLeft: '-22px',
                            marginTop: '-22px',
                            transform: `rotate(${wispSlot * angleStep}deg) translateY(-280px)`,
                            zIndex: 9999
                        }}
                    >
                        <div className="wisp-aura"></div>
                        <div className="wisp-trail-braid t1"></div>
                        <div className="wisp-trail-braid t2"></div>
                        <div className="wisp-trail-braid t3"></div>
                        <div className="wisp-core">
                            <div className="eye-sclera"></div>
                            <div className="eye-iris"></div>
                            <div className="eye-pupil"></div>
                            <div className="eye-glint"></div>
                        </div>
                        <div className="wisp-sparkles">
                            {[...Array(5)].map((_, i) => <div key={i} className={`wisp-spark s${i}`}></div>)}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .party-room {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    min-height: 100vh;
                    min-height: 100dvh;
                    padding-top: 2rem;
                    position: relative;
                    overflow-x: hidden;
                    background: radial-gradient(circle at center, rgba(17, 8, 26, 0.4), transparent);
                }

                .room-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    z-index: 10;
                    width: 100%;
                }

                .header-title {
                    font-size: clamp(1.8rem, 8vw, 3.5rem);
                    font-family: var(--font-magic);
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    margin: 0;
                    word-break: keep-all;
                }

                .turn-indicator-pill {
                    background: rgba(15, 8, 25, 0.85);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--glass-border);
                    padding: 8px 30px;
                    border-radius: 50px;
                    font-size: 0.9rem;
                    color: var(--gold);
                    z-index: 15;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    font-weight: 600;
                    animation: pillPulse 4s infinite ease-in-out;
                }

                @keyframes pillPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    50% { transform: scale(1.05); box-shadow: 0 15px 40px rgba(191,149,63,0.3); }
                }

                .gold-foil {
                  background: linear-gradient(
                    to right,
                    #BF953F,
                    #FCF6BA,
                    #B38728,
                    #FBF5B7,
                    #AA771C
                  );
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  animation: shimmer 10s linear infinite;
                  background-size: 200% auto;
                }

                @keyframes shimmer {
                  to { background-position: 200% center; }
                }

                .scene-container {
                    position: relative;
                    width: 100%;
                    max-width: 800px;
                    aspect-ratio: 1/1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform;
                    overflow: visible;
                    margin: 2rem auto 0; /* Added breathing room at top */
                    /* Defensive scaling for mobile-first fit - conservative 820px base */
                    transform: scale(min(0.95, calc(100vw / 820))); 
                    z-index: 5;
                }

                .scene-container.game-active {
                    transform: scale(min(0.95, calc(100vw / 850)));
                }

                .table-container {
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    z-index: 1;
                    pointer-events: none;
                    animation: floatTable 6s ease-in-out infinite;
                }

                @keyframes floatTable {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .scene-container.game-active .table-container {
                    width: 540px;
                    height: 540px;
                    pointer-events: all;
                }

                .table-surface {
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at center, #230B4A 0%, #050208 100%);
                    border-radius: 50%;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 0 100px rgba(0,0,0,1),
                        0 0 40px rgba(175, 144, 67, 0.15),
                        inset 0 0 40px rgba(0,0,0,0.8);
                    border: 1px solid rgba(175, 144, 67, 0.1);
                }

                .table-min-ouroboros {
                    position: absolute;
                    width: 112%;
                    height: 112%;
                    opacity: 1;
                    animation: slowRotate 60s linear infinite;
                    pointer-events: none;
                    filter: drop-shadow(0 0 15px rgba(175, 144, 67, 0.4)) brightness(1.2); /* Boosted ring clarity */
                }

                @keyframes slowRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .table-inner {
                    width: 82%;
                    height: 82%;
                    border-radius: 50%;
                    background: 
                      url("https://www.transparenttextures.com/patterns/dark-matter.png"),
                      radial-gradient(circle at center, #230B4A, #0C0514); /* Lightened inner area */
                    position: relative;
                    overflow: visible;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(175, 144, 67, 0.4);
                    box-shadow: inset 0 0 60px rgba(0,0,0,0.7); /* Softened interior shadows */
                }

                .table-shine {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 70%);
                    pointer-events: none;
                    border-radius: 50%;
                }

                .grain-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.05;
                    pointer-events: none;
                    background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
                    border-radius: 50%;
                }

                .game-stage {
                    width: 90%;
                    height: 90%;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: visible;
                }

                .players-container {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    z-index: 2;
                    pointer-events: none;
                }

                .player-spot {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    margin-top: -50px;
                    margin-left: -50px;
                    width: 100px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: default;
                    pointer-events: none;
                    will-change: transform;
                }

                .avatar-frame {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: transparent; /* Removed black background */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: var(--gold-light);
                    font-weight: 800;
                    font-family: var(--font-heading);
                    z-index: 2;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8); /* Ensure text pop */
                }

                .ouroboros-frame {
                    position: absolute;
                    width: 140%; /* Slightly larger to clear text */
                    height: 140%;
                    top: -20%;
                    left: -20%;
                    z-index: 1; /* Behind text but part of frame */
                    pointer-events: none;
                    opacity: 1;
                }

                .turn-glow-ring {
                    position: absolute;
                    top: -10%;
                    left: -10%;
                    width: 120%;
                    height: 120%;
                    border-radius: 50%;
                    border: 2px solid var(--gold);
                    box-shadow: 0 0 20px var(--gold), inset 0 0 10px var(--gold);
                    animation: pulseRing 1.5s infinite;
                    z-index: 1;
                }

                @keyframes pulseRing {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.1); opacity: 0; }
                }





                .admin-crown {
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 1.2rem;
                    z-index: 10;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
                }


                .skip-badge {
                    position: absolute;
                    bottom: -5px;
                    right: -5px;
                    background: var(--gold);
                    color: #000;
                    font-size: 0.65rem;
                    font-family: var(--font-heading);
                    font-weight: 800;
                    padding: 2px 6px;
                    border-radius: 10px;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                    border: 1px solid #000;
                    animation: badgePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .skip-badge.limit-reached {
                    background: #8e0000;
                    color: #fff;
                    border-color: var(--gold);
                    box-shadow: 0 0 10px rgba(142, 0, 0, 0.5);
                }

                @keyframes badgePop {
                    from { transform: scale(0) rotate(-20deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }

                .glass-indicator { display: none; } 

                .my-device-badge {
                    position: absolute;
                    bottom: -8px;
                    left: -8px;
                    font-size: 0.9rem;
                    z-index: 10;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
                }

                .on-my-device { border-color: rgba(191,149,63,0.3); background: rgba(191,149,63,0.05); }
                .add-player-btn { background: rgba(191,149,63,0.15); border: 1px dashed rgba(191,149,63,0.4); color: var(--gold-light); }

                /* Cinematic Ritual Styles */
                .ritual-hidden {
                    opacity: 0;
                    transform: scale(0.8);
                    pointer-events: none;
                }
                
                /* Wisp 2.0: The Ouroboros Soul */
                .magic-wisp {
                    position: absolute;
                    width: 44px;
                    height: 44px;
                    z-index: 10000;
                    pointer-events: none;
                }
                
                .wisp-aura {
                    position: absolute;
                    inset: -20px;
                    background: radial-gradient(circle, rgba(175, 82, 222, 0.3) 0%, transparent 70%);
                    filter: blur(10px);
                    animation: auraPulse 3s infinite ease-in-out;
                    z-index: -1;
                }

                .wisp-core {
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 35% 35%, #fff 0%, #ffd700 30%, #bf953f 60%, #4a3b1a 100%);
                    border-radius: 50%;
                    position: relative;
                    box-shadow: 
                        0 0 30px rgba(255, 215, 0, 0.4), 
                        inset -2px -2px 6px rgba(0,0,0,0.5);
                    animation: wispPulse2 2s infinite ease-in-out, wispColorShift 8s infinite linear;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .eye-sclera {
                    position: absolute;
                    inset: 2px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #af52de33 0%, #000 70%);
                    z-index: 1;
                }

                .eye-iris {
                    position: absolute;
                    width: 80%;
                    height: 80%;
                    border-radius: 50%;
                    background: conic-gradient(
                        from 0deg,
                        #bf953f 0deg,
                        #ff2d55 90deg,
                        #bf953f 180deg,
                        #ff2d55 270deg,
                        #bf953f 360deg
                    );
                    filter: blur(2px) contrast(1.5);
                    opacity: 0.6;
                    animation: irisRotate 4s infinite linear;
                    z-index: 2;
                }

                .eye-pupil {
                    position: absolute;
                    width: 35%;
                    height: 35%;
                    background: #000;
                    border-radius: 50%;
                    z-index: 3;
                    box-shadow: 0 0 10px rgba(175, 82, 222, 0.8), inset 0 0 5px #af52de;
                    animation: pupilDilate 3s infinite ease-in-out;
                }

                .eye-glint {
                    position: absolute;
                    top: 25%;
                    left: 25%;
                    width: 6px;
                    height: 6px;
                    background: #fff;
                    border-radius: 50%;
                    filter: blur(1px);
                    z-index: 4;
                    opacity: 0.8;
                    animation: glintShimmer 2s infinite alternate ease-in-out;
                }

                @keyframes irisRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes pupilDilate {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                }

                @keyframes glintShimmer {
                    from { transform: translate(0, 0) scale(1); opacity: 0.6; }
                    to { transform: translate(2px, -1px) scale(1.2); opacity: 0.9; }
                }

                /* Braided Trails */
                .wisp-trail-braid {
                    position: absolute;
                    top: 50%; left: 50%;
                    width: 250%; height: 250%;
                    transform-origin: center;
                    border-radius: 50%;
                    mix-blend-mode: screen;
                }
                
                .t1 {
                    background: conic-gradient(from 0deg, transparent 40%, rgba(191,149,63,0.6) 50%, transparent 60%);
                    animation: wispTrailRotate 1s infinite linear;
                }
                .t2 {
                    width: 200%; height: 200%;
                    background: conic-gradient(from 120deg, transparent 40%, rgba(255, 45, 85, 0.4) 50%, transparent 60%);
                    animation: wispTrailRotate 1.5s infinite linear reverse;
                }
                .t3 {
                    width: 300%; height: 300%;
                    background: conic-gradient(from 240deg, transparent 45%, rgba(175, 82, 222, 0.3) 50%, transparent 55%);
                    animation: wispTrailRotate 3s infinite linear;
                }

                /* Sparkles */
                .wisp-spark {
                    position: absolute;
                    width: 4px; height: 4px;
                    background: #fff;
                    border-radius: 50%;
                    filter: blur(1px);
                    box-shadow: 0 0 8px var(--gold);
                    animation: wispSparkFloat 1s infinite ease-out;
                    opacity: 0;
                }
                .s0 { top: 10%; left: 10%; animation-delay: 0.1s; }
                .s1 { top: 80%; left: 20%; animation-delay: 0.3s; }
                .s2 { top: 40%; left: 90%; animation-delay: 0.5s; }
                .s3 { top: 90%; left: 70%; animation-delay: 0.7s; }
                .s4 { top: 20%; left: 80%; animation-delay: 0.9s; }

                @keyframes wispPulse2 {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.1); filter: brightness(1.3); }
                }

                @keyframes wispColorShift {
                    0%, 100% { filter: hue-rotate(0deg); }
                    33% { filter: hue-rotate(-20deg) saturate(1.5); } /* Redder */
                    66% { filter: hue-rotate(40deg); } /* More Golden/Purple */
                }

                @keyframes auraPulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.3); opacity: 0.5; }
                }

                @keyframes wispTrailRotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }

                @keyframes wispSparkFloat {
                    0% { transform: translate(0, 0) scale(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(var(--tx, 20px), var(--ty, -20px)) scale(0); opacity: 0; }
                }
                
                .wisp-spark:nth-child(1) { --tx: 30px; --ty: 20px; }
                .wisp-spark:nth-child(2) { --tx: -25px; --ty: 35px; }
                .wisp-spark:nth-child(3) { --tx: 40px; --ty: -30px; }
                .wisp-spark:nth-child(4) { --tx: -35px; --ty: -25px; }
                .wisp-spark:nth-child(5) { --tx: 20px; --ty: -40px; }


                .active-turn .avatar-frame {
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .active-turn:not(.ritual-active) .avatar-frame {
                    transform: scale(1.15);
                }

                @media (max-width: 600px) {
                    .header-title { font-size: 2.2rem; }
                    .global-turn-indicator { padding: 6px 15px; gap: 10px; margin-bottom: 1.5rem; }
                    .global-turn-indicator .value { font-size: 1rem; }
                }
            `}</style>
        </div >
    )
}
