export interface PoeClass {
  name: string;
  ascendancies: string[];
}

export const POE1_CLASSES: PoeClass[] = [
  { name: 'Witch', ascendancies: ['Necromancer', 'Elementalist', 'Occultist'] },
  { name: 'Shadow', ascendancies: ['Assassin', 'Saboteur', 'Trickster'] },
  { name: 'Ranger', ascendancies: ['Deadeye', 'Pathfinder', 'Warden'] },
  { name: 'Duelist', ascendancies: ['Slayer', 'Gladiator', 'Champion'] },
  { name: 'Marauder', ascendancies: ['Juggernaut', 'Berserker', 'Chieftain'] },
  { name: 'Templar', ascendancies: ['Inquisitor', 'Hierophant', 'Guardian'] },
  { name: 'Scion', ascendancies: ['Ascendant'] },
];

export const POE2_CLASSES: PoeClass[] = [
  { name: 'Witch', ascendancies: ['Infernalist', 'Blood Mage'] },
  { name: 'Ranger', ascendancies: ['Deadeye', 'Pathfinder'] },
  { name: 'Warrior', ascendancies: ['Titan', 'Warbringer'] },
  { name: 'Mercenary', ascendancies: ['Witchhunter', 'Gemling Legionnaire'] },
  { name: 'Monk', ascendancies: ['Invoker', 'Acolyte of Chayula'] },
  { name: 'Sorceress', ascendancies: ['Stormweaver', 'Chronomancer'] },
];

export const BUILD_TAGS = [
  { value: 'league-starter', label: 'League Starter' },
  { value: 'endgame', label: 'Endgame' },
  { value: 'boss-killer', label: 'Boss Killer' },
  { value: 'speed-farm', label: 'Speed Farm' },
  { value: 'ssf-viable', label: 'SSF Viable' },
  { value: 'hardcore', label: 'Hardcore' },
] as const;

export type BuildTag = (typeof BUILD_TAGS)[number]['value'];

// CDN fallback URLs for ascendancy images from poecdn.com
// Used when no custom image_url is set for a build
const ASCENDANCY_CDN_MAP: Record<string, string> = {
  // PoE 1 — Witch
  Necromancer: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Necromancer.png',
  Elementalist: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Elementalist.png',
  Occultist: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Occultist.png',
  // PoE 1 — Shadow
  Assassin: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Assassin.png',
  Saboteur: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Saboteur.png',
  Trickster: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Trickster.png',
  // PoE 1 — Ranger
  Deadeye: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Deadeye.png',
  Pathfinder: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Pathfinder.png',
  Warden: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Raider.png',
  // PoE 1 — Duelist
  Slayer: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Slayer.png',
  Gladiator: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Gladiator.png',
  Champion: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Champion.png',
  // PoE 1 — Marauder
  Juggernaut: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Juggernaut.png',
  Berserker: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Berserker.png',
  Chieftain: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Chieftain.png',
  // PoE 1 — Templar
  Inquisitor: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Inquisitor.png',
  Hierophant: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Hierophant.png',
  Guardian: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Guardian.png',
  // PoE 1 — Scion
  Ascendant: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Ascendant.png',
  // PoE 2
  Infernalist: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Infernalist.png',
  'Blood Mage': 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/BloodMage.png',
  Titan: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Titan.png',
  Warbringer: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Warbringer.png',
  Witchhunter: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Witchhunter.png',
  'Gemling Legionnaire': 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/GemlingLegionnaire.png',
  Invoker: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Invoker.png',
  'Acolyte of Chayula': 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/AcolyteOfChayula.png',
  Stormweaver: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Stormweaver.png',
  Chronomancer: 'https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Chronomancer.png',
};

export function getAscendancyCdnUrl(ascendancy: string): string | null {
  return ASCENDANCY_CDN_MAP[ascendancy] ?? null;
}

export function getClassesForGameVersion(gameVersion: string): PoeClass[] {
  return gameVersion === 'path-of-exile-2' ? POE2_CLASSES : POE1_CLASSES;
}
