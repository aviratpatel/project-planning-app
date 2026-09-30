import fs from 'fs';
import csv from 'csv-parser';

/**
 * Parses uploaded CSV file and extracts task records cleanly (stripping UTF-8 BOM)
 */
export const parseCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(
        csv({
          // Strip BOM (Byte Order Mark) from column headers
          mapHeaders: ({ header }) => header.replace(/^\ufeff/, '').trim()
        })
      )
      .on('data', (data) => {
        // Case-insensitive key lookup helper
        const getVal = (possibleKeys) => {
          for (const key of Object.keys(data)) {
            const cleanKey = key.trim().toLowerCase();
            if (possibleKeys.includes(cleanKey)) {
              return data[key];
            }
          }
          return null;
        };

        const app = getVal(['application', 'app']) || 'Default App';
        const screen = getVal(['screen']) || 'General';
        const feature = getVal(['feature', 'features']) || 'General Feature';
        const effortStr = getVal(['efforts in days', 'efforts_in_days', 'effort in days', 'effort', 'efforts']) || '0';

        const effortsInDays = parseFloat(effortStr) || 0;

        results.push({
          application: app.trim(),
          screen: screen.trim(),
          feature: feature.trim(),
          effortsInDays: effortsInDays
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Returns the next available workday (Mon-Fri) following a given date
 */
const getNextWorkday = (date) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  return nextDate;
};

/**
 * Adds a specified number of working days (excluding Saturdays and Sundays) to a start date
 */
const addWorkingDays = (startDateInput, days) => {
  let currentDate = new Date(startDateInput);

  // If start date falls on a weekend, shift to the next Monday
  while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const startDate = new Date(currentDate);
  let addedDays = 0;
  // If task takes N working days, it occupies current day plus (N-1) additional working days
  const targetDays = Math.max(1, Math.ceil(days));

  while (addedDays < targetDays - 1) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      addedDays++;
    }
  }

  const endDate = new Date(currentDate);

  return {
    startDate,
    endDate,
    startDateStr: startDate.toISOString().split('T')[0],
    endDateStr: endDate.toISOString().split('T')[0]
  };
};

/**
 * Calculates timeline by assigning each whole feature to a single developer
 */
export const calculateTimeline = (tasks, totalDevelopers = 1, projectStartDateStr = new Date().toISOString().split('T')[0]) => {
  const devs = Math.max(1, parseInt(totalDevelopers, 10) || 1);
  const totalEffortDays = tasks.reduce((sum, task) => sum + task.effortsInDays, 0);

  // Group efforts by Application and Screen
  const breakdownByApp = {};
  tasks.forEach((task) => {
    if (!breakdownByApp[task.application]) {
      breakdownByApp[task.application] = { totalEffort: 0, screens: {} };
    }
    breakdownByApp[task.application].totalEffort += task.effortsInDays;

    if (!breakdownByApp[task.application].screens[task.screen]) {
      breakdownByApp[task.application].screens[task.screen] = { totalEffort: 0, features: [] };
    }
    breakdownByApp[task.application].screens[task.screen].totalEffort += task.effortsInDays;
    breakdownByApp[task.application].screens[task.screen].features.push({
      feature: task.feature,
      effortInDays: task.effortsInDays
    });
  });

  // Track availability date for each developer
  const initialDate = new Date(projectStartDateStr);
  const devAvailableDates = Array.from({ length: devs }, () => new Date(initialDate));

  const schedule = [];

  tasks.forEach((task, index) => {
    // Find developer who becomes available earliest
    let earliestDevIdx = 0;
    for (let i = 1; i < devs; i++) {
      if (devAvailableDates[i] < devAvailableDates[earliestDevIdx]) {
        earliestDevIdx = i;
      }
    }

    const devStartDate = devAvailableDates[earliestDevIdx];
    const { startDate, endDate, startDateStr, endDateStr } = addWorkingDays(devStartDate, task.effortsInDays);

    schedule.push({
      id: index + 1,
      application: task.application,
      screen: task.screen,
      feature: task.feature,
      effortInDays: task.effortsInDays,
      assignedDeveloper: `Developer ${earliestDevIdx + 1}`,
      startDateFormatted: startDateStr,
      endDateFormatted: endDateStr
    });

    // Free date for assigned dev is the next working day after feature completion
    devAvailableDates[earliestDevIdx] = getNextWorkday(endDate);
  });

  // Project end date is the max end date across all assigned features
  const lastEndDate = schedule.reduce((latest, item) => {
    const itemEnd = new Date(item.endDateFormatted);
    return itemEnd > latest ? itemEnd : latest;
  }, new Date(projectStartDateStr));

  const overallRange = addWorkingDays(projectStartDateStr, 1);

  return {
    summary: {
      totalTasks: tasks.length,
      totalEffortDays,
      totalDevelopers: devs,
      projectStartDate: overallRange.startDateStr,
      projectEndDate: lastEndDate.toISOString().split('T')[0]
    },
    breakdownByApp,
    schedule
  };
};