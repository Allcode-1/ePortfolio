import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
  citySuggestions,
  degreeSuggestions,
  positionSuggestions,
  professionSuggestions,
  skillSuggestions,
  universitySuggestions,
} from '../../constants/suggestions';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import type { ProfileEducationItem, ProfileSettings, ProfileWorkItem } from '../../types/profileSettings';
import { createId } from '../../utils/createId';

type ProfileEditModalProps = {
  onClose: () => void;
};

const emptyWork = (): ProfileWorkItem => ({
  id: createId(),
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
});

const emptyEducation = (): ProfileEducationItem => ({
  id: createId(),
  institution: '',
  profession: '',
  degree: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
});

const suggestionRow = (
  items: string[],
  onPick: (value: string) => void,
) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {items.map((item) => (
      <button key={item} type="button" className="chip-btn" onClick={() => onPick(item)}>
        {item}
      </button>
    ))}
  </div>
);

const ProfileEditModal = ({ onClose }: ProfileEditModalProps) => {
  const { settings, updateSettings } = useProfileSettings();
  const [draft, setDraft] = useState<ProfileSettings>(() => settings);
  const [skillsText, setSkillsText] = useState(() => settings.keySkills.join(', '));

  const handleSave = () => {
    updateSettings({
      ...draft,
      keySkills: skillsText
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0),
    });
    onClose();
  };

  const updateWork = (workId: string, partial: Partial<ProfileWorkItem>) => {
    setDraft((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((item) => (item.id === workId ? { ...item, ...partial } : item)),
    }));
  };

  const updateEducation = (educationId: string, partial: Partial<ProfileEducationItem>) => {
    setDraft((prev) => ({
      ...prev,
      educationHistory: prev.educationHistory.map((item) =>
        item.id === educationId ? { ...item, ...partial } : item,
      ),
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-5">
      <div className="w-full max-w-[1120px] max-h-[90vh] overflow-y-auto surface rounded-soft border border-app shadow-app p-6">
        <header className="flex items-center justify-between gap-3 border-b border-app pb-4">
          <div>
            <h3 className="text-h2 text-main">Edit Profile</h3>
            <p className="text-h5 text-muted mt-1">
              Update personal info, work history and education in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-[14px] border border-app inline-flex items-center justify-center text-muted hover:text-main surface-soft"
          >
            <X size={18} />
          </button>
        </header>

        <section className="mt-5 surface-soft rounded-soft border border-app p-4">
          <h4 className="text-h4 text-main">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="block">
              <span className="text-h5 text-muted">Nickname</span>
              <input
                className="input-modern mt-2"
                value={draft.nickname}
                onChange={(event) => setDraft((prev) => ({ ...prev, nickname: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-h5 text-muted">Headline</span>
              <input
                className="input-modern mt-2"
                value={draft.headline}
                onChange={(event) => setDraft((prev) => ({ ...prev, headline: event.target.value }))}
                placeholder="Backend Middle Developer"
              />
              {suggestionRow(
                professionSuggestions.slice(0, 6),
                (value) => setDraft((prev) => ({ ...prev, headline: value })),
              )}
            </label>
            <label className="block">
              <span className="text-h5 text-muted">City</span>
              <input
                className="input-modern mt-2"
                value={draft.city}
                onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="Astana"
              />
              {suggestionRow(
                citySuggestions.slice(0, 6),
                (value) => setDraft((prev) => ({ ...prev, city: value })),
              )}
            </label>
            <label className="block">
              <span className="text-h5 text-muted">Birth date</span>
              <input
                className="input-modern mt-2"
                type="date"
                value={draft.birthDate}
                onChange={(event) => setDraft((prev) => ({ ...prev, birthDate: event.target.value }))}
              />
            </label>
          </div>

          <label className="block mt-4">
            <span className="text-h5 text-muted">About</span>
            <textarea
              value={draft.about}
              onChange={(event) => setDraft((prev) => ({ ...prev, about: event.target.value }))}
              className="textarea-modern mt-2"
            />
          </label>

          <label className="block mt-4">
            <span className="text-h5 text-muted">Key skills (comma separated)</span>
            <input
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              className="input-modern mt-2"
              placeholder="Java, Spring Boot, PostgreSQL"
            />
            {suggestionRow(skillSuggestions.slice(0, 12), (value) => {
              const current = skillsText
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

              if (!current.includes(value)) {
                setSkillsText([...current, value].join(', '));
              }
            })}
          </label>
        </section>

        <section className="mt-5 surface-soft rounded-soft border border-app p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-h4 text-main">Work Experience</h4>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  workHistory: [...prev.workHistory, emptyWork()],
                }))
              }
              className="h-9 px-3 rounded-[12px] border border-app surface text-h5 text-main inline-flex items-center gap-1"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {draft.workHistory.length === 0 && (
              <p className="text-h5 text-muted">No work experience added yet.</p>
            )}
            {draft.workHistory.map((item) => (
              <article key={item.id} className="rounded-soft border border-app surface p-4 shadow-soft">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input-modern"
                    placeholder="Company"
                    value={item.company}
                    onChange={(event) => updateWork(item.id, { company: event.target.value })}
                  />
                  <input
                    className="input-modern"
                    placeholder="Position"
                    value={item.position}
                    onChange={(event) => updateWork(item.id, { position: event.target.value })}
                  />
                  <input
                    className="input-modern"
                    type="date"
                    value={item.startDate}
                    onChange={(event) => updateWork(item.id, { startDate: event.target.value })}
                  />
                  <input
                    className="input-modern"
                    type="date"
                    disabled={item.isCurrent}
                    value={item.endDate}
                    onChange={(event) => updateWork(item.id, { endDate: event.target.value })}
                  />
                </div>

                {suggestionRow(positionSuggestions.slice(0, 6), (value) =>
                  updateWork(item.id, { position: value }),
                )}

                <div className="mt-3 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-h5 text-main">
                    <input
                      type="checkbox"
                      checked={item.isCurrent}
                      className="accent-[var(--primary)]"
                      onChange={(event) =>
                        updateWork(item.id, {
                          isCurrent: event.target.checked,
                          endDate: event.target.checked ? '' : item.endDate,
                        })
                      }
                    />
                    Current position
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        workHistory: prev.workHistory.filter((entry) => entry.id !== item.id),
                      }))
                    }
                    className="h-9 w-9 rounded-[12px] bg-red-500 text-white inline-flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  className="textarea-modern mt-3 min-h-[80px]"
                  placeholder="Responsibilities, stack, impact"
                  value={item.description}
                  onChange={(event) => updateWork(item.id, { description: event.target.value })}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 surface-soft rounded-soft border border-app p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-h4 text-main">Education</h4>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  educationHistory: [...prev.educationHistory, emptyEducation()],
                }))
              }
              className="h-9 px-3 rounded-[12px] border border-app surface text-h5 text-main inline-flex items-center gap-1"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {draft.educationHistory.length === 0 && (
              <p className="text-h5 text-muted">No education records added yet.</p>
            )}
            {draft.educationHistory.map((item) => (
              <article key={item.id} className="rounded-soft border border-app surface p-4 shadow-soft">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input-modern"
                    placeholder="University"
                    value={item.institution}
                    onChange={(event) => updateEducation(item.id, { institution: event.target.value })}
                  />
                  <input
                    className="input-modern"
                    placeholder="Profession"
                    value={item.profession}
                    onChange={(event) => updateEducation(item.id, { profession: event.target.value })}
                  />
                  <input
                    className="input-modern"
                    placeholder="Degree"
                    value={item.degree}
                    onChange={(event) => updateEducation(item.id, { degree: event.target.value })}
                  />
                  <input
                    className="input-modern"
                    type="date"
                    value={item.startDate}
                    onChange={(event) => updateEducation(item.id, { startDate: event.target.value })}
                  />
                  <input
                    className="input-modern"
                    type="date"
                    disabled={item.isCurrent}
                    value={item.endDate}
                    onChange={(event) => updateEducation(item.id, { endDate: event.target.value })}
                  />
                </div>

                {suggestionRow(universitySuggestions.slice(0, 5), (value) =>
                  updateEducation(item.id, { institution: value }),
                )}
                {suggestionRow(professionSuggestions.slice(0, 5), (value) =>
                  updateEducation(item.id, { profession: value }),
                )}
                {suggestionRow(degreeSuggestions.slice(0, 5), (value) =>
                  updateEducation(item.id, { degree: value }),
                )}

                <div className="mt-3 flex items-center justify-between">
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
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        educationHistory: prev.educationHistory.filter((entry) => entry.id !== item.id),
                      }))
                    }
                    className="h-9 w-9 rounded-[12px] bg-red-500 text-white inline-flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[44px] px-5 rounded-[14px] border border-app text-h5 text-main surface-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-[44px] px-5 rounded-[14px] bg-primary-app text-white text-h5"
          >
            Save profile
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProfileEditModal;
