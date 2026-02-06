import { useState, useEffect } from 'react'
import './App.css'
import WildCards from './components/WildCards'
import Spotlight from './components/Spotlight'
import DrunkTrivia from './components/DrunkTrivia'
import TruthOrDare from './components/TruthOrDare'
import Lobby from './components/Lobby'
import AdminPanel from './components/AdminPanel'
import PartyRoom from './components/PartyRoom'
import ContentEditor from './components/ContentEditor'
import DeepSecrets from './components/DeepSecrets'
import SacredContract from './components/SacredContract'
import { db } from './firebase'
import { ref, onValue, set, update, onDisconnect, remove } from 'firebase/database'
import { WILD_CARDS_DEFAULT, SPOTLIGHT_DEFAULT, TRIVIA_DEFAULT, DEEP_SECRETS_DEFAULT, GAME_SCHEMAS } from './data/defaults'
import { TRUTH_OR_DARE_DATA } from './data/truthOrDare'

// Helper to get or create a persistent deviceId
const getDeviceId = () => {
  let deviceId = localStorage.getItem('velvet_vines_device_id')
  if (!deviceId) {
    deviceId = 'device-' + Math.random().toString(36).substring(2, 11)
    localStorage.setItem('velvet_vines_device_id', deviceId)
  }
  return deviceId
}

