export type ModuleId = 'profile' | 'projects' | 'skills' | 'contact';

export type PlanetClass = 'rocky' | 'gas-giant';

export interface PlanetData {
  id: ModuleId;
  index: string;
  radius: number;
  speed: number;
  size: number;
  geometryDetail: 0 | 1 | 2;
  planetClass: PlanetClass;
  hasRings?: boolean;
  title: string;
  subtitle: string;
  systemLabel: string;
  color: string;
}

export interface ModuleContent {
  id: ModuleId;
  title: string;
  subtitle: string;
  body: React.ReactNode;
}
