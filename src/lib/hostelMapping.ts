export const HOSTEL_MAPPING: Record<string, string> = {
  '23BCE8594': 'LH1',
  '23BCE8588': 'LH2',
  '23BCE7417': 'LH3',
  '23BCE7808': 'MH2',
  '23BCE8612': 'MH3',
  '23BCE8585': 'MH5',
};

export const LADIES_HOSTELS = ['LH1', 'LH2', 'LH3'];
export const MENS_HOSTELS = ['MH2', 'MH3', 'MH4', 'MH5', 'MH6'];
export const COMMON_SECTIONS = ['AB1', 'AB2', 'CB', 'Sports', 'Examinations', 'Others'];

export const ALL_CATEGORIES = [
  ...LADIES_HOSTELS,
  ...MENS_HOSTELS,
  ...COMMON_SECTIONS,
];

export function getHostelFromRegNumber(regNumber: string): string | null {
  return HOSTEL_MAPPING[regNumber] || null;
}

export function canAccessCategory(userHostel: string, category: string): boolean {
  return category === userHostel || COMMON_SECTIONS.includes(category);
}
