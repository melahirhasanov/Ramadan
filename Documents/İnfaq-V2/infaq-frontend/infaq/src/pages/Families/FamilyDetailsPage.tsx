import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { familyService } from '../../services/familyService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  FaEdit, FaCalendarPlus, FaHeartbeat, FaHandHoldingHeart,
  FaChild, FaCalendar, FaUser, FaMapMarkerAlt, FaPhone,
  FaCheckCircle, FaClock, FaPlus, FaUpload, FaTimes,
  FaTrash, FaSave, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa';
import styles from './Families.module.css';

type NeedCategory = 'geyim' | 'qida' | 'derman' | 'tehsil';
type AidType = 'erzaq' | 'pul' | 'tibbi' | 'tehsil';

interface NeedForm {
  category: NeedCategory;
  description: string;
  medicine_image: string;
}
interface AidForm {
  aid_type: AidType;
  amount: number;
  description: string;
  aid_date: string;
}

const fadeSlide = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16 } }
};

/* ── Böyük şəkil modalı ── */
const ImageModal: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className={styles.imageModalOverlay} onClick={onClose}>
      <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.imageModalClose} onClick={onClose}>✕</button>
        <img src={src} alt="Böyük görünüş" />
      </div>
    </div>
  );
};

/* ── Cloudinary image upload component ── */
const MedicineImagePicker: React.FC<{
  value: string;
  onChange: (url: string) => void;
}> = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'infaq_preset');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Şəkil yüklənmədi');
      return null;
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil faylı seçin');
      return;
    }
    setUploading(true);
    const url = await uploadToCloudinary(file);
    setUploading(false);
    if (url) onChange(url);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (value) {
    return (
      <div className={styles.imagePreview}>
        <img src={value} alt="Dərman şəkli" />
        <button
          type="button"
          className={styles.imagePreviewRemove}
          onClick={() => {
            onChange('');
            if (fileRef.current) fileRef.current.value = '';
          }}
        >
          <FaTimes size={10} style={{ marginRight: 4 }} /> Sil
        </button>
      </div>
    );
  }

  return (
    <label className={styles.imageUploadArea}>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      <div className={styles.uploadIcon}>{uploading ? '⏳' : <FaUpload />}</div>
      <span className={styles.uploadLabel}>{uploading ? 'Yüklənir...' : 'Şəkil seçin'}</span>
      <span className={styles.uploadSub}>JPG, PNG, WEBP · maks 5 MB</span>
    </label>
  );
};

/* ── Reusable section add button ── */
const SectionBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick} className={styles.addBtn} style={{ fontSize: 13, padding: '8px 18px', marginBottom: 14 }}>
    <FaPlus size={10} /> {label}
  </button>
);

const FamilyDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [family, setFamily] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form states
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const [showNeedForm, setShowNeedForm] = useState(false);
  const [need, setNeed] = useState<NeedForm>({
    category: 'geyim', description: '', medicine_image: ''
  });

  const [showAidForm, setShowAidForm] = useState(false);
  const [aid, setAid] = useState<AidForm>({
    aid_type: 'erzaq', amount: 0, description: '', aid_date: ''
  });

  // Edit states
  const [editVisit, setEditVisit] = useState<any>(null);
  const [editNeed, setEditNeed] = useState<any>(null);
  const [editAid, setEditAid] = useState<any>(null);

  // Silmə modalı state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'visit' | 'need' | 'aid';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'visit',
    id: '',
    name: ''
  });

  const reload = () => familyService.getById(id!).then(res => setFamily(res.data));

  useEffect(() => {
    if (id) reload().catch(() => toast.error('Yüklənmədi'));
  }, [id]);

  // ========== ZİYARƏTLƏR ==========
  const addVisit = async () => {
    if (!visitDate) return toast.error('Tarix seçin');
    try {
      await familyService.addVisit(id!, visitDate, visitNotes);
      toast.success('Ziyarət əlavə edildi');
      setShowVisitForm(false);
      setVisitDate('');
      setVisitNotes('');
      reload();
    } catch { toast.error('Xəta baş verdi'); }
  };

  const updateVisit = async (visitId: string, data: any) => {
    try {
      await familyService.updateVisit(id!, visitId, data);
      toast.success('Ziyarət yeniləndi');
      setEditVisit(null);
      reload();
    } catch { toast.error('Xəta baş verdi'); }
  };

  // ========== EHTİYACLAR ==========
  const addNeed = async () => {
    if (!need.description) return toast.error('Təsvir daxil edin');
    try {
      await familyService.addNeed(id!, need);
      toast.success('Ehtiyac əlavə edildi');
      setShowNeedForm(false);
      setNeed({ category: 'geyim', description: '', medicine_image: '' });
      reload();
    } catch { toast.error('Xəta baş verdi'); }
  };

  const updateNeed = async (needId: string, data: any) => {
    try {
      await familyService.updateNeed(id!, needId, data);
      toast.success('Ehtiyac yeniləndi');
      setEditNeed(null);
      reload();
    } catch { toast.error('Xəta baş verdi'); }
  };

  const toggleNeedStatus = async (needItem: any) => {
    try {
      await familyService.updateNeed(id!, needItem._id, { ...needItem, is_fulfilled: !needItem.is_fulfilled });
      toast.success(needItem.is_fulfilled ? 'Gözləmədə' : 'Qarşılandı');
      reload();
    } catch { toast.error('Xəta baş verdi'); }
  };

  // ========== YARDIMLAR ==========
  const addAid = async () => {
    if (!aid.aid_date) return toast.error('Tarix seçin');
    try {
      await familyService.addAid(id!, aid);
      toast.success('Yardım əlavə edildi');
      setShowAidForm(false);
      setAid({ aid_type: 'erzaq', amount: 0, description: '', aid_date: '' });
      reload();
    } catch { toast.error('Xəta baş verdi'); }
  };

  const updateAid = async (aidId: string, data: any) => {
    try {
      await familyService.updateAid(id!, aidId, data);
      toast.success('Yardım yeniləndi');
      setEditAid(null);
      reload();
    } catch { toast.error('Xəta baş verdi'); }
  };

  // ========== SİLMƏ MODALI ==========
  const openDeleteModal = (type: 'visit' | 'need' | 'aid', itemId: string, name: string) => {
    setDeleteModal({ isOpen: true, type, id: itemId, name });
  };

  const confirmDelete = async () => {
    const { type, id: itemId } = deleteModal;
    try {
      if (type === 'visit') {
        await familyService.deleteVisit(id!, itemId);
        toast.success('Ziyarət silindi');
      } else if (type === 'need') {
        await familyService.deleteNeed(id!, itemId);
        toast.success('Ehtiyac silindi');
      } else if (type === 'aid') {
        await familyService.deleteAid(id!, itemId);
        toast.success('Yardım silindi');
      }
      reload();
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setDeleteModal({ isOpen: false, type: 'visit', id: '', name: '' });
    }
  };

  if (!family) return (
    <>
      <Sidebar /><Header />
      <div className={styles.container}><div className={styles.loader}>Yüklənir...</div></div>
    </>
  );

  const f = family.family;

  return (
    <>
      <Sidebar />
      <Header />
      <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        {/* Header */}
        <div className={styles.header}>
          <h1>{f.name}</h1>
          <Link to={`/families/${id}/edit`} className={styles.addBtn}><FaEdit size={13} /> Redaktə et</Link>
        </div>

        {/* Detail card */}
        <div className={styles.detailCard}>
          <p><strong><FaPhone size={9} style={{ marginRight: 4 }} />Telefon</strong>{f.contact_phone}</p>
          <p><strong><FaMapMarkerAlt size={9} style={{ marginRight: 4 }} />Ünvan</strong>{f.address}</p>
          {f.exact_address && <p><strong>Dəqiq ünvan</strong><a href={f.exact_address} target="_blank" rel="noreferrer">🗺 Xəritədə aç</a></p>}
          <p><strong>Status</strong><span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={f.status === 'aktiv' ? styles.active : styles.inactive}>{f.status}</span>
            {f.status_reason && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>({f.status_reason})</span>}
          </span></p>
          <p><strong><FaHeartbeat size={9} style={{ marginRight: 4 }} />Sağlamlıq</strong>{f.health_info || '—'}</p>
          <p><strong>Gəlir mənbəyi</strong>{f.income_source || '—'}</p>
          <p><strong>Xərclər</strong>{f.expenses || '—'}</p>
          <p style={{ gridColumn: '1 / -1' }}><strong>Qısa məlumat</strong>{f.short_description || '—'}</p>
          <p style={{ gridColumn: '1 / -1' }}><strong>Qeyd</strong>{f.notes || '—'}</p>
        </div>

        {/* Members */}
        <h2><FaChild style={{ color: 'var(--teal)', marginRight: 8 }} />Uşaqlar</h2>
        <div className={styles.grid}>
          {family.members?.map((m: any) => (
            <div key={m._id} className={styles.card}>
              <div className={styles.cardBody}>
                <h3>{m.name}</h3>
                <p><FaUser size={11} style={{ color: 'var(--ink-soft)' }} />{m.gender}, {m.age} yaş</p>
                {m.needs_spiritual_support && <p className={styles.spiritual}>🌿 Mənəvi dəstək: {m.spiritual_support_reason}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Visits */}
        <h2><FaCalendar style={{ color: 'var(--teal)', marginRight: 8 }} />Ziyarətlər</h2>
        <SectionBtn onClick={() => setShowVisitForm(v => !v)} label="Ziyarət əlavə et" />
        <AnimatePresence>
          {showVisitForm && (
            <motion.div variants={fadeSlide} initial="hidden" animate="show" exit="exit" className={styles.formInline}>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
              <input placeholder="Qeyd" value={visitNotes} onChange={e => setVisitNotes(e.target.value)} />
              <button onClick={addVisit} className={styles.saveBtn}>Yadda saxla</button>
            </motion.div>
          )}
        </AnimatePresence>
        <ul className={styles.list}>
          {family.visits?.map((v: any) => (
            <li key={v._id}>
              <div className={styles.itemContent}>
                <FaCalendarPlus className={styles.itemIcon} />
                <div className={styles.itemInfo}>
                  <strong>{new Date(v.visit_date).toLocaleDateString('az-AZ')}</strong>
                  {v.notes && <span className={styles.itemNote}> — {v.notes}</span>}
                  {v.visited_by && <small className={styles.itemMeta}> · {v.visited_by.full_name}</small>}
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => setEditVisit(v)} className={styles.editBtn}><FaEdit /></button>
                  <button onClick={() => openDeleteModal('visit', v._id, new Date(v.visit_date).toLocaleDateString('az-AZ'))} className={styles.deleteBtn}><FaTrash /></button>
                </div>
              </div>
              {editVisit?._id === v._id && (
                <div className={styles.editForm}>
                  <input type="date" defaultValue={editVisit.visit_date?.slice(0,10)} onChange={e => setEditVisit({...editVisit, visit_date: e.target.value})} />
                  <input defaultValue={editVisit.notes} onChange={e => setEditVisit({...editVisit, notes: e.target.value})} placeholder="Qeyd" />
                  <button onClick={() => updateVisit(editVisit._id, { visit_date: editVisit.visit_date, notes: editVisit.notes })}><FaSave /> Saxla</button>
                  <button onClick={() => setEditVisit(null)}><FaTimesCircle /> Ləğv</button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Needs */}
        <h2><span style={{ color: 'var(--amber)', marginRight: 8 }}>⚑</span>Ehtiyaclar</h2>
        <SectionBtn onClick={() => setShowNeedForm(v => !v)} label="Ehtiyac əlavə et" />
        <AnimatePresence>
          {showNeedForm && (
            <motion.div variants={fadeSlide} initial="hidden" animate="show" exit="exit" className={styles.formInline}>
              <select value={need.category} onChange={e => setNeed({ ...need, category: e.target.value as NeedCategory, medicine_image: '' })}>
                <option value="geyim">Geyim</option><option value="qida">Qida</option><option value="derman">Dərman</option><option value="tehsil">Təhsil</option>
              </select>
              <input placeholder="Təsvir" value={need.description} onChange={e => setNeed({ ...need, description: e.target.value })} />
              {need.category === 'derman' && <MedicineImagePicker value={need.medicine_image} onChange={url => setNeed({ ...need, medicine_image: url })} />}
              <button onClick={addNeed} className={styles.saveBtn}>Əlavə et</button>
            </motion.div>
          )}
        </AnimatePresence>
        <ul className={styles.list}>
          {family.needs?.map((n: any) => (
            <li key={n._id}>
              <div className={styles.itemContent}>
                {n.is_fulfilled ? <FaCheckCircle className={styles.fulfilledIcon} /> : <FaClock className={styles.pendingIcon} />}
                <div className={styles.itemInfo}>
                  <strong>{n.category}</strong>: {n.description}
                  <span className={`${styles.statusChip} ${n.is_fulfilled ? styles.statusFulfilled : styles.statusPending}`}>
                    {n.is_fulfilled ? 'Qarşılandı' : 'Gözləmədə'}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => toggleNeedStatus(n)} className={styles.toggleBtn}>
                    {n.is_fulfilled ? 'Gözləmədə et' : 'Qarşılandı et'}
                  </button>
                  <button onClick={() => setEditNeed(n)} className={styles.editBtn}><FaEdit /></button>
                  <button onClick={() => openDeleteModal('need', n._id, `${n.category} - ${n.description.substring(0, 30)}`)} className={styles.deleteBtn}><FaTrash /></button>
                </div>
              </div>
              {editNeed?._id === n._id && (
                <div className={styles.editForm}>
                  <select defaultValue={editNeed.category} onChange={e => setEditNeed({...editNeed, category: e.target.value})}>
                    <option value="geyim">Geyim</option><option value="qida">Qida</option><option value="derman">Dərman</option><option value="tehsil">Təhsil</option>
                  </select>
                  <input defaultValue={editNeed.description} onChange={e => setEditNeed({...editNeed, description: e.target.value})} placeholder="Təsvir" />
                  {editNeed.category === 'derman' && (
                    <MedicineImagePicker value={editNeed.medicine_image} onChange={url => setEditNeed({...editNeed, medicine_image: url})} />
                  )}
                  <button onClick={() => updateNeed(editNeed._id, { category: editNeed.category, description: editNeed.description, medicine_image: editNeed.medicine_image })}><FaSave /> Saxla</button>
                  <button onClick={() => setEditNeed(null)}><FaTimesCircle /> Ləğv</button>
                </div>
              )}
              {n.medicine_image && (
                <div className={styles.medicineImageWrapper}>
                  <img src={n.medicine_image} alt="Dərman" onClick={() => setSelectedImage(n.medicine_image)} className={styles.medicineImage} />
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Aids */}
        <h2><FaHandHoldingHeart style={{ color: 'var(--teal)', marginRight: 8 }} />Yardım tarixçəsi</h2>
        <SectionBtn onClick={() => setShowAidForm(v => !v)} label="Yardım əlavə et" />
        <AnimatePresence>
          {showAidForm && (
            <motion.div variants={fadeSlide} initial="hidden" animate="show" exit="exit" className={styles.formInline}>
              <select value={aid.aid_type} onChange={e => setAid({ ...aid, aid_type: e.target.value as AidType })}>
                <option value="erzaq">Erzaq</option><option value="pul">Pul</option><option value="tibbi">Tibbi</option><option value="tehsil">Təhsil</option>
              </select>
              <input type="number" placeholder="Məbləğ" value={aid.amount} onChange={e => setAid({ ...aid, amount: +e.target.value })} />
              <input placeholder="Təsvir" value={aid.description} onChange={e => setAid({ ...aid, description: e.target.value })} />
              <input type="date" value={aid.aid_date} onChange={e => setAid({ ...aid, aid_date: e.target.value })} />
              <button onClick={addAid} className={styles.saveBtn}>Əlavə et</button>
            </motion.div>
          )}
        </AnimatePresence>
        <ul className={styles.list}>
          {family.aids?.map((a: any) => (
            <li key={a._id}>
              <div className={styles.itemContent}>
                <FaHandHoldingHeart className={styles.itemIcon} />
                <div className={styles.itemInfo}>
                  <strong>{new Date(a.aid_date).toLocaleDateString('az-AZ')}</strong> — <span className={styles.aidType}>{a.aid_type}</span>
                  {a.amount > 0 && <span className={styles.aidAmount}> · {a.amount} AZN</span>}
                  {a.description && <span className={styles.itemNote}> — {a.description}</span>}
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => setEditAid(a)} className={styles.editBtn}><FaEdit /></button>
                  <button onClick={() => openDeleteModal('aid', a._id, `${a.aid_type} - ${new Date(a.aid_date).toLocaleDateString('az-AZ')}`)} className={styles.deleteBtn}><FaTrash /></button>
                </div>
              </div>
              {editAid?._id === a._id && (
                <div className={styles.editForm}>
                  <select defaultValue={editAid.aid_type} onChange={e => setEditAid({...editAid, aid_type: e.target.value})}>
                    <option value="erzaq">Erzaq</option><option value="pul">Pul</option><option value="tibbi">Tibbi</option><option value="tehsil">Təhsil</option>
                  </select>
                  <input type="number" defaultValue={editAid.amount} onChange={e => setEditAid({...editAid, amount: +e.target.value})} placeholder="Məbləğ" />
                  <input defaultValue={editAid.description} onChange={e => setEditAid({...editAid, description: e.target.value})} placeholder="Təsvir" />
                  <input type="date" defaultValue={editAid.aid_date?.slice(0,10)} onChange={e => setEditAid({...editAid, aid_date: e.target.value})} />
                  <button onClick={() => updateAid(editAid._id, { aid_type: editAid.aid_type, amount: editAid.amount, description: editAid.description, aid_date: editAid.aid_date })}><FaSave /> Saxla</button>
                  <button onClick={() => setEditAid(null)}><FaTimesCircle /> Ləğv</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Image Modal */}
      {selectedImage && <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
          >
            <motion.div
              className={styles.modalContainer}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalIconWarning}>
                  <FaExclamationTriangle />
                </div>
                <h3>Silinmə təsdiqi</h3>
                <button className={styles.modalClose} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>
                  <strong>{deleteModal.name}</strong> {deleteModal.type === 'visit' ? 'ziyarəti' : deleteModal.type === 'need' ? 'ehtiyacı' : 'yardımı'} silinəcək.
                </p>
                <p>Bu əməliyyat geri alına bilməz. Davam etmək istəyirsiniz?</p>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancel} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>
                  Ləğv et
                </button>
                <button className={styles.modalConfirm} onClick={confirmDelete}>
                  Bəli, sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FamilyDetailsPage;