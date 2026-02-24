import { useAuth, useUser } from '@clerk/clerk-react';
import { ArrowLeft, FileUp, LoaderCircle, Plus, Search, Trash2, WandSparkles } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react';
import { aiApi } from '../api/ai';
import { certificateApi } from '../api/certificates';
import { citySuggestions } from '../constants/suggestions';
import { useCertificates } from '../hooks/useCertificates';
import { useI18n } from '../i18n/useI18n';
import type { Certificate } from '../types/certificate';
import { bumpAnalytics } from '../utils/analytics';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

type CertificateForm = {
  name: string;
  issuedBy: string;
  issueDate: string;
  description: string;
  place: string;
  city: string;
  eventName: string;
  eventType: string;
  importance: string;
};

type SortField = 'name' | 'createdAt' | 'updatedAt' | 'issueDate';
type SortOrder = 'asc' | 'desc';

const initialForm: CertificateForm = {
  name: '',
  issuedBy: '',
  issueDate: '',
  description: '',
  place: '',
  city: '',
  eventName: '',
  eventType: '',
  importance: '',
};

const issuerSuggestions = [
  'Astana Hub',
  'Nazarbayev University',
  'Google Developers Group',
  'Yandex Practicum',
  'Kazakhstan IT University',
];

const eventSuggestions = [
  'Hackathon',
  'Case Championship',
  'Tech Olympiad',
  'Bootcamp Graduation',
  'Programming Contest',
  'Innovation Sprint',
];

const eventTypeSuggestions = ['Hackathon', 'Olympiad', 'Course', 'Bootcamp', 'Competition', 'Internship'];
const placeSuggestions = ['Winner', '1st place', '2nd place', 'Top 10', 'Finalist', 'Participant'];

const certificateNameSuggestions = [
  'Backend Development Certificate',
  'Spring Boot Advanced Course',
  'Machine Learning Fundamentals',
  'React Professional Track',
  'DevOps Essentials',
];

const toDateValue = (certificate: Certificate, field: SortField) => {
  if (field === 'issueDate') {
    return certificate.issueDate ?? '';
  }
  if (field === 'createdAt') {
    return certificate.createdAt ?? '';
  }
  return certificate.updatedAt ?? '';
};

const getYearFromCertificate = (certificate: Certificate) => {
  const source = certificate.issueDate || certificate.createdAt || '';
  if (!source) {
    return '';
  }
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return String(parsed.getFullYear());
};

