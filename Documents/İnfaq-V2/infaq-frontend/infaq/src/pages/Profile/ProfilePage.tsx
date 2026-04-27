import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const changePassword = async () => {
    if (!oldPassword || !newPassword) return toast.error('Hər iki sahəni doldurun');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { oldPassword, newPassword });
      toast.success('Şifrə dəyişdirildi, yenidən daxil olun');
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta');
    } finally { setLoading(false); }
  };
  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>Profil</h1>
        <div className={styles.card}>
          <p><strong>Ad:</strong> {user?.full_name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Rol:</strong> {user?.role}</p>
          <hr />
          <h3>Şifrəni dəyiş</h3>
          <input type="password" placeholder="Köhnə şifrə" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
          <input type="password" placeholder="Yeni şifrə" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <button onClick={changePassword} disabled={loading} className={styles.changeBtn}>Yenilə</button>
        </div>
      </div>
    </>
  );
};
export default ProfilePage;