import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';

// Extend dayjs with dayOfYear plugin
dayjs.extend(dayOfYear);

/**
 * Calculates True Solar Time (真太阳时)
 * 
 * Logic:
 * 1. Longitude Correction: (Local Longitude - 120) * 4 minutes
 * 2. Equation of Time (EoT): Variations due to Earth's elliptical orbit and axial tilt
 * 
 * @param date - Standard Beijing Time (UTC+8)
 * @param longitude - Local longitude (East is positive, West is negative). Default is 120 (Beijing).
 * @returns Date object representing the True Solar Time
 */
export function calculateTrueSolarTime(date: Date, longitude: number = 120): Date {
  // Validate inputs
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude. Must be between -180 and 180');
  }

  // 1. Longitude difference calculation
  // Beijing Standard Time is based on 120°E
  const deltaLongitude = longitude - 120;
  // 1 degree = 4 minutes
  const deltaTimeMinutes = deltaLongitude * 4;

  // 2. Equation of Time (EoT) calculation
  const d = dayjs(date);
  const n = d.dayOfYear(); // Day of the year (1-366)
  
  // Formula: B = 360 * (n - 81) / 365
  // Note: We need to convert degrees to radians for Math.sin/cos
  const B_degrees = (360 * (n - 81)) / 365;
  const B_radians = (B_degrees * Math.PI) / 180;

  // EoT = 9.87 * sin(2B) - 7.53 * cos(B) - 1.5 * sin(B)
  const eotMinutes = 
    9.87 * Math.sin(2 * B_radians) - 
    7.53 * Math.cos(B_radians) - 
    1.5 * Math.sin(B_radians);

  // 3. Total correction
  const totalCorrectionMinutes = deltaTimeMinutes + eotMinutes;

  // Apply correction
  // Create new date to avoid mutating original
  const correctedDate = new Date(date.getTime() + totalCorrectionMinutes * 60 * 1000);

  return correctedDate;
}

/**
 * Helper: Get Time Index (0-12) from Date
 * 0: Early Zi (00:00-01:00)
 * 1: Chou (01:00-03:00)
 * ...
 * 12: Late Zi (23:00-24:00)
 * 
 * Note: Zi Wei Dou Shu usually treats 23:00-01:00 as Zi hour.
 * However, some systems distinguish Early Zi (0-1) and Late Zi (23-0).
 * iztro expects 0-12.
 * 0: Early Zi (00:00 - 01:00)
 * 1: Chou (01:00 - 03:00)
 * ...
 * 11: Hai (21:00 - 23:00)
 * 12: Late Zi (23:00 - 00:00)
 */
export function getTimeIndexFromDate(date: Date): number {
  const hour = date.getHours();
  
  // Zi Hour: 23:00 - 01:00
  // Early Zi: 00:00 - 01:00 (Index 0)
  // Late Zi: 23:00 - 00:00 (Index 12)
  
  if (hour === 0) return 0; // Early Zi
  if (hour === 23) return 12; // Late Zi
  
  // Other hours:
  // Chou (1): 01-03
  // Yin (2): 03-05
  // ...
  // Calculation: Math.floor((hour + 1) / 2)
  // Example: 01:00 -> (1+1)/2 = 1 (Chou)
  // Example: 02:59 -> (2+1)/2 = 1 (Chou)
  // Example: 03:00 -> (3+1)/2 = 2 (Yin)
  
  return Math.floor((hour + 1) / 2);
}
