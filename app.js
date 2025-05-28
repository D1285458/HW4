var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const sqlite3 = require('sqlite3').verbose();

// 資料庫檔案路徑
const dbPath = path.join(__dirname, 'db', 'sqlite.db');

// 開啟資料庫
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('無法開啟資料庫:', err.message);
    } else {
        console.log('成功連接到 SQLite 資料庫');
    }
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// 新增 /api/quotes 路由
app.get('/api/quotes', (req, res) => {
    const query = 'SELECT * FROM starbucks';
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('查詢失敗:', err.message);
            res.status(500).json({ error: '查詢失敗' });
        } else {
            res.json(rows);
        }
    });
});

// 修改 /api 路由，實現正確的搜尋功能
app.get('/api', (req, res) => {
    const { name, size } = req.query;

    let query = 'SELECT * FROM starbucks';
    const params = [];

    if (name || size) {
        query += ' WHERE';
        if (name) {
            query += ' name = ?';
            params.push(name);
        }
        if (size) {
            if (params.length > 0) query += ' AND';
            query += ' size = ?';
            params.push(size);
        }
    }

    query += ' ORDER BY name ASC, price ASC'; // 按名稱和價格排序

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('查詢失敗:', err.message);
            res.status(500).json({ error: '查詢失敗' });
        } else {
            res.json(rows);
        }
    });
});

// 新增 /api 路由
app.post('/api', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: '缺少 name 參數' });
    }

    const query = 'SELECT * FROM starbucks WHERE name = ?';
    db.all(query, [name], (err, rows) => {
        if (err) {
            console.error('查詢失敗:', err.message);
            res.status(500).json({ error: '查詢失敗' });
        } else {
            res.json(rows);
        }
    });
});

// 新增 /api/insert 路由
app.get('/api/insert', (req, res) => {
    const { name, price, size, time } = req.query;

    if (!name || !price || !size || !time) {
        return res.status(400).json({ error: '缺少必要參數 (name, price, size, time)' });
    }

    const query = 'INSERT INTO starbucks (name, price, size, time) VALUES (?, ?, ?, ?)';
    db.run(query, [name, price, size, time], function (err) {
        if (err) {
            console.error('新增資料失敗:', err.message);
            res.status(500).json({ error: '新增資料失敗' });
        } else {
            res.json({ message: '新增資料成功', id: this.lastID });
        }
    });
});

// 新增 /api/insert 路由
app.post('/api/insert', (req, res) => {
    const { name, price, size, time } = req.body;

    if (!name || !price || !size || !time) {
        return res.status(400).send('缺少必要參數 (name, price, size, time)');
    }

    const query = 'INSERT INTO starbucks (name, price, size, time) VALUES (?, ?, ?, ?)';
    db.run(query, [name, price, size, time], function (err) {
        if (err) {
            console.error('新增資料失敗:', err.message);
            res.status(500).send('新增資料失敗');
        } else {
            res.send('新增資料成功');
        }
    });
});

module.exports = app;

