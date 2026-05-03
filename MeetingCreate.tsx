// src/pages/meetings/MeetingCreate.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function MeetingCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PHYSICAL',
    startTime: '',
    endTime: '',
    location: '',
    latitude: '',
    longitude: '',
    geofenceRadius: 50,
    requireBiometric: false,
    requireGPS: false,
    lateThresholdMin: 15,
    checkInOpenMin: 30,
    checkInCloseMin: 60,
    maxAttendees: '',
    departmentId: '',
    virtualLink: '',
  });

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/meetings', data),
    onSuccess: (res) => {
      toast.success('Meeting created!');
      navigate(`/meetings/${res.data.data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create meeting'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
        : type === 'number' ? (value === '' ? '' : Number(value))
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
      departmentId: form.departmentId || undefined,
      virtualLink: form.virtualLink || undefined,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Create Meeting</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Section title="Basic Information">
          <Field label="Title *">
            <input name="title" value={form.title} onChange={handleChange} required
              placeholder="Team standup, All-hands meeting..." className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder="Optional meeting description..." className={`${inputClass} resize-none`} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type *">
              <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                <option value="PHYSICAL">Physical</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </Field>
            <Field label="Department">
              <select name="departmentId" value={form.departmentId} onChange={handleChange} className={inputClass}>
                <option value="">All departments</option>
                {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Time *">
              <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange}
                required className={inputClass} />
            </Field>
            <Field label="End Time *">
              <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange}
                required className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Late After (min)">
              <input type="number" name="lateThresholdMin" value={form.lateThresholdMin} onChange={handleChange}
                min={0} max={120} className={inputClass} />
            </Field>
            <Field label="Check-in Opens (min before)">
              <input type="number" name="checkInOpenMin" value={form.checkInOpenMin} onChange={handleChange}
                min={0} max={240} className={inputClass} />
            </Field>
            <Field label="Check-in Closes (min after)">
              <input type="number" name="checkInCloseMin" value={form.checkInCloseMin} onChange={handleChange}
                min={0} max={480} className={inputClass} />
            </Field>
          </div>
          <Field label="Max Attendees">
            <input type="number" name="maxAttendees" value={form.maxAttendees} onChange={handleChange}
              placeholder="Unlimited" min={1} className={inputClass} />
          </Field>
        </Section>

        {/* Location (Physical/Hybrid) */}
        {(form.type === 'PHYSICAL' || form.type === 'HYBRID') && (
          <Section title="Location">
            <Field label="Venue / Address">
              <input name="location" value={form.location} onChange={handleChange}
                placeholder="Conference room, building address..." className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude">
                <input type="number" name="latitude" value={form.latitude} onChange={handleChange}
                  placeholder="e.g. 6.5244" step="any" className={inputClass} />
              </Field>
              <Field label="Longitude">
                <input type="number" name="longitude" value={form.longitude} onChange={handleChange}
                  placeholder="e.g. 3.3792" step="any" className={inputClass} />
              </Field>
            </div>
            <Field label={`Geofence Radius: ${form.geofenceRadius}m`}>
              <input type="range" name="geofenceRadius" value={form.geofenceRadius} onChange={handleChange}
                min={10} max={500} step={10}
                className="w-full accent-indigo-500" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10m</span><span>500m</span>
              </div>
            </Field>
          </Section>
        )}

        {/* Virtual link */}
        {(form.type === 'VIRTUAL' || form.type === 'HYBRID') && (
          <Section title="Virtual Meeting">
            <Field label="Meeting Link">
              <input name="virtualLink" value={form.virtualLink} onChange={handleChange}
                placeholder="https://meet.google.com/..." className={inputClass} />
            </Field>
          </Section>
        )}

        {/* Security */}
        <Section title="Security & Validation">
          <div className="space-y-3">
            <Toggle
              label="Require Biometric Verification"
              description="Attendees must verify their face before check-in"
              name="requireBiometric"
              checked={form.requireBiometric}
              onChange={handleChange}
            />
            {(form.type === 'PHYSICAL' || form.type === 'HYBRID') && (
              <Toggle
                label="Require GPS Validation"
                description="Attendees must be within the geofence radius"
                name="requireGPS"
                checked={form.requireGPS}
                onChange={handleChange}
              />
            )}
          </div>
        </Section>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            {mutation.isPending ? 'Creating...' : 'Create Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold text-white text-base">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, description, name, checked, onChange }: any) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-10 h-6 bg-gray-700 peer-checked:bg-indigo-600 rounded-full transition-colors" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </label>
  );
}
