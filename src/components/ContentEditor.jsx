import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { ref, onValue, set, remove } from 'firebase/database'

export default function ContentEditor({ gameId, gameName, onBack, defaultData, schema }) {
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState(schema.reduce((acc, field) => ({ ...acc, [field.name]: field.default || '' }), {}))
    const [editingIndex, setEditingIndex] = useState(null)
    const [editValue, setEditValue] = useState({})

    useEffect(() => {
        const contentRef = ref(db, `content/${gameId}`)
        const unsubscribe = onValue(contentRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setItems(Array.isArray(data) ? data : Object.values(data))
            } else {
                setItems(defaultData)
            }
        })
        return () => unsubscribe()
    }, [gameId, defaultData])

    const handleAddItem = () => {
        const updatedItems = [...items, newItem]
        set(ref(db, `content/${gameId}`), updatedItems)
        setNewItem(schema.reduce((acc, field) => ({ ...acc, [field.name]: field.default || '' }), {}))
    }

    const handleDeleteItem = (index) => {
        const updatedItems = items.filter((_, i) => i !== index)
        set(ref(db, `content/${gameId}`), updatedItems)
    }

    const startEditing = (index) => {
        setEditingIndex(index)
        setEditValue(items[index])
    }

    const handleSaveEdit = () => {
        const updatedItems = [...items]
        updatedItems[editingIndex] = editValue
        set(ref(db, `content/${gameId}`), updatedItems)
        setEditingIndex(null)
    }

    const handleRestoreDefaults = () => {
        if (window.confirm('Bạn có chắc chắn muốn khôi phục về mặc định?')) {
            set(ref(db, `content/${gameId}`), defaultData)
        }
    }

    return (
        <div className="content-editor animate-fade">
            <button className="back-button" onClick={onBack}>← Quay lại</button>
            <h2 className="gold-text">Chỉnh sửa: {gameName}</h2>

            <div className="editor-container">
                <section className="add-item-section premium-card">
                    <h3>Thêm mục mới</h3>
                    <div className="input-grid">
                        {schema.map(field => (
                            <div key={field.name} className="input-field">
                                <label>{field.label}</label>
                                {field.type === 'select' ? (
                                    <select
                                        value={newItem[field.name]}
                                        onChange={e => setNewItem({ ...newItem, [field.name]: e.target.value })}
                                    >
                                        {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        value={newItem[field.name]}
                                        onChange={e => setNewItem({ ...newItem, [field.name]: e.target.value })}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={newItem[field.name]}
                                        onChange={e => setNewItem({ ...newItem, [field.name]: e.target.value })}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <button className="premium-button add-btn" onClick={handleAddItem}>Thêm</button>
                </section>

                <section className="items-list-section premium-card">
                    <div className="section-header">
                        <h3>Danh sách hiện tại ({items.length})</h3>
                        <button className="restore-btn" onClick={handleRestoreDefaults}>Khôi phục mặc định</button>
                    </div>
                    <div className="items-list">
                        {items.map((item, index) => (
                            <div key={index} className="item-row">
                                {editingIndex === index ? (
                                    <div className="edit-form">
                                        {schema.map(field => (
                                            <div key={field.name} className="input-field">
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={editValue[field.name]}
                                                        onChange={e => setEditValue({ ...editValue, [field.name]: e.target.value })}
                                                    >
                                                        {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                ) : field.type === 'textarea' ? (
                                                    <textarea
                                                        value={editValue[field.name]}
                                                        onChange={e => setEditValue({ ...editValue, [field.name]: e.target.value })}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={editValue[field.name]}
                                                        onChange={e => setEditValue({ ...editValue, [field.name]: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <div className="edit-actions">
                                            <button onClick={handleSaveEdit} className="save-btn">Lưu</button>
                                            <button onClick={() => setEditingIndex(null)} className="cancel-btn">Hủy</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="item-content">
                                            <span className="item-badge">{item.type || 'N/A'}</span>
                                            <p>{item.text || item.content || item.q || item}</p>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => startEditing(index)} className="edit-btn">Sửa</button>
                                            <button onClick={() => handleDeleteItem(index)} className="delete-btn">Xóa</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <style jsx>{`
                .content-editor { width: 100%; max-width: 900px; margin: 0 auto; color: white; }
                .editor-container { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-top: 2rem; }
                .input-grid { display: flex; flex-direction: column; gap: 15px; margin: 1.5rem 0; }
                .input-field { display: flex; flex-direction: column; gap: 5px; text-align: left; }
                .input-field label { font-size: 0.8rem; color: var(--gold); }
                .input-field input, .input-field select, .input-field textarea {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--gold-dark);
                    color: white;
                    padding: 10px;
                    border-radius: 4px;
                    font-family: inherit;
                }
                .input-field textarea { height: 80px; resize: vertical; }
                .add-btn { width: 100%; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .restore-btn { background: transparent; border: 1px solid #666; color: #aaa; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; }
                .restore-btn:hover { border-color: var(--gold); color: var(--gold); }
                .items-list { display: flex; flex-direction: column; gap: 10px; max-height: 500px; overflow-y: auto; padding-right: 10px; }
                .items-list::-webkit-scrollbar { width: 4px; }
                .items-list::-webkit-scrollbar-thumb { background: var(--gold-dark); border-radius: 2px; }
                .item-row { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
                .item-content { flex: 1; text-align: left; }
                .item-badge { display: inline-block; font-size: 0.6rem; text-transform: uppercase; background: var(--gold); color: #1a1a1a; padding: 2px 6px; border-radius: 4px; margin-bottom: 5px; font-weight: bold; }
                .item-actions { display: flex; gap: 5px; }
                .edit-btn, .delete-btn, .save-btn, .cancel-btn { padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 0.7rem; }
                .edit-btn { background: var(--gold-dark); color: white; }
                .delete-btn { background: #c62828; color: white; }
                .save-btn { background: #2e7d32; color: white; }
                .cancel-btn { background: #666; color: white; }
                .edit-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
                .edit-actions { display: flex; gap: 10px; justify-content: flex-end; }
            `}</style>
        </div>
    )
}
