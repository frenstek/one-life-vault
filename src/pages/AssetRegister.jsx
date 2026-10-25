import { useState, useEffect } from 'react';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiEye,
  HiPencilSquare,
  HiTrash,
  HiCubeTransparent,
  HiWrench,
  HiComputerDesktop,
  HiTruck,
  HiCamera,
  HiXMark,
  HiArrowDownTray,
} from 'react-icons/hi2';
import {
  fetchAssets,
  fetchAssetStats,
  createAsset,
  updateAsset,
  deleteAsset,
  formatDate,
} from '../lib/api';
import {
  PageHeader,
  StatCard,
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
import { SkeletonGrid, SkeletonStatCard } from '../components/ui/Skeleton';
import { exportRegisterPdf } from '../lib/registerPdfExport';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  equipment: 'Equipment',
  furniture: 'Furniture',
  vehicle: 'Vehicle',
  'IT/technology': 'IT / Technology',
  medical: 'Medical',
  kitchen: 'Kitchen',
  office: 'Office',
  maintenance: 'Maintenance',
  other: 'Other',
};

const CONDITION_LABELS = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  decommissioned: 'Decommissioned',
};

const STATUS_LABELS = {
  active: 'Active',
  in_repair: 'In Repair',
  disposed: 'Disposed',
  lost: 'Lost',
};

const CONDITION_COLORS = {
  new: 'success',
  good: 'info',
  fair: 'warning',
  poor: 'danger',
  decommissioned: 'default',
};

const STATUS_COLORS = {
  active: 'success',
  in_repair: 'warning',
  disposed: 'default',
  lost: 'danger',
};

const CATEGORY_FILTERS = ['All', ...Object.keys(CATEGORY_LABELS)];
const STATUS_FILTERS = ['All', 'Active', 'In Repair', 'Disposed', 'Lost'];

// Map display filter labels back to DB status keys
function filterToStatus(filter) {
  const map = {
    Active: 'active',
    'In Repair': 'in_repair',
    Disposed: 'disposed',
    Lost: 'lost',
  };
  return map[filter] || undefined;
}

function filterToCategory(filter) {
  if (filter === 'All') return undefined;
  return filter;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v) {
  if (!v && v !== 0) return '--';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(v);
}

