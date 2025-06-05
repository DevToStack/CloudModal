const mysql = require('mysql2/promise');
require('dotenv').config();

const pool =  mysql.createPool({
    host : process.env.DB_HOST || 'localhost',
    user : process.env.DB_USER || 'rabi',
    password : process.env.DB_PASSWORD,
    database : process.env.DATABASE || 'college_management',
    waitForConnections : true,
    connectionLimit : 10,
    queueLimit : 0
});

async function init(){
    try{
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Colleges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                college_code VARCHAR(50) NOT NULL UNIQUE,
                address TEXT,
                contact_email VARCHAR(100),
                contact_phone VARCHAR(20),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role ENUM('admin','teacher','student','account_manager'),
                college_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (college_id) REFERENCES Colleges(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Students (
                user_id INT PRIMARY KEY,
                enrollment_number VARCHAR(50) NOT NULL UNIQUE,
                program VARCHAR(100) NOT NULL,
                year_of_study INT NOT NULL,
                section VARCHAR(10),
                date_of_birth DATETIME,
                gender ENUM('male','female','other'),
                admission_date DATETIME,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )    
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Teachers (
                user_id INT PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL UNIQUE,
                department VARCHAR(100) NOT NULL,
                designation VARCHAR(100),
                qualification VARCHAR(255),
                joining_date DATETIME,
                gender ENUM('male','female','other'),
                date_of_birth DATETIME,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE    
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_code VARCHAR(50) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                department VARCHAR(100),
                semester INT,
                college_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
                FOREIGN KEY (college_id) REFERENCES Colleges(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT,
                teacher_id INT,
                year INT,
                section VARCHAR(3),
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES Teachers(user_id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                class_id INT,
                FOREIGN KEY (student_id) REFERENCES Students(user_id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE 
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT,
                student_id INT,
                date DATETIME,
                status ENUM('present','absent','late','excused'),
                notes TEXT,
                FOREIGN KEY (student_id) REFERENCES Students(user_id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Exams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT,
                title VARCHAR(50),
                exam_date DATETIME,
                FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                exam_id INT,
                student_id INT,
                marks_obtained DECIMAL(5,2),
                max_marks DECIMAL(5,2),
                FOREIGN KEY (student_id) REFERENCES Students(user_id) ON DELETE CASCADE,
                FOREIGN KEY (exam_id) REFERENCES Exams(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Timetable (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT,
                day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'),
                start_time TIME,
                end_time TIME,
                room VARCHAR(13),
                FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS AccountManager (
                user_id INT PRIMARY KEY,
                employee_id VARCHAR(100) UNIQUE,
                department VARCHAR(100) DEFAULT 'Accounts',
                reporting_to INT,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (reporting_to) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS FeeStructure (
                id INT AUTO_INCREMENT PRIMARY KEY,
                college_id INT,
                program VARCHAR(100),
                year INT,
                semester INT,
                total_amount DECIMAL(10,2),
                due_date DATE,
                FOREIGN KEY (college_id) REFERENCES Colleges(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS StudentFees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                fee_structure_id INT,
                amount_due DECIMAL(10,2),
                amount_paid DECIMAL(10,2),
                status ENUM('paid','partial','unpaid'),
                last_payment_date DATETIME,
                remarks TEXT,
                FOREIGN KEY (student_id) REFERENCES Students(user_id) ON DELETE CASCADE,
                FOREIGN KEY (fee_structure_id) REFERENCES FeeStructure(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_fee_id INT,
                paid_by_staff_id INT,
                payment_date DATETIME,
                amount DECIMAL(10,2),
                payment_mode ENUM('cash','card','bank_transfer','online'),
                receipt_number VARCHAR(100),
                FOREIGN KEY (student_fee_id) REFERENCES StudentFees(id) ON DELETE CASCADE,
                FOREIGN KEY (paid_by_staff_id) REFERENCES AccountManager(user_id) ON DELETE CASCADE

            )
        `);

        connection.release();
        console.log('Database tables initialized successfully');
    }catch(err){
        console.error('Error occured during the exicution of the table creation',err);
        throw err;
    }
}

function getDB() {
    if (!pool) {
        throw new Error('Database not initialized');
    }
    return pool;
}

module.exports = {
    init,
    getDB
};