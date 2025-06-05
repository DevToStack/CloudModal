const {getDB} = require('../database');

exports.getDashboardStats = async (req,res)=>{
    const db = getDB();
    try{
        const [row] = await db.query(`SELECT 
            (SELECT COUNT(*) FROM Students s
            JOIN Users u ON s.user_id=u.id
            WHERE u.college_id='447') as total_students,


            (SELECT COUNT(*) FROM teachers t 
            JOIN users u ON t.user_id = u.id 
            WHERE u.college_id = '447') AS total_teachers,

            (SELECT COUNT(*) FROM Courses 
            WHERE college_id = '447') AS total_courses,
            
            (SELECT COUNT(*) FROM feeStructure
            WHERE college_id = '447') AS total_fees;`
        );
        res.json(row[0]);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Dashboard Stats fetch error' });
    }
}

exports.getProgramOverview = async (req,res)=>{
    const db = getDB();
    try{
        const row = await db.query(`SELECT 
            s.program,
            s.year_of_study AS year,
            s.section,
            COUNT(*) AS total_students
            FROM Students s
            JOIN Users u ON s.user_id = u.id
            JOIN Colleges c ON u.college_id = c.id
            WHERE c.college_code = '447'
            GROUP BY s.program, s.year_of_study, s.section
            ORDER BY s.program, s.year_of_study, s.section;`
        );
        res.json(row[0]);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Dashboard Program overview fetch error' });
    }
}

exports.getFeeSummary = async (req,res)=>{
    const db = getDB();
    try{
        const row = await db.query(`SELECT
            COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) AS paid_students,
            COUNT(CASE WHEN sf.status = 'partial' THEN 1 END) AS partial_paid_students,
            COUNT(CASE WHEN sf.status = 'unpaid' THEN 1 END) AS unpaid_students
            FROM StudentFees sf
            JOIN Students s ON sf.student_id = s.user_id
            JOIN Users u ON s.user_id = u.id
            JOIN Colleges c ON u.college_id = c.id
            WHERE c.college_code = '447';`
        );
        res.json(row[0]);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Dashboard Fee summary fetch error' });
    }
}

exports.getRecentPayment = async (req,res)=>{
    const db = getDB();
    try{
        const row = await db.query(`SELECT 
            u.name AS student_name,
            p.amount AS paid_amount,
            p.payment_mode
            FROM Payments p
            JOIN StudentFees sf ON p.student_fee_id = sf.id
            JOIN Students s ON sf.student_id = s.user_id
            JOIN Users u ON s.user_id = u.id
            JOIN Colleges c ON u.college_id = c.id
            WHERE c.college_code = '447'
            ORDER BY p.payment_date DESC
            LIMIT 20;`
        );
        res.json(row[0]);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Dashboard Recent payments fetch error' });
    }
}

exports.getUpcomingExams = async (req,res)=>{
    const db = getDB();
    try{
        const row = await db.query(`SELECT 
            cr.title AS course,
            CONCAT(cl.year, ' - ', cl.section) AS class,
            e.title AS exam,
            e.exam_date
            FROM Exams e
            JOIN Classes cl ON e.class_id = cl.id
            JOIN Courses cr ON cl.course_id = cr.id
            JOIN Colleges co ON cr.college_id = co.id
            WHERE co.college_code = '447'
            AND e.exam_date > NOW()
            ORDER BY e.exam_date ASC;`
        );
        res.json(row[0]);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Dashboard Upcomming exams fetch error' });
    }
}

exports.getTodaysClasses = async (req,res)=>{
    const db = getDB();
    try{
        const row = await db.query(`SELECT 
            TIME_FORMAT(tt.start_time, '%H:%i') AS start_time,
            TIME_FORMAT(tt.end_time, '%H:%i') AS end_time,
            c.title AS course_title,
            tt.room
            FROM Timetable tt
            JOIN Classes cl ON tt.class_id = cl.id
            JOIN Courses c ON cl.course_id = c.id
            JOIN Colleges co ON c.college_id = co.id
            WHERE co.college_code = '447'
            AND tt.day_of_week = DAYNAME(CURDATE())
            ORDER BY tt.start_time;
        `);
        res.json(row[0]);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Dashboard Todays classes fetch error' });
    }
}
//Students
exports.getAllStudents = async (req,res)=>{
    const db = getDB();
    try{
        const [row] = await db.query(`SELECT s.*,u.name FROM Students s JOIN Users u ON s.user_id = u.id WHERE u.college_id = '447'`);
        res.json(row);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Students fetch error' });
    }
}

