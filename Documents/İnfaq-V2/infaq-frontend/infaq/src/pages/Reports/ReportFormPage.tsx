import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './Reports.module.css';

const ReportFormPage: React.FC = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const onSubmit = async (data: any) => {
    try {
      await reportService.create({ year: data.year, month: data.month, forecast_income: data.forecast_income, forecast_expense: data.forecast_expense });
      toast.success('Hesabat yaradıldı');
      navigate('/reports');
    } catch (error) { toast.error('Xəta'); }
  };
  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>Yeni hesabat</h1>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <input type="number" {...register('year')} placeholder="İl" required />
          <input type="number" {...register('month')} placeholder="Ay (1-12)" required />
          <input type="number" {...register('forecast_income')} placeholder="Proqnoz gəlir" />
          <input type="number" {...register('forecast_expense')} placeholder="Proqnoz xərc" />
          <button type="submit" className={styles.submitBtn}>Yarat</button>
        </form>
      </div>
    </>
  );
};
export default ReportFormPage;