import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { volunteerService } from '../../services/volunteerService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './Volunteers.module.css';

const VolunteerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, setValue, reset } = useForm();

  useEffect(() => {
    if (isEdit && id) {
      volunteerService.getById(id).then(res => {
        const v = res.data;
        const p = v.person_id;
        setValue('full_name', p.full_name);
        setValue('email', p.email);
        setValue('phone', p.phone);
        setValue('free_time', v.free_time);
        setValue('teams', v.teams?.join(', '));
        setValue('notes', v.notes);
        setValue('image', v.image);
      }).catch(() => toast.error('Məlumat yüklənmədi'));
    }
  }, [id, isEdit, setValue]);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'infaq_preset');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.secure_url;
  };

  const onSubmit = async (data: any) => {
    let imageUrl = data.image || '';
    if (data.imageFile && data.imageFile[0]) {
      setUploading(true);
      try {
        imageUrl = await uploadImage(data.imageFile[0]);
      } catch {
        toast.error('Şəkil yüklənmədi');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const volunteerData = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      free_time: data.free_time,
      teams: data.teams ? data.teams.split(',').map((t: string) => t.trim()) : [],
      image: imageUrl,
      notes: data.notes,
    };

    try {
      if (isEdit && id) {
        await volunteerService.update(id, volunteerData);
        toast.success('Könüllü yeniləndi');
      } else {
        await volunteerService.create(volunteerData);
        toast.success('Könüllü əlavə edildi');
      }
      navigate('/volunteers');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    }
  };

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>{isEdit ? 'Könüllü redaktə et' : 'Yeni könüllü'}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <input {...register('full_name')} placeholder="Ad Soyad" required />
          <input {...register('email')} placeholder="Email" required />
          <input {...register('phone')} placeholder="Telefon" required />
          {!isEdit && <input {...register('password')} type="password" placeholder="Şifrə" required />}
          <input {...register('free_time')} placeholder="Boş vaxtlar" />
          <input {...register('teams')} placeholder="Komandalar (vergüllə)" />
          <textarea {...register('notes')} placeholder="Qeyd" rows={3} />
          <input type="file" accept="image/*" {...register('imageFile')} />
          {isEdit && <input type="hidden" {...register('image')} />}
          <button type="submit" disabled={uploading} className={styles.submitBtn}>
            {uploading ? 'Yüklənir...' : (isEdit ? 'Yenilə' : 'Yarat')}
          </button>
        </form>
      </div>
    </>
  );
};

export default VolunteerFormPage;