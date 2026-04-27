import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './MasterPanel.module.css';

const MyIncomePage: React.FC = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<any[]>([]);
  useEffect(() => {
    api.get(`/profit-distributions?master_id=${user?._id}`)
      .then(res => setIncomes(res.data))
      .catch(() => toast.error('Gəlir məlumatı yüklənmədi'));
  }, [user]);
  const total = incomes.reduce((sum, i) => sum + i.master_share, 0);
  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>Gəlirlərim (80%)</h1>
        <div className={styles.totalCard}>Ümumi qazanc: {total} AZN</div>
        <div className={styles.grid}>
          {incomes.map(i => (
            <div key={i._id} className={styles.card}>
              <p>Məhsul: {i.product_id?.name || i.product_id}</p>
              <p>Xalis gəlir: {i.net_profit} AZN</p>
              <p>Sizin pay: {i.master_share} AZN</p>
              <p>Tarix: {new Date(i.calculated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default MyIncomePage;