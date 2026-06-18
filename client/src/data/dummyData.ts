export const students = [
  { id: 1, name: "Alice Johnson", rollNo: "S101", class: "Grade 10", section: "A", parentName: "Robert Johnson", phone: "555-0101", email: "alice@example.com", status: "Active", initials: "AJ" },
  { id: 2, name: "Bob Smith", rollNo: "S102", class: "Grade 10", section: "A", parentName: "Mary Smith", phone: "555-0102", email: "bob@example.com", status: "Active", initials: "BS" },
  { id: 3, name: "Charlie Davis", rollNo: "S103", class: "Grade 10", section: "B", parentName: "William Davis", phone: "555-0103", email: "charlie@example.com", status: "Active", initials: "CD" },
  { id: 4, name: "Diana Prince", rollNo: "S104", class: "Grade 11", section: "A", parentName: "John Prince", phone: "555-0104", email: "diana@example.com", status: "Active", initials: "DP" },
  { id: 5, name: "Evan Wright", rollNo: "S105", class: "Grade 11", section: "B", parentName: "Susan Wright", phone: "555-0105", email: "evan@example.com", status: "Inactive", initials: "EW" },
  { id: 6, name: "Fiona Green", rollNo: "S106", class: "Grade 12", section: "A", parentName: "Tom Green", phone: "555-0106", email: "fiona@example.com", status: "Active", initials: "FG" },
  { id: 7, name: "George Adams", rollNo: "S107", class: "Grade 12", section: "B", parentName: "Lisa Adams", phone: "555-0107", email: "george@example.com", status: "Active", initials: "GA" },
  { id: 8, name: "Hannah Brown", rollNo: "S108", class: "Grade 10", section: "A", parentName: "Chris Brown", phone: "555-0108", email: "hannah@example.com", status: "Active", initials: "HB" },
  { id: 9, name: "Ian Clark", rollNo: "S109", class: "Grade 11", section: "A", parentName: "Nancy Clark", phone: "555-0109", email: "ian@example.com", status: "Inactive", initials: "IC" },
  { id: 10, name: "Julia Moore", rollNo: "S110", class: "Grade 12", section: "A", parentName: "Kevin Moore", phone: "555-0110", email: "julia@example.com", status: "Active", initials: "JM" },
  { id: 11, name: "Kyle Taylor", rollNo: "S111", class: "Grade 10", section: "B", parentName: "Amy Taylor", phone: "555-0111", email: "kyle@example.com", status: "Active", initials: "KT" },
  { id: 12, name: "Lily Anderson", rollNo: "S112", class: "Grade 11", section: "B", parentName: "Paul Anderson", phone: "555-0112", email: "lily@example.com", status: "Active", initials: "LA" },
  { id: 13, name: "Mark Wilson", rollNo: "S113", class: "Grade 12", section: "B", parentName: "Sara Wilson", phone: "555-0113", email: "mark@example.com", status: "Active", initials: "MW" },
  { id: 14, name: "Nina Harris", rollNo: "S114", class: "Grade 10", section: "A", parentName: "David Harris", phone: "555-0114", email: "nina@example.com", status: "Active", initials: "NH" },
  { id: 15, name: "Oscar Martin", rollNo: "S115", class: "Grade 11", section: "A", parentName: "Emma Martin", phone: "555-0115", email: "oscar@example.com", status: "Active", initials: "OM" },
];

