export interface BloodlineData {
  name: string;
  source: string;
  imageUrl: string;
}

export const bloodlinesData: Record<string, BloodlineData> = {
  'farrul': {
    name: 'Farrul Bloodline',
    source: 'Beast Bosses',
    imageUrl: '/images/bloodlines/farrul-bloodline.png'
  },
  'lycia': {
    name: 'Lycia Bloodline',
    source: 'Sanctum Bosses',
    imageUrl: '/images/bloodlines/lycia-bloodline.png'
  },
  'delirious': {
    name: 'Delirious Bloodline',
    source: 'Delirium Bosses',
    imageUrl: '/images/bloodlines/delirious-bloodline.png'
  },
  'catarina': {
    name: 'Catarina Bloodline',
    source: 'Betrayal Bosses',
    imageUrl: '/images/bloodlines/catarina-bloodline.png'
  },
  'aul': {
    name: 'Aul Bloodline',
    source: 'Delve Bosses',
    imageUrl: '/images/bloodlines/aul-bloodline.png'
  },
  'olroth': {
    name: 'Olroth Bloodline',
    source: 'Expedition Bosses',
    imageUrl: '/images/bloodlines/olroth-bloodline.png'
  }
};
