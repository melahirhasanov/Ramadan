import React, { useState, useEffect } from 'react';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './MasterPanel.module.css';

const MyProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', category_id: '', description: '', image: '' });
  useEffect(() => {
    Promise.all([tradeService.getProducts(), tradeService.getCategories()])
      .then(([p, c]) => { setProducts(p.data.filter((prod: any) => prod.master_id?._id === user?._id || prod.master_id === user?._id)); setCategories(c.data); });
  }, [user]);
  const addProduct = async () => {
    if (!form.name || !form.category_id) return toast.error('Ad və kateqoriya tələb olunur');
    await tradeService.createProduct({ ...form, master_id: user?._id || '', is_approved: false });
    toast.success('Məhsul əlavə edildi');
    setForm({ name: '', category_id: '', description: '', image: '' });
    const res = await tradeService.getProducts();
    setProducts(res.data.filter((p: any) => p.master_id?._id === user?._id || p.master_id === user?._id));
  };
  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>Məhsullarım</h1>
        <div className={styles.form}>
          <input placeholder="Ad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Kateqoriya seç</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <textarea placeholder="Təsvir" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Şəkil URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
          <button onClick={addProduct} className={styles.addBtn}>Əlavə et</button>
        </div>
        <div className={styles.grid}>
          {products.map(p => (
            <div key={p._id} className={styles.card}>
              <h3>{p.name}</h3>
              <p>Kateqoriya: {p.category_id?.name || p.category_id}</p>
              <p>Status: {p.is_approved ? 'Təsdiqli' : 'Gözləmədə'}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default MyProductsPage;