function App() {
  // localPlayers: array of { id, nickname, isAdmin, isModerator, isDeviceOwner }
  const [localPlayers, setLocalPlayers] = useState([])
  const [deviceId] = useState(getDeviceId)
  const [roomId, setRoomId] = useState(null)
  const [gameMode, setGameMode] = useState(null)
  const [players, setPlayers] = useState([])
  const [roomState, setRoomState] = useState(null)
  const [editorGameId, setEditorGameId] = useState(null)
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)

  // Get primary user (device owner or first local player)
  const primaryUser = localPlayers.find(p => p.isDeviceOwner) || localPlayers[0]
  const isAdmin = primaryUser?.isAdmin || false
  const isModerator = primaryUser?.isModerator || false

  // 1. Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('velvet_vines_session')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.roomId && parsed.localPlayers?.length > 0) {
          setLocalPlayers(parsed.localPlayers)
          setRoomId(parsed.roomId)
        }
      } catch (e) {
        console.error("Failed to parse saved session", e)
      }
    }
  }, [])

  useEffect(() => {
    if (!roomId || localPlayers.length === 0) return

    const roomRef = ref(db, `rooms/${roomId}`)

    // Listen for room changes (gameMode, current card, etc.)
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setRoomState(data)
        setGameMode(data.gameMode)
      } else if (!isAdmin && !isModerator) {
        alert('Phòng đã bị đóng hoặc không tồn tại!')
        setLocalPlayers([])
        setRoomId(null)
        localStorage.removeItem('velvet_vines_session')
      }
    })

    // Sync players
    const playersRef = ref(db, `rooms/${roomId}/players`)
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const playerList = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        setPlayers(playerList)

        // Check if ALL my local players were removed
        const myLocalIds = localPlayers.map(p => p.id)
        const stillExists = playerList.some(p => myLocalIds.includes(p.id))
        if (!stillExists && localPlayers.length > 0) {
          setLocalPlayers([])
          setRoomId(null)
          localStorage.removeItem('velvet_vines_session')
        }
      }
    })

    // Register all local players
    localPlayers.forEach(lp => {
      const playerRef = ref(db, `rooms/${roomId}/players/${lp.id}`)
      set(playerRef, {
        nickname: lp.nickname,
        isAdmin: lp.isAdmin || false,
        isModerator: lp.isModerator || false,
        deviceId: deviceId,
        isDeviceOwner: lp.isDeviceOwner || false
      })
      onDisconnect(playerRef).remove()
    })

    return () => {
      unsubscribeRoom()
      unsubscribePlayers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, localPlayers.length, deviceId])

  // Derive signature state early for automation
  const currentSignatures = roomState?.signatures?.[gameMode] || {}
  const everyoneSigned = players.length > 0 && players.every(p => currentSignatures[p.id] === true)
  const allLocalPlayersSigned = localPlayers.every(lp => currentSignatures[lp.id] === true)

  // Signature-Gated Ritual Trigger (Host only)
  useEffect(() => {
    if (isAdmin && everyoneSigned && gameMode && gameMode !== 'party-room') {
      // Check if we already started the ritual for this specific mode
      if (roomState?.ritualStartedFor !== gameMode) {
        const randomIndex = Math.floor(Math.random() * players.length)
        update(ref(db, `rooms/${roomId}`), {
          activeTurnSlot: randomIndex,
          gameStartTimestamp: Date.now(),
          ritualStartedFor: gameMode // Lock trigger for this mode session
        })
      }
    }
  }, [isAdmin, everyoneSigned, gameMode, roomId, players.length, roomState?.ritualStartedFor])

  const handleJoin = async (data) => {
    const { nickname, passcode } = data
    const oduserId = Math.random().toString(36).substring(2, 9)
    const fixedRoomId = 'VELVET_VINES_PARTY'

    let playerIsAdmin = false
    let playerIsModerator = false

    // Fetch dynamic join code from Firebase
    const roomRef = ref(db, `rooms/${fixedRoomId}`)
    const roomSnapshot = await new Promise((resolve) => onValue(roomRef, (s) => resolve(s), { onlyOnce: true }))
    const currentPasscode = roomSnapshot.val()?.joinPasscode || 'ForeverAlone'

    if (passcode === '230502') {
      playerIsAdmin = true
    } else if (passcode === 'capnong' || passcode === 'capnia') {
      playerIsModerator = true
    } else if (passcode === currentPasscode) {
      playerIsAdmin = false
      playerIsModerator = false
    } else {
      return alert('Mã truy cập không chính xác!')
    }

    const newLocalPlayer = {
      id: oduserId,
      nickname,
      isAdmin: playerIsAdmin,
      isModerator: playerIsModerator,
      isDeviceOwner: true
    }

    if (playerIsAdmin) {
      update(ref(db, `rooms/${fixedRoomId}`), {
        adminId: oduserId
      })
    }

    const newLocalPlayers = [newLocalPlayer]
    setLocalPlayers(newLocalPlayers)
    setRoomId(fixedRoomId)
    localStorage.setItem('velvet_vines_session', JSON.stringify({
      roomId: fixedRoomId,
      localPlayers: newLocalPlayers
    }))
  }

  // Add another player to this device (no passcode needed)
  // Admin can add: regular or moderator
  // Moderator can only add: regular
  const addLocalPlayer = (nickname, role = 'regular') => {
    if (!nickname.trim()) return
    const newPlayerId = Math.random().toString(36).substring(2, 9)
    const newPlayer = {
      id: newPlayerId,
      nickname: nickname.trim(),
      isAdmin: false, // Can never add admin via this method
      isModerator: role === 'moderator' && isAdmin, // Only admin can add mod
      isDeviceOwner: false
    }

    const updated = [...localPlayers, newPlayer]
    setLocalPlayers(updated)
    localStorage.setItem('velvet_vines_session', JSON.stringify({
      roomId,
      localPlayers: updated
    }))

    // Register immediately to Firebase
    set(ref(db, `rooms/${roomId}/players/${newPlayerId}`), {
      nickname: newPlayer.nickname,
      isAdmin: false,
      isModerator: newPlayer.isModerator,
      deviceId: deviceId,
      isDeviceOwner: false
    })
    onDisconnect(ref(db, `rooms/${roomId}/players/${newPlayerId}`)).remove()
    setShowAddPlayerModal(false)
  }

  // Remove a local player from this device
  const removeLocalPlayerFromDevice = (playerId) => {
    const updated = localPlayers.filter(p => p.id !== playerId)
    setLocalPlayers(updated)
    localStorage.setItem('velvet_vines_session', JSON.stringify({
      roomId,
      localPlayers: updated
    }))
    remove(ref(db, `rooms/${roomId}/players/${playerId}`))
  }

  const resetGameStates = {
    wildCardsRevealed: false,
    todRevealed: false,
    spotlightRevealed: false,
    deepSecretsRevealed: false,
    penaltyRitualTimestamp: null,
    penaltyRitualSlot: null,
    globalRandomTarget: null,
    contractAccepted: false
  }

  const setGlobalMode = (mode) => {
    const updates = {
      gameMode: mode,
      signatures: null,
      ritualStartedFor: null, // Reset ritual lock
      ...resetGameStates
    }

    update(ref(db, `rooms/${roomId}`), updates)
  }

  const advanceTurn = () => {
    if (!isAdmin && !isModerator) return
    const currentSlot = roomState?.activeTurnSlot || 0
    const direction = roomState?.turnDirection || 'cw'
    const isAutoMode = roomState?.autoMode || false
    const numPlayers = players.length
    if (numPlayers === 0) return

    const occupiedSlots = players.map(p => {
      const slot = roomState?.playerSlots?.[p.id]
      return slot !== undefined ? slot : players.findIndex(pl => pl.id === p.id)
    }).sort((a, b) => a - b)

    if (occupiedSlots.length === 0) return

    let nextSlotIndex
    const currentIdxInOccupied = occupiedSlots.indexOf(currentSlot)

    // Check if we finished a round (reaching the end/start of the occupied list)
    let finishedRound = false
    if (direction === 'cw') {
      const isLast = currentIdxInOccupied === occupiedSlots.length - 1
      nextSlotIndex = occupiedSlots[(currentIdxInOccupied + 1) % occupiedSlots.length]
      if (isLast) finishedRound = true
    } else {
      const isFirst = currentIdxInOccupied === 0
      nextSlotIndex = occupiedSlots[(currentIdxInOccupied - 1 + occupiedSlots.length) % occupiedSlots.length]
      if (isFirst) finishedRound = true
    }

    const updates = {
      activeTurnSlot: nextSlotIndex,
      ...resetGameStates
    }

    if (finishedRound && isAutoMode) {
      const gameOrder = ['wild-cards', 'trivia', 'truth-or-dare', 'spotlight', 'deep-secrets']
      const currentIndex = gameOrder.indexOf(gameMode)
      if (currentIndex !== -1) {
        const nextGame = gameOrder[(currentIndex + 1) % gameOrder.length]
        updates.gameMode = nextGame
      }
    }

    update(ref(db, `rooms/${roomId}`), { ...updates })
  }

  const handleSkip = () => {
    if (localPlayers.length === 0) return
    // Use primary user for skip count tracking
    const myPlayer = players.find(p => p.id === primaryUser?.id)
    const currentSkips = myPlayer?.skipCount || 0
    const nextSkips = currentSkips + 1

    if (primaryUser) {
      update(ref(db, `rooms/${roomId}/players/${primaryUser.id}`), {
        skipCount: nextSkips
      })
    }

    advanceTurn()
  }

  const removePlayer = (playerId) => {
    remove(ref(db, `rooms/${roomId}/players/${playerId}`))
  }

  const openEditor = (gameId) => {
    setEditorGameId(gameId)
    setGameMode('content-editor')
  }

  // Define commonProps here so they are available to both renderGame and the main return block
  const commonProps = localPlayers.length > 0 ? {
    onBack: () => {
      setGameMode(null)
      if (isAdmin || isModerator) {
        update(ref(db, `rooms/${roomId}`), { gameMode: null })
      }
    },
    isAdmin: isAdmin,
    isModerator: isModerator,
    userId: primaryUser?.id,
    roomId: roomId,
    roomState: roomState,
    players: players,
    advanceTurn: advanceTurn,
    onSkip: handleSkip,
    userSkipCount: players.find(p => p.id === primaryUser?.id)?.skipCount || 0,
    // New props for multi-player device support
    localPlayers: localPlayers,
    deviceId: deviceId
  } : {};


  const renderGame = () => {
    if (gameMode === 'content-editor') {
      const gameNames = {
        'wild-cards': 'Lá Bài Hoang Dã',
        'truth-or-dare': 'Sự thật hay Thách thức',
        'spotlight': 'Tâm Điểm',
        'trivia': 'Đố Vui Nhậu Nhẹt',
        'deep-secrets': 'Sâu Sắc & Chia Sẻ'
      }
      const gameDefaults = {
        'wild-cards': WILD_CARDS_DEFAULT,
        'truth-or-dare': TRUTH_OR_DARE_DATA,
        'spotlight': SPOTLIGHT_DEFAULT,
        'trivia': TRIVIA_DEFAULT,
        'deep-secrets': DEEP_SECRETS_DEFAULT
      }

      return (
        <ContentEditor
          gameId={editorGameId}
          gameName={gameNames[editorGameId]}
          onBack={() => setGameMode(null)}
          defaultData={gameDefaults[editorGameId]}
          schema={GAME_SCHEMAS[editorGameId]}
        />
      )
    }

    // Skill: scroll-experience - Grimoire Page Flip
    return (
      <div key={gameMode} className="grimoire-page-container animate-page-flip">
        {(() => {
          switch (gameMode) {
            case 'wild-cards': return <WildCards {...commonProps} />
            case 'truth-or-dare': return <TruthOrDare {...commonProps} />
            case 'trivia': return <DrunkTrivia {...commonProps} />
            case 'spotlight': return <Spotlight {...commonProps} />
            case 'deep-secrets': return <DeepSecrets {...commonProps} />
            default: return null
          }
        })()}
      </div>
    )
  }

  if (localPlayers.length === 0) {
    return <Lobby onJoin={handleJoin} />
  }

  if (localPlayers.length === 0) {
    return <Lobby onJoin={handleJoin} />
  }

  return (
    <div className="app-container">
      {gameMode === 'content-editor' ? (
        renderGame()
      ) : (
        <div className="lobby-experience animate-fade">
          <PartyRoom
            {...commonProps}
            players={players}
            activeGame={(gameMode && gameMode !== 'party-room' && everyoneSigned) ? renderGame() : null}
            localPlayers={localPlayers}
            onAddPlayer={() => setShowAddPlayerModal(true)}
            onRemoveLocalPlayer={removeLocalPlayerFromDevice}
          />

          {gameMode && gameMode !== 'party-room' && !everyoneSigned && (
            <SacredContract
              gameMode={gameMode}
              onSign={() => {
                // Sign for all local players on this device
                localPlayers.forEach(lp => {
                  set(ref(db, `rooms/${roomId}/signatures/${gameMode}/${lp.id}`), true)
                })
              }}
              players={players}
              signatures={currentSignatures}
              currentUserId={primaryUser?.id}
              hasSigned={allLocalPlayersSigned}
              localPlayers={localPlayers}
            />
          )}

          {(!gameMode || gameMode === 'party-room') && (
            <div className={`menu-overlay ${gameMode === 'party-room' ? 'mini' : ''}`}>
              {(isAdmin || isModerator) ? (
                <div className="admin-dock animate-slide-up sacred-grimoire">
                  <AdminPanel
                    players={players}
                    onSelectMode={setGlobalMode}
                    onRemovePlayer={removePlayer}
                    onOpenEditor={openEditor}
                    isAdmin={isAdmin}
                    isModerator={isModerator}
                    roomState={roomState}
                    roomId={roomId}
                    localPlayers={localPlayers}
                    onAddPlayer={() => setShowAddPlayerModal(true)}
                    onRemoveLocalPlayer={removeLocalPlayerFromDevice}
                  />
                  <div className="turn-controls" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      className="premium-button"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '8px' }}
                      onClick={() => update(ref(db, `rooms/${roomId}`), { activeTurnSlot: 0 })}
                    >
                      Về vị trí 0
                    </button>
                    <button
                      className="premium-button"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '8px', background: 'var(--gold-dark)' }}
                      onClick={() => advanceTurn()}
                    >
                      Chuyển lượt (Skip)
                    </button>
                  </div>
                  {gameMode === 'party-room' && (
                    <button className="premium-button close-menu-btn" onClick={() => update(ref(db, `rooms/${roomId}`), { gameMode: null })}>
                      Ẩn Bảng Điều Khiển
                    </button>
                  )}
                </div>
              ) : (
                <div className="waiting-dock animate-fade">
                  <div className="premium-card info-card">
                    <h2 className="gold-text">Chào {primaryUser?.nickname || 'bạn'}!</h2>
                    <p>Hãy cùng ngồi vào bàn và đợi chủ xị chọn trò nhé.</p>
                    {localPlayers.length > 1 && (
                      <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                        Đang chơi cùng: {localPlayers.filter(lp => !lp.isDeviceOwner).map(lp => lp.nickname).join(', ')}
                      </p>
                    )}
                    <button
                      className="premium-button"
                      style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.8rem' }}
                      onClick={() => setShowAddPlayerModal(true)}
                    >
                      + Thêm người chơi vào điện thoại này
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Player Modal */}
          {showAddPlayerModal && (
            <div className="modal-overlay" onClick={() => setShowAddPlayerModal(false)}>
              <div className="modal-content premium-card" onClick={e => e.stopPropagation()}>
                <h3 className="gold-text">Thêm người chơi</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>
                  Thêm người chơi khác vào điện thoại này
                </p>
                <input
                  type="text"
                  placeholder="Nhập biệt danh..."
                  className="premium-input"
                  id="add-player-input"
                  autoFocus
                />
                {/* Role selector - only Admin can add Moderator */}
                {isAdmin && (
                  <div className="role-selector" style={{ marginTop: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>Vai trò:</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        id="role-regular"
                        className="role-btn active"
                        onClick={(e) => {
                          document.getElementById('role-regular').classList.add('active')
                          document.getElementById('role-mod').classList.remove('active')
                        }}
                      >
                        Người chơi
                      </button>
                      <button
                        type="button"
                        id="role-mod"
                        className="role-btn"
                        onClick={(e) => {
                          document.getElementById('role-mod').classList.add('active')
                          document.getElementById('role-regular').classList.remove('active')
                        }}
                      >
                        Moderator ◈
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                  <button
                    className="premium-button"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const input = document.getElementById('add-player-input')
                      const modBtn = document.getElementById('role-mod')
                      const role = modBtn?.classList.contains('active') ? 'moderator' : 'regular'
                      addLocalPlayer(input?.value || '', role)
                    }}
                  >
                    Thêm
                  </button>
                  <button
                    className="premium-button"
                    style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)' }}
                    onClick={() => setShowAddPlayerModal(false)}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
            .lobby-experience { position: relative; width: 100%; height: 100vh; height: 100dvh; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .menu-overlay { 
              position: absolute; 
              inset: 0;
              width: 100%; 
              height: 100%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              background: radial-gradient(circle, rgba(20,10,30,0.4) 0%, rgba(5,2,8,0.95) 100%);
              backdrop-filter: blur(15px);
              -webkit-backdrop-filter: blur(15px);
              z-index: 100; 
              pointer-events: none; 
            }
            .menu-overlay > div { pointer-events: all; width: 95%; max-width: 500px; }
            .menu-overlay.mini { background: radial-gradient(circle at bottom, rgba(30,15,50,0.6) 0%, rgba(5,2,8,0.98) 100%); align-items: flex-end; padding-bottom: 2rem; }
            .admin-dock { max-width: 550px !important; width: 95%; max-height: 85vh; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem; box-shadow: 0 40px 100px rgba(0,0,0,0.9); scrollbar-width: thin; }
            .waiting-dock { padding: 1.5rem; width: 100%; max-width: 450px; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 12px; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
            .info-card { text-align: center; padding: 2rem; border: none; }
            .close-menu-btn { width: 100%; margin-top: 1.5rem; background: var(--gold-gradient); color: #000; font-weight: 800; padding: 15px; border: none; border-radius: 4px; text-transform: uppercase; letter-spacing: 2px; }
            .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 200; }
            .modal-content { width: 90%; max-width: 400px; padding: 2rem; border-radius: 8px; background: var(--bg-card); border: 1px solid var(--glass-border); }
            .modal-content h3 { margin-bottom: 0.5rem; font-family: var(--font-magic); letter-spacing: 2px; }
            .modal-content .premium-input { width: 100%; margin-top: 0.5rem; }
            .role-btn { flex: 1; padding: 10px; background: transparent; border: 1px solid var(--glass-border); color: var(--text-main); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; border-radius: 4px; }
            .role-btn.active { background: rgba(191,149,63,0.15); border-color: var(--gold); color: var(--gold-light); font-weight: 700; }
            .role-btn:hover { border-color: var(--gold-dark); }
      `}</style>
    </div>
  )
}

export default App