const CertificatesPage = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { language, t } = useI18n();
  const { certificates, isLoading, error, reload } = useCertificates();

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CertificateForm>(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    certificates.forEach((certificate) => {
      const year = getYearFromCertificate(certificate);
      if (year) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [certificates]);

  const availableEventTypes = useMemo(() => {
    const all = new Set<string>(eventTypeSuggestions);
    certificates.forEach((certificate) => {
      if (certificate.eventType) {
        all.add(certificate.eventType);
      }
    });
    return Array.from(all);
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const eventQuery = eventFilter.trim().toLowerCase();

    const prepared = certificates.filter((certificate) => {
      const matchesQuery =
        !query ||
        certificate.name.toLowerCase().includes(query) ||
        certificate.issuedBy.toLowerCase().includes(query) ||
        (certificate.description ?? '').toLowerCase().includes(query);

      const matchesEventType =
        eventTypeFilter === 'all' ||
        (certificate.eventType ?? '').toLowerCase() === eventTypeFilter.toLowerCase();

      const matchesEventName =
        !eventQuery || (certificate.eventName ?? '').toLowerCase().includes(eventQuery);

      const year = getYearFromCertificate(certificate);
      const matchesYear = yearFilter === 'all' || year === yearFilter;

      return matchesQuery && matchesEventType && matchesEventName && matchesYear;
    });

    return prepared.sort((a, b) => {
      if (sortBy === 'name') {
        const left = a.name.toLowerCase();
        const right = b.name.toLowerCase();
        if (left === right) {
          return b.id - a.id;
        }
        return sortOrder === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      }

      const left = new Date(toDateValue(a, sortBy)).getTime() || 0;
      const right = new Date(toDateValue(b, sortBy)).getTime() || 0;
      if (left === right) {
        return b.id - a.id;
      }
      return sortOrder === 'asc' ? left - right : right - left;
    });
  }, [certificates, eventFilter, eventTypeFilter, searchQuery, sortBy, sortOrder, yearFilter]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setSuccessMessage(null);

    if (!selectedFile) {
      setActionError('Please attach certificate file.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedUrl = await certificateApi.uploadFile(selectedFile, getToken);
      await certificateApi.create(
        {
          name: form.name,
          issuedBy: form.issuedBy,
          imageUrl: uploadedUrl,
          issueDate: form.issueDate || undefined,
          description: form.description || undefined,
          place: form.place || undefined,
          city: form.city || undefined,
          eventName: form.eventName || undefined,
          eventType: form.eventType || undefined,
          importance: form.importance ? Number(form.importance) : undefined,
        },
        getToken,
      );

      setForm(initialForm);
      setSelectedFile(null);
      setIsCreating(false);
      setSuccessMessage(t('certificates.createSuccess', 'Certificate added.'));
      await reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to add certificate.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImproveDescription = async () => {
    const source = form.description.trim();
    if (!source) {
      setActionError('Add description first.');
      return;
    }

    setActionError(null);
    setIsImprovingDescription(true);
    try {
      const response = await aiApi.improveCertificate(
        {
          text: source,
          context: `Certificate: ${form.name}; Issuer: ${form.issuedBy}; Event: ${form.eventName}; City: ${form.city}`,
          language,
        },
        getToken,
      );
      setForm((prev) => ({ ...prev, description: response.improvedText }));
      setSuccessMessage(response.summary || t('ai.applied', 'AI text applied.'));
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, t('ai.failed', 'Failed to get AI response.')));
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const handleDelete = async (certificateId: number) => {
    setActionError(null);
    setSuccessMessage(null);
    setDeletingId(certificateId);

    try {
      await certificateApi.remove(certificateId, getToken);
      setSuccessMessage('Certificate deleted.');
      await reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to delete certificate.'));
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = 'input-modern';

  const applySuggestion = (field: keyof CertificateForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isCreating) {
    return (
      <div className="max-w-[1200px] mx-auto px-2 pb-8">
        <section className="surface rounded-soft border border-app shadow-app p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-h2 text-main">Add Certificate</h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setActionError(null);
              }}
              className="h-[40px] px-4 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              {t('certificates.addBack', 'Back to cards')}
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-h5 text-muted">Certificate name *</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {certificateNameSuggestions.map((value) => (
                    <button key={value} type="button" className="chip-btn" onClick={() => applySuggestion('name', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Issued by *</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.issuedBy}
                  onChange={(event) => setForm((prev) => ({ ...prev, issuedBy: event.target.value }))}
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {issuerSuggestions.map((value) => (
                    <button key={value} type="button" className="chip-btn" onClick={() => applySuggestion('issuedBy', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Issue date</span>
                <input
                  className={`${inputClass} mt-2`}
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, issueDate: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Place achieved</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.place}
                  onChange={(event) => setForm((prev) => ({ ...prev, place: event.target.value }))}
                  placeholder="1st place / Winner / Finalist"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {placeSuggestions.map((value) => (
                    <button key={value} type="button" className="chip-btn" onClick={() => applySuggestion('place', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">City</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.city}
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {citySuggestions.slice(0, 8).map((value) => (
                    <button key={value} type="button" className="chip-btn" onClick={() => applySuggestion('city', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Event</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.eventName}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventName: event.target.value }))}
                  placeholder="Hackathon / Olympiad / Course"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {eventSuggestions.map((value) => (
                    <button key={value} type="button" className="chip-btn" onClick={() => applySuggestion('eventName', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Event type</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.eventType}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventType: event.target.value }))}
                  placeholder="Hackathon / Course / Olympiad"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {eventTypeSuggestions.map((value) => (
                    <button key={value} type="button" className="chip-btn" onClick={() => applySuggestion('eventType', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Importance (0-10)</span>
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min={0}
                  max={10}
                  value={form.importance}
                  onChange={(event) => setForm((prev) => ({ ...prev, importance: event.target.value }))}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-h5 text-muted">Description</span>
              <div className="mt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    void handleImproveDescription();
                  }}
                  disabled={isImprovingDescription}
                  className="h-[34px] px-3 rounded-[10px] border border-app text-h5 text-main inline-flex items-center gap-1 disabled:opacity-60"
                >
                  {isImprovingDescription ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <WandSparkles size={14} />
                  )}
                  {isImprovingDescription
                    ? t('ai.improving', 'AI is improving...')
                    : t('ai.improve', 'Improve with AI')}
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="textarea-modern mt-2"
              />
            </label>

            <label className="block rounded-soft border-2 border-dashed border-app p-5 surface-soft cursor-pointer">
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
              <div className="inline-flex items-center gap-2 text-h4 text-main">
                <FileUp size={18} />
                {selectedFile ? `Attached: ${selectedFile.name}` : 'Click to attach certificate file'}
              </div>
              <p className="text-h5 text-muted mt-2">Supported: image and pdf</p>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] px-6 rounded-[14px] bg-primary-app text-white text-h4 inline-flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}
              {isSubmitting ? 'Saving certificate...' : 'Confirm and add certificate'}
            </button>
          </form>

          {actionError && <p className="text-h5 text-red-500 mt-4">{actionError}</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-2 pb-8">
      <section className="surface rounded-soft border border-app shadow-app p-6">
        <h2 className="text-h2 text-main">Certificates</h2>
        <p className="text-h3 text-muted mt-2">Filter by name, event, type and dates.</p>

        {actionError && <p className="text-h5 text-red-500 mt-3">{actionError}</p>}
        {successMessage && <p className="text-h5 text-green-600 mt-3">{successMessage}</p>}
        {error && <p className="text-h5 text-red-500 mt-3">{error}</p>}
        {isLoading && <p className="text-h5 text-muted mt-3">Loading certificates...</p>}

        <div className="mt-5 rounded-soft border border-app surface-soft p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-h5 text-muted">Search</span>
              <div className="relative mt-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="input-modern pl-9"
                  placeholder="Name, issuer, description"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-h5 text-muted">Event name</span>
              <input
                value={eventFilter}
                onChange={(event) => setEventFilter(event.target.value)}
                className="input-modern mt-2"
                placeholder="Hackathon..."
              />
            </label>
            <label className="block">
              <span className="text-h5 text-muted">Event type</span>
              <select
                value={eventTypeFilter}
                onChange={(event) => setEventTypeFilter(event.target.value)}
                className="input-modern mt-2"
              >
                <option value="all">All types</option>
                {availableEventTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-h5 text-muted">Year</span>
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="input-modern mt-2"
              >
                <option value="all">All years</option>
                {availableYears.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <label className="block">
              <span className="text-h5 text-muted">Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortField)} className="input-modern mt-2">
                <option value="createdAt">Date added</option>
                <option value="updatedAt">Date updated</option>
                <option value="issueDate">Issue date</option>
                <option value="name">Name</option>
              </select>
            </label>
            <label className="block">
              <span className="text-h5 text-muted">Order</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="input-modern mt-2">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-soft border-2 border-dashed border-app min-h-[220px] surface-soft flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-primary-app text-white inline-flex items-center justify-center">
              <Plus size={22} />
            </div>
            <p className="text-h4 text-main">Add certificate</p>
            <p className="text-h5 text-muted">Create a new certificate card</p>
          </button>

          {!isLoading && filteredCertificates.length === 0 && (
            <article className="rounded-soft border border-app surface-soft min-h-[220px] p-5 flex items-center">
              <p className="text-h4 text-muted">Нет сертификатов по текущим фильтрам.</p>
            </article>
          )}

          {filteredCertificates.map((certificate) => (
            <article key={certificate.id} className="rounded-soft border border-app surface-soft p-5 shadow-soft">
              <p className="text-h4 text-main">{certificate.name}</p>
              <p className="text-h5 text-muted mt-1">{certificate.issuedBy}</p>
              {certificate.issueDate && <p className="text-h5 text-muted mt-1">{certificate.issueDate}</p>}
              {certificate.eventName && (
                <p className="text-h5 text-main mt-2">Event: {certificate.eventName}</p>
              )}
              {(certificate.eventType || certificate.city || certificate.place) && (
                <p className="text-h5 text-main mt-1">
                  {certificate.eventType || 'Event'} {certificate.city ? `• ${certificate.city}` : ''}{' '}
                  {certificate.place ? `• ${certificate.place}` : ''}
                </p>
              )}
              {certificate.description && (
                <p className="text-h5 text-muted mt-2 line-clamp-3">{certificate.description}</p>
              )}
              <p className="text-[12px] text-muted mt-3">
                Added: {certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : '-'} • Updated:{' '}
                {certificate.updatedAt ? new Date(certificate.updatedAt).toLocaleDateString() : '-'}
              </p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <a
                  href={certificate.fileUrl || certificate.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    if (user?.id) {
                      bumpAnalytics(user.id, 'certificateFileOpens');
                    }
                  }}
                  className="h-[38px] px-4 rounded-[12px] border border-app text-h5 text-main inline-flex items-center"
                >
                  {t('certificates.openFile', 'Open file')}
                </a>
                <button
                  type="button"
                  disabled={deletingId === certificate.id}
                  onClick={() => {
                    void handleDelete(certificate.id);
                  }}
                  className="h-[38px] px-4 rounded-[12px] bg-red-500 text-white text-h5 inline-flex items-center gap-2 disabled:opacity-70"
                >
                  {deletingId === certificate.id ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CertificatesPage;