export const teachers = [
  { id: 1, name: "Dr. Alan Turing", subject: "Computer Science", classAssigned: "Grade 10A", phone: "555-0201", email: "alan@school.edu", status: "Active", initials: "AT" },
  { id: 2, name: "Marie Curie", subject: "Mathematics", classAssigned: "Grade 11A", phone: "555-0202", email: "marie@school.edu", status: "Active", initials: "MC" },
  { id: 3, name: "Isaac Newton", subject: "Physics", classAssigned: "Grade 12A", phone: "555-0203", email: "isaac@school.edu", status: "Active", initials: "IN" },
  { id: 4, name: "Jane Goodall", subject: "Biology", classAssigned: "Grade 10B", phone: "555-0204", email: "jane@school.edu", status: "Active", initials: "JG" },
  { id: 5, name: "William Shakespeare", subject: "English Literature", classAssigned: "Grade 11B", phone: "555-0205", email: "william@school.edu", status: "Active", initials: "WS" },
  { id: 6, name: "Albert Einstein", subject: "Advanced Physics", classAssigned: "Grade 12B", phone: "555-0206", email: "albert@school.edu", status: "Inactive", initials: "AE" },
  { id: 7, name: "Florence Nightingale", subject: "Health Sciences", classAssigned: "Grade 10A", phone: "555-0207", email: "florence@school.edu", status: "Active", initials: "FN" },
  { id: 8, name: "Charles Darwin", subject: "Environmental Science", classAssigned: "Grade 11A", phone: "555-0208", email: "darwin@school.edu", status: "Active", initials: "CD" },
  { id: 9, name: "Ada Lovelace", subject: "Programming", classAssigned: "Grade 12A", phone: "555-0209", email: "ada@school.edu", status: "Active", initials: "AL" },
  { id: 10, name: "Leonardo da Vinci", subject: "Art & Design", classAssigned: "Grade 10B", phone: "555-0210", email: "leo@school.edu", status: "Active", initials: "LV" },
];

export const parents = [
  { id: 1, parentName: "Robert Johnson", studentName: "Alice Johnson", phone: "555-0101", email: "robert@example.com", relationship: "Father" },
  { id: 2, parentName: "Mary Smith", studentName: "Bob Smith", phone: "555-0102", email: "mary@example.com", relationship: "Mother" },
  { id: 3, parentName: "William Davis", studentName: "Charlie Davis", phone: "555-0103", email: "william@example.com", relationship: "Father" },
  { id: 4, parentName: "John Prince", studentName: "Diana Prince", phone: "555-0104", email: "john@example.com", relationship: "Father" },
  { id: 5, parentName: "Susan Wright", studentName: "Evan Wright", phone: "555-0105", email: "susan@example.com", relationship: "Mother" },
  { id: 6, parentName: "Tom Green", studentName: "Fiona Green", phone: "555-0106", email: "tom@example.com", relationship: "Father" },
  { id: 7, parentName: "Lisa Adams", studentName: "George Adams", phone: "555-0107", email: "lisa@example.com", relationship: "Mother" },
  { id: 8, parentName: "Chris Brown", studentName: "Hannah Brown", phone: "555-0108", email: "chris@example.com", relationship: "Father" },
  { id: 9, parentName: "Nancy Clark", studentName: "Ian Clark", phone: "555-0109", email: "nancy@example.com", relationship: "Mother" },
  { id: 10, parentName: "Kevin Moore", studentName: "Julia Moore", phone: "555-0110", email: "kevin@example.com", relationship: "Father" },
  { id: 11, parentName: "Amy Taylor", studentName: "Kyle Taylor", phone: "555-0111", email: "amy@example.com", relationship: "Mother" },
  { id: 12, parentName: "Paul Anderson", studentName: "Lily Anderson", phone: "555-0112", email: "paul@example.com", relationship: "Father" },
];

export const classes = [
  { id: 1, name: "Grade 10A", teacher: "Dr. Alan Turing", totalStudents: 30, section: "A", status: "Active" },
  { id: 2, name: "Grade 10B", teacher: "Jane Goodall", totalStudents: 28, section: "B", status: "Active" },
  { id: 3, name: "Grade 11A", teacher: "Marie Curie", totalStudents: 32, section: "A", status: "Active" },
  { id: 4, name: "Grade 11B", teacher: "William Shakespeare", totalStudents: 29, section: "B", status: "Active" },
  { id: 5, name: "Grade 12A", teacher: "Isaac Newton", totalStudents: 25, section: "A", status: "Active" },
  { id: 6, name: "Grade 12B", teacher: "Albert Einstein", totalStudents: 27, section: "B", status: "Inactive" },
  { id: 7, name: "Grade 9A", teacher: "Florence Nightingale", totalStudents: 35, section: "A", status: "Active" },
  { id: 8, name: "Grade 9B", teacher: "Charles Darwin", totalStudents: 31, section: "B", status: "Active" },
];

