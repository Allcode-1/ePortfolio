import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, Calendar, ExternalLink, Github, Layers3, MonitorPlay } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { bumpAnalytics } from '../utils/analytics';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not specified';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, isLoading, error } = useProjects();

  const numericId = Number(projectId);
  const project = useMemo(
    () => projects.find((item) => item.id === numericId) ?? null,
    [numericId, projects],
  );

  useEffect(() => {
    if (project && user?.id) {
      bumpAnalytics(user.id, 'projectDetailViews');
    }
  }, [project, user?.id]);

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-2 pb-8">
        <section className="surface rounded-soft border border-app shadow-app p-6">
          <p className="text-h4 text-muted">Loading project details...</p>
        </section>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-[1200px] mx-auto px-2 pb-8">
        <section className="surface rounded-soft border border-app shadow-app p-6">
          <p className="text-h4 text-red-500">{error || 'Project not found.'}</p>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="mt-4 h-[40px] px-4 rounded-[12px] border border-app text-h5 text-main"
          >
            Back to projects
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto px-2 pb-8">
      <section className="surface rounded-soft border border-app shadow-app p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-h2 text-main">{project.title}</h2>
            <p className="text-h5 text-muted mt-2">Detailed project page with timeline and metadata.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="h-[40px] px-4 rounded-[12px] border border-app text-h5 text-main inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <article className="lg:col-span-2 surface-soft rounded-soft border border-app p-5">
            <h3 className="text-h4 text-main">Description</h3>
            <p className="text-h4 text-main mt-3 whitespace-pre-wrap">{project.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div className="rounded-tile border border-app surface p-4">
                <p className="text-h5 text-muted inline-flex items-center gap-1">
                  <Layers3 size={14} />
                  Stack summary
                </p>
                <p className="text-h4 text-main mt-2">{project.stackSummary || 'Not specified'}</p>
              </div>
              <div className="rounded-tile border border-app surface p-4">
                <p className="text-h5 text-muted">Role</p>
                <p className="text-h4 text-main mt-2">{project.role || 'Not specified'}</p>
              </div>
              <div className="rounded-tile border border-app surface p-4">
                <p className="text-h5 text-muted">Project type</p>
                <p className="text-h4 text-main mt-2">{project.projectType || 'Not specified'}</p>
              </div>
              <div className="rounded-tile border border-app surface p-4">
                <p className="text-h5 text-muted">Status</p>
                <p className="text-h4 text-main mt-2">{project.status || (project.isPinned ? 'Highlighted' : 'Active')}</p>
              </div>
            </div>
          </article>

          <article className="surface-soft rounded-soft border border-app p-5">
            <h3 className="text-h4 text-main">Links & Timeline</h3>
            <div className="space-y-3 mt-4">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-[40px] px-4 rounded-[12px] border border-app surface inline-flex items-center gap-2 text-h5 text-main w-full"
                >
                  <Github size={15} />
                  Open repository
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-[40px] px-4 rounded-[12px] border border-app surface inline-flex items-center gap-2 text-h5 text-main w-full"
                >
                  <MonitorPlay size={15} />
                  Open live demo
                </a>
              )}
              {!project.githubUrl && !project.liveUrl && (
                <p className="text-h5 text-muted">No external links.</p>
              )}
            </div>

            <div className="mt-5 rounded-tile border border-app surface p-4">
              <p className="text-h5 text-muted inline-flex items-center gap-1">
                <Calendar size={14} />
                Timeline
              </p>
              <p className="text-h4 text-main mt-2">
                {formatDate(project.startedAt)} - {formatDate(project.finishedAt)}
              </p>
              <p className="text-h5 text-muted mt-3">Created: {formatDate(project.createdAt)}</p>
              <p className="text-h5 text-muted mt-1">Updated: {formatDate(project.updatedAt)}</p>
            </div>

            {project.imageUrl && (
              <a
                href={project.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 h-[40px] px-4 rounded-[12px] border border-app surface inline-flex items-center gap-2 text-h5 text-main w-full"
              >
                <ExternalLink size={15} />
                Open cover image
              </a>
            )}
          </article>
        </div>
      </section>
    </div>
  );
};

export default ProjectDetailPage;