function formatDateShort(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Initial Form ─────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  name: '',
  category: 'equipment',
  description: '',
  serial_number: '',
  asset_tag: '',
  location: '',
  assigned_to: '',
  condition: 'good',
  status: 'active',
  purchase_date: '',
  purchase_price: '',
  supplier: '',
  warranty_expiry: '',
  notes: '',
  imageData: null,
  imagePreview: null,
  image_url: '',
  removeImage: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

// Error boundary wrapper
import { Component } from 'react';
class AssetErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center">
          <p className="text-lg font-bold text-red-600">Asset Register Error</p>
          <p className="mt-2 text-sm text-red-500">{this.state.error.message}</p>
          <pre className="mt-4 text-left text-xs text-slate-500 overflow-auto max-h-48">{this.state.error.stack}</pre>
          <button onClick={() => this.setState({ error: null })} className="mt-4 rounded bg-accent-500 px-4 py-2 text-white text-sm">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AssetRegisterWrapper() {
  return <AssetErrorBoundary><AssetRegisterInner /></AssetErrorBoundary>;
}

function AssetRegisterInner() {
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data Loading ─────────────────────────────────────────────────────────

  function loadData() {
    setLoading(true);
    setError(null);
    const category = filterToCategory(categoryFilter);
    const status = statusFilter === 'All' ? undefined : filterToStatus(statusFilter);
    Promise.all([fetchAssets(category, status), fetchAssetStats()])
      .then(([assetData, statsData]) => {
        setAssets(Array.isArray(assetData) ? assetData : assetData.assets || []);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  // Client-side search filtering
  const filtered = assets.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.name || '').toLowerCase().includes(q) ||
      (a.serial_number || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q) ||
      (a.asset_tag || '').toLowerCase().includes(q)
    );
  });

  // Stats calculations
  const totalAssets = stats?.total || assets.length;
  const activeCount = stats?.active || assets.filter((a) => a.status === 'active').length;
  const inRepairCount =
    stats?.in_repair || assets.filter((a) => a.status === 'in_repair').length;
  const totalValue =
    stats?.total_value ??
    assets.reduce((sum, a) => sum + (parseFloat(a.purchase_price) || 0), 0);

  // ─── Create / Edit Modal ──────────────────────────────────────────────────

  function openFormModal(asset = null) {
    if (asset) {
      setForm({
        name: asset.name || '',
        category: asset.category || 'equipment',
        description: asset.description || '',
        serial_number: asset.serial_number || '',
        asset_tag: asset.asset_tag || '',
        location: asset.location || '',
        assigned_to: asset.assigned_to || '',
        condition: asset.condition || 'good',
        status: asset.status || 'active',
        purchase_date: asset.purchase_date || '',
        purchase_price: asset.purchase_price ?? '',
        supplier: asset.supplier || '',
        warranty_expiry: asset.warranty_expiry || '',
        notes: asset.notes || '',
        image_url: asset.image_url || '',
        imagePreview: asset.image_url || null,
        imageData: null,
        removeImage: false,
      });
      setIsEditing(true);
      setSelectedAsset(asset);
    } else {
      setForm(INITIAL_FORM);
      setIsEditing(false);
      setSelectedAsset(null);
    }
    setFormError(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setForm(INITIAL_FORM);
    setFormError(null);
    setIsEditing(false);
    setSelectedAsset(null);
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, imageData: reader.result, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) return setFormError('Name is required.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        purchase_price: form.purchase_price !== '' ? parseFloat(form.purchase_price) : null,
        purchase_date: form.purchase_date || null,
        warranty_expiry: form.warranty_expiry || null,
      };
      delete payload.imagePreview;
      delete payload.removeImage;
      if (!payload.imageData) delete payload.imageData;
      if (form.removeImage) payload.image_url = null;

      if (isEditing && selectedAsset) {
        await updateAsset(selectedAsset.id, payload);
      } else {
        await createAsset(payload);
      }
      closeFormModal();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── View Modal ───────────────────────────────────────────────────────────

  function openViewModal(asset) {
    setSelectedAsset(asset);
    setViewModalOpen(true);
  }

  function closeViewModal() {
    setViewModalOpen(false);
    setSelectedAsset(null);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteAsset(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Asset Register"
        subtitle="Track and manage organisational assets"
        actions={
          <>
            <button
              onClick={() => exportRegisterPdf({
                title: 'Asset Register',
                columns: ['Name', 'Category', 'Location', 'Condition', 'Status', 'Purchase Date', 'Value'],
                rows: filtered.map((a) => [
                  a.name || '',
                  CATEGORY_LABELS[a.category] || a.category || '',
                  a.location || '',
                  CONDITION_LABELS[a.condition] || a.condition || '',
                  STATUS_LABELS[a.status] || a.status || '',
                  a.purchase_date ? formatDateShort(a.purchase_date) : '',
                  a.purchase_price != null && a.purchase_price !== '' ? `$${Number(a.purchase_price).toLocaleString()}` : '',
                ]),
                filename: 'OLF-Asset-Register.pdf',
              })}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <HiArrowDownTray className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => openFormModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
            >
              <HiPlus className="h-4 w-4" />
              Add Asset
            </button>
          </>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={HiCubeTransparent}
              label="Total Assets"
              value={totalAssets}
              color="bg-blue-50 dark:bg-blue-900/30 text-brand-500"
            />
            <StatCard
              icon={HiComputerDesktop}
              label="Active"
              value={activeCount}
              color="bg-green-50 dark:bg-green-900/30 text-emerald-500"
            />
            <StatCard
              icon={HiWrench}
              label="In Repair"
              value={inRepairCount}
              color="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
            />
            <StatCard
              icon={HiTruck}
              label="Total Value"
              value={formatCurrency(totalValue)}
              color="bg-purple-50 dark:bg-purple-900/30 text-purple-500"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#334766] dark:bg-[#162036] dark:text-white"
          >
            <option value="All">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-[#334766] dark:bg-[#162036] dark:text-white"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'All Statuses' : opt}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#334766] bg-white dark:bg-[#162036] py-2 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Assets Table */}
      {loading ? (
        <SkeletonGrid count={5} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="mt-2 text-sm font-medium text-red-600 underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiCubeTransparent}
          title={
            search || categoryFilter !== 'All' || statusFilter !== 'All'
              ? 'No assets match your filters.'
              : 'No assets recorded yet.'
          }
          description="Use the Add Asset button to register a new asset."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-[#263554] bg-white dark:bg-[#162036] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#263554]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Name
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Condition
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Purchase Date
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Value
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-slate-100 dark:border-[#263554] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {asset.name}
                      </span>
                      {asset.asset_tag && (
                        <span className="ml-2 text-xs font-mono text-slate-400">
                          {asset.asset_tag}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="default">
                        {CATEGORY_LABELS[asset.category] || asset.category || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {asset.location || '--'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={CONDITION_COLORS[asset.condition] || 'default'}>
                        {CONDITION_LABELS[asset.condition] || asset.condition || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_COLORS[asset.status] || 'default'}>
                        {STATUS_LABELS[asset.status] || asset.status || '--'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDateShort(asset.purchase_date)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-medium font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(asset.purchase_price)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(asset)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500"
                          title="View"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(asset)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2d4a] hover:text-slate-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <HiPencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(asset)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                          title="Delete"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Create / Edit Asset Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Asset' : 'Add Asset'}
        icon={HiCubeTransparent}
        iconColor="text-brand-500"
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-6">
              <ModalError message={formError} />

              {/* Row 1: Name (full width) */}
              <FormInput
                label="Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Asset name or description"
              />

              {/* Row 2: Category, Condition */}
              <FormRow>
                <FormSelect
                  label="Category"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Condition"
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                >
                  {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              </FormRow>

              {/* Row 3: Serial Number, Asset Tag */}
              <FormRow>
                <FormInput
                  label="Serial Number"
                  value={form.serial_number}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  placeholder="Manufacturer serial number"
                />
                <FormInput
                  label="Asset Tag"
                  value={form.asset_tag}
                  onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
                  placeholder="Internal asset tag / ID"
                />
              </FormRow>

              {/* Row 4: Location, Assigned To */}
              <FormRow>
                <FormInput
                  label="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Where is the asset located?"
                />
                <FormInput
                  label="Assigned To"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  placeholder="Person or department"
                />
              </FormRow>

              {/* Row 5: Purchase Date, Purchase Price */}
              <FormRow>
                <FormInput
                  label="Purchase Date"
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                />
                <FormInput
                  label="Purchase Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.purchase_price}
                  onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                  placeholder="0.00"
                />
              </FormRow>

              {/* Row 6: Supplier, Warranty Expiry */}
              <FormRow>
                <FormInput
                  label="Supplier"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Supplier or vendor name"
                />
                <FormInput
                  label="Warranty Expiry"
                  type="date"
                  value={form.warranty_expiry}
                  onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                />
              </FormRow>

              {/* Row 7: Description */}
              <FormTextarea
                label="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the asset in detail..."
              />

              {/* Row 8: Notes */}
              <FormTextarea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
              />

              {/* Row 9: Asset Photo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Photo</label>
                {(form.imagePreview || form.image_url) ? (
                  <div className="relative">
                    <img src={form.imagePreview || form.image_url} alt="Asset" className="w-full max-h-48 object-contain rounded-lg border border-slate-200 dark:border-[#334766]" />
                    <button type="button" onClick={() => setForm(prev => ({...prev, imageData: null, imagePreview: null, image_url: null, removeImage: true}))} className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600">
                      <HiXMark className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-[#334766] bg-slate-50 dark:bg-[#0c1425] p-6 hover:bg-slate-100 dark:hover:bg-[#162036] transition-colors">
                    <HiCamera className="h-8 w-8 text-slate-400" />
                    <span className="mt-2 text-sm text-slate-500">Click to upload photo</span>
                    <span className="text-xs text-slate-400">JPG, PNG up to 5MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                )}
              </div>

              {/* Status (edit only) */}
              {isEditing && (
                <FormSelect
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonSecondary onClick={closeFormModal} disabled={saving}>
              Cancel
            </ButtonSecondary>
            <ButtonPrimary type="submit" loading={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Asset' : 'Add Asset'}
            </ButtonPrimary>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── View Asset Modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={selectedAsset ? `Asset: ${selectedAsset.name}` : 'Asset Details'}
        icon={HiEye}
        iconColor="text-brand-500"
        size="xl"
      >
        {selectedAsset && (
          <>
            <ModalBody>
              <div className="space-y-6">
                {selectedAsset.image_url && (
                  <div className="mb-4">
                    <img src={selectedAsset.image_url} alt="Asset" className="w-full max-h-64 object-contain rounded-lg border border-slate-200 dark:border-[#334766]" />
                  </div>
                )}
                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <DetailRow label="Name" value={selectedAsset.name} />
                  <DetailRow label="Category" value={CATEGORY_LABELS[selectedAsset.category] || selectedAsset.category || '--'} />
                  <DetailRow label="Serial Number" value={selectedAsset.serial_number || '--'} mono />
                  <DetailRow label="Asset Tag" value={selectedAsset.asset_tag || '--'} mono />
                  <DetailRow label="Location" value={selectedAsset.location || '--'} />
                  <DetailRow label="Assigned To" value={selectedAsset.assigned_to || '--'} />
                  <DetailRow label="Supplier" value={selectedAsset.supplier || '--'} />
                  <DetailRow label="Purchase Date" value={formatDateShort(selectedAsset.purchase_date)} />
                  <DetailRow label="Purchase Price" value={formatCurrency(selectedAsset.purchase_price)} />
                  <DetailRow label="Warranty Expiry" value={formatDateShort(selectedAsset.warranty_expiry)} />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Condition:</span>
                    <Badge variant={CONDITION_COLORS[selectedAsset.condition] || 'default'}>
                      {CONDITION_LABELS[selectedAsset.condition] || selectedAsset.condition || '--'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Status:</span>
                    <Badge variant={STATUS_COLORS[selectedAsset.status] || 'default'}>
                      {STATUS_LABELS[selectedAsset.status] || selectedAsset.status || '--'}
                    </Badge>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-[#263554]" />

                {/* Description */}
                {selectedAsset.description && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedAsset.description}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedAsset.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedAsset.notes}
                    </p>
                  </div>
                )}

                {/* Disposed/Lost info */}
                {(selectedAsset.status === 'disposed' || selectedAsset.status === 'lost') && (
                  <>
                    <hr className="border-slate-200 dark:border-[#263554]" />
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-[#263554] p-4">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {selectedAsset.status === 'disposed' ? 'Disposed' : 'Lost'}
                      </h4>
                      {selectedAsset.updated_at && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Last updated: {formatDate(selectedAsset.updated_at)}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Timestamps */}
                <hr className="border-slate-200 dark:border-[#263554]" />
                <div className="flex gap-6 text-xs text-slate-400 dark:text-slate-500">
                  {selectedAsset.created_at && (
                    <span>Created: {formatDate(selectedAsset.created_at)}</span>
                  )}
                  {selectedAsset.updated_at && (
                    <span>Updated: {formatDate(selectedAsset.updated_at)}</span>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary onClick={closeViewModal}>
                Close
              </ButtonSecondary>
              <ButtonPrimary onClick={() => { closeViewModal(); openFormModal(selectedAsset); }}>
                Edit Asset
              </ButtonPrimary>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-[#162036] p-8 shadow-xl animate-modal-in border border-transparent dark:border-[#263554]">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <HiTrash className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Asset</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the asset{' '}
              <strong>{deleteConfirm.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 dark:border-[#263554] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2d4a] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : (
                  <>
                    <HiTrash className="h-4 w-4" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail Row (View Modal) ──────────────────────────────────────────────────

function DetailRow({ label, value, children, mono }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {children || (
        <p className={`mt-0.5 text-sm text-slate-800 dark:text-slate-200 ${mono ? 'font-mono font-medium text-brand-500' : ''}`}>
          {value || '--'}
        </p>
      )}
    </div>
  );
}
