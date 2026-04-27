import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './Reports.module.css';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fetchReports = async () => { const res = await reportService.getAll(); setReports(res.data); };
  useEffect(() => { fetchReports(); }, []);
  const approveReport = async (id: string) => { await reportService.approve(id); toast.success('Təsdiq edildi'); fetchReports(); };
  const uploadFile = async (reportId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'infaq_preset');
    setUploading(true);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`, formData);
      const url = res.data.secure_url;
      const report = reports.find(r => r._id === reportId);
      const newFiles = [...(report.related_files || []), url];
      await reportService.update(reportId, { related_files: newFiles });
      toast.success('Fayl yükləndi');
      fetchReports();
    } catch (error) { toast.error('Yükləmə xətası'); } finally { setUploading(false); }
  };
  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <div className={styles.header}><h1>Hesabatlar</h1><Link to="/reports/new" className={styles.addBtn}>+ Yeni hesabat</Link></div>
        <div className={styles.grid}>
          {reports.map(r => (
            <div key={r._id} className={styles.card}>
              <h3>{new Date(r.report_month).toLocaleDateString('az', { year: 'numeric', month: 'long' })}</h3>
              <p>Faktiki gəlir: {r.actual_income} AZN</p>
              <p>Faktiki xərc: {r.actual_expense} AZN</p>
              <p>Proqnoz gəlir: {r.forecast_income} AZN</p>
              <p>Proqnoz xərc: {r.forecast_expense} AZN</p>
              <p>Status: {r.status}</p>
              <p>Ay sonu büdcə: {r.end_of_month_budget} AZN</p>
              {!r.approved_by ? <button onClick={() => approveReport(r._id)} className={styles.approveBtn}>Təsdiq et</button> : <span className={styles.approved}>✓ Təsdiqlənib ({r.approved_by?.full_name})</span>}
              <div className={styles.fileUpload}><input type="file" onChange={(e) => e.target.files && uploadFile(r._id, e.target.files[0])} disabled={uploading} />{r.related_files?.map((url: string, i: number) => <a key={i} href={url} target="_blank" rel="noreferrer">Fayl {i+1}</a>)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default ReportsPage;