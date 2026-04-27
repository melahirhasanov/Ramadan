import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { personService, Person } from '../../services/personService';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FaUpload, FaTimes } from 'react-icons/fa';
import styles from './Masters.module.css';

const MasterFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  
  const profileImage = watch('profile_image');

  // Cloudinary-ə şəkil yükləmə funksiyası
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'infaq_preset');
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME as string;
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Şəkil yüklənmədi');
    const data = await response.json();
    return data.secure_url;
  };

  // Şəkil faylı seçildikdə
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil faylı seçin (JPG, PNG, WEBP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Şəkil ölçüsü 5MB-dan az olmalıdır');
      return;
    }
    
    // Preview göstər
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setValue('profile_image', imageUrl);
      toast.success('Şəkil yükləndi');
    } catch (error) {
      toast.error('Şəkil yüklənmədi');
      setPreviewImage('');
    } finally {
      setUploading(false);
    }
  };

  // Şəkli sil
  const removeImage = () => {
    setValue('profile_image', '');
    setPreviewImage('');
    toast.success('Şəkil silindi');
  };

  useEffect(() => {
    if (isEdit && id) {
      personService.getById(id)
        .then(res => {
          const p = res.data;
          setValue('full_name', p.full_name);
          setValue('email', p.email);
          setValue('phone', p.phone);
          setValue('is_active', p.is_active);
          setValue('profile_image', p.profile_image || '');
          if (p.profile_image) {
            setPreviewImage(p.profile_image);
          }
        })
        .catch(() => toast.error('Məlumat yüklənmədi'));
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        await personService.update(id, {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          is_active: data.is_active,
          profile_image: data.profile_image || ''
        });
        toast.success('Ustad yeniləndi');
      } else {
        await personService.create({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'master',
          profile_image: data.profile_image || ''
        });
        toast.success('Ustad yaradıldı');
      }
      navigate('/masters');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar />
      <Header />
      <div className={styles.container}>
        <h1>{isEdit ? 'Ustad redaktə et' : 'Yeni ustad'}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Profil şəkli sahəsi */}
          <div className={styles.formGroup}>
            <label>Profil şəkli</label>
            <div className={styles.imageUploadContainer}>
              {(previewImage || profileImage) && (
                <div className={styles.imagePreviewWrapper}>
                  <img 
                    src={previewImage || profileImage} 
                    alt="Profil şəkli" 
                    className={styles.imagePreview}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className={styles.removeImageBtn}
                    disabled={uploading}
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
              
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUpload" className={styles.uploadLabel}>
                  <FaUpload />
                  {uploading ? 'Yüklənir...' : (previewImage || profileImage ? 'Şəkli dəyiş' : 'Şəkil seç')}
                </label>
                <small className={styles.uploadHint}>
                  JPG, PNG, WEBP · maks 5 MB
                </small>
              </div>
            </div>
            <input type="hidden" {...register('profile_image')} />
          </div>

          <div className={styles.formGroup}>
            <label>Ad Soyad</label>
            <input {...register('full_name', { required: true })} placeholder="Ad Soyad" />
            {errors.full_name && <span className={styles.error}>Ad Soyad tələb olunur</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label>Email</label>
            <input {...register('email', { required: true })} type="email" placeholder="Email" />
            {errors.email && <span className={styles.error}>Email tələb olunur</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label>Telefon</label>
            <input {...register('phone', { required: true })} placeholder="Telefon" />
            {errors.phone && <span className={styles.error}>Telefon tələb olunur</span>}
          </div>
          
          {!isEdit && (
            <div className={styles.formGroup}>
              <label>Şifrə</label>
              <input {...register('password', { required: true })} type="password" placeholder="Şifrə" />
              {errors.password && <span className={styles.error}>Şifrə tələb olunur</span>}
            </div>
          )}
          
          {isEdit && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('is_active')} /> Aktiv
              </label>
            </div>
          )}
          
          <button type="submit" disabled={loading || uploading} className={styles.submitBtn}>
            {uploading ? 'Şəkil yüklənir...' : (loading ? 'Yadda saxlanır...' : (isEdit ? 'Yenilə' : 'Yarat'))}
          </button>
        </form>
      </div>
    </>
  );
};

export default MasterFormPage;