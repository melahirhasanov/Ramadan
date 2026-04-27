import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {} finally { setLoading(false); }
  };

  return (
    <div className={styles.container}>
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className={styles.card}>
        <h1 className={styles.title}>İnfaq Yardım Birliyi</h1>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
          <input type="password" placeholder="Şifrə" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
          <button type="submit" disabled={loading} className={styles.button}>{loading ? 'Daxil olur...' : 'Daxil ol'}</button>
        </form>
      </motion.div>
    </div>
  );
};
export default LoginPage;