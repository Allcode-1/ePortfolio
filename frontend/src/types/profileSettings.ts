export interface ProfileWorkItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface ProfileEducationItem {
  id: string;
  institution: string;
  profession: string;
  degree: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ProfileSettings {
  nickname: string;
  headline: string;
  city: string;
  birthDate: string;
  about: string;
  keySkills: string[];
  workHistory: ProfileWorkItem[];
  educationHistory: ProfileEducationItem[];
}

export const defaultProfileSettings: ProfileSettings = {
  nickname: '',
  headline: '',
  city: '',
  birthDate: '',
  about: '',
  keySkills: [],
  workHistory: [],
  educationHistory: [],
};
