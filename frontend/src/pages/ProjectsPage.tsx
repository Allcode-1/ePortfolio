import { useAuth } from '@clerk/clerk-react';
import {
  ArrowLeft,
  CalendarRange,
  ExternalLink,
  Filter,
  LoaderCircle,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../api/ai';
import { githubApi } from '../api/github';
import { projectsApi } from '../api/projects';
import { useProjects } from '../hooks/useProjects';
import { useI18n } from '../i18n/useI18n';
import type { GithubRepoInfo, Project, ProjectPayload } from '../types/project';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

type ProjectFormState = {
  title: string;
  description: string;
  githubUrl: string;
  liveUrl: string;
  imageUrl: string;
  role: string;
  stackSummary: string;
  projectType: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  pinned: boolean;
};

type SortField = 'title' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const initialFormState: ProjectFormState = {
  title: '',
  description: '',
  githubUrl: '',
  liveUrl: '',
  imageUrl: '',
  role: '',
  stackSummary: '',
  projectType: '',
  status: '',
  startedAt: '',
  finishedAt: '',
  pinned: false,
};

const projectTypeSuggestions = ['Web App', 'Mobile App', 'Backend API', 'AI/ML', 'DevOps', 'Data Engineering'];
const projectStatusSuggestions = ['In progress', 'Completed', 'Paused', 'Archived'];
const projectRoleSuggestions = ['Backend Developer', 'Frontend Developer', 'Fullstack Developer', 'Team Lead', 'Solo Developer'];

const toPayload = (form: ProjectFormState): ProjectPayload => ({
  title: form.title.trim(),
  description: form.description.trim(),
  githubUrl: form.githubUrl.trim() || undefined,
  liveUrl: form.liveUrl.trim() || undefined,
  imageUrl: form.imageUrl.trim() || undefined,
  role: form.role.trim() || undefined,
  stackSummary: form.stackSummary.trim() || undefined,
  projectType: form.projectType.trim() || undefined,
  status: form.status.trim() || undefined,
  startedAt: form.startedAt || undefined,
  finishedAt: form.finishedAt || undefined,
  pinned: form.pinned,
});

const mapProjectToPayload = (project: Project, nextPinned: boolean): ProjectPayload => ({
  title: project.title,
  description: project.description,
  githubUrl: project.githubUrl ?? undefined,
  liveUrl: project.liveUrl ?? undefined,
  imageUrl: project.imageUrl ?? undefined,
  role: project.role ?? undefined,
  stackSummary: project.stackSummary ?? undefined,
  projectType: project.projectType ?? undefined,
  status: project.status ?? undefined,
  startedAt: project.startedAt ?? undefined,
  finishedAt: project.finishedAt ?? undefined,
  pinned: nextPinned,
});

const toTimestamp = (value?: string | null) => {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { language, t } = useI18n();
  const { projects, isLoading, error, reload } = useProjects();

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(initialFormState);
  const [githubInfo, setGithubInfo] = useState<GithubRepoInfo | null>(null);
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pinningId, setPinningId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const availableStatuses = useMemo(() => {
    const all = new Set(projectStatusSuggestions);
    projects.forEach((project) => {
      if (project.status) {
        all.add(project.status);
      }
    });
    return Array.from(all);
  }, [projects]);

  const availableTypes = useMemo(() => {
    const all = new Set(projectTypeSuggestions);
    projects.forEach((project) => {
      if (project.projectType) {
        all.add(project.projectType);
      }
    });
    return Array.from(all);
  }, [projects]);

  const filteredProjects = useMemo(
    () =>
      [...projects]
        .filter((project) => {
          const query = searchQuery.trim().toLowerCase();
          const matchesQuery =
            !query ||
            project.title.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query) ||
            (project.stackSummary ?? '').toLowerCase().includes(query);

          const matchesStatus =
            statusFilter === 'all' ||
            (project.status ?? '').toLowerCase() === statusFilter.toLowerCase();

          const matchesType =
            typeFilter === 'all' ||
            (project.projectType ?? '').toLowerCase() === typeFilter.toLowerCase();

          return matchesQuery && matchesStatus && matchesType;
        })
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }

          if (sortBy === 'title') {
            const left = a.title.toLowerCase();
            const right = b.title.toLowerCase();
            if (left === right) {
              return b.id - a.id;
            }
            return sortOrder === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
          }

          const left = sortBy === 'createdAt' ? toTimestamp(a.createdAt) : toTimestamp(a.updatedAt);
          const right = sortBy === 'createdAt' ? toTimestamp(b.createdAt) : toTimestamp(b.updatedAt);
          if (left === right) {
            return b.id - a.id;
          }
          return sortOrder === 'asc' ? left - right : right - left;
        }),
    [projects, searchQuery, sortBy, sortOrder, statusFilter, typeFilter],
  );

  const handleFetchFromGithub = async () => {
    setActionError(null);
    setSuccessMessage(null);

    if (!form.githubUrl.trim()) {
      setActionError('Enter GitHub URL first.');
      return;
    }

    setIsFetchingGithub(true);
    try {
      const repo = await githubApi.fetchRepo(form.githubUrl, getToken);
      setGithubInfo(repo);
      setForm((prev) => ({
        ...prev,
        title: prev.title || repo.name,
        description: prev.description || repo.description || `Repository ${repo.fullName}`,
        githubUrl: repo.htmlUrl,
        imageUrl: prev.imageUrl || repo.ownerAvatarUrl || '',
        stackSummary: prev.stackSummary || repo.language || '',
      }));
      setSuccessMessage('GitHub data fetched.');
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to fetch GitHub data.'));
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setSuccessMessage(null);

    const payload = toPayload(form);
    if (payload.title.length < 3 || !payload.description) {
      setActionError('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await projectsApi.create(payload, getToken);
      setForm(initialFormState);
      setGithubInfo(null);
      setIsCreating(false);
      setSuccessMessage(t('projects.createSuccess', 'Project added.'));
      await reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to create project.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImproveDescription = async () => {
    const source = form.description.trim();
    if (!source) {
      setActionError('Enter project description first.');
      return;
    }

    setActionError(null);
    setIsImprovingDescription(true);
    try {
      const response = await aiApi.improveProject(
        {
          text: source,
          context: `Project: ${form.title}; Role: ${form.role}; Stack: ${form.stackSummary}; Type: ${form.projectType}; Status: ${form.status}`,
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

  const handleDelete = async (projectId: number) => {
    setActionError(null);
    setSuccessMessage(null);
    setDeletingId(projectId);
    try {
      await projectsApi.remove(projectId, getToken);
      setSuccessMessage('Project deleted.');
      await reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to delete project.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePin = async (project: Project) => {
    setActionError(null);
    setPinningId(project.id);
    try {
      await projectsApi.update(project.id, mapProjectToPayload(project, !project.isPinned), getToken);
      setSuccessMessage(project.isPinned ? 'Project unpinned.' : 'Project pinned.');
      await reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Failed to update project.'));
    } finally {
      setPinningId(null);
    }
  };

  const inputClass = 'input-modern';

  if (isCreating) {
    return (
      <div className="max-w-[1200px] mx-auto px-2 pb-8">
        <section className="surface rounded-soft border border-app shadow-app p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 text-main">Add Project</h2>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="h-[40px] px-4 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              {t('projects.back', 'Back to cards')}
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-h5 text-muted">GitHub URL</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.githubUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, githubUrl: event.target.value }))}
                  placeholder="https://github.com/user/repo"
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Live URL</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.liveUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, liveUrl: event.target.value }))}
                  placeholder="https://yourproject.app"
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Image URL</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Role</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  placeholder="Backend Developer"
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Project type</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.projectType}
                  onChange={(event) => setForm((prev) => ({ ...prev, projectType: event.target.value }))}
                  placeholder="Web App"
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Status</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  placeholder="In progress"
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Start date</span>
                <input
                  type="date"
                  className={`${inputClass} mt-2`}
                  value={form.startedAt}
                  onChange={(event) => setForm((prev) => ({ ...prev, startedAt: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-h5 text-muted">Finish date</span>
                <input
                  type="date"
                  className={`${inputClass} mt-2`}
                  value={form.finishedAt}
                  onChange={(event) => setForm((prev) => ({ ...prev, finishedAt: event.target.value }))}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {projectTypeSuggestions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip-btn"
                  onClick={() => setForm((prev) => ({ ...prev, projectType: value }))}
                >
                  {value}
                </button>
              ))}
              {projectStatusSuggestions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip-btn"
                  onClick={() => setForm((prev) => ({ ...prev, status: value }))}
                >
                  {value}
                </button>
              ))}
              {projectRoleSuggestions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip-btn"
                  onClick={() => setForm((prev) => ({ ...prev, role: value }))}
                >
                  {value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                void handleFetchFromGithub();
              }}
              disabled={isFetchingGithub}
              className="h-[42px] px-4 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-2"
            >
              {isFetchingGithub ? <LoaderCircle size={15} className="animate-spin" /> : <WandSparkles size={15} />}
              Autofill from GitHub
            </button>

            <label className="block">
              <span className="text-h5 text-muted">Project title *</span>
              <input
                className={`${inputClass} mt-2`}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>

            <label className="block">
              <span className="text-h5 text-muted">Stack summary</span>
              <input
                className={`${inputClass} mt-2`}
                value={form.stackSummary}
                onChange={(event) => setForm((prev) => ({ ...prev, stackSummary: event.target.value }))}
                placeholder="Java, Spring Boot, PostgreSQL, React"
              />
            </label>

            <label className="block">
              <span className="text-h5 text-muted">Description *</span>
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
                className="textarea-modern mt-2 min-h-[110px]"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
            </label>

            <label className="inline-flex items-center gap-2 text-h5 text-main">
              <input
                type="checkbox"
                checked={form.pinned}
                className="accent-[var(--primary)]"
                onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
              />
              Pin project after creation
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] px-6 rounded-[14px] bg-primary-app text-white text-h4 inline-flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
              {isSubmitting ? 'Adding project...' : 'Confirm and add project'}
            </button>
          </form>

          {githubInfo && (
            <div className="mt-4 rounded-tile border border-app surface-soft p-3">
              <p className="text-h4 text-main">{githubInfo.fullName}</p>
              <p className="text-h5 text-muted mt-1">
                {githubInfo.language || 'No language'} • {githubInfo.stars} stars • {githubInfo.forks} forks
              </p>
            </div>
          )}

          {actionError && <p className="text-h5 text-red-500 mt-4">{actionError}</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1450px] mx-auto px-2 pb-8">
      <section className="surface rounded-soft border border-app shadow-app p-6">
        <h2 className="text-h2 text-main">Projects</h2>
        <p className="text-h3 text-muted mt-2">Projects with filters, timeline and detail pages.</p>

        {error && <p className="text-h5 text-red-500 mt-3">{error}</p>}
        {actionError && <p className="text-h5 text-red-500 mt-3">{actionError}</p>}
        {successMessage && <p className="text-h5 text-green-600 mt-3">{successMessage}</p>}
        {isLoading && <p className="text-h5 text-muted mt-3">Loading projects...</p>}

        <div className="mt-5 rounded-soft border border-app surface-soft p-4">
          <div className="flex items-center gap-2 text-h5 text-muted">
            <Filter size={15} />
            Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mt-3">
            <label className="block">
              <span className="text-h5 text-muted">Search</span>
              <div className="relative mt-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input-modern pl-9"
                  placeholder="Title, description, stack"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-h5 text-muted">Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-modern mt-2">
                <option value="all">All statuses</option>
                {availableStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-h5 text-muted">Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="input-modern mt-2">
                <option value="all">All types</option>
                {availableTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-h5 text-muted">Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortField)} className="input-modern mt-2">
                <option value="updatedAt">Date updated</option>
                <option value="createdAt">Date added</option>
                <option value="title">Title</option>
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
            className="rounded-soft border-2 border-dashed border-app min-h-[250px] surface-soft flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-primary-app text-white inline-flex items-center justify-center">
              <Plus size={22} />
            </div>
            <p className="text-h4 text-main">Add project</p>
            <p className="text-h5 text-muted">Create project card</p>
          </button>

          {!isLoading && filteredProjects.length === 0 && (
            <article className="rounded-soft border border-app surface-soft min-h-[250px] p-5 flex items-center">
              <p className="text-h4 text-muted">Нет проектов по текущим фильтрам.</p>
            </article>
          )}

          {filteredProjects.map((project) => (
            <article key={project.id} className="rounded-soft border border-app surface-soft p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <p className="text-h4 text-main">{project.title}</p>
                {project.isPinned && (
                  <span className="text-[11px] rounded-full px-2 py-1 bg-primary-app text-white">Pinned</span>
                )}
              </div>

              <p className="text-h5 text-muted mt-2 line-clamp-3">{project.description}</p>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {project.projectType && <span className="chip-btn inline-flex items-center">{project.projectType}</span>}
                {project.status && <span className="chip-btn inline-flex items-center">{project.status}</span>}
                {project.role && <span className="chip-btn inline-flex items-center">{project.role}</span>}
              </div>

              {(project.startedAt || project.finishedAt) && (
                <p className="text-[12px] text-muted mt-3 inline-flex items-center gap-1">
                  <CalendarRange size={13} />
                  {project.startedAt || 'Start'} - {project.finishedAt || 'Present'}
                </p>
              )}

              <p className="text-[12px] text-muted mt-1">
                Added: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'} • Updated:{' '}
                {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '-'}
              </p>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main"
                >
                  Details
                </button>
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1"
                  >
                    <ExternalLink size={14} />
                    GitHub
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1"
                  >
                    <ExternalLink size={14} />
                    Live
                  </a>
                )}
                <button
                  type="button"
                  disabled={pinningId === project.id}
                  onClick={() => {
                    void handleTogglePin(project);
                  }}
                  className="h-[36px] px-3 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-1 disabled:opacity-70"
                >
                  {project.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {project.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  type="button"
                  disabled={deletingId === project.id}
                  onClick={() => {
                    void handleDelete(project.id);
                  }}
                  className="h-[36px] px-3 rounded-[12px] bg-red-500 text-white text-h5 inline-flex items-center gap-1 disabled:opacity-70"
                >
                  {deletingId === project.id ? (
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
      </section>
    </div>
  );
};

export default ProjectsPage;
