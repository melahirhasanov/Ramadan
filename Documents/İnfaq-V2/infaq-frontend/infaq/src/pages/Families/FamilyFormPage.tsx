import React, { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { familyService, Family } from '../../services/familyService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FaPlus, FaTrash, FaSave, FaUpload, FaTimes } from 'react-icons/fa';
import styles from './Families.module.css';

interface FamilyForm extends Family {
  members: {
    name: string;
    gender: string;
    age: number;
    needs_spiritual_support: boolean;
    spiritual_support_reason: string;
  }[];
}

const FamilyFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, setValue } = useForm<FamilyForm>({
    defaultValues: { members: [] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  useEffect(() => {
    if (isEdit && id) {
      familyService.getById(id).then(res => {
        const d = res.data.family;
        Object.keys(d).forEach(k => setValue(k as any, d[k]));
        if (res.data.members) setValue('members', res.data.members);
      }).catch(() => toast.error('Məlumat yüklənmədi'));
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data: FamilyForm) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        await familyService.update(id, data);
        const existing = await familyService.getById(id);
        for (const m of existing.data.members) await familyService.deleteMember(id, m._id);
        for (const member of data.members) await familyService.addMember(id, member);
        toast.success('Ailə yeniləndi');
      } else {
        const res = await familyService.create(data);
        for (const member of data.members) await familyService.addMember(res.data._id, member);
        toast.success('Ailə əlavə edildi');
      }
      navigate('/families');
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar />
      <Header />
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className={styles.header}>
          <h1>{isEdit ? 'Ailəni redaktə et' : 'Yeni ailə əlavə et'}</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

          {/* ── Əsas məlumatlar ── */}
          <h3>Əsas məlumatlar</h3>
          <input {...register('name', { required: true })} placeholder="Ailə adı *" />
          <input {...register('contact_phone', { required: true })} placeholder="Əlaqə telefonu *" />
          <input {...register('address', { required: true })} placeholder="Ünvan *" />
          <input {...register('exact_address')} placeholder="Dəqiq ünvan — Google Maps linki" />

          {/* ── Status ── */}
          <h3>Status məlumatları</h3>
          <select {...register('family_head_status', { required: true })}>
            <option value="">Ailə başçısının vəziyyəti *</option>
            <option value="yasayir">Yaşayır</option>
            <option value="vefat_edib">Vəfat edib</option>
            <option value="ayrilib_qeyri_resmi">Ayrılıb (qeyri-rəsmi)</option>
            <option value="bosaniblar">Boşanıblar</option>
          </select>
          <select {...register('status')}>
            <option value="aktiv">Aktiv</option>
            <option value="qara_siyah">Qara siyahı</option>
            <option value="muxtelif_sebeb">Müxtəlif səbəb</option>
          </select>
          <input {...register('status_reason')} placeholder="Status səbəbi (əgər müxtəlifsə)" />

          {/* ── Sosial məlumatlar ── */}
          <h3>Sosial məlumatlar</h3>
          <input {...register('health_info')} placeholder="Sağlamlıq məlumatı" />
          <input {...register('income_source')} placeholder="Gəlir mənbəyi" />
          <input {...register('expenses')} placeholder="Aylıq xərclər" />
          <textarea {...register('short_description')} placeholder="Qısa məlumat" />
          <textarea {...register('notes')} placeholder="Əlavə qeydlər" />

          {/* ── Uşaqlar ── */}
          <h3>Uşaqlar</h3>
          {fields.map((field, idx) => (
            <motion.div
              key={field.id}
              className={styles.memberCard}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <input {...register(`members.${idx}.name`)} placeholder="Uşağın adı" />
              <select {...register(`members.${idx}.gender`)}>
                <option value="kişi">Kişi</option>
                <option value="qadın">Qadın</option>
              </select>
              <input type="number" {...register(`members.${idx}.age`)} placeholder="Yaş" />
              <label>
                <input type="checkbox" {...register(`members.${idx}.needs_spiritual_support`)} />
                Mənəvi dəstəyə ehtiyacı var
              </label>
              {watch(`members.${idx}.needs_spiritual_support`) && (
                <motion.textarea
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  {...register(`members.${idx}.spiritual_support_reason`)}
                  placeholder="Mənəvi dəstəyin səbəbi..."
                />
              )}
              <button type="button" onClick={() => remove(idx)} className={styles.removeBtn}>
                <FaTrash size={11} /> Sil
              </button>
            </motion.div>
          ))}

          <button
            type="button"
            className={styles.addBtn}
            style={{ alignSelf: 'flex-start' }}
            onClick={() => append({
              name: '', gender: 'kişi', age: 0,
              needs_spiritual_support: false, spiritual_support_reason: ''
            })}
          >
            <FaPlus size={12} /> Uşaq əlavə et
          </button>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading
              ? 'Saxlanılır...'
              : <><FaSave size={15} />{isEdit ? 'Dəyişiklikləri saxla' : 'Ailə yarat'}</>}
          </button>
        </form>
      </motion.div>
    </>
  );
};

export default FamilyFormPage;