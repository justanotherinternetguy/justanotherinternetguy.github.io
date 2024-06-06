const gradeToGPA = {
  A: { CPA: 4.333, ACC: 4.667, AP: 5.0 },
  "A-": { CPA: 4.0, ACC: 4.333, AP: 4.667 },
  "B+": { CPA: 3.667, ACC: 4.0, AP: 4.333 },
  B: { CPA: 3.333, ACC: 3.667, AP: 4.0 },
  "B-": { CPA: 3.0, ACC: 3.333, AP: 3.667 },
  "C+": { CPA: 2.667, ACC: 3.0, AP: 3.333 },
  C: { CPA: 2.333, ACC: 2.667, AP: 3.0 },
  "C-": { CPA: 2.0, ACC: 2.333, AP: 2.667 },
  "D+": { CPA: 1.667, ACC: 2.0, AP: 2.333 },
  D: { CPA: 1.333, ACC: 1.667, AP: 2.0 },
  "D-": { CPA: 1.0, ACC: 1.333, AP: 1.667 },
  F: { CPA: 0.0, ACC: 0.0, AP: 0.0 },
};

const percentageToLetterGrade = (percentage) => {
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
};

function calculateGPA() {
  const rows = document.querySelectorAll("tbody tr");
  let totalGrades = 0;
  let totalCount = 0;

  rows.forEach((row, index) => {
    const gradeInputs = row.querySelectorAll(".grade");
    const level = row.querySelector(".level").value;
    let classTotal = 0;
    let classCount = 0;
    let filledGrades = 0;
    let gradeValues = [];

    gradeInputs.forEach((input) => {
      const percentage = parseFloat(input.value);
      if (!isNaN(percentage)) {
        gradeValues.push(percentage);
        filledGrades++;
      } else {
        gradeValues.push(null);
      }
    });

    if (filledGrades > 0) {
      let weights = [];

      if (filledGrades === 6) {
        weights = [0.2, 0.2, 0.2, 0.2, 0.1, 0.1];
      } else if (filledGrades === 5 && gradeValues[5] === null) {
        weights = [0.2, 0.2, 0.25, 0.25, 0.1, 0.0];
      } else if (
        filledGrades === 4 &&
        gradeValues[4] === null &&
        gradeValues[5] === null
      ) {
        weights = [0.25, 0.25, 0.25, 0.25, 0.0, 0.0];
      } else {
        alert(
          `Incomplete grades for Class ${
            index + 1
          }. Please fill the grades as per the rules.`
        );
        return;
      }

      gradeValues.forEach((percentage, idx) => {
        if (percentage !== null) {
          const letterGrade = percentageToLetterGrade(percentage);
          const gradePoint = gradeToGPA[letterGrade][level];
          classTotal += gradePoint * weights[idx];
          classCount += weights[idx];
        }
      });
    }

    const classGPA = classCount > 0 ? (classTotal / classCount).toFixed(2) : 0;
    document.getElementById(`gpa${index + 1}`).textContent = `GPA: ${classGPA}`;

    totalGrades += classTotal;
    totalCount += classCount;
  });

  const averageGPA = totalCount > 0 ? (totalGrades / totalCount).toFixed(2) : 0;
  document.getElementById(
    "averageResult"
  ).textContent = `Average GPA: ${averageGPA}`;
}
