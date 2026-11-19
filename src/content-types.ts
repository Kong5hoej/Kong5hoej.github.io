/* The shape of src/content.ts. TypeScript checks the content against it
   on every build, so a missing field or a typo fails before it goes live. */

/** "YYYY" or "YYYY-MM". */
export type DateString = `${number}` | `${number}-${number}`;

export interface Entry {
  start?: DateString | null;
  /** null means "Present". */
  end: DateString | null;
  /** true shows it in the default "Relevant" view; false only under "All experience". */
  relevant: boolean;
  location?: string;
}

export interface Job extends Entry {
  role: string;
  org: string;
  bullets: string[];
}

export interface Study extends Entry {
  degree: string;
  school: string;
  details: string[];
}

export interface Project {
  name: string;
  year?: string;
  description?: string;
  tags?: string[];
  repo?: string;
  live?: string;
}

export interface Site {
  person: {
    name: string;
    firstName: string;
    initials: string;
    role: string;
    tagline: string;
    location: string;
    email: string;
    phone: string;
    photo: string;
    availability: string;
    links: { github?: string; linkedin?: string; website?: string };
  };
  facts: Record<string, string | number | boolean | (string | number)[]>;
  about: string[];
  pages: {
    projects: { title: string; intro?: string };
    experience: { title: string };
    toolbox: { title: string; intro?: string };
    contact: { title: string; intro?: string };
  };
  projects: Project[];
  skills: { group: string; items: string[] }[];
  cv: {
    summary: string;
    experience: Job[];
    education: Study[];
    sections: { title: string; items: Job[] }[];
    languages: { name: string; level: string }[];
    certifications: { name: string; issuer?: string; year?: string; url?: string }[];
  };
}
