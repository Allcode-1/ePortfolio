import { useAuth, useUser } from '@clerk/clerk-react';
import { ArrowLeft, Download, LoaderCircle, Plus, Star, Trash2, WandSparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { aiApi } from '../api/ai';
import { cvApi } from '../api/cv';
import {
  citySuggestions,
  degreeSuggestions,
  positionSuggestions,
  professionSuggestions,
  skillLevels,
  skillSuggestions,
  universitySuggestions,
  type SkillLevel,
} from '../constants/suggestions';
import { useCv } from '../hooks/useCv';
import { useCvDocuments } from '../hooks/useCvDocuments';
import { useI18n } from '../i18n/useI18n';
import type { CvDocument, CvEducationItem, CvExperienceItem, CvSkill } from '../types/cvDocument';
import { bumpAnalytics } from '../utils/analytics';
import { createId } from '../utils/createId';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

type CvFormState = {
  title: string;
  profession: string;
  city: string;
  contactEmail: string;
  phone: string;
  skills: CvSkill[];
  experiences: CvExperienceItem[];
  educations: CvEducationItem[];
};

const createEmptySkill = (): CvSkill => ({
  id: createId(),
  name: '',
  level: 'Medium',
});

const createEmptyExperience = (): CvExperienceItem => ({
  id: createId(),
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  isCurrent: true,
  description: '',
});

const createEmptyEducation = (): CvEducationItem => ({
  id: createId(),
  institution: '',
  profession: '',
  degree: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
});

const createInitialFormState = (userName?: string | null): CvFormState => ({
  title: userName ? `${userName} CV` : 'New CV',
  profession: '',
  city: '',
  contactEmail: '',
  phone: '',
  skills: [createEmptySkill()],
  experiences: [createEmptyExperience()],
  educations: [createEmptyEducation()],
});

const toPeriod = (startDate: string, endDate: string, isCurrent: boolean) => {
  const start = startDate || 'Start';
  const end = isCurrent ? 'Present' : endDate || 'End';
  return `${start} - ${end}`;
};

const hasSkillData = (skill: CvSkill) => skill.name.trim().length > 0;
const hasExperienceData = (item: CvExperienceItem) => item.company || item.position || item.description;
const hasEducationData = (item: CvEducationItem) => item.institution || item.profession || item.degree;
const quickSkillSuggestions = skillSuggestions.slice(0, 24);
type CvSortField = 'title' | 'createdAt' | 'updatedAt';
type CvSortOrder = 'asc' | 'desc';

const CvBuilderPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { language, t } = useI18n();
  const { cv } = useCv();
  const { documents, addDocument, updateDocument, deleteDocument, setPrimaryDocument } = useCvDocuments();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CvFormState>(createInitialFormState(user?.fullName));
  const [isSaving, setIsSaving] = useState(false);
  const [improvingExperienceId, setImprovingExperienceId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<CvSortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<CvSortOrder>('desc');
  const [compareLeftId, setCompareLeftId] = useState<string>('');
  const [compareRightId, setCompareRightId] = useState<string>('');

  useEffect(() => {
    if (documents.length > 0 || !cv) {
      return;
    }

    const nowIso = new Date().toISOString();
    addDocument({
      id: createId(),
      title: cv.profession ? `${cv.profession} CV` : `${user?.fullName || 'Primary'} CV`,
      profession: cv.profession ?? '',
      city: cv.city ?? '',
      contactEmail: cv.contactEmail ?? '',
      phone: cv.phone ?? '',
      skills:
        cv.skills?.map((skill) => ({
          id: createId(),
          name: skill,
          level: 'Medium',
        })) ?? [],
      experiences:
        cv.experiences?.map((experience) => ({
          id: createId(),
          company: experience.company ?? '',
          position: experience.position ?? '',
          startDate: '',
          endDate: '',
          isCurrent: true,
          description: experience.period ?? '',
        })) ?? [],
      educations:
        cv.educations?.map((education) => ({
          id: createId(),
          institution: education.institution ?? '',
          profession: education.degree ?? '',
          degree: education.year ?? '',
          startDate: '',
          endDate: '',
          isCurrent: false,
        })) ?? [],
      createdAt: nowIso,
      updatedAt: nowIso,
      isPrimary: true,
    });
  }, [addDocument, cv, documents.length, user?.fullName]);

  const primaryDocument = useMemo(
    () => documents.find((document) => document.isPrimary) ?? documents[0] ?? null,
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...documents]
      .filter((document) => {
        if (!query) {
          return true;
        }
        return (
          document.title.toLowerCase().includes(query) ||
          document.profession.toLowerCase().includes(query) ||
          document.city.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
          return a.isPrimary ? -1 : 1;
        }

        if (sortBy === 'title') {
          const left = a.title.toLowerCase();
          const right = b.title.toLowerCase();
          if (left === right) {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }
          return sortOrder === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
        }

        const left = sortBy === 'createdAt' ? new Date(a.createdAt).getTime() : new Date(a.updatedAt).getTime();
        const right = sortBy === 'createdAt' ? new Date(b.createdAt).getTime() : new Date(b.updatedAt).getTime();
        if (left === right) {
          return a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? left - right : right - left;
      });
  }, [documents, searchQuery, sortBy, sortOrder]);

  const compareLeft = filteredDocuments.find((document) => document.id === compareLeftId) ?? null;
  const compareRight = filteredDocuments.find((document) => document.id === compareRightId) ?? null;

  const syncDocumentToBackend = async (document: CvDocument | null) => {
    if (!document) {
      await cvApi.remove(getToken);
      return;
    }

    await cvApi.save(
      {
        profession: document.profession || undefined,
        city: document.city || undefined,
        contactEmail: document.contactEmail || undefined,
        phone: document.phone || undefined,
        skills: document.skills.filter(hasSkillData).map((skill) => skill.name.trim()),
        experiences: document.experiences.filter(hasExperienceData).map((item) => ({
          company: item.company || 'Company',
          position: item.position || 'Position',
          period: toPeriod(item.startDate, item.endDate, item.isCurrent),
        })),
        educations: document.educations.filter(hasEducationData).map((item) => ({
          institution: item.institution || '',
          degree: item.profession || item.degree || '',
          year: toPeriod(item.startDate, item.endDate, item.isCurrent),
        })),
      },
      getToken,
    );
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(createInitialFormState(user?.fullName));
    setIsCreating(true);
    setActionError(null);
  };

  const startEdit = (document: CvDocument) => {
    setEditingId(document.id);
    setForm({
      title: document.title,
      profession: document.profession,
      city: document.city,
      contactEmail: document.contactEmail,
      phone: document.phone,
      skills:
        document.skills.length > 0
          ? document.skills.map((skill) => ({ ...skill }))
          : [createEmptySkill()],
      experiences:
        document.experiences.length > 0
          ? document.experiences.map((item) => ({ ...item }))
          : [createEmptyExperience()],
      educations:
        document.educations.length > 0
          ? document.educations.map((item) => ({ ...item }))
          : [createEmptyEducation()],
    });
    setIsCreating(true);
    setActionError(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    const existingDocument = editingId ? documents.find((document) => document.id === editingId) : null;
    const nowIso = new Date().toISOString();
    const nextDocument: CvDocument = {
      id: editingId ?? createId(),
      title: form.title.trim() || `${user?.fullName || 'User'} CV`,
      profession: form.profession.trim(),
      city: form.city.trim(),
      contactEmail: form.contactEmail.trim(),
      phone: form.phone.trim(),
      skills: form.skills.filter(hasSkillData),
      experiences: form.experiences.filter(hasExperienceData),
      educations: form.educations.filter(hasEducationData),
      createdAt: editingId
        ? existingDocument?.createdAt ?? nowIso
        : nowIso,
      updatedAt: nowIso,
      isPrimary: editingId ? existingDocument?.isPrimary ?? false : true,
    };

    try {
      if (editingId) {
        updateDocument(editingId, nextDocument);
      } else {
        addDocument(nextDocument);
      }

      const cvForBackend =
        editingId && !nextDocument.isPrimary ? primaryDocument : nextDocument;
      await syncDocumentToBackend(cvForBackend);
      setSuccessMessage(t('cv.saveSuccess', 'CV saved and synced to backend.'));
      setIsCreating(false);
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to save CV.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    setActionError(null);
    setSuccessMessage(null);
    setDeletingId(documentId);

    try {
      const nextDocuments = documents.filter((document) => document.id !== documentId);
      const nextPrimary =
        nextDocuments.find((document) => document.isPrimary) ?? nextDocuments[nextDocuments.length - 1] ?? null;

      deleteDocument(documentId);
      await syncDocumentToBackend(nextPrimary);
      setSuccessMessage('CV deleted.');
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to delete CV.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (documentId: string) => {
    setActionError(null);
    setSuccessMessage(null);

    const selected = documents.find((document) => document.id === documentId);
    if (!selected) {
      return;
    }

    try {
      setPrimaryDocument(documentId);
      await syncDocumentToBackend({ ...selected, isPrimary: true, updatedAt: new Date().toISOString() });
      setSuccessMessage('Primary CV updated.');
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to set primary CV.'));
    }
  };

  const updateSkill = (skillId: string, partial: Partial<CvSkill>) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) => (skill.id === skillId ? { ...skill, ...partial } : skill)),
    }));
  };

  const addSkill = () => {
    setForm((prev) => ({ ...prev, skills: [...prev.skills, createEmptySkill()] }));
  };

  const removeSkill = (skillId: string) => {
    setForm((prev) => {
      const next = prev.skills.filter((skill) => skill.id !== skillId);
      return {
        ...prev,
        skills: next.length > 0 ? next : [createEmptySkill()],
      };
    });
  };

  const updateExperience = (experienceId: string, partial: Partial<CvExperienceItem>) => {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.map((item) =>
        item.id === experienceId ? { ...item, ...partial } : item,
      ),
    }));
  };

  const addExperience = () => {
    setForm((prev) => ({ ...prev, experiences: [...prev.experiences, createEmptyExperience()] }));
  };

  const removeExperience = (experienceId: string) => {
    setForm((prev) => {
      const next = prev.experiences.filter((item) => item.id !== experienceId);
      return {
        ...prev,
        experiences: next.length > 0 ? next : [createEmptyExperience()],
      };
    });
  };

  const handleImproveExperienceDescription = async (experience: CvExperienceItem) => {
    const source = experience.description.trim();
    if (!source) {
      setActionError('Add experience description first.');
      return;
    }

    setActionError(null);
    setImprovingExperienceId(experience.id);
    try {
      const response = await aiApi.improveCv(
        {
          text: source,
          context: `CV title: ${form.title}; Profession: ${form.profession}; Company: ${experience.company}; Position: ${experience.position}`,
          language,
        },
        getToken,
      );
      updateExperience(experience.id, { description: response.improvedText });
      setSuccessMessage(response.summary || t('ai.applied', 'AI text applied.'));
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, t('ai.failed', 'Failed to get AI response.')));
    } finally {
      setImprovingExperienceId(null);
    }
  };

  const updateEducation = (educationId: string, partial: Partial<CvEducationItem>) => {
    setForm((prev) => ({
      ...prev,
      educations: prev.educations.map((item) =>
        item.id === educationId ? { ...item, ...partial } : item,
      ),
    }));
  };

  const addEducation = () => {
    setForm((prev) => ({ ...prev, educations: [...prev.educations, createEmptyEducation()] }));
  };

  const removeEducation = (educationId: string) => {
    setForm((prev) => {
      const next = prev.educations.filter((item) => item.id !== educationId);
      return {
        ...prev,
        educations: next.length > 0 ? next : [createEmptyEducation()],
      };
    });
  };

  const handleDownloadPdf = (document: CvDocument) => {
    if (user?.id) {
      bumpAnalytics(user.id, 'cvDownloads');
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    pdf.setFillColor(79, 70, 229);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 30, 4, 4, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text(document.title || 'CV', margin + 4, y + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(
      `${document.profession || 'Profession not set'} • ${document.city || 'City not set'}`,
      margin + 4,
      y + 18,
    );
    pdf.text(
      `${document.contactEmail || 'email@domain.com'} • ${document.phone || '+7 ...'}`,
      margin + 4,
      y + 24,
    );

    y += 38;
    pdf.setTextColor(15, 23, 42);

    const drawSectionTitle = (title: string) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(title, margin, y);
      y += 2;
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y + 1, pageWidth - margin, y + 1);
      y += 7;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
    };

    const ensurePageSpace = (requiredHeight: number) => {
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (y + requiredHeight >= pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    drawSectionTitle('Skills');
    const skillsText =
      document.skills.length > 0
        ? document.skills.map((skill) => `${skill.name} (${skill.level})`).join(', ')
        : 'No skills added.';
    const splitSkills = pdf.splitTextToSize(skillsText, pageWidth - margin * 2);
    ensurePageSpace(splitSkills.length * 6 + 6);
    pdf.text(splitSkills, margin, y);
    y += splitSkills.length * 6 + 6;

    drawSectionTitle('Work Experience');
    if (document.experiences.length === 0) {
      pdf.text('No work experience added.', margin, y);
      y += 6;
    } else {
      document.experiences.forEach((item) => {
        ensurePageSpace(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.position || 'Position'} @ ${item.company || 'Company'}`, margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.text(toPeriod(item.startDate, item.endDate, item.isCurrent), margin, y);
        y += 5;
        if (item.description) {
          const details = pdf.splitTextToSize(item.description, pageWidth - margin * 2);
          ensurePageSpace(details.length * 5 + 2);
          pdf.text(details, margin, y);
          y += details.length * 5 + 2;
        }
        y += 2;
      });
    }

    drawSectionTitle('Education');
    if (document.educations.length === 0) {
      pdf.text('No education added.', margin, y);
      y += 6;
    } else {
      document.educations.forEach((item) => {
        ensurePageSpace(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.institution || 'Institution', margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `${item.profession || 'Profession'}${item.degree ? ` • ${item.degree}` : ''}`,
          margin,
          y,
        );
        y += 5;
        pdf.text(toPeriod(item.startDate, item.endDate, item.isCurrent), margin, y);
        y += 7;
      });
    }

    pdf.save(`${document.title.replace(/\s+/g, '_')}.pdf`);
  };

  const inputClass = 'input-modern';

  if (!isCreating) {
    return (
      <div className="max-w-[1400px] mx-auto px-2 pb-8">
        <section className="surface rounded-soft border border-app shadow-app p-6">
          <h2 className="text-h2 text-main">CV Builder</h2>
          <p className="text-h3 text-muted mt-2">
            Manage multiple CV versions. The latest created CV becomes primary by default.
          </p>

          {successMessage && <p className="text-h5 text-green-600 mt-3">{successMessage}</p>}
          {actionError && <p className="text-h5 text-red-500 mt-3">{actionError}</p>}

          <div className="mt-5 rounded-soft border border-app surface-soft p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-h5 text-muted">Search</span>
                <input
                  className="input-modern mt-2"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Title, profession, city"
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Sort by</span>
                <select className="input-modern mt-2" value={sortBy} onChange={(event) => setSortBy(event.target.value as CvSortField)}>
                  <option value="updatedAt">Date updated</option>
                  <option value="createdAt">Date added</option>
                  <option value="title">Title</option>
                </select>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Order</span>
                <select className="input-modern mt-2" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as CvSortOrder)}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            <button
              type="button"
              onClick={startCreate}
              className="rounded-soft border-2 border-dashed border-app min-h-[220px] surface-soft flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-primary-app text-white inline-flex items-center justify-center">
                <Plus size={22} />
              </div>
              <p className="text-h4 text-main">Create CV</p>
              <p className="text-h5 text-muted">Add new CV version</p>
            </button>

            {filteredDocuments.length === 0 && (
              <article className="rounded-soft border border-app surface-soft min-h-[220px] p-5 flex items-center">
                <p className="text-h4 text-muted">Нет CV по текущим фильтрам.</p>
              </article>
            )}

            {filteredDocuments.map((document) => (
              <article key={document.id} className="rounded-soft border border-app surface-soft p-5 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-h4 text-main">{document.title}</p>
                    <p className="text-h5 text-muted mt-1">
                      {document.profession || 'Profession not set'} • {document.city || 'City not set'}
                    </p>
                  </div>
                  {document.isPrimary && (
                    <span className="text-[11px] rounded-full px-2 py-1 bg-primary-app text-white">Primary</span>
                  )}
                </div>

                <p className="text-h5 text-muted mt-2">
                  Updated: {new Date(document.updatedAt).toLocaleDateString()}
                </p>
                <p className="text-[12px] text-muted mt-1">
                  Added: {new Date(document.createdAt).toLocaleDateString()}
                </p>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => startEdit(document)}
                    className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={document.isPrimary}
                    onClick={() => {
                      void handleSetPrimary(document.id);
                    }}
                    className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <Star size={14} />
                    {document.isPrimary ? 'Primary' : 'Set primary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(document)}
                    className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1"
                  >
                    <Download size={14} />
                    PDF
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === document.id}
                    onClick={() => {
                      void handleDelete(document.id);
                    }}
                    className="h-[36px] px-3 rounded-[12px] bg-red-500 text-white text-h5 inline-flex items-center gap-1 disabled:opacity-70"
                  >
                    {deletingId === document.id ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-6 rounded-soft border border-app surface-soft p-4">
            <h3 className="text-h4 text-main">Before / After CV Compare</h3>
            <p className="text-h5 text-muted mt-1">
              Choose two CV versions to compare content growth.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <label className="block">
                <span className="text-h5 text-muted">Before</span>
                <select
                  className="input-modern mt-2"
                  value={compareLeftId}
                  onChange={(event) => setCompareLeftId(event.target.value)}
                >
                  <option value="">Select CV</option>
                  {filteredDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-h5 text-muted">After</span>
                <select
                  className="input-modern mt-2"
                  value={compareRightId}
                  onChange={(event) => setCompareRightId(event.target.value)}
                >
                  <option value="">Select CV</option>
                  {filteredDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {compareLeft && compareRight && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <article className="rounded-tile border border-app surface p-4">
                  <p className="text-h4 text-main">{compareLeft.title}</p>
                  <p className="text-h5 text-muted mt-2">Skills: {compareLeft.skills.length}</p>
                  <p className="text-h5 text-muted mt-1">Experience: {compareLeft.experiences.length}</p>
                  <p className="text-h5 text-muted mt-1">Education: {compareLeft.educations.length}</p>
                </article>
                <article className="rounded-tile border border-app surface p-4">
                  <p className="text-h4 text-main">{compareRight.title}</p>
                  <p className="text-h5 text-muted mt-2">Skills: {compareRight.skills.length}</p>
                  <p className="text-h5 text-muted mt-1">Experience: {compareRight.experiences.length}</p>
                  <p className="text-h5 text-muted mt-1">Education: {compareRight.educations.length}</p>
                </article>
              </div>
            )}
          </section>

          {primaryDocument && (
            <p className="text-h5 text-muted mt-4">
              Primary CV in profile: <span className="text-main">{primaryDocument.title}</span>
            </p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-2 pb-8">
      <section className="surface rounded-soft border border-app shadow-app p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-main">{editingId ? t('cv.edit', 'Edit CV') : t('cv.create', 'Create CV')}</h2>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="h-[40px] px-4 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            {t('cv.back', 'Back to cards')}
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSave}>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-h5 text-muted">CV title *</span>
              <input
                className={`${inputClass} mt-2`}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>

            <label className="block">
              <span className="text-h5 text-muted">Profession</span>
              <input
                className={`${inputClass} mt-2`}
                value={form.profession}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, profession: event.target.value }))
                }
                placeholder="Backend Middle Developer"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {professionSuggestions.slice(0, 6).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="chip-btn"
                    onClick={() => setForm((prev) => ({ ...prev, profession: value }))}
                  >
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
                placeholder="Astana"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {citySuggestions.slice(0, 6).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="chip-btn"
                    onClick={() => setForm((prev) => ({ ...prev, city: value }))}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="text-h5 text-muted">Contact email</span>
              <input
                className={`${inputClass} mt-2`}
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                }
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-h5 text-muted">Phone</span>
              <input
                className={`${inputClass} mt-2`}
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+7 777 123 45 67"
              />
            </label>
          </section>

          <section className="rounded-soft border border-app surface-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h4 text-main">Skills</h3>
              <button
                type="button"
                onClick={addSkill}
                className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1"
              >
                <Plus size={14} />
                Add skill
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {form.skills.map((skill) => (
                <article key={skill.id} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <input
                    className={`${inputClass} md:col-span-7`}
                    placeholder="Python, Spring Boot, React..."
                    value={skill.name}
                    onChange={(event) => updateSkill(skill.id, { name: event.target.value })}
                  />
                  <select
                    className={`${inputClass} md:col-span-4`}
                    value={skill.level}
                    onChange={(event) =>
                      updateSkill(skill.id, { level: event.target.value as SkillLevel })
                    }
                  >
                    {skillLevels.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="h-[42px] md:col-span-1 rounded-[12px] bg-red-500 text-white inline-flex items-center justify-center"
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {quickSkillSuggestions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    const exists = form.skills.some(
                      (skill) => skill.name.trim().toLowerCase() === value.toLowerCase(),
                    );
                    if (!exists) {
                      setForm((prev) => ({
                        ...prev,
                        skills: [...prev.skills, { id: createId(), name: value, level: 'Medium' }],
                      }));
                    }
                  }}
                >
                  + {value}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-soft border border-app surface-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h4 text-main">Work experience</h3>
              <button
                type="button"
                onClick={addExperience}
                className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1"
              >
                <Plus size={14} />
                Add experience
              </button>
            </div>

            <div className="space-y-4 mt-3">
              {form.experiences.map((item) => (
                <article key={item.id} className="rounded-tile border border-app surface p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className={inputClass}
                      placeholder="Company"
                      value={item.company}
                      onChange={(event) =>
                        updateExperience(item.id, { company: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Position"
                      value={item.position}
                      onChange={(event) =>
                        updateExperience(item.id, { position: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      type="date"
                      value={item.startDate}
                      onChange={(event) =>
                        updateExperience(item.id, { startDate: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      type="date"
                      disabled={item.isCurrent}
                      value={item.endDate}
                      onChange={(event) =>
                        updateExperience(item.id, { endDate: event.target.value })
                      }
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-h5 text-main">
                      <input
                        type="checkbox"
                        checked={item.isCurrent}
                        className="accent-[var(--primary)]"
                        onChange={(event) =>
                          updateExperience(item.id, {
                            isCurrent: event.target.checked,
                            endDate: event.target.checked ? '' : item.endDate,
                          })
                        }
                      />
                      Current position
                    </label>
                    <button
                      type="button"
                      onClick={() => removeExperience(item.id)}
                      className="h-9 w-9 rounded-[12px] bg-red-500 text-white inline-flex items-center justify-center"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      updateExperience(item.id, { description: event.target.value })
                    }
                    placeholder="Responsibilities, stack and results"
                    className="textarea-modern mt-3 min-h-[80px]"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        void handleImproveExperienceDescription(item);
                      }}
                      disabled={improvingExperienceId === item.id}
                      className="h-[34px] px-3 rounded-[10px] border border-app text-h5 text-main inline-flex items-center gap-1 disabled:opacity-60"
                    >
                      {improvingExperienceId === item.id ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <WandSparkles size={14} />
                      )}
                      {improvingExperienceId === item.id
                        ? t('ai.improving', 'AI is improving...')
                        : t('ai.improve', 'Improve with AI')}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {positionSuggestions.slice(0, 6).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="chip-btn"
                        onClick={() => updateExperience(item.id, { position: value })}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-soft border border-app surface-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h4 text-main">Education</h3>
              <button
                type="button"
                onClick={addEducation}
                className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1"
              >
                <Plus size={14} />
                Add education
              </button>
            </div>

            <div className="space-y-4 mt-3">
              {form.educations.map((item) => (
                <article key={item.id} className="rounded-tile border border-app surface p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className={inputClass}
                      placeholder="University"
                      value={item.institution}
                      onChange={(event) =>
                        updateEducation(item.id, { institution: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Profession"
                      value={item.profession}
                      onChange={(event) =>
                        updateEducation(item.id, { profession: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Degree"
                      value={item.degree}
                      onChange={(event) =>
                        updateEducation(item.id, { degree: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      type="date"
                      value={item.startDate}
                      onChange={(event) =>
                        updateEducation(item.id, { startDate: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      type="date"
                      disabled={item.isCurrent}
                      value={item.endDate}
                      onChange={(event) =>
                        updateEducation(item.id, { endDate: event.target.value })
                      }
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-h5 text-main">
                      <input
                        type="checkbox"
                        checked={item.isCurrent}
                        className="accent-[var(--primary)]"
                        onChange={(event) =>
                          updateEducation(item.id, {
                            isCurrent: event.target.checked,
                            endDate: event.target.checked ? '' : item.endDate,
                          })
                        }
                      />
                      Studying now
                    </label>
                    <button
                      type="button"
                      onClick={() => removeEducation(item.id)}
                      className="h-9 w-9 rounded-[12px] bg-red-500 text-white inline-flex items-center justify-center"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {universitySuggestions.slice(0, 4).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="chip-btn"
                        onClick={() => updateEducation(item.id, { institution: value })}
                      >
                        {value}
                      </button>
                    ))}
                    {degreeSuggestions.slice(0, 4).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="chip-btn"
                        onClick={() => updateEducation(item.id, { degree: value })}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="h-[48px] px-6 rounded-[14px] bg-primary-app text-white text-h4 inline-flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}
              {isSaving ? t('cv.saving', 'Saving CV...') : t('cv.save', 'Save CV')}
            </button>

            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="h-[48px] px-6 rounded-[14px] border border-app text-h4 text-main"
            >
              Cancel
            </button>
          </div>

          {successMessage && <p className="text-h5 text-green-600">{successMessage}</p>}
          {actionError && <p className="text-h5 text-red-500">{actionError}</p>}
        </form>
      </section>
    </div>
  );
};

export default CvBuilderPage;
