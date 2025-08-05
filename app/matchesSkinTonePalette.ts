import { paletteMap } from './paletteMap';

// Define the type for the item
export interface PaletteItem {
  base_colour?: string;
  colour1?: string;
  colour2?: string;
}

/**
 * Checks if any of the item's colors match the preferred palette for the given skin tone class.
 * @param item - The item with color properties.
 * @param skinToneClass - The skin tone class (0-3).
 * @returns True if any color matches the palette, false otherwise.
 */
export function matchesSkinTonePalette(item: PaletteItem, skinToneClass: number): boolean {
  const preferredColors = paletteMap[skinToneClass] || [];
  return [item.base_colour, item.colour1, item.colour2].some(color =>
    color ? preferredColors.includes(color.toLowerCase()) : false
  );
} 