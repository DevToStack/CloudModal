const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

//Dashboard routes for admin
router.get('/dashboard/stats',adminController.getDashboardStats);
router.get('/dashboard/program-overview',adminController.getProgramOverview);
router.get('/dashboard/fee-summary',adminController.getFeeSummary);
router.get('/dashboard/recent-payments',adminController.getRecentPayment);
router.get('/dashboard/upcoming-exams',adminController.getUpcomingExams);
router.get('/dashboard/todays-classes',adminController.getTodaysClasses);

//Students routes for admin
router.get('/students',adminController.getAllStudents);
router.get('/students/:id',adminController.getAllStudentsById);
router.post('/students',adminController.createStudent);
router.put('/students/:id',adminController.updateStudent);
router.delete('/students/:id',adminController.deleteStudent);

//Teacher routes for admin
router.get('/teachers',adminController.getAllTeachers);
router.get('/teachers/:id',adminController.getTeacherById);
router.post('/teachers',adminController.createTeacher);
router.delete('/teachers/:id',adminController.deleteTeacher);

//Courses routes for admin
router.get('/courses',adminController.getAllCourses);
router.get('/cources/:id',adminController.getCourseById);
router.post('/cources/:id',adminController.createCourse);
router.put('/cources/:id',adminController.updateCourse);
router.delete('/cources/:id',adminController.deleteCourse);

//Fees routes for admin
router.get('/fees',adminController.getAllFees);
router.get('/fees/student/:id',adminController.getFeeByStudentId);
router.post('/fees',adminController.createFeePayment);
router.put('/fees/:id',adminController.updateFeePayment);

//Exams routes for admin
router.get('/exams',adminController.getAllExams);
router.get('/exams/:id',adminController.getExamById);
router.post('/exams',adminController.createExam);
router.put('/exams/:id',adminController.updateExam);
router.delete('/exams/:id',adminController.deleteExam);

//Reports routes for admin
router.get('/reports/attendance',adminController.getAttendanceReport);
router.get('/reports/fees',adminController.getFeesReport);
router.get('/reports/results',adminController.getResultReport);

module.exports = router;