export const subjects = [
  { id: 1, name: "Mathematics", code: "MTH101", teacher: "Marie Curie", maxMarks: 100, passMarks: 33, classes: "All Grades", status: "Active", description: "Core mathematics including algebra, geometry and calculus" },
  { id: 2, name: "Physics", code: "PHY101", teacher: "Isaac Newton", maxMarks: 100, passMarks: 33, classes: "Grade 10–12", status: "Active", description: "Classical and modern physics fundamentals" },
  { id: 3, name: "Biology", code: "BIO101", teacher: "Jane Goodall", maxMarks: 100, passMarks: 33, classes: "Grade 9–12", status: "Active", description: "Life sciences including cell biology and ecology" },
  { id: 4, name: "English Literature", code: "ENG101", teacher: "W. Shakespeare", maxMarks: 100, passMarks: 33, classes: "All Grades", status: "Active", description: "Reading, writing and literary analysis" },
  { id: 5, name: "Computer Science", code: "CS101", teacher: "Dr. A. Turing", maxMarks: 100, passMarks: 33, classes: "Grade 10–12", status: "Active", description: "Programming, algorithms and digital literacy" },
  { id: 6, name: "History", code: "HIS101", teacher: "C. Darwin", maxMarks: 100, passMarks: 33, classes: "All Grades", status: "Active", description: "World history from ancient civilizations to modern era" },
  { id: 7, name: "Art & Design", code: "ART101", teacher: "L. da Vinci", maxMarks: 100, passMarks: 33, classes: "Grade 9–11", status: "Active", description: "Visual arts, design principles and creative expression" },
  { id: 8, name: "Health Sciences", code: "HLT101", teacher: "F. Nightingale", maxMarks: 100, passMarks: 33, classes: "All Grades", status: "Active", description: "Human health, nutrition and physical education" },
  { id: 9, name: "Programming", code: "PRG101", teacher: "Ada Lovelace", maxMarks: 100, passMarks: 33, classes: "Grade 11–12", status: "Active", description: "Advanced programming and software development" },
  { id: 10, name: "Environmental Science", code: "ENV101", teacher: "C. Darwin", maxMarks: 100, passMarks: 33, classes: "Grade 9–10", status: "Inactive", description: "Ecology, climate science and sustainability" },
];

export const attendance = [
  { id: 1, studentName: "Alice Johnson", class: "Grade 10A", date: "2024-10-01", status: "Present" },
  { id: 2, studentName: "Bob Smith", class: "Grade 10A", date: "2024-10-01", status: "Absent" },
  { id: 3, studentName: "Charlie Davis", class: "Grade 10B", date: "2024-10-01", status: "Late" },
  { id: 4, studentName: "Diana Prince", class: "Grade 11A", date: "2024-10-01", status: "Present" },
  { id: 5, studentName: "Evan Wright", class: "Grade 11B", date: "2024-10-01", status: "Present" },
  { id: 6, studentName: "Fiona Green", class: "Grade 12A", date: "2024-10-01", status: "Absent" },
  { id: 7, studentName: "George Adams", class: "Grade 12B", date: "2024-10-01", status: "Present" },
  { id: 8, studentName: "Hannah Brown", class: "Grade 10A", date: "2024-10-01", status: "Present" },
  { id: 9, studentName: "Ian Clark", class: "Grade 11A", date: "2024-10-01", status: "Late" },
  { id: 10, studentName: "Julia Moore", class: "Grade 12A", date: "2024-10-01", status: "Present" },
  { id: 11, studentName: "Kyle Taylor", class: "Grade 10B", date: "2024-10-02", status: "Present" },
  { id: 12, studentName: "Lily Anderson", class: "Grade 11B", date: "2024-10-02", status: "Present" },
  { id: 13, studentName: "Mark Wilson", class: "Grade 12B", date: "2024-10-02", status: "Absent" },
  { id: 14, studentName: "Nina Harris", class: "Grade 10A", date: "2024-10-02", status: "Present" },
  { id: 15, studentName: "Oscar Martin", class: "Grade 11A", date: "2024-10-02", status: "Late" },
];

