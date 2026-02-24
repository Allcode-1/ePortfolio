export interface Experience {
  id?: number;
  company: string;
  position: string;
  period?: string | null;
}

export interface Education {
  id?: number;
  institution?: string | null;
  degree?: string | null;
  year?: string | null;
}

export interface Cv {
  id: number;
  profession?: string | null;
  expectedSalary?: number | null;
  contactEmail?: string | null;
  phone?: string | null;
  city?: string | null;
  citizenship?: string | null;
  birthDate?: string | null;
  skills?: string[] | null;
  experiences?: Experience[] | null;
  educations?: Education[] | null;
}

export interface CvSavePayload {
  profession?: string;
  city?: string;
  contactEmail?: string;
  phone?: string;
  skills: string[];
  experiences: Experience[];
  educations: Education[];
}
