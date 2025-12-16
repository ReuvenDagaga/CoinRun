export const TRACK_LENGTH = 800;
export const SEGMENT_COUNT = 16;
export const SEGMENT_LENGTH = TRACK_LENGTH / SEGMENT_COUNT;
export const TRACK_WIDTH = 10;

export interface TrackTexture {
  name: string;
  color: string;
}

export interface TrackTheme {
  name: string;
  textures: TrackTexture[];
}

export const TRACK_THEMES: TrackTheme[] = [
  {
    name: 'Sunset',
    textures: [
      { name: 'Deep Red', color: '#8B0000' },
      { name: 'Crimson', color: '#DC143C' },
      { name: 'Coral', color: '#FF6B6B' },
      { name: 'Orange Red', color: '#FF4500' },
      { name: 'Sunset Orange', color: '#FF8C42' },
      { name: 'Warm Peach', color: '#FFAB91' },
    ],
  },
  {
    name: 'Ocean',
    textures: [
      { name: 'Deep Sea', color: '#003366' },
      { name: 'Navy', color: '#1A237E' },
      { name: 'Royal Blue', color: '#4169E1' },
      { name: 'Ocean', color: '#006994' },
      { name: 'Turquoise', color: '#40E0D0' },
      { name: 'Aqua', color: '#7FDBFF' },
    ],
  },
  {
    name: 'Forest',
    textures: [
      { name: 'Dark Forest', color: '#1B4332' },
      { name: 'Pine', color: '#2D5A3D' },
      { name: 'Moss', color: '#4A7C59' },
      { name: 'Fern', color: '#6B8E6B' },
      { name: 'Sage', color: '#9DC183' },
      { name: 'Mint', color: '#B8E0C8' },
    ],
  },
  {
    name: 'Royal Purple',
    textures: [
      { name: 'Deep Purple', color: '#2E1A47' },
      { name: 'Indigo', color: '#4B0082' },
      { name: 'Violet', color: '#6B3FA0' },
      { name: 'Amethyst', color: '#9966CC' },
      { name: 'Lavender', color: '#B19CD9' },
      { name: 'Lilac', color: '#DCD0FF' },
    ],
  },
  {
    name: 'Golden Desert',
    textures: [
      { name: 'Bronze', color: '#8B6914' },
      { name: 'Copper', color: '#B87333' },
      { name: 'Gold', color: '#D4AF37' },
      { name: 'Sand', color: '#E6C588' },
      { name: 'Cream', color: '#F5DEB3' },
      { name: 'Pearl', color: '#FFF8DC' },
    ],
  },
  {
    name: 'Arctic',
    textures: [
      { name: 'Glacier', color: '#4A6670' },
      { name: 'Steel Blue', color: '#6B8E9B' },
      { name: 'Ice Blue', color: '#A8D5E5' },
      { name: 'Frost', color: '#D4F1F9' },
      { name: 'Snow', color: '#E8F4F8' },
      { name: 'White Ice', color: '#F5FBFC' },
    ],
  },
  {
    name: 'Volcano',
    textures: [
      { name: 'Obsidian', color: '#1C1C1C' },
      { name: 'Charcoal', color: '#36454F' },
      { name: 'Ash', color: '#5C5C5C' },
      { name: 'Ember', color: '#8B2500' },
      { name: 'Lava', color: '#CF1020' },
      { name: 'Magma', color: '#FF4500' },
    ],
  },
  {
    name: 'Cherry Blossom',
    textures: [
      { name: 'Deep Rose', color: '#8B2252' },
      { name: 'Raspberry', color: '#C54B8C' },
      { name: 'Pink', color: '#E75480' },
      { name: 'Rose', color: '#F4A6C4' },
      { name: 'Blush', color: '#FFB6C1' },
      { name: 'Petal', color: '#FFE4E8' },
    ],
  },
  {
    name: 'Neon Cyber',
    textures: [
      { name: 'Dark Purple', color: '#1A0A2E' },
      { name: 'Neon Pink', color: '#FF00FF' },
      { name: 'Electric Blue', color: '#00FFFF' },
      { name: 'Neon Green', color: '#39FF14' },
      { name: 'Hot Pink', color: '#FF6EC7' },
      { name: 'Laser Yellow', color: '#FFFF00' },
    ],
  },
  {
    name: 'Earth',
    textures: [
      { name: 'Dark Soil', color: '#3D2914' },
      { name: 'Clay', color: '#8B4513' },
      { name: 'Terracotta', color: '#C45C3E' },
      { name: 'Sandstone', color: '#D2B48C' },
      { name: 'Tan', color: '#E8D4B8' },
      { name: 'Cream', color: '#FFF8E7' },
    ],
  },
  {
    name: 'Monochrome',
    textures: [
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Charcoal', color: '#333333' },
      { name: 'Gray', color: '#666666' },
      { name: 'Silver', color: '#999999' },
      { name: 'Light Gray', color: '#CCCCCC' },
      { name: 'White', color: '#F0F0F0' },
    ],
  },
  {
    name: 'Autumn',
    textures: [
      { name: 'Maroon', color: '#5C1A1B' },
      { name: 'Rust', color: '#8B4726' },
      { name: 'Burnt Orange', color: '#CC5500' },
      { name: 'Amber', color: '#E69138' },
      { name: 'Mustard', color: '#E4A010' },
      { name: 'Golden', color: '#F5C242' },
    ],
  },
  {
    name: 'Tropical',
    textures: [
      { name: 'Teal', color: '#008080' },
      { name: 'Turquoise', color: '#30D5C8' },
      { name: 'Lime', color: '#32CD32' },
      { name: 'Mango', color: '#FF8243' },
      { name: 'Coral', color: '#FF6F61' },
      { name: 'Sunny', color: '#FFD93D' },
    ],
  },
  {
    name: 'Gemstone',
    textures: [
      { name: 'Ruby', color: '#9B111E' },
      { name: 'Emerald', color: '#50C878' },
      { name: 'Sapphire', color: '#0F52BA' },
      { name: 'Amethyst', color: '#9966CC' },
      { name: 'Topaz', color: '#FFC87C' },
      { name: 'Diamond', color: '#B9F2FF' },
    ],
  },
  {
    name: 'Midnight',
    textures: [
      { name: 'Void', color: '#0D0D1A' },
      { name: 'Midnight', color: '#191970' },
      { name: 'Dark Blue', color: '#00008B' },
      { name: 'Deep Purple', color: '#301934' },
      { name: 'Starlight', color: '#4A4A6A' },
      { name: 'Moonlight', color: '#7B7BA0' },
    ],
  },
];

export const COLORS = {
  trackEdge: '#FF6B35',
  grass: '#7CFC00',
  darkGrass: '#228B22',
  finishLine: '#22c55e',
  pole: '#8B4513',
  gold: '#FFD700',
  markerWhite: '#ffffff',
  markerDark: '#333333',
} as const;

export const MARKER_COUNT = 8;
