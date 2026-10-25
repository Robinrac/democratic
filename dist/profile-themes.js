// CSA palette from the supplied reference. Background, hair and clothing colors.
export const PROFILE_THEMES = [
  { name: 'Pink', avatar: ['#D3AABE', '#682241', '#EA528E'] },
  { name: 'Light blue', avatar: ['#AEC2D3', '#2B5165', '#FFFFFF'] },
  { name: 'Burgundy', avatar: ['#D3AABE', '#682241', '#682241'] },
  { name: 'Ocean', avatar: ['#AEC2D3', '#000000', '#2B5165'] },
  { name: 'Sage', avatar: ['#B0C198', '#2B5113', '#2B5165'] },
  { name: 'Sand', avatar: ['#D4C394', '#682241', '#682241'] },
  { name: 'Dusty rose', avatar: ['#D3AABE', '#682241', '#AEC2D3'] }
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
