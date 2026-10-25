import { useState, useEffect } from 'react';
import {
  HiPencilSquare, HiCheckCircle, HiArrowDownTray, HiArrowPath,
  HiExclamationTriangle, HiDocumentText,
} from 'react-icons/hi2';
import { fetchOrientation, saveOrientation, fetchHospitalPassport } from '../lib/api';
import { generateOrientationPDF, generateDefaults } from './OrientationPDF';
import { useAuth } from '../contexts/AuthContext';

// ─── Section config ──────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'about', label: 'About the Participant', rows: 5 },
  { key: 'likes', label: 'Things They Like', rows: 2 },
  { key: 'dislikes', label: 'Things They Don\'t Like', rows: 2 },
  { key: 'upsets', label: 'Things That May Upset Them', rows: 2 },
  { key: 'calms', label: 'What Helps Them Feel Calm', rows: 2 },
  { key: 'critical_alerts', label: 'Critical Alerts', rows: 5, alert: true },
  { key: 'daily_routine_morning', label: 'Daily Routine — Morning', rows: 6 },
  { key: 'daily_routine_afternoon', label: 'Daily Routine — Afternoon', rows: 6 },
  { key: 'daily_routine_evening', label: 'Daily Routine — Evening', rows: 6 },
  { key: 'daily_routine_overnight', label: 'Daily Routine — Overnight', rows: 4 },
  { key: 'medication_management', label: 'Medication Management', rows: 5 },
  { key: 'insulin_schedule', label: 'Insulin / Medication Schedule', rows: 4 },
  { key: 'personal_care', label: 'Personal Care', rows: 5 },
  { key: 'meals_nutrition', label: 'Meals & Nutrition', rows: 5 },
  { key: 'mobility_transfers', label: 'Mobility & Transfers', rows: 4 },
  { key: 'communication_style', label: 'Communication Style', rows: 3 },
  { key: 'behaviour_guidance', label: 'Behaviour Guidance', rows: 4 },
  { key: 'behaviour_notes', label: 'Behaviour Notes (from progress notes)', rows: 4 },
  { key: 'appointments', label: 'Appointments & Transport', rows: 4 },
  { key: 'risk_management', label: 'Risk Management', rows: 5 },
  { key: 'emergency_protocols', label: 'Emergency Protocols', rows: 5 },
  { key: 'household_duties', label: 'Household & General Duties', rows: 4 },
  { key: 'family_visitors', label: 'Family & Visitors', rows: 4 },
  { key: 'additional_notes', label: 'Additional Notes', rows: 3 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrientationTab({ participant, supportPlan }) {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hospitalPassport, setHospitalPassport] = useState(null);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { profile } = useAuth();
  const participantId = participant?.id;

  useEffect(() => {
    if (!participantId) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      fetchOrientation(participantId).catch(() => null),
      fetchHospitalPassport(participantId).catch(() => null),
    ]).then(([orientationData, hpData]) => {
      if (!alive) return;
      setHospitalPassport(hpData);
      if (orientationData) {
        setData(orientationData);
        setForm(orientationData);
      } else {
        const defaults = generateDefaults(participant, supportPlan, hpData);
        setForm(defaults);
        setData(null);
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [participantId]);

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const saved = await saveOrientation({ participant_id: participant.id, ...form, last_updated_by: profile?.full_name || profile?.email || 'Admin' });
      setData(saved);
      setForm(saved);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPDF() {
    setExporting(true);
    try {
      const hp = hospitalPassport;
      const pdf = await generateOrientationPDF(participant, supportPlan, hp, form);
      const pName = `${participant.first_name || ''}-${participant.last_name || ''}`.replace(/\s+/g, '-');
      pdf.save(`OLF-Orientation-Guide-${pName}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  function handleRegenerate() {
    if (!confirm('This will reset all fields to auto-generated content from the participant profile. Any manual edits will be lost. Continue?')) return;
    const defaults = generateDefaults(participant, supportPlan, hospitalPassport);
    setForm(defaults);
    setEditing(true);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-[#162036] animate-pulse" />
        ))}
      </div>
    );
  }

  const name = participant.preferred_name || participant.first_name || 'Participant';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <HiDocumentText className="h-5 w-5 text-brand-500" />
            Support Worker Orientation Guide
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {data ? `Last updated: ${new Date(data.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Not yet saved — review and save to create orientation guide'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
              >
                <HiPencilSquare className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                <HiArrowDownTray className="h-4 w-4" />
                {exporting ? 'Generating...' : 'Download PDF'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <HiArrowPath className="h-4 w-4" />
                Re-generate
              </button>
              <button
                onClick={() => { setForm(data || {}); setEditing(false); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                <HiCheckCircle className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <HiCheckCircle className="h-4 w-4 shrink-0" /> Orientation guide saved successfully.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <HiExclamationTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map(({ key, label, rows, alert }) => (
          <div
            key={key}
            className={`rounded-xl border ${
              alert
                ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                : 'border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036]'
            } p-5`}
          >
            <label className={`block text-sm font-semibold mb-2 ${
              alert ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
            }`}>
              {alert && <HiExclamationTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />}
              {label}
            </label>
            {editing ? (
              <textarea
                value={form[key] || ''}
                onChange={e => handleChange(key, e.target.value)}
                rows={rows}
                className="w-full rounded-lg border border-slate-300 dark:border-[#334766] bg-white dark:bg-[#0d1829] px-4 py-3 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-y"
                placeholder={`Enter ${label.toLowerCase()}...`}
              />
            ) : (
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[2rem]">
                {form[key] || <span className="text-slate-400 dark:text-slate-600 italic">Not set</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      {editing && (
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#263554]">
          <button
            onClick={() => { setForm(data || {}); setEditing(false); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            <HiCheckCircle className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Orientation Guide'}
          </button>
        </div>
      )}
    </div>
  );
}