export const fees = [
  { id: 1, studentName: "Alice Johnson", amount: 1500, dueDate: "2024-11-01", paidDate: "2024-10-28", status: "Paid" },
  { id: 2, studentName: "Bob Smith", amount: 1500, dueDate: "2024-11-01", paidDate: "", status: "Pending" },
  { id: 3, studentName: "Charlie Davis", amount: 1500, dueDate: "2024-10-15", paidDate: "", status: "Unpaid" },
  { id: 4, studentName: "Diana Prince", amount: 1800, dueDate: "2024-11-01", paidDate: "2024-10-25", status: "Paid" },
  { id: 5, studentName: "Evan Wright", amount: 1800, dueDate: "2024-10-20", paidDate: "", status: "Unpaid" },
  { id: 6, studentName: "Fiona Green", amount: 2000, dueDate: "2024-11-01", paidDate: "2024-10-30", status: "Paid" },
  { id: 7, studentName: "George Adams", amount: 2000, dueDate: "2024-11-01", paidDate: "", status: "Pending" },
  { id: 8, studentName: "Hannah Brown", amount: 1500, dueDate: "2024-11-01", paidDate: "2024-10-27", status: "Paid" },
  { id: 9, studentName: "Ian Clark", amount: 1800, dueDate: "2024-10-25", paidDate: "", status: "Unpaid" },
  { id: 10, studentName: "Julia Moore", amount: 2000, dueDate: "2024-11-01", paidDate: "2024-10-29", status: "Paid" },
  { id: 11, studentName: "Kyle Taylor", amount: 1500, dueDate: "2024-11-01", paidDate: "", status: "Pending" },
  { id: 12, studentName: "Lily Anderson", amount: 1800, dueDate: "2024-11-01", paidDate: "2024-10-26", status: "Paid" },
  { id: 13, studentName: "Mark Wilson", amount: 2000, dueDate: "2024-10-18", paidDate: "", status: "Unpaid" },
  { id: 14, studentName: "Nina Harris", amount: 1500, dueDate: "2024-11-01", paidDate: "2024-10-24", status: "Paid" },
  { id: 15, studentName: "Oscar Martin", amount: 1800, dueDate: "2024-11-01", paidDate: "", status: "Pending" },
];

export const exams = [
  { id: 1, name: "Mid Term", subject: "Mathematics", date: "2024-12-10", time: "09:00 AM", room: "Room 101" },
  { id: 2, name: "Mid Term", subject: "Physics", date: "2024-12-11", time: "09:00 AM", room: "Room 102" },
  { id: 3, name: "Mid Term", subject: "English", date: "2024-12-12", time: "09:00 AM", room: "Room 103" },
  { id: 4, name: "Mid Term", subject: "Biology", date: "2024-12-13", time: "10:00 AM", room: "Room 104" },
  { id: 5, name: "Final Exam", subject: "Mathematics", date: "2025-03-10", time: "09:00 AM", room: "Room 101" },
  { id: 6, name: "Final Exam", subject: "Physics", date: "2025-03-11", time: "09:00 AM", room: "Room 102" },
  { id: 7, name: "Final Exam", subject: "Computer Science", date: "2025-03-12", time: "11:00 AM", room: "Lab 1" },
  { id: 8, name: "Unit Test", subject: "History", date: "2024-11-20", time: "02:00 PM", room: "Room 201" },
];

export const results = [
  { id: 1, studentName: "Alice Johnson", subject: "Mathematics", marks: 95, grade: "A+", status: "Pass" },
  { id: 2, studentName: "Bob Smith", subject: "Mathematics", marks: 45, grade: "C", status: "Pass" },
  { id: 3, studentName: "Charlie Davis", subject: "Physics", marks: 78, grade: "B+", status: "Pass" },
  { id: 4, studentName: "Diana Prince", subject: "English", marks: 88, grade: "A", status: "Pass" },
  { id: 5, studentName: "Evan Wright", subject: "Biology", marks: 32, grade: "F", status: "Fail" },
  { id: 6, studentName: "Fiona Green", subject: "Mathematics", marks: 91, grade: "A+", status: "Pass" },
  { id: 7, studentName: "George Adams", subject: "Computer Science", marks: 85, grade: "A", status: "Pass" },
  { id: 8, studentName: "Hannah Brown", subject: "Physics", marks: 67, grade: "B", status: "Pass" },
  { id: 9, studentName: "Ian Clark", subject: "English", marks: 55, grade: "C+", status: "Pass" },
  { id: 10, studentName: "Julia Moore", subject: "Mathematics", marks: 92, grade: "A+", status: "Pass" },
  { id: 11, studentName: "Kyle Taylor", subject: "History", marks: 73, grade: "B", status: "Pass" },
  { id: 12, studentName: "Lily Anderson", subject: "Biology", marks: 81, grade: "A", status: "Pass" },
];

