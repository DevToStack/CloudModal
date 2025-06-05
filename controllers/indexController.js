const {getDB} = require('../database');

exports.getColleges = async (req,res)=>{
    const db = getDB();
    try{
        const [rows] = await db.query(`select name as Name,college_code as CollegeCode,address as Address from Colleges`);
        res.json(rows);

    }catch(err){
        console.error('Failed to fetch data : '+err);
        res.status(500).json({ error: 'Colleges fetch error' });
    }
}