require('dotenv').config();
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── TRANSLATION UTILS FOR POSTGRES COMPATIBILITY ───────────────────────────
const casingMap = {
  manv: 'MaNV', tennv: 'TenNV', sodtnv: 'SoDTNV', chucvu: 'ChucVu',
  masv: 'MaSV', tendangnhap: 'TenDangNhap', matkhau: 'MatKhau', hoten: 'HoTen', sodt: 'SoDT', email: 'Email', trangthaitk: 'TrangThaiTK',
  matl: 'MaTL', tentl: 'TenTL', tacgia: 'TacGia', nhaxuatban: 'NhaXuatBan', namxb: 'NamXB', loaitl: 'LoaiTL', trangthai: 'TrangThai',
  mapm: 'MaPM', ngaymuon: 'NgayMuon', hantra: 'HanTra', ngaytra: 'NgayTra', solangiahan: 'SoLanGiaHan',
  danhsachtl: 'DanhSachTL', tl: 'TL', songaytre: 'soNgayTre',
  tongtl: 'tongTL', dangmuon: 'dangMuon', tongsv: 'tongSV', phieuchuatra: 'phieuChuaTra', quahan: 'quaHan',
  thang: 'thang', soluot: 'soLuot',
  sophieu: 'soPhieu', soquahan: 'soQuaHan'
};

function normalizeRow(row) {
  if (!row) return row;
  const newRow = {};
  for (const key of Object.keys(row)) {
    const normalKey = casingMap[key.toLowerCase()] || key;
    newRow[normalKey] = row[key];
  }
  return newRow;
}

function translateQuery(sql, params = []) {
  let pgSql = sql;
  
  // Replace MySQL specific dialects
  pgSql = pgSql.replace(/GROUP_CONCAT\(([^,]+)\s+SEPARATOR\s+('[^']+'\))/gi, 'STRING_AGG($1, $2)');
  pgSql = pgSql.replace(/GROUP_CONCAT\(([^)]+)\)/gi, "STRING_AGG($1, ',')");
  pgSql = pgSql.replace(/DATE_FORMAT\(([^,]+),\s*'%m\/%Y'\)/gi, "TO_CHAR($1, 'MM/YYYY')");
  pgSql = pgSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
  pgSql = pgSql.replace(/DATEDIFF\(([^,]+),\s*([^)]+)\)/gi, '($1 - $2)');
  pgSql = pgSql.replace(/N'([^']*)'/g, "'$1'");

  // Fix GROUP BY for Postgres strictness
  if (pgSql.includes('GROUP BY pm.MaPM')) {
    pgSql = pgSql.replace('GROUP BY pm.MaPM', 'GROUP BY pm.MaPM, nd.HoTen, nd.MaSV, pm.HanTra');
  }
  if (pgSql.includes('GROUP BY c.MaTL')) {
    pgSql = pgSql.replace('GROUP BY c.MaTL', 'GROUP BY c.MaTL, tl.TenTL');
  }
  if (pgSql.includes('GROUP BY thang')) {
    pgSql = pgSql.replace('GROUP BY thang', "GROUP BY TO_CHAR(NgayMuon, 'MM/YYYY')");
  }

  // Replace ? with $1, $2, etc.
  let paramCount = 0;
  pgSql = pgSql.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });

  return { pgSql, pgParams: params };
}

// ─── KẾT NỐI POSTGRESQL ──────────────────────────────────────────────────────
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'QuanLyThuVien',
    };

const pgPool = new pg.Pool(poolConfig);

// Compatibility wrapper for mysql2 interface
const pool = {
  async query(sql, params) {
    const { pgSql, pgParams } = translateQuery(sql, params);
    const res = await pgPool.query(pgSql, pgParams);
    const normalizedRows = res.rows.map(normalizeRow);
    return [normalizedRows, null];
  },
  async getConnection() {
    const client = await pgPool.connect();
    return {
      async query(sql, params) {
        const { pgSql, pgParams } = translateQuery(sql, params);
        const res = await client.query(pgSql, pgParams);
        const normalizedRows = res.rows.map(normalizeRow);
        return [normalizedRows, null];
      },
      async beginTransaction() {
        await client.query('BEGIN');
      },
      async commit() {
        await client.query('COMMIT');
      },
      async rollback() {
        await client.query('ROLLBACK');
      },
      release() {
        client.release();
      }
    };
  }
};

