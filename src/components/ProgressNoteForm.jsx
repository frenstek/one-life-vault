import { useState, useEffect } from 'react';
import { HiPencilSquare } from 'react-icons/hi2';
import Modal, { ModalBody, ModalFooter, ButtonPrimary, ButtonSecondary, ModalError } from './ui/Modal';
import { FormInput, FormSelect, FormTextarea, FormRow, FormSection, FormDivider } from './ui/FormComponents';
import { toLocalDate } from '../lib/dates';
import { parseShiftTime, composeShiftTime } from '../lib/shiftTime';

const MOODS = ['Happy', 'Content', 'Anxious', 'Agitated', 'Upset', 'Neutral'];
const SLEEP_QUALITIES = ['Good', 'Fair', 'Poor', 'Restless'];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return DAYS[d.getDay()] || '';
}

// Function so note_date/day_of_week are today's when the form opens, not when the module loaded.
const INITIAL_FORM = () => ({
  participant_name: '',
  note_date: toLocalDate(),
  day_of_week: getDayOfWeek(toLocalDate()),
  shift_start: '',
  shift_end: '',
  staff_name: '',
  content: '',
  bsl_reading: '',
  medication_notes: '',
  concerns: '',
  mood: '',
  sleep_quality: '',
  meals: '',
  activities: '',
});

export default function ProgressNoteForm({ isOpen, onClose, onSave, editingNote, participantNames = [] }) {
  const [form, setForm] = useState(INITIAL_FORM);  // lazy initializer
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        setForm({
          participant_name: editingNote.participant_name || '',
          ...parseShiftTime(editingNote.shift),
          note_date: editingNote.note_date || '',
          day_of_week: editingNote.day_of_week || getDayOfWeek(editingNote.note_date),
          staff_name: editingNote.staff_name || '',
          content: editingNote.content || '',
          bsl_reading: editingNote.bsl_reading || '',
          medication_notes: editingNote.medication_notes || '',
          concerns: editingNote.concerns || '',
          mood: editingNote.mood || '',
          sleep_quality: editingNote.sleep_quality || '',
          meals: editingNote.meals || '',
          activities: editingNote.activities || '',
        });
      } else {
        setForm(INITIAL_FORM());
      }
      setError(null);
    }
  }, [isOpen, editingNote]);

  // Auto-fill day of week when date changes
  useEffect(() => {
    if (form.note_date) {
      setForm(prev => ({ ...prev, day_of_week: getDayOfWeek(prev.note_date) }));
    }
  }, [form.note_date]);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.participant_name.trim()) return setError('Participant name is required.');
    if (!form.note_date) return setError('Date is required.');
    if (!form.content.trim()) return setError('Content is required.');
    if (!form.shift_start || !form.shift_end) return setError('Enter the shift start and finish time.');

    setSaving(true);
    try {
      const { shift_start, shift_end, ...rest } = form;
      await onSave({ ...rest, shift: composeShiftTime(shift_start, shift_end) });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingNote ? 'Edit Progress Note' : 'New Progress Note'}
      icon={HiPencilSquare}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <ModalError message={error} />

            {/* Core Details */}
            <FormSection title="Shift Details">
              <FormRow>
                {participantNames.length > 0 ? (
                  <FormSelect
                    label="Participant Name"
                    required
                    value={form.participant_name}
                    onChange={e => handleChange('participant_name', e.target.value)}
                  >
                    <option value="">Select participant...</option>
                    {participantNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </FormSelect>
                ) : (
                  <FormInput
                    label="Participant Name"
                    required
                    type="text"
                    value={form.participant_name}
                    onChange={e => handleChange('participant_name', e.target.value)}
                    placeholder="e.g. John Smith"
                  />
                )}
                <FormInput
                  label="Staff Name"
                  type="text"
                  value={form.staff_name}
                  onChange={e => handleChange('staff_name', e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </FormRow>

              <FormRow cols={4}>
                <FormInput
                  label="Date"
                  required
                  type="date"
                  value={form.note_date}
                  onChange={e => handleChange('note_date', e.target.value)}
                />
                <FormInput
                  label="Shift start"
                  required
                  type="time"
                  value={form.shift_start}
                  onChange={e => handleChange('shift_start', e.target.value)}
                />
                <FormInput
                  label="Shift finish"
                  required
                  type="time"
                  value={form.shift_end}
                  onChange={e => handleChange('shift_end', e.target.value)}
                  hint="Can be the next morning (e.g. 8:00 am)"
                />
                <FormInput
                  label="Day of Week"
                  type="text"
                  value={form.day_of_week}
                  readOnly
                  hint="Auto-filled from date"
                />
              </FormRow>

            </FormSection>

            <FormDivider />

            {/* Main Content */}
            <FormSection title="Progress Note">
              <FormTextarea
                label="Content"
                required
                value={form.content}
                onChange={e => handleChange('content', e.target.value)}
                placeholder="Describe the participant's day, support given, behaviour and observations..."
                rows={6}
              />
            </FormSection>

            <FormDivider />

            {/* Health & Wellbeing */}
            <FormSection title="Health & Wellbeing">
              <FormRow>
                <FormSelect
                  label="Mood"
                  value={form.mood}
                  onChange={e => handleChange('mood', e.target.value)}
                >
                  <option value="">Select mood...</option>
                  {MOODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Sleep Quality"
                  value={form.sleep_quality}
                  onChange={e => handleChange('sleep_quality', e.target.value)}
                >
                  <option value="">Select quality...</option>
                  {SLEEP_QUALITIES.map(sq => (
                    <option key={sq} value={sq}>{sq}</option>
                  ))}
                </FormSelect>
              </FormRow>

              <FormRow>
                <FormInput
                  label="BSL Reading"
                  type="text"
                  value={form.bsl_reading}
                  onChange={e => handleChange('bsl_reading', e.target.value)}
                  placeholder="e.g. 5.4 mmol/L"
                />
                <FormTextarea
                  label="Medication Notes"
                  value={form.medication_notes}
                  onChange={e => handleChange('medication_notes', e.target.value)}
                  placeholder="Any medication-related observations..."
                  rows={2}
                />
              </FormRow>
            </FormSection>

            <FormDivider />

            {/* Daily Activities */}
            <FormSection title="Daily Activities">
              <FormRow>
                <FormTextarea
                  label="Meals"
                  value={form.meals}
                  onChange={e => handleChange('meals', e.target.value)}
                  placeholder="Breakfast, lunch, dinner, snacks..."
                  rows={2}
                />
                <FormTextarea
                  label="Activities"
                  value={form.activities}
                  onChange={e => handleChange('activities', e.target.value)}
                  placeholder="Activities throughout the shift..."
                  rows={2}
                />
              </FormRow>
            </FormSection>

            <FormDivider />

            {/* Concerns */}
            <FormSection title="Concerns">
              <FormTextarea
                label="Concerns"
                value={form.concerns}
                onChange={e => handleChange('concerns', e.target.value)}
                placeholder="Any concerns to flag for the next shift or management..."
                rows={3}
                hint="This will be highlighted if filled in"
              />
            </FormSection>
          </div>
        </ModalBody>

        <ModalFooter>
          <ButtonSecondary onClick={onClose}>Cancel</ButtonSecondary>
          <ButtonPrimary type="submit" loading={saving}>
            {editingNote ? 'Update Note' : 'Save Note'}
          </ButtonPrimary>
        </ModalFooter>
      </form>
    </Modal>
  );
}
