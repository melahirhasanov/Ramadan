import React, { useState, useEffect } from 'react';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './MasterPanel.module.css';

const MyPurchasesPage: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [form, setForm] = useState({ material_id: '', quantity: 0, unit_price: 0, purchase_date: '' });
  useEffect(() => {
    Promise.all([tradeService.getPurchases(), tradeService.getMaterials()])
      .then(([p, m]) => { setPurchases(p.data.filter((pur: any) => pur.master_id?._id === user?._id || pur.master_id === user?._id)); setMaterials(m.data); });
  }, [user]);
  const submit = async () => {
    if (!form.material_id || !form.quantity || !form.unit_price || !form.purchase_date) return toast.error('Bütün sahələri doldurun');
    await tradeService.createPurchase({ ...form, master_id: user?._id || '' });
    toast.success('Alış əlavə edildi');
    setForm({ material_id: '', quantity: 0, unit_price: 0, purchase_date: '' });
    const res = await tradeService.getPurchases();
    setPurchases(res.data.filter((pur: any) => pur.master_id?._id === user?._id || pur.master_id === user?._id));
  };
  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>Alışlarım</h1>
        <div className={styles.form}>
          <select value={form.material_id} onChange={e => setForm({ ...form, material_id: e.target.value })}>
            <option value="">Material seç</option>
            {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
          <input type="number" placeholder="Miqdar" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} />
          <input type="number" placeholder="Vahid qiyməti" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: +e.target.value })} />
          <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
          <button onClick={submit} className={styles.addBtn}>Əlavə et</button>
        </div>
        <ul className={styles.list}>
          {purchases.map(p => <li key={p._id}>{p.material_id?.name || p.material_id} - {p.quantity} ədəd - {p.total_cost} AZN - {new Date(p.purchase_date).toLocaleDateString()}</li>)}
        </ul>
      </div>
    </>
  );
};
export default MyPurchasesPage;