export const notices = [
  { id: 1, title: "Annual Sports Day", date: "2024-11-15", audience: "All", description: "The annual sports day will be held on Nov 20th. All students must participate. Kindly wear appropriate sportswear." },
  { id: 2, title: "Staff Meeting", date: "2024-11-16", audience: "Teachers", description: "Mandatory staff meeting in the main hall at 4 PM. All teaching faculty must attend." },
  { id: 3, title: "Fee Submission Deadline", date: "2024-11-01", audience: "Students", description: "All students are reminded to submit their fees before November 1st to avoid late payment penalties." },
  { id: 4, title: "Parent-Teacher Meeting", date: "2024-11-25", audience: "Parents", description: "Parent-Teacher meeting scheduled for Nov 25th from 10 AM to 2 PM. Attendance is mandatory." },
  { id: 5, title: "Winter Break Schedule", date: "2024-12-20", audience: "All", description: "School will be closed from December 20 to January 5 for winter break. Classes resume on January 6." },
  { id: 6, title: "Science Fair Registration", date: "2024-11-10", audience: "Students", description: "Registration for the annual Science Fair is now open. Contact your class teacher for participation details." },
  { id: 7, title: "Library Books Return", date: "2024-11-30", audience: "Students", description: "All library books must be returned by November 30th. Overdue books will attract a fine." },
  { id: 8, title: "Professional Development Day", date: "2024-12-05", audience: "Teachers", description: "A professional development workshop will be held on Dec 5th. Topics include new pedagogy methods." },
];

export const events = [
  { id: 1, title: "Science Fair", date: "2024-12-05", type: "Academic" },
  { id: 2, title: "Winter Break Starts", date: "2024-12-20", type: "Holiday" },
  { id: 3, title: "Parent-Teacher Meeting", date: "2024-11-25", type: "Meeting" },
  { id: 4, title: "Annual Sports Day", date: "2024-11-20", type: "Sports" },
  { id: 5, title: "Mid-Term Exams Begin", date: "2024-12-10", type: "Academic" },
  { id: 6, title: "School Anniversary", date: "2025-01-15", type: "Cultural" },
];

export const activities = [
  { id: 1, action: "Added new student Alice Johnson to Grade 10A", user: "Admin", time: "10 mins ago" },
  { id: 2, action: "Updated fee record for Bob Smith", user: "Accounts", time: "1 hour ago" },
  { id: 3, action: "Marked attendance for Grade 11A", user: "Marie Curie", time: "2 hours ago" },
  { id: 4, action: "Published notice: Annual Sports Day", user: "Admin", time: "3 hours ago" },
  { id: 5, action: "Added exam schedule for Mid Term", user: "Admin", time: "5 hours ago" },
  { id: 6, action: "Updated timetable for Grade 12B", user: "Dr. Newton", time: "Yesterday" },
  { id: 7, action: "Registered 5 new parents in the system", user: "Admin", time: "Yesterday" },
  { id: 8, action: "Uploaded results for Unit Test - History", user: "Herodotus", time: "2 days ago" },
];

