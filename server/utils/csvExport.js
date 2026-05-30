// ============================================================
// AttendX - CSV Export Utility
// Generates CSV files from data arrays using json2csv
// ============================================================

const { Parser } = require('json2csv');

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} fields - Optional array of field definitions
 * @returns {string} CSV formatted string
 */
const generateCSV = (data, fields = null) => {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  const opts = {};
  if (fields) {
    opts.fields = fields;
  }

  const parser = new Parser(opts);
  return parser.parse(data);
};

/**
 * Generate attendance report CSV
 * @param {Array} records - Attendance records
 * @returns {string} CSV string
 */
const generateAttendanceCSV = (records) => {
  const fields = [
    { label: 'Student Name', value: 'student_name' },
    { label: 'Roll Number', value: 'roll_number' },
    { label: 'Subject', value: 'subject_name' },
    { label: 'Date', value: 'date' },
    { label: 'Status', value: 'status' },
    { label: 'Slot Time', value: 'slot_time' },
    { label: 'Remarks', value: 'remarks' },
  ];

  return generateCSV(records, fields);
};

/**
 * Generate attendance summary CSV (percentage-based)
 * @param {Array} records - Summary records
 * @returns {string} CSV string
 */
const generateAttendanceSummaryCSV = (records) => {
  const fields = [
    { label: 'Student Name', value: 'student_name' },
    { label: 'Roll Number', value: 'roll_number' },
    { label: 'Subject', value: 'subject_name' },
    { label: 'Classes Attended', value: 'classes_attended' },
    { label: 'Total Classes', value: 'total_classes' },
    { label: 'Attendance %', value: 'percentage' },
    { label: 'Status', value: 'status' },
  ];

  return generateCSV(records, fields);
};

/**
 * Generate grades report CSV
 * @param {Array} records - Grade records
 * @returns {string} CSV string
 */
const generateGradesCSV = (records) => {
  const fields = [
    { label: 'Student Name', value: 'student_name' },
    { label: 'Roll Number', value: 'roll_number' },
    { label: 'Subject', value: 'subject_name' },
    { label: 'Exam Type', value: 'exam_type' },
    { label: 'Marks Obtained', value: 'marks_obtained' },
    { label: 'Total Marks', value: 'total_marks' },
    { label: 'Grade', value: 'grade_letter' },
  ];

  return generateCSV(records, fields);
};

/**
 * Send CSV as downloadable response
 * @param {object} res - Express response object
 * @param {string} csv - CSV string
 * @param {string} filename - Download filename
 */
const sendCSVResponse = (res, csv, filename) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};

module.exports = {
  generateCSV,
  generateAttendanceCSV,
  generateAttendanceSummaryCSV,
  generateGradesCSV,
  sendCSVResponse,
};
