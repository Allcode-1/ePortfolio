import type { SkillLevel } from '../constants/suggestions';

export interface CvSkill {
  id: string;
  name: string;
  level: SkillLevel;
}

export interface CvExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface CvEducationItem {
  id: string;
  institution: string;
  profession: string;
  degree: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface CvDocument {
  id: string;
  title: string;
  profession: string;
  city: string;
  contactEmail: string;
  phone: string;
  skills: CvSkill[];
  experiences: CvExperienceItem[];
  educations: CvEducationItem[];
  createdAt: string;
  updatedAt: string;
  isPrimary: boolean;
}
