import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiTrash,
  HiArrowDownTray,
  HiShieldExclamation,
  HiCheckCircle,
  HiXCircle,
} from 'react-icons/hi2';
import {
  fetchSDSRegister,
  createSDSEntry,
  updateSDSEntry,
  deleteSDSEntry,
  formatDate,
} from '../lib/api';
import {
  PageHeader,
  Badge,
  EmptyState,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
} from '../components/ui/FormComponents';
import Modal, {
  ModalBody,
  ModalFooter,
  ButtonPrimary,
  ButtonSecondary,
  ButtonDanger,
  ModalError,
} from '../components/ui/Modal';
import { exportRegisterPdf } from '../lib/registerPdfExport';

// ─── Constants ──────────────────────────────────────────────────────────────────

const RISK_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const RISK_FILTERS = ['All', 'Low', 'Medium', 'High', 'Critical'];

const INITIAL_FORM = {
  product_name: '',
  manufacturer: '',
  hazard_classification: '',
  ghs_pictograms: '',
  location_stored: '',
  first_aid: '',
  sds_date: '',
  sds_on_site: true,
  risk_rating: 'low',
  property_location: 'Epping',
  notes: '',
};

function capitalize(str) {
  if (!str) return '--';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function SDSRegister() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [riskFilter, setRiskFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function loadData() {
    setLoading(true);
    setError(null);
    const risk = riskFilter === 'All' ? undefined : riskFilter.toLowerCase();
    fetchSDSRegister(risk)
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [riskFilter]);

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (e.product_name || '').toLowerCase().includes(q) ||
      (e.manufacturer || '').toLowerCase().includes(q) ||
      (e.location_stored || '').toLowerCase().includes(q) ||
      (e.hazard_classification || '').toLowerCase().includes(q)
    );
  });

  function openFormModal(entry = null) {
    if (entry) {
      setForm({
        product_name: entry.product_name || '',
        manufacturer: entry.manufacturer || '',
        hazard_classification: entry.hazard_classification || '',
        ghs_pictograms: entry.ghs_pictograms || '',
        location_stored: entry.location_stored || '',
        first_aid: entry.first_aid || '',
        sds_date: entry.sds_date || '',
        sds_on_site: entry.sds_on_site !== false,
        risk_rating: entry.risk_rating || 'low',
        property_location: entry.property_location || 'Epping',
        notes: entry.notes || '',
      });
      setSelectedEntry(entry);
      setIsEditing(true);
    } else {
      setForm(INITIAL_FORM);
      setSelectedEntry(null);
      setIsEditing(false);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  async function handleSave() {
    if (!form.product_name.trim()) return setFormError('Product name is required');
    setSaving(true);
    setFormError(null);
    try {
      if (isEditing && selectedEntry) {
        await updateSDSEntry(selectedEntry.id, form);
      } else {
        await createSDSEntry(form);
      }
      setFormModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteSDSEntry(deleteConfirm.id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SDS Register"
        subtitle="Safety Data Sheet register for hazardous chemicals"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Safety Data Sheet (SDS) Register',
                columns: ['Product', 'Manufacturer', 'Hazard Classification', 'Storage Location', 'Risk', 'SDS Date', 'First Aid'],
                rows: filtered.map((e) => [
                  e.product_name || '',
                  e.manufacturer || '',
                  e.hazard_classification || '',
                  e.location_stored || '',
                  capitalize(e.risk_rating || 'low'),
                  e.sds_date ? formatDate(e.sds_date) : '',
                  e.first_aid || '',
                ]),
                orientation: 'landscape',
                columnWidths: [12, 10, 18, 12, 6, 8, 34],
                filename: 'OLF-SDS-Register.pdf',
              })}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <HiArrowDownTray className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => openFormModal()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <HiPlus className="h-4 w-4" />
              Add Chemical
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {RISK_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                riskFilter === r
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} chemicals</span>
        </div>
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search chemicals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiShieldExclamation}
          title="No chemicals registered"
          description="Add chemicals to the SDS register."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Manufacturer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hazard</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Storage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">SDS On-Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">SDS Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{entry.product_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.manufacturer || '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{entry.hazard_classification || '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.location_stored || '--'}</td>
                  <td className="px-4 py-3"><Badge variant={RISK_COLORS[entry.risk_rating] || 'default'}>{capitalize(entry.risk_rating)}</Badge></td>
                  <td className="px-4 py-3">
                    {entry.sds_on_site ? (
                      <HiCheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <HiXCircle className="h-5 w-5 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.sds_date ? formatDate(entry.sds_date) : '--'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openFormModal(entry)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><HiPencilSquare className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteConfirm(entry)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"><HiTrash className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={isEditing ? 'Edit Chemical' : 'Add Chemical'} size="lg">
        <ModalBody>
          {formError && <ModalError message={formError} />}
          <div className="space-y-4">
            <FormRow>
              <FormInput label="Product Name" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required placeholder="e.g. Domestos Bleach" />
              <FormInput label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="e.g. Unilever" />
            </FormRow>
            <FormRow>
              <FormInput label="Hazard Classification" value={form.hazard_classification} onChange={(e) => setForm({ ...form, hazard_classification: e.target.value })} placeholder="e.g. Corrosive (Cat 1), Skin irritant" />
              <FormInput label="GHS Pictograms" value={form.ghs_pictograms} onChange={(e) => setForm({ ...form, ghs_pictograms: e.target.value })} placeholder="e.g. Corrosion, Exclamation" />
            </FormRow>
            <FormRow>
              <FormInput label="Storage Location" value={form.location_stored} onChange={(e) => setForm({ ...form, location_stored: e.target.value })} placeholder="e.g. Laundry cupboard (locked)" />
              <FormSelect label="Risk Rating" value={form.risk_rating} onChange={(e) => setForm({ ...form, risk_rating: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </FormSelect>
            </FormRow>
            <FormRow>
              <FormInput label="SDS Date" type="date" value={form.sds_date} onChange={(e) => setForm({ ...form, sds_date: e.target.value })} />
              <FormInput label="Property" value={form.property_location} onChange={(e) => setForm({ ...form, property_location: e.target.value })} placeholder="Epping" />
            </FormRow>
            <FormTextarea label="First Aid Instructions" value={form.first_aid} onChange={(e) => setForm({ ...form, first_aid: e.target.value })} rows={2} placeholder="Primary first aid measures..." />
            <FormTextarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any additional notes..." />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.sds_on_site} onChange={(e) => setForm({ ...form, sds_on_site: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              SDS document is on-site
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setFormModalOpen(false)}>Cancel</ButtonSecondary>
          <ButtonPrimary onClick={handleSave} loading={saving}>{isEditing ? 'Update' : 'Add'}</ButtonPrimary>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Chemical" size="sm">
        <ModalBody>
          <p className="text-sm text-slate-600">Remove <strong>{deleteConfirm?.product_name}</strong> from the SDS register?</p>
        </ModalBody>
        <ModalFooter>
          <ButtonSecondary onClick={() => setDeleteConfirm(null)}>Cancel</ButtonSecondary>
          <ButtonDanger onClick={handleDelete} loading={deleting}>Remove</ButtonDanger>
        </ModalFooter>
      </Modal>
    </div>
  );
}
