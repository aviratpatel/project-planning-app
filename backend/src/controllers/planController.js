import fs from 'fs';
import ExcelJS from 'exceljs';
import { parseCsvFile, calculateTimeline } from '../services/plannerService.js';

export const processPlan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a CSV file.' });
    }

    const totalDevelopers = req.body.totalDevelopers || 1;
    const startDate = req.body.startDate || new Date().toISOString().split('T')[0];

    const tasks = await parseCsvFile(req.file.path);

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to clean up uploaded file:', err);
    });

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or formatted incorrectly.' });
    }

    const planResult = calculateTimeline(tasks, totalDevelopers, startDate);
    return res.status(200).json(planResult);
  } catch (error) {
    console.error('Error processing plan:', error);
    return res.status(500).json({ error: 'Server error processing CSV file.' });
  }
};

export const exportExcelPlan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a CSV file.' });
    }

    const totalDevelopers = req.body.totalDevelopers || 1;
    const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
    const tasks = await parseCsvFile(req.file.path);

    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to clean up uploaded file:', err);
    });

    const plan = calculateTimeline(tasks, totalDevelopers, startDate);

    const workbook = new ExcelJS.Workbook();

    // Palette Colors
    const primaryNavy = '1F4E78';
    const taskGanttFill = '2F5597'; // Color for feature-level tasks
    const appGanttFill = '206095';  // Color for application summary bars
    const weekendFill = 'F2F2F2';  // Grey shade for weekends

    // 1. Generate array of all calendar dates from project start to end
    const startDateObj = new Date(plan.summary.projectStartDate);
    const endDateObj = new Date(plan.summary.projectEndDate);
    const timelineDates = [];

    let curDate = new Date(startDateObj);
    while (curDate <= endDateObj) {
      timelineDates.push(new Date(curDate));
      curDate.setDate(curDate.getDate() + 1);
    }

    // ==========================================
    // WORKSHEET 1: Feature Detailed Gantt Chart
    // ==========================================
    const ws1 = workbook.addWorksheet('Feature Detailed Gantt');
    ws1.views = [{ showGridLines: true }];

    // Title Block
    ws1.mergeCells('A1:H1');
    const titleCell1 = ws1.getCell('A1');
    titleCell1.value = 'FEATURE-LEVEL DEVELOPMENT GANTT CHART';
    titleCell1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryNavy } };
    titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Summary Details
    ws1.getCell('A3').value = 'Total Workload (Days):';
    ws1.getCell('B3').value = plan.summary.totalEffortDays;
    ws1.getCell('A4').value = 'Total Developers:';
    ws1.getCell('B4').value = plan.summary.totalDevelopers;
    ws1.getCell('A5').value = 'Project Start Date:';
    ws1.getCell('B5').value = plan.summary.projectStartDate;
    ws1.getCell('A6').value = 'Target End Date:';
    ws1.getCell('B6').value = plan.summary.projectEndDate;

    ['A3', 'A4', 'A5', 'A6'].forEach((cell) => {
      ws1.getCell(cell).font = { bold: true };
    });

    // Headers
    const headers1 = ['ID', 'Application', 'Screen', 'Feature', 'Effort (Days)', 'Assigned Resource', 'Start Date', 'End Date'];
    const headerRow1 = ws1.getRow(8);
    headers1.forEach((h, i) => {
      const cell = headerRow1.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryNavy } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Calendar Timeline Headers (Cols 9+)
    timelineDates.forEach((tDate, i) => {
      const colIdx = 9 + i;
      const cell = headerRow1.getCell(colIdx);
      const dayStr = tDate.getDate().toString().padStart(2, '0');
      const monthStr = tDate.toLocaleString('default', { month: 'short' });
      cell.value = `${dayStr}\n${monthStr}`;

      const isWeekend = tDate.getDay() === 0 || tDate.getDay() === 6;
      cell.font = { size: 9, bold: true, color: { argb: isWeekend ? '7F7F7F' : 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isWeekend ? weekendFill : primaryNavy }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Data Rows & Gantt Bars
    plan.schedule.forEach((item, index) => {
      const rowNum = 9 + index;
      const row = ws1.getRow(rowNum);

      row.getCell(1).value = item.id;
      row.getCell(2).value = item.application;
      row.getCell(3).value = item.screen;
      row.getCell(4).value = item.feature;
      row.getCell(5).value = item.effortInDays;
      row.getCell(6).value = item.assignedDeveloper;
      row.getCell(7).value = item.startDateFormatted;
      row.getCell(8).value = item.endDateFormatted;

      for (let c = 1; c <= 8; c++) {
        row.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'D9D9D9' } },
          left: { style: 'thin', color: { argb: 'D9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
          right: { style: 'thin', color: { argb: 'D9D9D9' } }
        };
      }

      const itemStart = new Date(item.startDateFormatted);
      const itemEnd = new Date(item.endDateFormatted);

      timelineDates.forEach((tDate, i) => {
        const colIdx = 9 + i;
        const cell = row.getCell(colIdx);
        const isWeekend = tDate.getDay() === 0 || tDate.getDay() === 6;

        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } }
        };

        if (tDate >= itemStart && tDate <= itemEnd) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isWeekend ? weekendFill : taskGanttFill }
          };
        } else if (isWeekend) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: weekendFill } };
        }
      });
    });

    // Column Config Worksheet 1
    const colsConfig1 = [
      { width: 6 }, { width: 14 }, { width: 14 }, { width: 22 },
      { width: 12 }, { width: 18 }, { width: 14 }, { width: 14 }
    ];
    timelineDates.forEach(() => colsConfig1.push({ width: 4 }));
    ws1.columns = colsConfig1;

    // ==========================================
    // WORKSHEET 2: Application Summary Gantt
    // ==========================================
    const ws2 = workbook.addWorksheet('Application Summary Gantt');
    ws2.views = [{ showGridLines: true }];

    // Aggregate Application metrics (Start, End, Total Effort)
    const appSummary = {};
    plan.schedule.forEach((item) => {
      if (!appSummary[item.application]) {
        appSummary[item.application] = {
          application: item.application,
          totalEffort: 0,
          startDate: item.startDateFormatted,
          endDate: item.endDateFormatted,
          taskCount: 0
        };
      }
      appSummary[item.application].totalEffort += item.effortInDays;
      appSummary[item.application].taskCount += 1;

      if (new Date(item.startDateFormatted) < new Date(appSummary[item.application].startDate)) {
        appSummary[item.application].startDate = item.startDateFormatted;
      }
      if (new Date(item.endDateFormatted) > new Date(appSummary[item.application].endDate)) {
        appSummary[item.application].endDate = item.endDateFormatted;
      }
    });

    const appList = Object.values(appSummary);

    // Title Block
    ws2.mergeCells('A1:E1');
    const titleCell2 = ws2.getCell('A1');
    titleCell2.value = 'APPLICATION-LEVEL GANTT SUMMARY';
    titleCell2.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryNavy } };
    titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };

    // Table Headers
    const headers2 = ['Application', 'Total Effort (Days)', 'Features', 'Start Date', 'End Date'];
    const headerRow2 = ws2.getRow(3);
    headers2.forEach((h, i) => {
      const cell = headerRow2.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryNavy } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Calendar Timeline Headers (Cols 6+)
    timelineDates.forEach((tDate, i) => {
      const colIdx = 6 + i;
      const cell = headerRow2.getCell(colIdx);
      const dayStr = tDate.getDate().toString().padStart(2, '0');
      const monthStr = tDate.toLocaleString('default', { month: 'short' });
      cell.value = `${dayStr}\n${monthStr}`;

      const isWeekend = tDate.getDay() === 0 || tDate.getDay() === 6;
      cell.font = { size: 9, bold: true, color: { argb: isWeekend ? '7F7F7F' : 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isWeekend ? weekendFill : primaryNavy }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Populate Application Rows and Application Gantt Bars
    appList.forEach((app, index) => {
      const rowNum = 4 + index;
      const row = ws2.getRow(rowNum);

      row.getCell(1).value = app.application;
      row.getCell(2).value = app.totalEffort;
      row.getCell(3).value = app.taskCount;
      row.getCell(4).value = app.startDate;
      row.getCell(5).value = app.endDate;

      for (let c = 1; c <= 5; c++) {
        row.getCell(c).font = { bold: true };
        row.getCell(c).border = {
          top: { style: 'medium', color: { argb: 'B0C4DE' } },
          left: { style: 'thin', color: { argb: 'D9D9D9' } },
          bottom: { style: 'medium', color: { argb: 'B0C4DE' } },
          right: { style: 'thin', color: { argb: 'D9D9D9' } }
        };
      }

      const appStart = new Date(app.startDate);
      const appEnd = new Date(app.endDate);

      // Application Gantt Bar Fill
      timelineDates.forEach((tDate, i) => {
        const colIdx = 6 + i;
        const cell = row.getCell(colIdx);
        const isWeekend = tDate.getDay() === 0 || tDate.getDay() === 6;

        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } }
        };

        if (tDate >= appStart && tDate <= appEnd) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isWeekend ? weekendFill : appGanttFill }
          };
        } else if (isWeekend) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: weekendFill } };
        }
      });
    });

    // Column Config Worksheet 2
    const colsConfig2 = [
      { width: 16 }, { width: 18 }, { width: 12 }, { width: 14 }, { width: 14 }
    ];
    timelineDates.forEach(() => colsConfig2.push({ width: 4 }));
    ws2.columns = colsConfig2;

    // Stream Workbook Download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Project_Timeline_Gantt.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel Gantt timeline:', error);
    res.status(500).json({ error: 'Failed to generate Excel file.' });
  }
};