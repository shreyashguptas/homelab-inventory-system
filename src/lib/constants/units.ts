// Common measurement units for inventory tracking
export const UNITS = [
  // Count/Quantity
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'units', label: 'Units' },
  { value: 'sets', label: 'Sets' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'dozens', label: 'Dozens' },
  { value: 'packs', label: 'Packs' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'sheets', label: 'Sheets' },
  { value: 'bags', label: 'Bags' },

  // Length
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'km', label: 'Kilometers (km)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'yd', label: 'Yards (yd)' },

  // Weight/Mass
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },

  // Volume
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (L)' },
  { value: 'gal', label: 'Gallons (gal)' },
  { value: 'fl oz', label: 'Fluid Ounces (fl oz)' },
  { value: 'qt', label: 'Quarts (qt)' },
  { value: 'pt', label: 'Pints (pt)' },

  // Area
  { value: 'sq mm', label: 'Square Millimeters (sq mm)' },
  { value: 'sq cm', label: 'Square Centimeters (sq cm)' },
  { value: 'sq m', label: 'Square Meters (sq m)' },
  { value: 'sq in', label: 'Square Inches (sq in)' },
  { value: 'sq ft', label: 'Square Feet (sq ft)' },

  // Electronics
  { value: 'ohms', label: 'Ohms (Ω)' },
  { value: 'kohms', label: 'Kilohms (kΩ)' },
  { value: 'mohms', label: 'Megohms (MΩ)' },
  { value: 'pF', label: 'Picofarads (pF)' },
  { value: 'nF', label: 'Nanofarads (nF)' },
  { value: 'uF', label: 'Microfarads (µF)' },
  { value: 'mF', label: 'Millifarads (mF)' },
  { value: 'uH', label: 'Microhenries (µH)' },
  { value: 'mH', label: 'Millihenries (mH)' },
  { value: 'mA', label: 'Milliamps (mA)' },
  { value: 'A', label: 'Amps (A)' },
  { value: 'V', label: 'Volts (V)' },
  { value: 'mV', label: 'Millivolts (mV)' },
  { value: 'W', label: 'Watts (W)' },
  { value: 'kW', label: 'Kilowatts (kW)' },
  { value: 'mW', label: 'Milliwatts (mW)' },

  // Data/Computing
  { value: 'bytes', label: 'Bytes' },
  { value: 'KB', label: 'Kilobytes (KB)' },
  { value: 'MB', label: 'Megabytes (MB)' },
  { value: 'GB', label: 'Gigabytes (GB)' },
  { value: 'TB', label: 'Terabytes (TB)' },

  // Time
  { value: 'sec', label: 'Seconds' },
  { value: 'min', label: 'Minutes' },
  { value: 'hr', label: 'Hours' },
  { value: 'days', label: 'Days' },

  // Other
  { value: 'spools', label: 'Spools' },
  { value: 'reels', label: 'Reels' },
  { value: 'tubes', label: 'Tubes' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'cans', label: 'Cans' },
  { value: 'cartridges', label: 'Cartridges' },
] as const;

export type UnitValue = typeof UNITS[number]['value'];
