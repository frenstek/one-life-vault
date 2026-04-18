import { useState, useRef, useCallback } from 'react';
import {
  HiPhoto,
  HiPlus,
  HiTrash,
  HiStar,
  HiPencilSquare,
  HiCheck,
  HiXMark,
  HiArrowUpTray,
  HiPrinter,
  HiHome,
  HiMapPin,
  HiSparkles,
  HiShieldCheck,
  HiBuildingStorefront,
} from 'react-icons/hi2';
import {
  uploadPropertyPhoto,
  deletePropertyPhoto,
  setCoverPhoto,
  updatePropertyRecord,
} from '../lib/api';
import PropertyProfilePDF from './PropertyProfilePDF';

const COMMON_FEATURES = [
  'Fully accessible bathroom', 'Wheelchair ramp', 'Wide doorways',
  'Ceiling hoists', 'Emergency call system', 'Air conditioning',
  'Solar panels', 'Secure fencing', 'Garden/outdoor area',
  'Communal living area', 'Individual ensuites', 'Laundry facilities',
  'Smart home automation', 'Sensory room', 'Activity room',
  'Assistive technology ready', 'Fire sprinkler system', 'CCTV',
  'Backup generator', 'Vehicle parking',
];

const formatDateShort = (d) => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function PropertyProfileTab({ property, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [settingCover, setSettingCover] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    description: property.description || '',
    bedrooms: property.bedrooms ?? '',
    bathrooms: property.bathrooms ?? '',
    features: property.features || [],
    accessibility: property.accessibility || '',
    nearby_amenities: property.nearby_amenities || '',
  });
  const [featureInput, setFeatureInput] = useState('');

  const photos = property.photos || [];
  const coverPhoto = photos.find((p) => p.is_cover) || photos[0] || null;

  // ─── Photo Upload ──────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    setUploading(true);
    try {
      for (const file of imageFiles) {
        const base64 = await fileToBase64(file);
        await uploadPropertyPhoto(property.id, file.name, base64);
      }
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }, [property.id, onRefresh]);

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleDelete(photoId) {
    if (!confirm('Delete this photo?')) return;
    setDeleting(photoId);
    try {
      await deletePropertyPhoto(photoId);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetCover(photoId) {
    setSettingCover(photoId);
    try {
      await setCoverPhoto(property.id, photoId);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSettingCover(null);
    }
  }

  // ─── Details Edit ─────────────────────────────────────────────────────

  function startEdit() {
    setForm({
      description: property.description || '',
      bedrooms: property.bedrooms ?? '',
      bathrooms: property.bathrooms ?? '',
      features: property.features || [],
      accessibility: property.accessibility || '',
      nearby_amenities: property.nearby_amenities || '',
    });
    setEditing(true);
  }

  async function saveDetails() {
    setSaving(true);
    try {
      await updatePropertyRecord('properties', property.id, {
        description: form.description || null,
        bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
        features: form.features,
        accessibility: form.accessibility || null,
        nearby_amenities: form.nearby_amenities || null,
      });
      setEditing(false);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addFeature(feat) {
    const trimmed = feat.trim();
    if (trimmed && !form.features.includes(trimmed)) {
      setForm((f) => ({ ...f, features: [...f.features, trimmed] }));
    }
    setFeatureInput('');
  }

  function removeFeature(feat) {
    setForm((f) => ({ ...f, features: f.features.filter((x) => x !== feat) }));
  }

  const unusedSuggestions = COMMON_FEATURES.filter((f) => !form.features.includes(f));

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 print:hidden">
        {/* Photo Gallery */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <HiPhoto className="h-5 w-5 text-brand-500" />
              Photos ({photos.length})
            </h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg bg-[#0ea03e] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b8532] disabled:opacity-50"
            >
              {uploading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Uploading...</>
              ) : (
                <><HiPlus className="h-4 w-4" /> Add Photos</>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Cover photo */}
          {coverPhoto && (
            <div className="mb-4 relative group overflow-hidden rounded-lg">
              <img
                src={coverPhoto.url}
                alt={coverPhoto.caption || 'Cover photo'}
                className="w-full h-64 object-cover cursor-pointer"
                onClick={() => setLightbox(coverPhoto)}
              />
              <div className="absolute top-2 left-2">
                <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white flex items-center gap-1">
                  <HiStar className="h-3.5 w-3.5 text-yellow-400" /> Cover
                </span>
              </div>
            </div>
          )}

          {/* Thumbnail grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                  <img
                    src={photo.url}
                    alt={photo.caption || photo.file_name}
                    className="h-full w-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => setLightbox(photo)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1 p-1.5 opacity-0 group-hover:opacity-100">
                    {!photo.is_cover && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetCover(photo.id); }}
                        disabled={settingCover === photo.id}
                        title="Set as cover"
                        className="rounded bg-white/90 p-1.5 text-xs hover:bg-white disabled:opacity-50"
                      >
                        <HiStar className="h-3.5 w-3.5 text-amber-500" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                      disabled={deleting === photo.id}
                      title="Delete"
                      className="rounded bg-white/90 p-1.5 text-xs hover:bg-white disabled:opacity-50"
                    >
                      <HiTrash className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                  {photo.is_cover && (
                    <div className="absolute top-1 left-1">
                      <HiStar className="h-4 w-4 text-yellow-400 drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dropzone (when no photos or always show) */}
          {photos.length === 0 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                dragOver
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-slate-300 hover:border-slate-400 dark:border-slate-600'
              }`}
            >
              <HiArrowUpTray className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Drag & drop photos here, or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-400">PNG, JPG, GIF, WebP up to 4.5MB</p>
            </div>
          )}

          {/* Drop overlay when photos already exist */}
          {photos.length > 0 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mt-3 flex items-center justify-center rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors ${
                dragOver
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-600'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <HiArrowUpTray className="h-4 w-4" /> Drop more photos or click to upload
              </p>
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <HiHome className="h-5 w-5 text-brand-500" />
              Property Details
            </h2>
            {!editing ? (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                <HiPencilSquare className="h-4 w-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <HiXMark className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={saveDetails}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-lg bg-[#0ea03e] px-3 py-2 text-sm font-medium text-white hover:bg-[#0b8532] disabled:opacity-50"
                >
                  {saving ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving...</>
                  ) : (
                    <><HiCheck className="h-4 w-4" /> Save</>
                  )}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe the property, its setting, and what makes it special..."
                  className="resize-y"
                />
              </div>

              {/* Bedrooms / Bathrooms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={form.bedrooms}
                    onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
                    placeholder="e.g. 4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bathrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={form.bathrooms}
                    onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Features & Amenities
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.features.map((feat) => (
                    <span key={feat} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {feat}
                      <button onClick={() => removeFeature(feat)} className="hover:text-red-500 ml-0.5">
                        <HiXMark className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addFeature(featureInput); }
                    }}
                    placeholder="Type a feature and press Enter..."
                    className="flex-1"
                  />
                  <button
                    onClick={() => addFeature(featureInput)}
                    disabled={!featureInput.trim()}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                  >
                    Add
                  </button>
                </div>
                {unusedSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {unusedSuggestions.slice(0, 12).map((feat) => (
                        <button
                          key={feat}
                          onClick={() => addFeature(feat)}
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition-colors dark:border-slate-600 dark:text-slate-400"
                        >
                          + {feat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accessibility */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Accessibility Notes</label>
                <textarea
                  value={form.accessibility}
                  onChange={(e) => setForm((f) => ({ ...f, accessibility: e.target.value }))}
                  rows={3}
                  placeholder="SDA design category, accessibility features, modifications..."
                />
              </div>

              {/* Nearby Amenities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nearby Amenities</label>
                <textarea
                  value={form.nearby_amenities}
                  onChange={(e) => setForm((f) => ({ ...f, nearby_amenities: e.target.value }))}
                  rows={3}
                  placeholder="Shopping centres, parks, public transport, medical facilities..."
                />
              </div>
            </div>
          ) : (
            <DetailsReadView property={property} />
          )}
        </div>

        {/* Actions: Print + PDF Download */}
        <div className="flex justify-end gap-3">
          <PropertyProfilePDF property={property} />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <HiPrinter className="h-4 w-4" /> Print Profile
          </button>
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
            onClick={() => setLightbox(null)}
          >
            <HiXMark className="h-6 w-6" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.caption || lightbox.file_name}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p className="absolute bottom-6 text-sm text-white/80 bg-black/40 rounded-lg px-3 py-1.5">
              {lightbox.caption}
            </p>
          )}
        </div>
      )}

      {/* ─── Print-only Profile ─── */}
      <PrintProfile property={property} coverPhoto={coverPhoto} photos={photos} />
    </>
  );
}

// ─── Read-only details view ─────────────────────────────────────────────────

function DetailsReadView({ property }) {
  const p = property;
  const features = p.features || [];
  const hasDetails = p.description || p.bedrooms || p.bathrooms || features.length || p.accessibility || p.nearby_amenities;

  if (!hasDetails) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center dark:border-slate-600">
        <HiHome className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">No details added yet. Click Edit to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {p.description && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</h3>
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{p.description}</p>
        </div>
      )}

      {(p.bedrooms || p.bathrooms) && (
        <div className="flex gap-6">
          {p.bedrooms != null && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                <HiHome className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{p.bedrooms}</p>
                <p className="text-xs text-slate-500">Bedrooms</p>
              </div>
            </div>
          )}
          {p.bathrooms != null && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <HiSparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{p.bathrooms}</p>
                <p className="text-xs text-slate-500">Bathrooms</p>
              </div>
            </div>
          )}
        </div>
      )}

      {features.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Features & Amenities</h3>
          <div className="flex flex-wrap gap-1.5">
            {features.map((feat) => (
              <span key={feat} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                {feat}
              </span>
            ))}
          </div>
        </div>
      )}

      {p.accessibility && (
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            <HiShieldCheck className="h-4 w-4" /> Accessibility
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{p.accessibility}</p>
        </div>
      )}

      {p.nearby_amenities && (
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            <HiBuildingStorefront className="h-4 w-4" /> Nearby Amenities
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{p.nearby_amenities}</p>
        </div>
      )}
    </div>
  );
}

// ─── Print-only branded profile ─────────────────────────────────────────────

function PrintProfile({ property, coverPhoto, photos }) {
  const p = property;
  const features = p.features || [];
  const typeLabel = { SIL: 'Supported Independent Living', SDA: 'Specialist Disability Accommodation', 'SIL+SDA': 'SIL + SDA' };

  return (
    <div className="hidden print:block print-profile">
      {/* Header */}
      <div className="print-header flex items-center justify-between border-b-2 border-[#0ea03e] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">One Life Foundation</h1>
          <p className="text-sm text-slate-500">Property Profile</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>Generated {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Property Title */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">{p.name}</h2>
        <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
          <HiMapPin className="h-4 w-4 inline" />
          {p.address}{p.suburb ? `, ${p.suburb}` : ''}{p.state ? ` ${p.state}` : ''}{p.postcode ? ` ${p.postcode}` : ''}
        </p>
        <div className="mt-2 flex gap-3 text-xs">
          <span className="rounded-full border border-[#0ea03e] px-2.5 py-0.5 font-medium text-[#0ea03e]">
            {typeLabel[p.property_type] || p.property_type}
          </span>
          {p.capacity && (
            <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-slate-600">
              Capacity: {p.capacity}
            </span>
          )}
          {p.bedrooms != null && (
            <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-slate-600">
              {p.bedrooms} Bed
            </span>
          )}
          {p.bathrooms != null && (
            <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-slate-600">
              {p.bathrooms} Bath
            </span>
          )}
        </div>
      </div>

      {/* Cover Photo */}
      {coverPhoto && (
        <div className="mb-5">
          <img
            src={coverPhoto.url}
            alt="Property"
            className="w-full h-56 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Photo grid (up to 6 thumbnails) */}
      {photos.length > 1 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {photos.filter((ph) => ph.id !== coverPhoto?.id).slice(0, 6).map((ph) => (
            <img key={ph.id} src={ph.url} alt="" className="w-full h-24 object-cover rounded" />
          ))}
        </div>
      )}

      {/* Description */}
      {p.description && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wide">About</h3>
          <p className="text-sm text-slate-700 whitespace-pre-line">{p.description}</p>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">Features & Amenities</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {features.map((feat) => (
              <div key={feat} className="flex items-center gap-1.5 text-sm text-slate-700">
                <HiCheck className="h-3.5 w-3.5 text-[#0ea03e] flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility */}
      {p.accessibility && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wide">Accessibility</h3>
          <p className="text-sm text-slate-700 whitespace-pre-line">{p.accessibility}</p>
        </div>
      )}

      {/* Nearby Amenities */}
      {p.nearby_amenities && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wide">Nearby Amenities</h3>
          <p className="text-sm text-slate-700 whitespace-pre-line">{p.nearby_amenities}</p>
        </div>
      )}

      {/* Contact */}
      {(p.property_manager || p.contact_phone) && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wide">Contact</h3>
          <p className="text-sm text-slate-700">
            {p.property_manager && <span>Manager: {p.property_manager}</span>}
            {p.property_manager && p.contact_phone && <span> &middot; </span>}
            {p.contact_phone && <span>Phone: {p.contact_phone}</span>}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-3 border-t border-slate-300 text-center">
        <p className="text-xs text-slate-400">
          One Life Foundation &middot; Supporting people with disability to live their best life
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          This property profile is for informational purposes. Please contact us for availability.
        </p>
      </div>
    </div>
  );
}
