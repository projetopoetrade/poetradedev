export interface BloodlineData {
  name: string;
  source: string;
  imageUrl: string;
}

export const bloodlinesData: Record<string, BloodlineData> = {
  'farrul': {
    name: 'Farrul Bloodline',
    source: 'Beast Bosses',
    imageUrl: '/images/bloodlines/farrul-bloodline.webp'
  },
  'lycia': {
    name: 'Lycia Bloodline',
    source: 'Sanctum Bosses',
    imageUrl: '/images/bloodlines/lycia-bloodline.webp'
  },
  'delirious': {
    name: 'Delirious Bloodline',
    source: 'Delirium Bosses',
    imageUrl: '/images/bloodlines/delirious-bloodline.webp'
  },
  'catarina': {
    name: 'Catarina Bloodline',
    source: 'Betrayal Bosses',
    imageUrl: '/images/bloodlines/catarina-bloodline.webp'
  },
  'aul': {
    name: 'Aul Bloodline',
    source: 'Delve Bosses',
    imageUrl: '/images/bloodlines/aul-bloodline.webp'
  },
  'olroth': {
    name: 'Olroth Bloodline',
    source: 'Expedition Bosses',
    imageUrl: '/images/bloodlines/olroth-bloodline.webp'
  }
};
