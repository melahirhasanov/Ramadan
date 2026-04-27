import React, { useState, useEffect } from 'react';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './MasterPanel.module.css';

interface Product {
  _id: string;
  name: string;
}

interface ExtraCostItem {
  _id: string;
  name: string;
  amount: number;
  cost_type: 'per_product' | 'batch';
  cost_date: string;
  master_id: string | { _id: string; full_name: string };
  product_id?: string | Product;
}

interface ExtraCostForm {
  name: string;
  amount: number;
  cost_type: 'per_product' | 'batch';
  batch_quantity: number;
  cost_date: string;
  product_id: string;
}

const MyExtraCostsPage: React.FC = () => {
  const { user } = useAuth();
  const [costs, setCosts] = useState<ExtraCostItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ExtraCostForm>({
    name: '',
    amount: 0,
    cost_type: 'per_product',
    batch_quantity: 1,
    cost_date: '',
    product_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [c, p] = await Promise.all([
        tradeService.getExtraCosts(),
        tradeService.getProducts()
      ]);
      const filteredCosts = c.data.filter((cost: ExtraCostItem) => {
        const masterId = typeof cost.master_id === 'object' ? cost.master_id._id : cost.master_id;
        return masterId === user?._id;
      });
      setCosts(filteredCosts);
      setProducts(p.data);
    } catch (error) {
      toast.error('Məlumat yüklənmədi');
    }
  };

  const submit = async () => {
    if (!form.name || !form.amount || !form.cost_date) {
      return toast.error('Ad, məbləğ və tarix daxil edin');
    }
    try {
      await tradeService.createExtraCost({
        ...form,
        master_id: user?._id || ''
      });
      toast.success('Xərc əlavə edildi');
      setForm({
        name: '',
        amount: 0,
        cost_type: 'per_product',
        batch_quantity: 1,
        cost_date: '',
        product_id: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>Xərclərim</h1>
        <div className={styles.form}>
          <select
            value={form.product_id}
            onChange={e => setForm({ ...form, product_id: e.target.value })}
          >
            <option value="">Məhsul (opsional)</option>
            {products.map((product: Product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Xərc adı"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="number"
            placeholder="Məbləğ"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: +e.target.value })}
          />

          <select
            value={form.cost_type}
            onChange={e => setForm({
              ...form,
              cost_type: e.target.value as 'per_product' | 'batch',
              batch_quantity: e.target.value === 'batch' ? 1 : 0
            })}
          >
            <option value="per_product">Bir məhsula aydın</option>
            <option value="batch">Partiya ümumi</option>
          </select>

          {form.cost_type === 'batch' && (
            <input
              type="number"
              placeholder="Partiya sayı"
              value={form.batch_quantity}
              onChange={e => setForm({ ...form, batch_quantity: +e.target.value })}
            />
          )}

          <input
            type="date"
            value={form.cost_date}
            onChange={e => setForm({ ...form, cost_date: e.target.value })}
          />

          <button onClick={submit} className={styles.addBtn}>
            Əlavə et
          </button>
        </div>

        <ul className={styles.list}>
          {costs.map((cost: ExtraCostItem) => (
            <li key={cost._id}>
              {cost.name} - {cost.amount} AZN - {cost.cost_type} -{' '}
              {new Date(cost.cost_date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default MyExtraCostsPage;