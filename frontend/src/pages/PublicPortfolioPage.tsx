import { Calendar, ExternalLink, Github, GraduationCap, MapPin, Sparkles, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { portfolioApi } from '../api/portfolio';
import type { PortfolioResponse } from '../types/portfolio';
import type { PublicProfileTheme } from '../types/appSettings';
import { bumpAnalytics } from '../utils/analytics';
import { resolvePublicTheme } from '../utils/publicProfile';
import type { ProjectApi } from '../types/project';

const themePalette: Record<PublicProfileTheme, { accent: string; accentSoft: string; ring: string }> = {
  indigo: {
    accent: '#4F46E5',
    accentSoft: 'rgba(79,70,229,0.12)',
    ring: 'rgba(79,70,229,0.26)',
  },
  emerald: {
    accent: '#059669',
    accentSoft: 'rgba(5,150,105,0.14)',
    ring: 'rgba(5,150,105,0.24)',
  },
  slate: {
    accent: '#334155',
    accentSoft: 'rgba(51,65,85,0.14)',
    ring: 'rgba(51,65,85,0.24)',
  },
  sunset: {
    accent: '#EA580C',
    accentSoft: 'rgba(234,88,12,0.14)',
    ring: 'rgba(234,88,12,0.24)',
  },
};

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

const PublicPortfolioPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = resolvePublicTheme(searchParams.get('theme'));
  const palette = themePalette[theme];

  useEffect(() => {
    if (!userId) {
      setError('Public profile not found.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadPortfolio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await portfolioApi.getByUserId(userId);
        if (!isMounted) {
          return;
        }
        setPortfolio(data);
        bumpAnalytics(userId, 'publicViews');
      } catch {
        if (!isMounted) {
          return;
        }
        setError('Failed to load public profile.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPortfolio();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const projects = useMemo(() => portfolio?.projects ?? [], [portfolio?.projects]);
  const certificates = useMemo(() => portfolio?.certificates ?? [], [portfolio?.certificates]);
  const cv = portfolio?.cv;

  if (isLoading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center p-6">
        <div className="surface rounded-soft border border-app shadow-app p-6 text-h4 text-main">
          Loading public profile...
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center p-6">
        <div className="surface rounded-soft border border-app shadow-app p-6">
          <p className="text-h4 text-red-500">{error || 'Public profile unavailable.'}</p>
          <Link to="/info" className="inline-block mt-3 text-h5 text-primary-app">
            Go to info page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg py-8 px-4">
      <div className="max-w-[1280px] mx-auto">
        <section
          className="surface rounded-soft border shadow-app p-7"
          style={{ borderColor: palette.ring }}
        >
          <div
            className="rounded-soft p-6"
            style={{
              background: `linear-gradient(135deg, ${palette.accentSoft}, transparent 62%)`,
            }}
          >
            <p className="text-h5 text-muted uppercase tracking-[0.16em]">Public Portfolio</p>
            <h1 className="text-[34px] leading-[42px] font-bold text-main mt-2">
              {portfolio.fullName || 'Portfolio owner'}
            </h1>
            <p className="text-h4 text-muted mt-2">{portfolio.email || 'No email provided'}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 h-[34px] rounded-full border border-app surface">
              <Sparkles size={14} style={{ color: palette.accent }} />
              <span className="text-h5 text-main">Theme: {theme}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <article className="lg:col-span-2 surface-soft rounded-soft border border-app p-5">
              <h2 className="text-h2 text-main">CV Summary</h2>
              {!cv ? (
                <p className="text-h4 text-muted mt-3">CV is not published yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="rounded-tile border border-app surface p-3">
                      <p className="text-h5 text-muted">Profession</p>
                      <p className="text-h4 text-main mt-1">{cv.profession || 'Not specified'}</p>
                    </div>
                    <div className="rounded-tile border border-app surface p-3">
                      <p className="text-h5 text-muted inline-flex items-center gap-1">
                        <MapPin size={14} />
                        City
                      </p>
                      <p className="text-h4 text-main mt-1">{cv.city || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-h4 text-main">Skills</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(cv.skills ?? []).length === 0 && <p className="text-h5 text-muted">No skills listed.</p>}
                      {(cv.skills ?? []).map((skill) => (
                        <span key={skill} className="chip-btn inline-flex items-center">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-h4 text-main">Experience</p>
                      <div className="space-y-2 mt-2">
                        {(cv.experiences ?? []).length === 0 && (
                          <p className="text-h5 text-muted">No experience listed.</p>
                        )}
                        {(cv.experiences ?? []).map((item, index) => (
                          <article key={`${item.company}-${index}`} className="rounded-tile border border-app surface p-3">
                            <p className="text-h4 text-main">{item.position}</p>
                            <p className="text-h5 text-muted mt-1">{item.company}</p>
                            <p className="text-h5 text-muted mt-1">{item.period || 'Period not specified'}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-h4 text-main inline-flex items-center gap-1">
                        <GraduationCap size={16} />
                        Education
                      </p>
                      <div className="space-y-2 mt-2">
                        {(cv.educations ?? []).length === 0 && (
                          <p className="text-h5 text-muted">No education listed.</p>
                        )}
                        {(cv.educations ?? []).map((item, index) => (
                          <article key={`${item.institution}-${index}`} className="rounded-tile border border-app surface p-3">
                            <p className="text-h4 text-main">{item.institution || 'Institution'}</p>
                            <p className="text-h5 text-muted mt-1">{item.degree || 'Degree not specified'}</p>
                            <p className="text-h5 text-muted mt-1">{item.year || 'Year not specified'}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </article>

            <article className="surface-soft rounded-soft border border-app p-5">
              <h2 className="text-h2 text-main">Portfolio Stats</h2>
              <div className="space-y-3 mt-4">
                <div className="rounded-tile border border-app surface p-3">
                  <p className="text-h5 text-muted">Certificates</p>
                  <p className="text-[32px] leading-[38px] font-bold text-main">{certificates.length}</p>
                </div>
                <div className="rounded-tile border border-app surface p-3">
                  <p className="text-h5 text-muted">Projects</p>
                  <p className="text-[32px] leading-[38px] font-bold text-main">{projects.length}</p>
                </div>
              </div>
            </article>
          </div>

          <section className="mt-6">
            <h2 className="text-h2 text-main">Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {projects.length === 0 && <p className="text-h5 text-muted">No public projects yet.</p>}
              {projects.map((project: ProjectApi) => (
                <article key={project.id} className="rounded-soft border border-app surface-soft p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-h4 text-main">{project.title}</p>
                    {project.githubUrl && <Github size={16} style={{ color: palette.accent }} />}
                  </div>
                  <p className="text-h5 text-muted mt-2 line-clamp-4">{project.description}</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {project.projectType && <span className="chip-btn inline-flex items-center">{project.projectType}</span>}
                    {project.status && <span className="chip-btn inline-flex items-center">{project.status}</span>}
                  </div>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-[34px] px-3 rounded-[10px] border border-app text-h5 text-main inline-flex items-center gap-1"
                      >
                        <ExternalLink size={13} />
                        Repo
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-[34px] px-3 rounded-[10px] border border-app text-h5 text-main inline-flex items-center gap-1"
                      >
                        <ExternalLink size={13} />
                        Live
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-h2 text-main">Certificates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {certificates.length === 0 && <p className="text-h5 text-muted">No public certificates yet.</p>}
              {certificates.map((certificate) => (
                <article key={certificate.id} className="rounded-soft border border-app surface-soft p-4">
                  <p className="text-h4 text-main">{certificate.name}</p>
                  <p className="text-h5 text-muted mt-1">{certificate.issuedBy}</p>
                  <p className="text-h5 text-muted mt-1 inline-flex items-center gap-1">
                    <Calendar size={13} />
                    {formatDate(certificate.issueDate)}
                  </p>
                  {certificate.eventName && (
                    <p className="text-h5 text-main mt-2">{certificate.eventName}</p>
                  )}
                  {certificate.fileUrl && (
                    <a
                      href={certificate.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 h-[34px] px-3 rounded-[10px] border border-app text-h5 text-main inline-flex items-center gap-1"
                    >
                      <ExternalLink size={13} />
                      Open file
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>

          <footer className="mt-7 border-t border-app pt-4 text-h5 text-muted inline-flex items-center gap-2">
            <UserRound size={14} />
            Powered by ePortfolio
          </footer>
        </section>
      </div>
    </div>
  );
};

export default PublicPortfolioPage;
