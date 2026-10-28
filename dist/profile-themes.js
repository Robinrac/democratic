// Original background and clothing palette; subtle portrait variations share one drawing style.
export const PROFILE_THEMES = [
  { name: 'Pink', portrait: { style: 'straight', skin: '#F2C6AE', shadow: '#D69E88', hair: '#713C38' }, shape: 'circles', banner: ['YOUR VOICE.', 'YOUR SPACE.'], avatar: ['#D3AABE', '#682241', '#EA528E'] },
  { name: 'Light blue', portrait: { style: 'swept', skin: '#F4D8C4', shadow: '#DBB69D', hair: '#AE8248' }, shape: 'triangles', banner: ['STAY CURIOUS.', 'KEEP LISTENING.'], avatar: ['#AEC2D3', '#2B5165', '#FFFFFF'] },
  { name: 'Burgundy', portrait: { style: 'waves', skin: '#C98E67', shadow: '#AF7153', hair: '#422C29' }, shape: 'octagons', banner: ['SPEAK UP.', 'MAKE ROOM.'], avatar: ['#D3AABE', '#682241', '#682241'] },
  { name: 'Ocean', portrait: { style: 'coils', skin: '#805139', shadow: '#653C2C', hair: '#241F23' }, shape: 'waves', banner: ['NEW IDEAS.', 'OPEN MINDS.'], avatar: ['#AEC2D3', '#000000', '#2B5165'] },
  { name: 'Sage', portrait: { style: 'curls', skin: '#A36B49', shadow: '#845135', hair: '#332524' }, shape: 'squares', banner: ['ROOM TO GROW.', 'SPACE TO THINK.'], avatar: ['#B0C198', '#2B5113', '#2B5165'] },
  { name: 'Sand', portrait: { style: 'crop', skin: '#D6AA82', shadow: '#BA8B65', hair: '#4C352B' }, shape: 'diamonds', banner: ['SMALL WORDS.', 'BIG IDEAS.'], avatar: ['#D4C394', '#682241', '#682241'] },
  { name: 'Dusty rose', portrait: { style: 'longParted', skin: '#E9B79A', shadow: '#C88E74', hair: '#765633' }, shape: 'starbursts', banner: ['BE YOURSELF.', 'BELONG HERE.'], avatar: ['#D3AABE', '#682241', '#AEC2D3'] }
];
export function isProfileTheme(value) { return Number.isInteger(value) && value >= 0 && value < PROFILE_THEMES.length; }
export function createAppearancePicker() {
  let remaining = [];
  let previous = -1;
  return () => {
    if (!remaining.length) {
      remaining = PROFILE_THEMES.map((_, index) => index);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      // Avoid repeating the last color when a new shuffled set begins.
      if (remaining.at(-1) === previous) [remaining[0], remaining[remaining.length - 1]] = [remaining.at(-1), remaining[0]];
    }
    previous = remaining.pop();
    return { color: previous, cover: previous };
  };
}
