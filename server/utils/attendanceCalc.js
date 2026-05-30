// ============================================================
// AttendX - Attendance Calculation Utility
// Core attendance percentage and prediction logic
// ============================================================

/**
 * Calculate attendance percentage
 * @param {number} classesAttended - Number of classes the student attended
 * @param {number} totalClassesHeld - Total classes held so far
 * @returns {number} Attendance percentage (0-100), rounded to 2 decimal places
 */
const calculatePercentage = (classesAttended, totalClassesHeld) => {
  if (totalClassesHeld === 0) return 100; // No classes held yet
  return parseFloat(((classesAttended / totalClassesHeld) * 100).toFixed(2));
};

/**
 * Calculate how many more consecutive classes a student must attend
 * to reach the target attendance percentage (default 75%).
 *
 * Formula derivation:
 *   We need: (classesAttended + N) / (totalClassesHeld + N) >= target
 *   Solving for N: N >= (target * totalClassesHeld - classesAttended) / (1 - target)
 *
 * @param {number} classesAttended
 * @param {number} totalClassesHeld
 * @param {number} target - Target percentage as decimal (default 0.75)
 * @returns {number} Number of consecutive classes needed (0 if already above target)
 */
const classesNeededForTarget = (classesAttended, totalClassesHeld, target = 0.75) => {
  const currentPercentage = calculatePercentage(classesAttended, totalClassesHeld);

  if (currentPercentage >= target * 100) return 0;

  // N = ceil((target * totalClassesHeld - classesAttended) / (1 - target))
  const needed = Math.ceil(
    (target * totalClassesHeld - classesAttended) / (1 - target)
  );

  return Math.max(0, needed);
};

/**
 * Calculate how many classes a student can skip and still maintain the target
 * @param {number} classesAttended
 * @param {number} totalClassesHeld
 * @param {number} target - Target percentage as decimal (default 0.75)
 * @returns {number} Number of classes that can be safely skipped
 */
const classesCanSkip = (classesAttended, totalClassesHeld, target = 0.75) => {
  if (totalClassesHeld === 0) return 0;

  // canSkip = floor((classesAttended - target * totalClassesHeld) / target)
  const skippable = Math.floor(
    (classesAttended - target * totalClassesHeld) / target
  );

  return Math.max(0, skippable);
};

/**
 * Get full attendance prediction report for a student-subject combination
 * @param {number} classesAttended
 * @param {number} totalClassesHeld
 * @param {string} subjectName - Optional subject name for the message
 * @returns {object} Full attendance report
 */
const getAttendancePrediction = (classesAttended, totalClassesHeld, subjectName = '') => {
  const percentage = calculatePercentage(classesAttended, totalClassesHeld);
  const needed = classesNeededForTarget(classesAttended, totalClassesHeld);
  const canSkip = classesCanSkip(classesAttended, totalClassesHeld);
  const isAboveThreshold = percentage >= 75;

  let message;
  const subjectText = subjectName ? ` in ${subjectName}` : '';

  if (totalClassesHeld === 0) {
    message = `No classes have been held yet${subjectText}.`;
  } else if (isAboveThreshold) {
    message = `Your attendance${subjectText} is ${percentage}%. You are above the 75% threshold. You can safely skip ${canSkip} more class${canSkip !== 1 ? 'es' : ''}.`;
  } else {
    message = `Your attendance${subjectText} is ${percentage}%. You must attend ${needed} more consecutive class${needed !== 1 ? 'es' : ''} to reach 75%.`;
  }

  return {
    classesAttended,
    totalClassesHeld,
    percentage,
    isAboveThreshold,
    classesNeeded: needed,
    classesCanSkip: canSkip,
    message,
    status: isAboveThreshold ? 'safe' : 'critical',
  };
};

module.exports = {
  calculatePercentage,
  classesNeededForTarget,
  classesCanSkip,
  getAttendancePrediction,
};
