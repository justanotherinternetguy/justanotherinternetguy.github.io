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
  if (percentage >= 92.5) return "A";
  if (percentage >= 89.5) return "A-";
  if (percentage >= 86.5) return "B+";
  if (percentage >= 82.5) return "B";
  if (percentage >= 79.5) return "B-";
  if (percentage >= 76.5) return "C+";
  if (percentage >= 72.5) return "C";
  if (percentage >= 69.5) return "C-";
  if (percentage >= 66.5) return "D+";
  if (percentage >= 62.5) return "D";
  if (percentage >= 59.5) return "D-";
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

      let classPercentage = 0;

      gradeValues.forEach((percentage, idx) => {
        if (percentage !== null) {
          classPercentage += percentage * weights[idx];
        }
      });

      const letterGrade = percentageToLetterGrade(classPercentage);
      const classGPA = gradeToGPA[letterGrade][level];
      classTotal = classGPA;
      classCount = 1;

      document.getElementById(
        `gpa${index + 1}`
      ).textContent = `GPA: ${classTotal.toFixed(3)} (${classPercentage.toFixed(
        2
      )}%)`;
    } else {
      document.getElementById(
        `gpa${index + 1}`
      ).textContent = `GPA: 0.000 (N/A)`;
    }

    totalGrades += classTotal;
    totalCount += classCount;
  });

  const averageGPA = totalCount > 0 ? (totalGrades / 7).toFixed(3) : 0;
  document.getElementById(
    "averageResult"
  ).textContent = `Average GPA: ${averageGPA}`;
}
