/**
 * Shape of the GGG skilltree-export `data.json` document (only the fields
 * the renderer uses). Source of truth, pinned per patch via GitHub raw tag.
 */

export interface GggNode {
  skill: number;
  name?: string;
  icon?: string;
  stats?: string[];
  flavourText?: string[];
  reminderText?: string[];
  isNotable?: boolean;
  isKeystone?: boolean;
  isJewelSocket?: boolean;
  isMastery?: boolean;
  isAscendancyStart?: boolean;
  isBlighted?: boolean;
  isProxy?: boolean;
  isMultipleChoice?: boolean;
  isMultipleChoiceOption?: boolean;
  ascendancyName?: string;
  classStartIndex?: number;
  grantedStrength?: number;
  grantedDexterity?: number;
  grantedIntelligence?: number;
  grantedPassivePoints?: number;
  group?: number;
  orbit?: number;
  orbitIndex?: number;
  in?: string[];
  out?: string[];
  recipe?: string[];
  masteryEffects?: Array<{ effect: number; stats: string[]; reminderText?: string[] }>;
  expansionJewel?: { size: number; index: number; proxy: string; parent: string };
}

export interface GggGroup {
  x: number;
  y: number;
  orbits?: number[];
  nodes?: string[];
  isProxy?: boolean;
}

export interface GggSpriteSheet {
  filename: string;
  coords: Record<string, { x: number; y: number; w: number; h: number }>;
}

export interface GggSpriteGroup {
  [zoom: string]: GggSpriteSheet;
}

export interface GggTreeDocument {
  tree?: string;
  classes?: Array<{ name: string; base_str: number; base_dex: number; base_int: number; ascendancies: any[] }>;
  groups: Record<string, GggGroup>;
  nodes: Record<string, GggNode>;
  jewelSlots?: number[];
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  constants: {
    classes: Record<string, number>;
    characterAttributes: Record<string, number>;
    PSSCentreInnerRadius: number;
    skillsPerOrbit: number[];
    orbitRadii: number[];
  };
  sprites: Record<string, GggSpriteGroup>;
  imageZoomLevels: number[];
}

/** Kind classification for rendering / filtering. */
export type PassiveKind =
  | 'small'
  | 'notable'
  | 'keystone'
  | 'ascendancy'
  | 'mastery'
  | 'jewel_socket'
  | 'class_start';

export interface PositionedNode {
  id: number;
  name: string;
  x: number;
  y: number;
  kind: PassiveKind;
  ascendancyName: string | null;
  stats: string[];
  flavourText: string | null;
  isActiveSpec: boolean;
  /** Raw GGG node for sprite lookup. */
  raw: GggNode;
}

export interface Connection {
  a: number;
  b: number;
  /** True when both endpoints share an ascendancy name. */
  isAscendancy: boolean;
  /**
   * Arc metadata — present only when both endpoints sit on the same group
   * + orbit. Renderer draws a curved stroke along the orbit circle instead
   * of a straight chord, matching the in-game look.
   *
   * Angles are in canvas convention (0 = right, CCW-positive).
   */
  arc?: {
    cx: number;
    cy: number;
    radius: number;
    startAngle: number;
    endAngle: number;
    counterclockwise: boolean;
  };
}
