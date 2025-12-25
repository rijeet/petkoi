'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Vaccine {
  id: string;
  name: string;
  doseNumber?: number;
  clinic?: string;
  injectionDate: string;
  nextDueDate?: string;
  prescriptionImageUrl?: string;
  createdAt: string;
}

export default function PetVaccinesPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    doseNumber: '',
    clinic: '',
    injectionDate: '',
    nextDueDate: '',
  });
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    if (isAuthenticated) {
      loadVaccines();
    }
  }, [params.id, isAuthenticated, authLoading, router]);

  const loadVaccines = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.getPetVaccines(params.id as string) as Vaccine[];
      setVaccines(data || []);
    } catch (error: any) {
      console.error('Failed to load vaccines:', error);
      setError('Failed to load vaccines');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }

      const vaccineData: any = {
        name: formData.name,
        injectionDate: formData.injectionDate,
      };

      if (formData.doseNumber) {
        vaccineData.doseNumber = parseInt(formData.doseNumber);
      }
      if (formData.clinic) {
        vaccineData.clinic = formData.clinic;
      }
      if (formData.nextDueDate) {
        vaccineData.nextDueDate = formData.nextDueDate;
      }

      let vaccineId: string;
      if (editingVaccine) {
        await apiClient.updateVaccine(params.id as string, editingVaccine.id, vaccineData);
        vaccineId = editingVaccine.id;
        setSuccess('Vaccine updated successfully!');
      } else {
        const newVaccine = await apiClient.createVaccine(params.id as string, vaccineData) as Vaccine;
        vaccineId = newVaccine.id;
        setSuccess('Vaccine added successfully!');
      }

      // Upload prescription image if provided
      if (prescriptionFile && vaccineId) {
        try {
          await apiClient.uploadVaccinePrescription(params.id as string, vaccineId, prescriptionFile);
          setSuccess((prev) => prev + ' Prescription image uploaded!');
        } catch (uploadError: any) {
          console.error('Failed to upload prescription:', uploadError);
          // Don't fail the whole operation if image upload fails
          setError((prev) => prev || 'Vaccine saved but prescription upload failed. You can upload it later.');
        }
      }

      setFormData({
        name: '',
        doseNumber: '',
        clinic: '',
        injectionDate: '',
        nextDueDate: '',
      });
      setPrescriptionFile(null);
      setPrescriptionPreview(null);
      setShowForm(false);
      setEditingVaccine(null);
      loadVaccines();
    } catch (error: any) {
      setError(error.message || 'Failed to save vaccine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vaccineId: string) => {
    if (!confirm('Are you sure you want to delete this vaccine record?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.deleteVaccine(params.id as string, vaccineId);
      setSuccess('Vaccine deleted successfully!');
      loadVaccines();
    } catch (error: any) {
      setError(error.message || 'Failed to delete vaccine');
    }
  };

  const handleEdit = (vaccine: Vaccine) => {
    setEditingVaccine(vaccine);
    setFormData({
      name: vaccine.name,
      doseNumber: vaccine.doseNumber?.toString() || '',
      clinic: vaccine.clinic || '',
      injectionDate: new Date(vaccine.injectionDate).toISOString().split('T')[0],
      nextDueDate: vaccine.nextDueDate ? new Date(vaccine.nextDueDate).toISOString().split('T')[0] : '',
    });
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
    setShowForm(true);
  };

  const handlePrescriptionUpload = async (vaccineId: string, file: File) => {
    try {
      setUploadingPrescription(vaccineId);
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }
      await apiClient.uploadVaccinePrescription(params.id as string, vaccineId, file);
      setSuccess('Prescription image uploaded successfully!');
      loadVaccines();
    } catch (error: any) {
      setError(error.message || 'Failed to upload prescription');
    } finally {
      setUploadingPrescription(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/dashboard/pets/${params.id}`}
          className="text-sm sm:text-base text-pink-500 hover:text-pink-600 mb-6 inline-block font-medium"
        >
          ← Back to Pet Details
        </Link>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💉 Vaccine Records</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingVaccine(null);
                setFormData({
                  name: '',
                  doseNumber: '',
                  clinic: '',
                  injectionDate: '',
                  nextDueDate: '',
                });
                setPrescriptionFile(null);
                setPrescriptionPreview(null);
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
            >
              {showForm ? 'Cancel' : '+ Add Vaccine'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                {editingVaccine ? 'Edit Vaccine' : 'Add New Vaccine'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccine Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dose Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.doseNumber}
                    onChange={(e) => setFormData({ ...formData, doseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic/Hospital
                  </label>
                  <input
                    type="text"
                    value={formData.clinic}
                    onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Injection Date *
                  </label>
                  <input
                    type="date"
                    value={formData.injectionDate}
                    onChange={(e) => setFormData({ ...formData, injectionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prescription Image (Optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                    />
                    {prescriptionPreview && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <div className="relative inline-block">
                          <img
                            src={prescriptionPreview}
                            alt="Prescription preview"
                            className="max-w-xs max-h-48 rounded-lg border border-gray-300 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPrescriptionFile(null);
                              setPrescriptionPreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            aria-label="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    {editingVaccine?.prescriptionImageUrl && !prescriptionPreview && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Current prescription:</p>
                        <img
                          src={editingVaccine.prescriptionImageUrl}
                          alt="Current prescription"
                          className="max-w-xs max-h-48 rounded-lg border border-gray-300 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingVaccine ? 'Update' : 'Add Vaccine'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVaccine(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Vaccine List */}
          {vaccines.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">💉</div>
              <p>No vaccine records yet</p>
              <p className="text-sm mt-2 text-gray-400">Click "Add Vaccine" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vaccines.map((vaccine) => (
                <div
                  key={vaccine.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">{vaccine.name}</h3>
                          {vaccine.doseNumber && (
                            <p className="text-sm text-gray-600">Dose #{vaccine.doseNumber}</p>
                          )}
                        </div>
                        {vaccine.prescriptionImageUrl && (
                          <div className="ml-4">
                            <img
                              src={vaccine.prescriptionImageUrl}
                              alt="Prescription"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => window.open(vaccine.prescriptionImageUrl, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {vaccine.clinic && (
                          <div>
                            <span className="text-gray-600 font-medium">Clinic:</span>
                            <p className="text-gray-900">{vaccine.clinic}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600 font-medium">Injection Date:</span>
                          <p className="text-gray-900">
                            {new Date(vaccine.injectionDate).toLocaleDateString()}
                          </p>
                        </div>
                        {vaccine.nextDueDate && (
                          <div>
                            <span className="text-gray-600 font-medium">Next Due:</span>
                            <p className="text-gray-900">
                              {new Date(vaccine.nextDueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!vaccine.prescriptionImageUrl && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handlePrescriptionUpload(vaccine.id, file);
                              }
                            }}
                            disabled={uploadingPrescription === vaccine.id}
                          />
                          <span className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-semibold text-center block">
                            {uploadingPrescription === vaccine.id ? 'Uploading...' : '📷 Upload Prescription'}
                          </span>
                        </label>
                      )}
                      <button
                        onClick={() => handleEdit(vaccine)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-semibold"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vaccine.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

