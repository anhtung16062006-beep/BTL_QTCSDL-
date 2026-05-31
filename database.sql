-- ═══════════════════════════════════════════════════════════════
-- HỆ THỐNG QUẢN LÝ THƯ VIỆN ĐẠI HỌC
-- File: database.sql
-- Chạy file này trong MySQL để khởi tạo toàn bộ CSDL
-- ═══════════════════════════════════════════════════════════════

DROP DATABASE IF EXISTS QuanLyThuVien;
CREATE DATABASE QuanLyThuVien CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE QuanLyThuVien;

-- ─────────────────────────────────────────────── BẢNG NHANVIEN
CREATE TABLE NHANVIEN (
    MaNV    VARCHAR(20)  PRIMARY KEY,
    TenNV   VARCHAR(50)  NOT NULL,
    SoDTNV  VARCHAR(10),
    ChucVu  VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO NHANVIEN (MaNV, TenNV, SoDTNV, ChucVu) VALUES
('PLB07355', 'Nguyễn Văn Nam',  '0911111111', 'Thủ thư'),
('PLB07356', 'Trần Thị Hoa',    '0922222222', 'Quản lý'),
('PLB07357', 'Lê Minh Tuấn',    '0933333333', 'Thủ thư'),
('PLB07358', 'Phạm Quốc Bảo',   '0944444444', 'Nhân viên'),
('PLB07359', 'Đỗ Khánh Linh',   '0955555555', 'Nhân viên'),
('PLB07360', 'Vũ Thanh Sơn',    '0966666666', 'Thủ thư'),
('PLB07361', 'Hoàng Gia Huy',   '0977777777', 'Quản lý'),
('PLB07362', 'Bùi Ngọc Anh',    '0988888888', 'Nhân viên'),
('PLB07363', 'Ngô Đức Minh',    '0999999999', 'Thủ thư'),
('PLB07364', 'Đặng Thu Hà',     '0900000000', 'Nhân viên');

-- ─────────────────────────────────────────────── BẢNG NGUOIDUNG
CREATE TABLE NGUOIDUNG (
    MaSV        VARCHAR(20)  PRIMARY KEY,
    TenDangNhap VARCHAR(30)  UNIQUE,
    MatKhau     VARCHAR(50),
    HoTen       VARCHAR(50)  NOT NULL,
    SoDT        VARCHAR(10),
    Email       VARCHAR(100) UNIQUE,
    TrangThaiTK VARCHAR(30)  DEFAULT 'Hoạt động'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO NGUOIDUNG (MaSV, TenDangNhap, MatKhau, HoTen, SoDT, Email, TrangThaiTK) VALUES
('24D190176', 'user01', '123456', 'Nguyễn Minh Anh',   '0901111111', 'minhanh@gmail.com',   'Hoạt động'),
('24D190177', 'user02', '123456', 'Trần Gia Bảo',       '0902222222', 'giabao@gmail.com',    'Hoạt động'),
('24D190178', 'user03', '123456', 'Lê Thị Cẩm Ly',     '0903333333', 'camly@gmail.com',     'Bị Khoá'),
('24D190179', 'user04', '123456', 'Phạm Hoàng Long',    '0904444444', 'hoanglong@gmail.com', 'Hoạt động'),
('24D190180', 'user05', '123456', 'Đỗ Ngọc Hà',         '0905555555', 'ngoch@gmail.com',     'Hoạt động'),
('24D190181', 'user06', '123456', 'Vũ Thanh Tùng',      '0906666666', 'thanhtung@gmail.com', 'Hoạt động'),
('24D190182', 'user07', '123456', 'Hoàng Minh Châu',    '0907777777', 'minhchau@gmail.com',  'Tạm Khoá'),
('24D190183', 'user08', '123456', 'Bùi Khánh Linh',     '0908888888', 'khanhlinh@gmail.com', 'Hoạt động'),
('24D190184', 'user09', '123456', 'Ngô Quốc Đạt',       '0909999999', 'quocdat@gmail.com',   'Hoạt động'),
('24D190185', 'user10', '123456', 'Đặng Thuý An',       '0910000000', 'thuyan@gmail.com',    'Hoạt động');

-- ─────────────────────────────────────────────── BẢNG TAILIEU
CREATE TABLE TAILIEU (
    MaTL        VARCHAR(20)  PRIMARY KEY,
    TenTL       VARCHAR(100) NOT NULL,
    TacGia      VARCHAR(50),
    NhaXuatBan  VARCHAR(100),
    NamXB       INT,
    LoaiTL      VARCHAR(50),
    TrangThai   VARCHAR(30)  DEFAULT 'Còn'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO TAILIEU (MaTL, TenTL, TacGia, NhaXuatBan, NamXB, LoaiTL, TrangThai) VALUES
('TL001', 'Cơ sở dữ liệu',               'Nguyễn Văn A', 'NXB Giáo Dục',            2020, 'Sách',      'Còn'),
('TL002', 'Lập trình Java',               'Trần Thị B',   'NXB Thanh Niên',           2021, 'Sách',      'Còn'),
('TL003', 'Mạng máy tính',                'Lê Văn C',     'NXB Lao Động',             2019, 'Sách',      'Đang mượn'),
('TL004', 'Trí tuệ nhân tạo',             'Phạm Văn D',   'NXB Khoa Học',             2022, 'Sách',      'Còn'),
('TL005', 'Hệ điều hành',                 'Nguyễn Thị E', 'NXB Đại Học Quốc Gia',    2018, 'Sách',      'Mất'),
('TL006', 'Phân tích thiết kế hệ thống',  'Hoàng Văn F',  'NXB Thông Tin',            2020, 'Giáo trình','Còn'),
('TL007', 'An toàn thông tin',            'Đỗ Thị G',     'NXB Công Thương',          2023, 'Sách',      'Còn'),
('TL008', 'Toán rời rạc',                 'Bùi Văn H',    'NXB Giáo Dục',             2017, 'Giáo trình','Đang mượn'),
('TL009', 'Kỹ năng mềm',                  'Phạm Thị I',   'NXB Thanh Niên',           2021, 'Tài liệu',  'Còn'),
('TL010', 'Khai phá dữ liệu',             'Nguyễn Văn K', 'NXB Khoa Học Kỹ Thuật',   2024, 'Sách',      'Còn');

-- ─────────────────────────────────────────────── BẢNG PHIEUMUON
-- Lưu ý: MaPM kiểu INT, dùng số nguyên thay vì chuỗi 'PM2025001'
CREATE TABLE PHIEUMUON (
    MaPM        INT          PRIMARY KEY,
    NgayMuon    DATE,
    HanTra      DATE,
    NgayTra     DATE,
    SoLanGiaHan INT          DEFAULT 0,
    MaSV        VARCHAR(20),
    MaNV        VARCHAR(20),
    FOREIGN KEY (MaSV) REFERENCES NGUOIDUNG(MaSV),
    FOREIGN KEY (MaNV) REFERENCES NHANVIEN(MaNV)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO PHIEUMUON (MaPM, NgayMuon, HanTra, NgayTra, SoLanGiaHan, MaSV, MaNV) VALUES
(20250102, '2025-01-02', '2025-01-16', '2025-01-15', 0, '24D190176', 'PLB07355'),
(20250105, '2025-01-05', '2025-01-19', '2025-01-20', 1, '24D190177', 'PLB07356'),
(20250110, '2025-01-10', '2025-01-24', NULL,          2, '24D190178', 'PLB07357'),
(20250112, '2025-01-12', '2025-01-26', '2025-01-25', 0, '24D190179', 'PLB07358'),
(20250115, '2025-01-15', '2025-01-29', NULL,          1, '24D190180', 'PLB07359'),
(20250118, '2025-01-18', '2025-02-01', '2025-01-30', 0, '24D190181', 'PLB07360'),
(20250120, '2025-01-20', '2025-02-03', NULL,          0, '24D190182', 'PLB07361'),
(20250122, '2025-01-22', '2025-02-05', '2025-02-06', 1, '24D190183', 'PLB07362'),
(20250125, '2025-01-25', '2025-02-08', '2025-02-07', 0, '24D190184', 'PLB07363'),
(20250128, '2025-01-28', '2025-02-11', NULL,          0, '24D190185', 'PLB07364');

-- ─────────────────────────────────────────────── BẢNG CHUA
-- Bảng liên kết PHIEUMUON - TAILIEU (1 phiếu chứa nhiều tài liệu)
CREATE TABLE CHUA (
    MaPM  INT,
    MaTL  VARCHAR(20),
    PRIMARY KEY (MaPM, MaTL),
    FOREIGN KEY (MaPM) REFERENCES PHIEUMUON(MaPM),
    FOREIGN KEY (MaTL) REFERENCES TAILIEU(MaTL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO CHUA (MaPM, MaTL) VALUES
(20250102, 'TL001'),
(20250102, 'TL002'),
(20250105, 'TL003'),
(20250105, 'TL004'),
(20250110, 'TL005'),
(20250110, 'TL006'),
(20250112, 'TL007'),
(20250115, 'TL008'),
(20250118, 'TL009'),
(20250120, 'TL010');

-- ─────────────────────────────────────────────── KIỂM TRA
SELECT 'NHANVIEN'  AS Bang, COUNT(*) AS SoBanGhi FROM NHANVIEN
UNION ALL
SELECT 'NGUOIDUNG', COUNT(*) FROM NGUOIDUNG
UNION ALL
SELECT 'TAILIEU',   COUNT(*) FROM TAILIEU
UNION ALL
SELECT 'PHIEUMUON', COUNT(*) FROM PHIEUMUON
UNION ALL
SELECT 'CHUA',      COUNT(*) FROM CHUA;
