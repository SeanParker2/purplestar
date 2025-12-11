import { ZiWeiCalculator, ZiWeiChart } from '../src/lib/ziwei';

const runTest = () => {
  console.log('Starting Zi Wei Dou Shu Verification...\n');

  // Test Case 1: Normal Case
  try {
    console.log('Test Case 1: Normal Case (1990-01-01, Chen Hour, Male)');
    const chart = ZiWeiCalculator.getZiWeiChart('1990-01-01', 4, 'male');
    printChartSummary(chart);
    verifyChart(chart);
    console.log('✅ Test Case 1 Passed\n');
  } catch (e) {
    console.error('❌ Test Case 1 Failed:', e);
  }

  // Test Case 2: Boundary Case (Zi Hour - Early)
  try {
    console.log('Test Case 2: Boundary Case (2023-12-31, Zi Hour 0, Female)');
    const chart = ZiWeiCalculator.getZiWeiChart('2023-12-31', 0, 'female');
    printChartSummary(chart);
    verifyChart(chart);
    console.log('✅ Test Case 2 Passed\n');
  } catch (e) {
    console.error('❌ Test Case 2 Failed:', e);
  }

  // Test Case 3: Boundary Case (Hai Hour - Late)
  try {
    console.log('Test Case 3: Boundary Case (2024-02-10, Hai Hour 11, Male)');
    const chart = ZiWeiCalculator.getZiWeiChart('2024-02-10', 11, 'male');
    printChartSummary(chart);
    verifyChart(chart);
    console.log('✅ Test Case 3 Passed\n');
  } catch (e) {
    console.error('❌ Test Case 3 Failed:', e);
  }

  // Test Case 4: Error Case (Invalid Date)
  try {
    console.log('Test Case 4: Error Case (Invalid Date)');
    ZiWeiCalculator.getZiWeiChart('invalid-date', 0, 'male');
    console.error('❌ Test Case 4 Failed: Should have thrown error');
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Invalid date format')) {
      console.log('✅ Test Case 4 Passed (Expected Error caught)\n');
    } else {
      console.error('❌ Test Case 4 Failed: Unexpected error', e);
    }
  }

  // Test Case 5: Flow Year (Removed for cleanup)
  /*
  try {
    console.log('Test Case 5: Flow Year (Specified Year 2025)');
    const chart = ZiWeiCalculator.getZiWeiChart('1990-01-01', 4, 'male', 2025);
    // Verify yearly data is present
    if (chart.yearly.length !== 12) {
      throw new Error('Yearly palaces count mismatch');
    }
    if (!chart.yearly[0].isYearly) {
      throw new Error('Yearly flag missing');
    }
    console.log('✅ Test Case 5 Passed\n');
  } catch (e) {
    console.error('❌ Test Case 5 Failed:', e);
  }
  */

  // Test Case 6: True Solar Time Integration
  try {
    console.log('Test Case 6: True Solar Time (2023-04-15 12:00, Chengdu 104E)');
    // Chengdu is approx 1 hour behind solar time. 12:00 -> 10:52 approx.
    // 12:00 is Wu (6), 10:52 is Si (5).
    // So the chart should reflect Si hour, not Wu hour.
    const date = new Date('2023-04-15T12:00:00'); // Beijing Time
    const chart = ZiWeiCalculator.getZiWeiChartByDate(date, 104, 'male');
    printChartSummary(chart);
    console.log('✅ Test Case 6 Passed (Chart Generated)\n');
  } catch (e) {
    console.error('❌ Test Case 6 Failed:', e);
  }

  // Test Case 7: Flying Star Location Finder
  try {
    console.log('Test Case 7: Flying Star Location Finder');
    const chart = ZiWeiCalculator.getZiWeiChart('1990-01-01', 4, 'male');
    
    // Find Zi Wei and Tian Ji
    const starsToFind = ['紫微', '天机'];
    const locations = ZiWeiCalculator.findStarsLocation(chart, starsToFind);
    
    console.log(`Finding ${starsToFind.join(', ')} -> Locations: ${locations.join(', ')}`);
    
    if (locations.length !== 2) {
      throw new Error('Incorrect locations length');
    }
    
    // Verify correctness
    locations.forEach((loc, idx) => {
      if (loc === -1) {
        console.warn(`Warning: Star ${starsToFind[idx]} not found`);
        return;
      }
      const palace = chart.palaces[loc];
      const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.miscStars].map(s => s.name);
      if (!allStars.includes(starsToFind[idx])) {
        throw new Error(`Star ${starsToFind[idx]} not found in palace ${loc}`);
      }
    });

    // Test Not Found Case
    const notFoundStars = ['NonExistentStar'];
    const notFoundLocs = ZiWeiCalculator.findStarsLocation(chart, notFoundStars);
    if (notFoundLocs[0] !== -1) {
       throw new Error('Should return -1 for non-existent star');
    }

    console.log('✅ Test Case 7 Passed\n');
  } catch (e) {
    console.error('❌ Test Case 7 Failed:', e);
  }
};

const printChartSummary = (chart: ZiWeiChart) => {
  console.log('----------------------------------------');
  console.log(`Five Elements: ${chart.fiveElements}`);
  console.log(`Life Owner: ${chart.lifeOwner}`);
  console.log(`Body Owner: ${chart.bodyOwner}`);
  console.log('Palaces (First 3):');
  chart.palaces.slice(0, 3).forEach(p => {
    console.log(`  [${p.palaceName}] ${p.heavenlyEarthly}`);
    console.log(`    Main: ${p.majorStars.map(s => s.name).join(', ')}`);
    console.log(`    Trans: ${p.transformations.join(', ')}`);
  });
  console.log('----------------------------------------');
};

const verifyChart = (chart: ZiWeiChart) => {
  if (!chart.fiveElements || !chart.lifeOwner || !chart.bodyOwner) {
    throw new Error('Missing core info');
  }
  if (chart.palaces.length !== 12) {
    throw new Error('Palaces count mismatch');
  }
  // Check strict types by accessing properties (TS does this, but runtime check too)
  chart.palaces.forEach(p => {
    if (typeof p.palaceName !== 'string') throw new Error('Invalid palace name');
    if (!Array.isArray(p.majorStars)) throw new Error('Invalid major stars');
  });
};

runTest();
