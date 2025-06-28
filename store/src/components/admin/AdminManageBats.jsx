import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; // ✅ Import toast
import '../../styles/adminManage.css';

const AdminManageBats = () => {
    const [bats, setBats] = useState([]);
    const [form, setForm] = useState({ name: '', type: '', brand: '', rating: '', price: '' });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetch('https://batbazaar.onrender.com/api/bats/bat')
            .then(res => res.json())
            .then(setBats)
            .catch(() => toast.error('Failed to fetch bats.'));
    }, []);

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`https://batbazaar.onrender.com/api/admin/bat/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');

            setBats(bats.filter(b => b._id !== id));
            toast.success('🗑️ Bat deleted successfully!');
        } catch (error) {
            toast.error('❌ Failed to delete the bat.');
            console.error(error);
        }
    };

    const handleAdd = async () => {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        formData.append('img', imageFile);

        try {
            const res = await fetch('https://batbazaar.onrender.com/api/admin/bat', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to add bat');

            const newBat = await res.json();
            setBats([...bats, newBat]);

            toast.success('✅ Bat added successfully!');
            setForm({ name: '', type: '', brand: '', rating: '', price: '' });
            setImageFile(null);
        } catch (err) {
            toast.error('❌ Failed to add bat. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="admin-manage">
            <h2>🛠️ Manage Bats</h2>

            <div className="bat-form">
                <input
                    placeholder="Brand"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                    placeholder="Type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Rating"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                />
                <button onClick={handleAdd}>Add Bat</button>
            </div>

            <div className="bat-cards-container">
                {bats.map((bat) => (
                    <div className="bat-card" key={bat._id}>
                        <img src={bat.imgUrl} alt={bat.name} />
                        <div className="bat-info">
                            <p><strong>Type:</strong> {bat.type}</p>
                            <p><strong>Brand:</strong> {bat.name}</p>
                            <p><strong>Rating:</strong> {bat.rating} ⭐</p>
                            <p><strong>Price:</strong> ₹{bat.price}</p>
                            <button className="delete-btn" onClick={() => handleDelete(bat._id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminManageBats;