export const timetable: Record<string, { time: string; subject: string; teacher: string }[]> = {
  monday: [
    { time: "08:00 - 09:00", subject: "Mathematics", teacher: "Marie Curie" },
    { time: "09:00 - 10:00", subject: "Physics", teacher: "Isaac Newton" },
    { time: "10:30 - 11:30", subject: "English", teacher: "W. Shakespeare" },
    { time: "11:30 - 12:30", subject: "Computer Sci", teacher: "Dr. A. Turing" },
    { time: "13:30 - 14:30", subject: "Biology", teacher: "Jane Goodall" },
    { time: "14:30 - 15:30", subject: "Art & Design", teacher: "L. da Vinci" },
  ],
  tuesday: [
    { time: "08:00 - 09:00", subject: "English", teacher: "W. Shakespeare" },
    { time: "09:00 - 10:00", subject: "History", teacher: "C. Darwin" },
    { time: "10:30 - 11:30", subject: "Mathematics", teacher: "Marie Curie" },
    { time: "11:30 - 12:30", subject: "Health Sci", teacher: "F. Nightingale" },
    { time: "13:30 - 14:30", subject: "Physics", teacher: "Isaac Newton" },
    { time: "14:30 - 15:30", subject: "Programming", teacher: "Ada Lovelace" },
  ],
  wednesday: [
    { time: "08:00 - 09:00", subject: "Biology", teacher: "Jane Goodall" },
    { time: "09:00 - 10:00", subject: "Mathematics", teacher: "Marie Curie" },
    { time: "10:30 - 11:30", subject: "Physics", teacher: "Isaac Newton" },
    { time: "11:30 - 12:30", subject: "English", teacher: "W. Shakespeare" },
    { time: "13:30 - 14:30", subject: "Art & Design", teacher: "L. da Vinci" },
    { time: "14:30 - 15:30", subject: "Computer Sci", teacher: "Dr. A. Turing" },
  ],
  thursday: [
    { time: "08:00 - 09:00", subject: "Physics", teacher: "Isaac Newton" },
    { time: "09:00 - 10:00", subject: "English", teacher: "W. Shakespeare" },
    { time: "10:30 - 11:30", subject: "History", teacher: "C. Darwin" },
    { time: "11:30 - 12:30", subject: "Mathematics", teacher: "Marie Curie" },
    { time: "13:30 - 14:30", subject: "Programming", teacher: "Ada Lovelace" },
    { time: "14:30 - 15:30", subject: "Health Sci", teacher: "F. Nightingale" },
  ],
  friday: [
    { time: "08:00 - 09:00", subject: "Computer Sci", teacher: "Dr. A. Turing" },
    { time: "09:00 - 10:00", subject: "Biology", teacher: "Jane Goodall" },
    { time: "10:30 - 11:30", subject: "Mathematics", teacher: "Marie Curie" },
    { time: "11:30 - 12:30", subject: "Physics", teacher: "Isaac Newton" },
    { time: "13:30 - 14:30", subject: "History", teacher: "C. Darwin" },
    { time: "14:30 - 15:30", subject: "English", teacher: "W. Shakespeare" },
  ],
};

export const attendanceSummary = [
  { class: "Grade 10A", total: 30, present: 26, absent: 3, late: 1, percentage: 87 },
  { class: "Grade 10B", total: 28, present: 24, absent: 3, late: 1, percentage: 86 },
  { class: "Grade 11A", total: 32, present: 29, absent: 2, late: 1, percentage: 91 },
  { class: "Grade 11B", total: 29, present: 25, absent: 3, late: 1, percentage: 86 },
  { class: "Grade 12A", total: 25, present: 23, absent: 1, late: 1, percentage: 92 },
];

export const users = [
  { id: 1, name: "John Admin", email: "john@school.edu", role: "Super Admin", status: "Active" },
  { id: 2, name: "Sarah Teacher", email: "sarah@school.edu", role: "Teacher", status: "Active" },
  { id: 3, name: "Mike Accounts", email: "mike@school.edu", role: "Accountant", status: "Active" },
  { id: 4, name: "Emma Librarian", email: "emma@school.edu", role: "Librarian", status: "Inactive" },
];

/** Generates a deterministic, realistic mark for a given student + subject combo */
export function generateMark(studentId: number, subjectIdx: number): number {
  const base = [88, 62, 75, 91, 45, 83, 70, 55, 95, 67, 78, 50, 85, 72, 60][studentId % 15];
  const offset = ((studentId * 7 + subjectIdx * 13) % 21) - 10;
  return Math.min(100, Math.max(18, base + offset));
}
