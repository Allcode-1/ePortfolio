import { useUser } from '@clerk/clerk-react';
import { Calendar, Copy, GraduationCap, MapPin, Pencil, Route, Trophy, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import { useAppSettings } from '../hooks/useAppSettings';
import { useCertificates } from '../hooks/useCertificates';
import { useCv } from '../hooks/useCv';
import { useCvDocuments } from '../hooks/useCvDocuments';
import { useProfileSettings } from '../hooks/useProfileSettings';
import { useProjects } from '../hooks/useProjects';
import { bumpAnalytics } from '../utils/analytics';
import { getPublicProfileLink } from '../utils/publicProfile';

const formatDate = (value: string) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const getAgeText = (birthDate: string) => {
  if (!birthDate) {
    return 'Not set';
  }

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return `${Math.max(age, 0)} years`;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { settings } = useProfileSettings();
  const { settings: appSettings } = useAppSettings();
  const { certificates } = useCertificates();
  const { projects } = useProjects();
  const { cv } = useCv();
  const { documents } = useCvDocuments();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copyState, setCopyState] = useState<string | null>(null);

  const primaryCv = useMemo(() => documents.find((document) => document.isPrimary) ?? null, [documents]);
  const fallbackCvTitle = useMemo(() => {
    if (!cv) {
      return null;
    }

    if (cv.profession) {
      return `${cv.profession} CV`;
    }

    return `${user?.fullName || 'Primary'} CV`;
  }, [cv, user?.fullName]);
  const cvDocumentsCount = documents.length > 0 ? documents.length : cv ? 1 : 0;
  const publicLink = user?.id ? getPublicProfileLink(user.id, appSettings.publicProfileTheme) : '';

  const docs = [
    {
      key: 'certificates',
      title: 'Certificates',
      value: certificates.length,
      button: 'Open certificates',
      onClick: () => navigate('/certificates'),
      icon: Trophy,
    },
    {
      key: 'cv',
      title: 'CV Documents',
      value: cvDocumentsCount,
      button: 'Open CV builder',
      onClick: () => navigate('/cv-builder'),
      icon: Route,
    },
    {
      key: 'projects',
      title: 'Projects',
      value: projects.length,
      button: 'Open projects',
      onClick: () => navigate('/projects'),
      icon: UserRound,
    },
  ];

  return (
    <>
      <div className="max-w-[1450px] mx-auto px-2 pb-8">
        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-12 lg:col-span-5 surface rounded-soft border border-app shadow-app p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-h2 text-main">Profile</h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="h-9 px-3 rounded-[12px] border border-app surface-soft text-h5 text-main inline-flex items-center gap-1 shadow-soft"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/statistics')}
                className="h-8 px-3 rounded-[10px] border border-app surface text-[12px] text-main"
              >
                See statistics
              </button>
              <button
                type="button"
                disabled={!user?.id}
                onClick={() => window.open(publicLink, '_blank', 'noreferrer')}
                className="h-8 px-3 rounded-[10px] border border-app surface text-[12px] text-main disabled:opacity-50"
              >
                Public preview
              </button>
              <button
                type="button"
                disabled={!user?.id}
                onClick={() => {
                  if (!user?.id) {
                    return;
                  }
                  void navigator.clipboard.writeText(publicLink);
                  bumpAnalytics(user.id, 'shareClicks');
                  setCopyState('Public link copied');
                  window.setTimeout(() => setCopyState(null), 1600);
                }}
                className="h-8 px-3 rounded-[10px] border border-app surface text-[12px] text-main inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Copy size={12} />
                Copy link
              </button>
              {copyState && <span className="text-[12px] text-emerald-600">{copyState}</span>}
            </div>

            <div className="flex items-start gap-4 mt-5">
              <img
                src={user?.imageUrl}
                alt=""
                className="w-20 h-20 rounded-[20px] object-cover border border-app surface-soft"
              />
              <div className="min-w-0">
                <p className="text-h2 text-main truncate">{user?.fullName || 'User'}</p>
                <p className="text-h5 text-muted mt-1 truncate">@{settings.nickname || 'nickname'}</p>
                <p className="text-h5 text-muted mt-1 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <article className="surface-soft rounded-tile border border-app px-4 py-3 shadow-soft">
                <p className="text-h5 text-muted inline-flex items-center gap-1">
                  <Calendar size={14} />
                  Birth date
                </p>
                <p className="text-h4 text-main mt-1">{formatDate(settings.birthDate)}</p>
              </article>
              <article className="surface-soft rounded-tile border border-app px-4 py-3 shadow-soft">
                <p className="text-h5 text-muted">Age</p>
                <p className="text-h4 text-main mt-1">{getAgeText(settings.birthDate)}</p>
              </article>
              <article className="surface-soft rounded-tile border border-app px-4 py-3 shadow-soft">
                <p className="text-h5 text-muted inline-flex items-center gap-1">
                  <MapPin size={14} />
                  City
                </p>
                <p className="text-h4 text-main mt-1">{settings.city || 'Not set'}</p>
              </article>
              <article className="surface-soft rounded-tile border border-app px-4 py-3 shadow-soft">
                <p className="text-h5 text-muted">Visibility</p>
                <p className="text-h4 text-main mt-1">
                  {appSettings.accountVisibility === 'public' ? 'Public' : 'Private'}
                </p>
              </article>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-7 surface rounded-soft border border-app shadow-app p-6">
            <h2 className="text-h2 text-main">Work and Education</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
              <article className="surface-soft rounded-soft border border-app p-4">
                <p className="text-h4 text-main">Work Experience</p>
                <div className="mt-3 space-y-3">
                  {settings.workHistory.length === 0 && (
                    <p className="text-h5 text-muted">No work experience yet. Use Edit to add details.</p>
                  )}
                  {settings.workHistory.map((work) => (
                    <div key={work.id} className="rounded-tile border border-app surface px-3 py-3 shadow-soft">
                      <p className="text-h4 text-main">{work.position || 'Position role'}</p>
                      <p className="text-h5 text-muted mt-1">{work.company || 'Company'}</p>
                      <p className="text-h5 text-muted mt-1">
                        {work.startDate || 'Start'} - {work.isCurrent ? 'Present' : work.endDate || 'End'}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="surface-soft rounded-soft border border-app p-4">
                <p className="text-h4 text-main inline-flex items-center gap-1">
                  <GraduationCap size={16} />
                  Education
                </p>
                <div className="mt-3 space-y-3">
                  {settings.educationHistory.length === 0 && (
                    <p className="text-h5 text-muted">No education records yet. Use Edit to add details.</p>
                  )}
                  {settings.educationHistory.map((education) => (
                    <div key={education.id} className="rounded-tile border border-app surface px-3 py-3 shadow-soft">
                      <p className="text-h4 text-main">{education.institution || 'Institution'}</p>
                      <p className="text-h5 text-muted mt-1">
                        {education.profession || 'Profession'} {education.degree ? `• ${education.degree}` : ''}
                      </p>
                      <p className="text-h5 text-muted mt-1">
                        {education.startDate || 'Start'} -{' '}
                        {education.isCurrent ? 'Present' : education.endDate || 'End'}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="mt-4 rounded-soft border border-app surface-soft p-4">
              <p className="text-h5 text-muted">Primary CV</p>
              <p className="text-h4 text-main mt-1">
                {primaryCv
                  ? `${primaryCv.title} (${primaryCv.profession || 'No profession'})`
                  : fallbackCvTitle
                    ? `${fallbackCvTitle} (${cv?.profession || 'No profession'})`
                    : 'No CV selected'}
              </p>
              <p className="text-h5 text-muted mt-1">
                Key skills: {settings.keySkills.length > 0 ? settings.keySkills.join(', ') : 'Not set'}
              </p>
            </div>
          </section>

          <section className="col-span-12 surface rounded-soft border border-app shadow-app p-6">
            <h2 className="text-h2 text-main">Portfolio Documents</h2>
            <p className="text-h3 text-muted mt-2">
              Overview and quick navigation to certificates, CV documents and projects.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {docs.map((item) => (
                <article key={item.key} className="surface-soft rounded-soft border border-app p-5 shadow-soft">
                  <div
                    className="w-9 h-9 rounded-[12px] text-primary-app inline-flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--primary) 16%, transparent)' }}
                  >
                    <item.icon size={18} />
                  </div>
                  <p className="text-[42px] leading-none font-bold text-main mt-4">{item.value}</p>
                  <p className="text-h4 text-main mt-1">{item.title}</p>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="mt-4 h-[40px] px-4 rounded-[12px] border border-app text-h5 text-main"
                  >
                    {item.button}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {isEditOpen && <ProfileEditModal onClose={() => setIsEditOpen(false)} />}
    </>
  );
};

export default DashboardPage;
