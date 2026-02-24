import { useClerk, useUser } from '@clerk/clerk-react';
import { ArrowRight, Layers, UserRound, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const techStack = [
  'Java 17, Spring Boot, Spring Security (JWT via Clerk)',
  'PostgreSQL, JPA/Hibernate, REST API',
  'React + TypeScript + Tailwind CSS',
  'Cloudinary for file storage and GitHub API integration',
];

const InfoPage = () => {
  const navigate = useNavigate();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useUser();

  const handleStart = async () => {
    if (isSignedIn) {
      navigate('/dashboard');
      return;
    }

    await openSignIn({ afterSignInUrl: '/dashboard' });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-2 pb-8">
      <section className="surface rounded-soft border border-app shadow-app p-8">
        <header className="rounded-soft border border-app surface-soft p-6">
          <p className="text-h5 text-muted uppercase tracking-[0.16em]">About Project</p>
          <h2 className="text-[32px] leading-[40px] font-bold text-main mt-2">ePortfolio</h2>
          <p className="text-h3 text-muted mt-2 max-w-[960px]">
            ePortfolio is a single workspace where user keeps certificates, builds multiple CV versions,
            manages GitHub-backed projects and controls profile visibility.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <article className="surface-soft rounded-soft border border-app p-6">
            <h3 className="text-h2 text-main inline-flex items-center gap-2">
              <Wrench size={20} />
              Used Technologies
            </h3>
            <ul className="mt-4 space-y-3">
              {techStack.map((item) => (
                <li key={item} className="text-h4 text-main">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-soft rounded-soft border border-app p-6">
            <h3 className="text-h2 text-main inline-flex items-center gap-2">
              <UserRound size={20} />
              Creator
            </h3>
            <p className="text-h4 text-main mt-4">Olzhas</p>
            <p className="text-h5 text-muted mt-2">
              Fullstack developer focused on building clean portfolio products with practical UX and strong
              backend integration.
            </p>
            <div className="mt-5 rounded-tile border border-app surface p-4">
              <p className="text-h5 text-muted">Project focus</p>
              <p className="text-h4 text-main mt-1 inline-flex items-center gap-2">
                <Layers size={16} />
                Certificates, CV Builder, Projects, Profile Dashboard
              </p>
            </div>
          </article>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => {
              void handleStart();
            }}
            className="h-[52px] px-7 rounded-button bg-primary-app text-white text-h4 inline-flex items-center gap-2"
          >
            Get Started
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default InfoPage;