// Test kết nối
pool.getConnection()
  .then(conn => { console.log('✅ Kết nối PostgreSQL thành công!'); conn.release(); })
  .catch(err => console.error('❌ Lỗi kết nối PostgreSQL:', err.message));

// ─── ĐĂNG NHẬP NHÂN VIÊN ─────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { maNV, matKhau } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM NHANVIEN WHERE MaNV = ?', [maNV]
    );
    if (rows.length === 0) return res.json({ success: false, message: 'Mã nhân viên không tồn tại' });
    // Đơn giản: so sánh thẳng (thực tế nên dùng bcrypt)
    if (matKhau !== '123456') return res.json({ success: false, message: 'Mật khẩu không đúng' });
    res.json({ success: true, nhanvien: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ĐĂNG NHẬP SINH VIÊN ─────────────────────────────────────────────────────
app.post('/api/login/sinhvien', async (req, res) => {
  const { maSV, matKhau } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT MaSV, HoTen, MatKhau, TrangThaiTK FROM NGUOIDUNG WHERE MaSV = ?', [maSV]
    );
    if (rows.length === 0) return res.json({ success: false, message: 'Mã sinh viên không tồn tại' });
    const sv = rows[0];
    if (matKhau !== sv.MatKhau) return res.json({ success: false, message: 'Mật khẩu không đúng' });
    if (sv.TrangThaiTK !== 'Hoạt động') return res.json({ success: false, message: 'Tài khoản đã bị khóa' });
    res.json({ success: true, sinhvien: { MaSV: sv.MaSV, HoTen: sv.HoTen, TrangThaiTK: sv.TrangThaiTK } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DASHBOARD TỔNG QUAN ──────────────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  try {
    const [[{ tongTL }]] = await pool.query('SELECT COUNT(*) as tongTL FROM TAILIEU');
    const [[{ dangMuon }]] = await pool.query("SELECT COUNT(*) as dangMuon FROM TAILIEU WHERE TrangThai = N'Đang mượn'");
    const [[{ tongSV }]] = await pool.query('SELECT COUNT(*) as tongSV FROM NGUOIDUNG');
    const [[{ phieuChuaTra }]] = await pool.query('SELECT COUNT(*) as phieuChuaTra FROM PHIEUMUON WHERE NgayTra IS NULL');
    const [[{ quaHan }]] = await pool.query(
      'SELECT COUNT(*) as quaHan FROM PHIEUMUON WHERE NgayTra IS NULL AND HanTra < CURDATE()'
    );
    res.json({ tongTL, dangMuon, tongSV, phieuChuaTra, quaHan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── TÀI LIỆU ────────────────────────────────────────────────────────────────
app.get('/api/tailieu', async (req, res) => {
  const { search, loai, trangthai } = req.query;
  let sql = 'SELECT * FROM TAILIEU WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (TenTL LIKE ? OR TacGia LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (loai) { sql += ' AND LoaiTL = ?'; params.push(loai); }
  if (trangthai) { sql += ' AND TrangThai = ?'; params.push(trangthai); }
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/tailieu/:maTL', async (req, res) => {
  const { TenTL, TacGia, NhaXuatBan, NamXB, LoaiTL, TrangThai } = req.body;
  try {
    await pool.query(
      'UPDATE TAILIEU SET TenTL=?, TacGia=?, NhaXuatBan=?, NamXB=?, LoaiTL=?, TrangThai=? WHERE MaTL=?',
      [TenTL, TacGia, NhaXuatBan, NamXB, LoaiTL, TrangThai, req.params.maTL]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tailieu', async (req, res) => {
  const { MaTL, TenTL, TacGia, NhaXuatBan, NamXB, LoaiTL, TrangThai } = req.body;
  try {
    await pool.query(
      'INSERT INTO TAILIEU (MaTL, TenTL, TacGia, NhaXuatBan, NamXB, LoaiTL, TrangThai) VALUES (?,?,?,?,?,?,?)',
      [MaTL, TenTL, TacGia, NhaXuatBan, NamXB, LoaiTL, TrangThai || 'Còn']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── NGƯỜI DÙNG ───────────────────────────────────────────────────────────────
app.get('/api/nguoidung', async (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM NGUOIDUNG WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (HoTen LIKE ? OR MaSV LIKE ? OR Email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/nguoidung/:maSV/trangthai', async (req, res) => {
  const { trangThai } = req.body;
  try {
    await pool.query('UPDATE NGUOIDUNG SET TrangThaiTK=? WHERE MaSV=?', [trangThai, req.params.maSV]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/nguoidung', async (req, res) => {
  const { MaSV, HoTen, TenDangNhap, MatKhau, SoDT, Email } = req.body;
  if (!MaSV || !HoTen || !TenDangNhap || !MatKhau) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
  }
  try {
    const [exist] = await pool.query(
      'SELECT MaSV, TenDangNhap, Email FROM NGUOIDUNG WHERE MaSV = ? OR TenDangNhap = ? OR (Email IS NOT NULL AND Email = ?)',
      [MaSV, TenDangNhap, Email || null]
    );
    if (exist.length > 0) {
      if (exist[0].MaSV === MaSV) return res.json({ success: false, message: 'Mã sinh viên đã tồn tại' });
      if (exist[0].TenDangNhap === TenDangNhap) return res.json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
      if (Email && exist[0].Email === Email) return res.json({ success: false, message: 'Email đã tồn tại' });
    }
    await pool.query(
      'INSERT INTO NGUOIDUNG (MaSV, HoTen, TenDangNhap, MatKhau, SoDT, Email, TrangThaiTK) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [MaSV, HoTen, TenDangNhap, MatKhau, SoDT || null, Email || null, 'Hoạt động']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/nguoidung/:maSV', async (req, res) => {
  const { HoTen, TenDangNhap, MatKhau, SoDT, Email, TrangThaiTK } = req.body;
  const { maSV } = req.params;
  if (!HoTen || !TenDangNhap || !MatKhau) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
  }
  try {
    const [exist] = await pool.query(
      'SELECT MaSV, TenDangNhap, Email FROM NGUOIDUNG WHERE (TenDangNhap = ? OR (Email IS NOT NULL AND Email = ?)) AND MaSV != ?',
      [TenDangNhap, Email || null, maSV]
    );
    if (exist.length > 0) {
      if (exist[0].TenDangNhap === TenDangNhap) return res.json({ success: false, message: 'Tên đăng nhập đã tồn tại ở tài khoản khác' });
      if (Email && exist[0].Email === Email) return res.json({ success: false, message: 'Email đã tồn tại ở tài khoản khác' });
    }
    await pool.query(
      'UPDATE NGUOIDUNG SET HoTen = ?, TenDangNhap = ?, MatKhau = ?, SoDT = ?, Email = ?, TrangThaiTK = ? WHERE MaSV = ?',
      [HoTen, TenDangNhap, MatKhau, SoDT || null, Email || null, TrangThaiTK || 'Hoạt động', maSV]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PHIẾU MƯỢN ──────────────────────────────────────────────────────────────
app.get('/api/phieumuon', async (req, res) => {
  const { trangthai, maSV } = req.query;
  let sql = `
    SELECT pm.*, nd.HoTen, GROUP_CONCAT(c.MaTL SEPARATOR ', ') as DanhSachTL
    FROM PHIEUMUON pm
    LEFT JOIN NGUOIDUNG nd ON pm.MaSV = nd.MaSV
    LEFT JOIN CHUA c ON pm.MaPM = c.MaPM
    WHERE 1=1
  `;
  const params = [];
  if (trangthai === 'dangmuon') { sql += ' AND pm.NgayTra IS NULL'; }
  if (trangthai === 'quahan') { sql += ' AND pm.NgayTra IS NULL AND pm.HanTra < CURDATE()'; }
  if (trangthai === 'dattra') { sql += ' AND pm.NgayTra IS NOT NULL'; }
  if (maSV) { sql += ' AND pm.MaSV = ?'; params.push(maSV); }
  sql += ' GROUP BY pm.MaPM ORDER BY pm.NgayMuon DESC';
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── TẠO PHIẾU MƯỢN (có kiểm tra điều kiện) ─────────────────────────────────
app.post('/api/phieumuon', async (req, res) => {
  const { MaPM, NgayMuon, HanTra, MaSV, MaNV, DanhSachTL } = req.body;

  // Kiểm tra 1 — Trạng thái tài khoản sinh viên
  try {
    const [svRows] = await pool.query('SELECT TrangThaiTK FROM NGUOIDUNG WHERE MaSV = ?', [MaSV]);
    if (svRows.length === 0) return res.json({ success: false, message: 'Sinh viên không tồn tại' });
    if (svRows[0].TrangThaiTK !== 'Hoạt động') return res.json({ success: false, message: 'Tài khoản sinh viên đã bị khóa, không thể mượn tài liệu' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }

  // Kiểm tra 2 — Giới hạn 5 phiếu đang mượn
  try {
    const [[{ soPhieu }]] = await pool.query('SELECT COUNT(*) as soPhieu FROM PHIEUMUON WHERE MaSV = ? AND NgayTra IS NULL', [MaSV]);
    if (parseInt(soPhieu) >= 5) return res.json({ success: false, message: 'Sinh viên đã đạt giới hạn 5 phiếu mượn, vui lòng trả bớt trước khi mượn thêm' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }

  // Kiểm tra 3 — Đang có phiếu quá hạn
  try {
    const [[{ soQuaHan }]] = await pool.query('SELECT COUNT(*) as soQuaHan FROM PHIEUMUON WHERE MaSV = ? AND NgayTra IS NULL AND HanTra < CURRENT_DATE', [MaSV]);
    if (parseInt(soQuaHan) > 0) return res.json({ success: false, message: 'Sinh viên đang có phiếu mượn quá hạn, vui lòng trả trước khi mượn thêm' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }

  // Tất cả hợp lệ — thực hiện INSERT
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO PHIEUMUON (MaPM, NgayMuon, HanTra, NgayTra, SoLanGiaHan, MaSV, MaNV) VALUES (?,?,?,NULL,0,?,?)',
      [MaPM, NgayMuon, HanTra, MaSV, MaNV]
    );
    for (const maTL of DanhSachTL) {
      await conn.query('INSERT INTO CHUA (MaPM, MaTL) VALUES (?,?)', [MaPM, maTL]);
      await conn.query("UPDATE TAILIEU SET TrangThai=N'Đang mượn' WHERE MaTL=?", [maTL]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

app.put('/api/phieumuon/:maPM/tra', async (req, res) => {
  const { NgayTra, DanhSachTL } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE PHIEUMUON SET NgayTra=? WHERE MaPM=?', [NgayTra, req.params.maPM]);
    for (const maTL of DanhSachTL) {
      await conn.query("UPDATE TAILIEU SET TrangThai=N'Còn' WHERE MaTL=?", [maTL]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ─── GIA HẠN PHIẾU MƯỢN (có kiểm tra giới hạn 3 lần) ───────────────────────
app.put('/api/phieumuon/:maPM/giahan', async (req, res) => {
  const { HanTraMoi } = req.body;
  const { maPM } = req.params;
  try {
    // Kiểm tra phiếu tồn tại
    const [rows] = await pool.query('SELECT SoLanGiaHan, NgayTra FROM PHIEUMUON WHERE MaPM = ?', [maPM]);
    if (rows.length === 0) return res.json({ success: false, message: 'Không tìm thấy phiếu mượn' });
    const phieu = rows[0];
    // Kiểm tra đã trả chưa
    if (phieu.NgayTra !== null) return res.json({ success: false, message: 'Phiếu đã được trả, không thể gia hạn' });
    // Kiểm tra giới hạn gia hạn
    if (parseInt(phieu.SoLanGiaHan) >= 3) return res.json({ success: false, message: 'Đã vượt quá số lần gia hạn cho phép (tối đa 3 lần)' });
    // Thực hiện gia hạn
    await pool.query(
      'UPDATE PHIEUMUON SET HanTra=?, SoLanGiaHan=SoLanGiaHan+1 WHERE MaPM=?',
      [HanTraMoi, maPM]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── THỐNG KÊ ─────────────────────────────────────────────────────────────────
app.get('/api/thongke', async (req, res) => {
  try {
    const [luotMuonTheoThang] = await pool.query(`
      SELECT DATE_FORMAT(NgayMuon, '%m/%Y') as thang, COUNT(*) as soLuot
      FROM PHIEUMUON GROUP BY thang ORDER BY MIN(NgayMuon) DESC LIMIT 6
    `);
    const [tlHayMuon] = await pool.query(`
      SELECT tl.TenTL, COUNT(c.MaTL) as soLuot
      FROM CHUA c JOIN TAILIEU tl ON c.MaTL = tl.MaTL
      GROUP BY c.MaTL ORDER BY soLuot DESC LIMIT 5
    `);
    const [viPham] = await pool.query(`
      SELECT pm.MaPM, nd.HoTen, pm.MaSV, pm.HanTra,
             DATEDIFF(CURDATE(), pm.HanTra) as soNgayTre
      FROM PHIEUMUON pm JOIN NGUOIDUNG nd ON pm.MaSV = nd.MaSV
      WHERE pm.NgayTra IS NULL AND pm.HanTra < CURDATE()
      ORDER BY soNgayTre DESC
    `);
    res.json({ luotMuonTheoThang, tlHayMuon, viPham });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CHATBOT AI ───────────────────────────────────────────────────────────────
app.post('/api/chatbot', async (req, res) => {
  const { message } = req.body;
  try {
    // Lấy dữ liệu thực từ DB để đưa vào context cho AI
    const [tailieu] = await pool.query('SELECT MaTL, TenTL, TacGia, LoaiTL, TrangThai FROM TAILIEU');
    const [phieuQuaHan] = await pool.query(`
      SELECT pm.MaPM, nd.HoTen, pm.MaSV, pm.HanTra, GROUP_CONCAT(c.MaTL) as TL,
             DATEDIFF(CURDATE(), pm.HanTra) as soNgayTre
      FROM PHIEUMUON pm
      JOIN NGUOIDUNG nd ON pm.MaSV = nd.MaSV
      LEFT JOIN CHUA c ON pm.MaPM = c.MaPM
      WHERE pm.NgayTra IS NULL AND pm.HanTra < CURDATE()
      GROUP BY pm.MaPM
    `);
    const [dangMuon] = await pool.query(`
      SELECT pm.MaPM, nd.HoTen, pm.MaSV, pm.HanTra, GROUP_CONCAT(c.MaTL) as TL
      FROM PHIEUMUON pm
      JOIN NGUOIDUNG nd ON pm.MaSV = nd.MaSV
      LEFT JOIN CHUA c ON pm.MaPM = c.MaPM
      WHERE pm.NgayTra IS NULL
      GROUP BY pm.MaPM
    `);

    const dbContext = `
Dữ liệu thư viện hiện tại:

DANH SÁCH TÀI LIỆU:
${tailieu.map(t => `- [${t.MaTL}] ${t.TenTL} | Tác giả: ${t.TacGia} | Loại: ${t.LoaiTL} | Trạng thái: ${t.TrangThai}`).join('\n')}

PHIẾU MƯỢN QUÁ HẠN:
${phieuQuaHan.length === 0 ? 'Không có' : phieuQuaHan.map(p => `- ${p.MaPM}: ${p.HoTen} (${p.MaSV}) | Tài liệu: ${p.TL} | Quá ${p.soNgayTre} ngày`).join('\n')}

PHIẾU ĐANG MƯỢN:
${dangMuon.map(p => `- ${p.MaPM}: ${p.HoTen} (${p.MaSV}) | Tài liệu: ${p.TL} | Hạn trả: ${p.HanTra}`).join('\n')}
    `;

    const systemPrompt = `Bạn là Chatbot AI của hệ thống quản lý thư viện đại học. Nhiệm vụ của bạn là hỗ trợ nhân viên thư viện tra cứu thông tin nhanh chóng.\n\n${dbContext}\n\nHãy trả lời ngắn gọn, chính xác dựa trên dữ liệu trên. Nếu không tìm thấy thông tin, hãy nói rõ. Trả lời bằng tiếng Việt.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const replyText = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';
    res.json({ reply: replyText });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ─── KHỞI ĐỘNG SERVER ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