exports.getAllStudentsById = async (req,res)=>{
    const StudentId = req.parms.StudentId;
    const CollegeId = req.user.college_id;
    const db = getDB();
    try{
        const [row] = await db.query(`SELECT 
            s.*, u.name, u.email
            FROM Students s
            JOIN Users u ON s.user_id = u.id
            JOIN Colleges c ON u.college_id = c.id
            WHERE s.user_id = ? AND c.college_code = ?
        `,[StudentId,CollegeId]);
        res.json(row);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Students fetch error' });
    }
}

exports.createStudent = async (req,res)=>{

}

exports.updateStudent = async (req,res)=>{

}

exports.deleteStudent = async (req,res)=>{

}
//teachers
exports.getAllTeachers = async (req,res)=>{
const db = getDB();
    try{
        const [row] = await db.query(`SELECT t.*,u.name FROM Teachers t JOIN Users u ON t.user_id = u.id WHERE u.college_id = '447'`);
        res.json(row);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Teachers fetch error' });
    }
}

exports.getTeacherById = async (req,res)=>{
    const TeacherId = req.parms.StudentId;
    const CollegeId = req.user.college_id;
    const db = getDB();
    try{
        const [row] = await db.query(`SELECT 
            t.*, u.name, u.email, u.role
            FROM Teachers t
            JOIN Users u ON t.user_id = u.id
            JOIN Colleges c ON u.college_id = c.id
            WHERE t.user_id = ? AND c.college_code = ?
        `,[TeacherId,CollegeId]);
        res.json(row);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Students fetch error' });
    }
}

exports.createTeacher = async (req,res)=>{

}

exports.updateTeacher = async (req,res)=>{

}

exports.deleteTeacher = async (req,res)=>{

}
//Courses
exports.getAllCourses = async (req,res)=>{
    const db = getDB();
    try{
        const [row] = await db.query(`SELECT title FROM Courses WHERE college_id = '447'`);
        res.json(row);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Courses fetch error' });
    }
}

exports.getCourseById = async (req,res)=>{
    const db = getDB();
    try{
        const [row] = await db.query(`SELECT 
            c.id, c.course_code, c.title, c.department, c.semester
            FROM Courses c
            JOIN Colleges co ON c.college_id = co.id
            WHERE c.id = ? AND co.college_code = ?
        `);
        res.json(row);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Courses fetch error' });
    }
}

exports.createCourse = async (req,res)=>{

}

exports.updateCourse = async (req,res)=>{

}

exports.deleteCourse = async (req,res)=>{

}

//Fees
exports.getAllFees = async (req,res)=>{

}

exports.getFeeByStudentId = async (req,res)=>{

}

exports.createFeePayment = async (req,res)=>{

}

exports.updateFeePayment = async (req,res)=>{

}

//Exams
exports.getAllExams = async (req,res)=>{
    const db = getDB();
    try{
        const [row] = await db.query(`SELECT e.title,e.exam_date FROM Exams e 
            JOIN Classes c ON e.class_id =c.id
            JOIN courses cr ON c.course_id = cr.id WHERE cr.college_id = '447'`);
        res.json(row);
    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Exams fetch error' });
    }
}

exports.getExamById = async (req,res)=>{

}

exports.createExam = async (req,res)=>{

}

exports.updateExam = async (req,res)=>{

}

exports.deleteExam = async (req,res)=>{

}

//Reports
exports.getAttendanceReport = async (req,res)=>{

}

exports.getFeesReport = async (req,res)=>{

}

exports.getResultReport = async (req,res)=>{

}