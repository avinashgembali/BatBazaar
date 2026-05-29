import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { authFetch } from '../../api';
import '../../styles/adminManage.css';

const AdminManageBats = () => {
    const [bats, setBats] = useState([]);
    const [form, setForm] = useState({ name: '', type: '', brand: '', rating: '', price: '', stock: '' });
    const [imageFile, setImageFile] = useState(null);
    // Per-bat stock edit values and loading state
    const [stockEdits, setStockEdits] = useState({});
    const [stockLoading, setStockLoading] = useState(new Set());

    const fetchBats = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bats/bat?limit=1000`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.bats ?? []);
            setBats(list);
            const edits = {};
            list.forEach(b => { edits[b._id] = String(b.stock ?? 0); });
            setStockEdits(edits);
        } catch {
            toast.error('Failed to fetch bats.');
        }
    };

    useEffect(() => { fetchBats(); }, []);

    const handleDelete = async (id) => {
        try {
            const res = await authFetch(`${import.meta.env.VITE_API_URL}/admin/bat/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setBats(bats.filter(b => b._id !== id));
            toast.success('Bat deleted successfully!');
        } catch {
            toast.error('Failed to delete the bat.');
        }
    };

    const handleAdd = async () => {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        if (imageFile) formData.append('img', imageFile);

        try {
            const res = await authFetch(`${import.meta.env.VITE_API_URL}/admin/bat`, {
                method: 'POST',
                body: formData,
                skipContentType: true,
            });
            if (!res.ok) throw new Error();
            toast.success('Bat added successfully!');
            setForm({ name: '', type: '', brand: '', rating: '', price: '', stock: '' });
            setImageFile(null);
            fetchBats();
        } catch {
            toast.error('Failed to add bat. Please try again.');
        }
    };

    const handleStockUpdate = async (batId) => {
        const newStock = parseInt(stockEdits[batId], 10);
        if (isNaN(newStock) || newStock < 0) {
            toast.error('Enter a valid stock quantity (0 or more).');
            return;
        }
        setStockLoading(prev => new Set(prev).add(batId));
        try {
            const res = await authFetch(`${import.meta.env.VITE_API_URL}/admin/bat/${batId}/stock`, {
                method: 'PATCH',
                body: JSON.stringify({ stock: newStock }),
            });
            if (!res.ok) throw new Error();
            setBats(prev => prev.map(b => b._id === batId ? { ...b, stock: newStock } : b));
            toast.success('Stock updated!');
        } catch {
            toast.error('Failed to update stock.');
        } finally {
            setStockLoading(prev => { const s = new Set(prev); s.delete(batId); return s; });
        }
    };

    return (
        <div className="admin-manage">
            <h2>🛠️ Manage Bats</h2>

            <div className="bat-form">
                <input placeholder="Brand" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                <input type="number" placeholder="Rating (0–5)" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                <input type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <input type="number" placeholder="Stock quantity" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                <button onClick={handleAdd}>Add Bat</button>
            </div>

            <div className="bat-cards-container">
                {bats.map((bat) => {
                    const isSoldOut = (bat.stock ?? 0) === 0;
                    const isUpdating = stockLoading.has(bat._id);
                    return (
                        <div className="bat-card" key={bat._id}>
                            <div className="bat-img-admin-wrapper">
                                <img src={bat.imgUrl} alt={bat.name} />
                                {isSoldOut && <span className="admin-soldout-badge">Sold Out</span>}
                            </div>
                            <div className="bat-info">
                                <p><strong>Brand:</strong> {bat.name}</p>
                                <p><strong>Type:</strong> {bat.type}</p>
                                <p><strong>Rating:</strong> {bat.rating} ⭐</p>
                                <p><strong>Price:</strong> ₹{bat.price}</p>

                                <div className="stock-row">
                                    <span className={`stock-badge${isSoldOut ? ' out' : ''}`}>
                                        {isSoldOut ? 'Out of Stock' : `Stock: ${bat.stock}`}
                                    </span>
                                </div>

                                <div className="stock-edit-row">
                                    <input
                                        type="number"
                                        min="0"
                                        className="stock-input"
                                        value={stockEdits[bat._id] ?? bat.stock ?? 0}
                                        onChange={e => setStockEdits(prev => ({ ...prev, [bat._id]: e.target.value }))}
                                        placeholder="Qty"
                                    />
                                    <button
                                        className="stock-update-btn"
                                        onClick={() => handleStockUpdate(bat._id)}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? '…' : 'Update'}
                                    </button>
                                </div>

                                <button className="delete-btn" onClick={() => handleDelete(bat._id)}>Delete</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminManageBats;
