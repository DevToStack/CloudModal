const db = require('./database');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const path = require('path');
const indexRoutes = require('./routes/indexRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Ensure CORS is set up before routes
app.use(express.json());

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/colleges',indexRoutes);
app.use('/api/admin',adminRoutes);
(async () => {
    try {
        await db.init();  // ✅ This ensures tables are created at server launch
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to initialize database or start server:', err);
        process.exit(1);
    }
})();


