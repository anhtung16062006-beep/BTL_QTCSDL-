const API = '/api';
let currentNV = null;
let currentSV = null;
let currentTab = 'dangmuon';
let currentSVSection = 'sachmuon';

// ═══════════════════════════════════════════════ INIT
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('sv-today-date').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const savedNV = sessionStorage.getItem('nhanvien');
  const savedSV = sessionStorage.getItem('sinhvien');

  if (savedNV) {
    currentNV = JSON.parse(savedNV);
    setNhanVienUI();
    showApp();
  } else if (savedSV) {
    currentSV = JSON.parse(savedSV);
    showSVApp();
  }

  // Set default date cho form (30 ngày)
  const today = new Date().toISOString().split('T')[0];
  const next30 = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
  if (document.getElementById('new-ngayMuon')) document.getElementById('new-ngayMuon').value = today;
  if (document.getElementById('new-hanTra')) document.getElementById('new-hanTra').value = next30;
});

// ═══════════════════════════════════════════════ LOGIN TAB SWITCH
function switchLoginTab(role) {
  document.getElementById('form-nhanvien').style.display = role === 'nhanvien' ? 'block' : 'none';
  document.getElementById('form-sinhvien').style.display = role === 'sinhvien' ? 'block' : 'none';
  document.getElementById('tab-nhanvien').classList.toggle('active', role === 'nhanvien');
  document.getElementById('tab-sinhvien').classList.toggle('active', role === 'sinhvien');
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-error-sv').textContent = '';
}

// ═══════════════════════════════════════════════ AUTH — NHÂN VIÊN
async function doLogin() {
  const maNV = document.getElementById('login-manv').value.trim();
  const matKhau = document.getElementById('login-matkhau').value;
  const errEl = document.getElementById('login-error');
  if (!maNV || !matKhau) { errEl.textContent = 'Vui lòng nhập đầy đủ thông tin'; return; }
  try {
    const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maNV, matKhau }) });
    const data = await res.json();
    if (data.success) {
      currentNV = data.nhanvien;
      sessionStorage.setItem('nhanvien', JSON.stringify(currentNV));
      setNhanVienUI();
      showApp();
    } else {
      errEl.textContent = data.message;
    }
  } catch (e) {
    errEl.textContent = 'Không thể kết nối đến server. Hãy chắc server đang chạy!';
  }
}

function setNhanVienUI() {
  if (!currentNV) return;
  document.getElementById('nv-ten').textContent = currentNV.TenNV || currentNV.TenNV;
  document.getElementById('nv-chucvu').textContent = currentNV.ChucVu;
  const initials = (currentNV.TenNV || '').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
  document.getElementById('nv-avatar').textContent = initials || 'NV';
}

function showApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-sinhvien').classList.remove('active');
  document.getElementById('page-app').classList.add('active');
  loadDashboard();
}

function doLogout() {
  sessionStorage.removeItem('nhanvien');
  currentNV = null;
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
  document.getElementById('login-manv').value = '';
  document.getElementById('login-matkhau').value = '';
  document.getElementById('login-error').textContent = '';
}

// ═══════════════════════════════════════════════ AUTH — SINH VIÊN
async function doLoginSV() {
  const maSV = document.getElementById('login-masv').value.trim();
  const matKhau = document.getElementById('login-matkhau-sv').value;
  const errEl = document.getElementById('login-error-sv');
  if (!maSV || !matKhau) { errEl.textContent = 'Vui lòng nhập đầy đủ thông tin'; return; }
  try {
    const res = await fetch(`${API}/login/sinhvien`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maSV, matKhau }) });
    const data = await res.json();
    if (data.success) {
      currentSV = data.sinhvien;
      sessionStorage.setItem('sinhvien', JSON.stringify(currentSV));
      showSVApp();
    } else {
      errEl.textContent = data.message;
    }
  } catch (e) {
    errEl.textContent = 'Không thể kết nối đến server. Hãy chắc server đang chạy!';
  }
}

function showSVApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-sinhvien').classList.add('active');
  // Cập nhật thông tin sinh viên
  if (currentSV) {
    document.getElementById('sv-hoten').textContent = currentSV.HoTen || '---';
    const initials = (currentSV.HoTen || 'SV').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
    document.getElementById('sv-avatar').textContent = initials || 'SV';
  }
  // Load dữ liệu mặc định
  showSVSection('sachmuon');
}

function doLogoutSV() {
  sessionStorage.removeItem('sinhvien');
  currentSV = null;
  document.getElementById('page-sinhvien').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
  document.getElementById('login-masv').value = '';
  document.getElementById('login-matkhau-sv').value = '';
  document.getElementById('login-error-sv').textContent = '';
  switchLoginTab('sinhvien');
}

// ═══════════════════════════════════════════════ NAVIGATION (SINH VIÊN)
function showSVSection(name) {
  currentSVSection = name;
  document.querySelectorAll('.sv-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sv-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`sv-section-${name}`).classList.add('active');
  document.getElementById(`sv-btn-${name}`).classList.add('active');

  if (name === 'sachmuon') loadSVSachDangMuon();
  if (name === 'thongke') loadSVThongKe();
}

// ─── Load sách đang mượn của sinh viên
async function loadSVSachDangMuon() {
  if (!currentSV) return;
  const tbody = document.getElementById('sv-sach-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Đang tải dữ liệu...</td></tr>';
  try {
    const res = await fetch(`${API}/phieumuon?trangthai=dangmuon&maSV=${currentSV.MaSV}`);
    const list = await res.json();

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-row" style="color:#059669">✓ Bạn hiện không có sách đang mượn</td></tr>';
      document.getElementById('sv-alert-quahan').style.display = 'none';
      return;
    }

    const today = new Date();
    let hasQuaHan = false;
    tbody.innerHTML = list.map(p => {
      const isQuaHan = new Date(p.HanTra) < today;
      if (isQuaHan) hasQuaHan = true;
      return `<tr style="${isQuaHan ? 'background:#fff5f5;' : ''}">
        <td><strong>${p.MaPM}</strong></td>
        <td style="max-width:200px;font-size:13px">${p.DanhSachTL || '--'}</td>
        <td>${formatDate(p.NgayMuon)}</td>
        <td>${isQuaHan ? `<span style="color:var(--red);font-weight:600">${formatDate(p.HanTra)} ⚠️</span>` : formatDate(p.HanTra)}</td>
        <td style="text-align:center">${p.SoLanGiaHan}</td>
        <td>${isQuaHan ? '<span class="badge badge-quahan">Quá Hạn</span>' : '<span class="badge badge-muon">Đang Mượn</span>'}</td>
      </tr>`;
    }).join('');

    document.getElementById('sv-alert-quahan').style.display = hasQuaHan ? 'block' : 'none';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Lỗi tải dữ liệu</td></tr>';
  }
}

// ─── Load thống kê cho sinh viên (dùng chung API /api/thongke)
async function loadSVThongKe() {
  try {
    const res = await fetch(`${API}/thongke`);
    const d = await res.json();

    const maxLuot = Math.max(...d.luotMuonTheoThang.map(x => x.soLuot), 1);
    document.getElementById('sv-chart-thang').innerHTML = d.luotMuonTheoThang.map(x => `
      <div class="bar-item">
        <div class="bar-label">${x.thang}</div>
        <div class="bar-track"><div class="bar-fill teal" style="width:${Math.round(x.soLuot/maxLuot*100)}%">${x.soLuot}</div></div>
      </div>`).join('');

    const maxTL = Math.max(...d.tlHayMuon.map(x => x.soLuot), 1);
    document.getElementById('sv-chart-tl').innerHTML = d.tlHayMuon.map(x => `
      <div class="bar-item">
        <div class="bar-label" style="font-size:11px">${x.TenTL.length > 18 ? x.TenTL.substring(0,18)+'...' : x.TenTL}</div>
        <div class="bar-track"><div class="bar-fill orange" style="width:${Math.round(x.soLuot/maxTL*100)}%">${x.soLuot}</div></div>
      </div>`).join('');
  } catch (e) { console.error(e); }
}

// ═══════════════════════════════════════════════ NAVIGATION (NHÂN VIÊN)
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  document.querySelector(`[data-section="${name}"]`).classList.add('active');

  if (name === 'dashboard') loadDashboard();
  if (name === 'tailieu') loadTaiLieu();
  if (name === 'nguoidung') loadNguoiDung();
  if (name === 'muonttra') loadPhieuMuon(currentTab);
  if (name === 'thongke') loadThongKe();
}

function switchTab(btn, tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTab = tab;
  loadPhieuMuon(tab);
}

// ═══════════════════════════════════════════════ DASHBOARD
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/dashboard`);
    const d = await res.json();
    document.getElementById('stat-tongtl').textContent = d.tongTL;
    document.getElementById('stat-dangmuon').textContent = d.dangMuon;
    document.getElementById('stat-tongsv').textContent = d.tongSV;
    document.getElementById('stat-quahan').textContent = d.quaHan;

    // Phiếu đang mượn
    const pmRes = await fetch(`${API}/phieumuon?trangthai=dangmuon`);
    const pmList = await pmRes.json();
    const pmEl = document.getElementById('dash-phieu-list');
    if (pmList.length === 0) { pmEl.innerHTML = '<div class="dash-item"><span class="item-meta">Không có phiếu nào đang mượn</span></div>'; }
    else {
      pmEl.innerHTML = pmList.slice(0, 5).map(p => `
        <div class="dash-item">
          <div><div class="item-name">${p.HoTen}</div><div class="item-meta">${p.MaPM} • ${p.DanhSachTL || '--'}</div></div>
          <span class="item-badge" style="background:#fef3c7;color:#d97706">Hạn: ${formatDate(p.HanTra)}</span>
        </div>`).join('');
    }

    // Vi phạm
    const vpRes = await fetch(`${API}/phieumuon?trangthai=quahan`);
    const vpList = await vpRes.json();
    const vpEl = document.getElementById('dash-vipham-list');
    if (vpList.length === 0) { vpEl.innerHTML = '<div class="dash-item"><span class="item-meta" style="color:#059669">✓ Không có vi phạm</span></div>'; }
    else {
      vpEl.innerHTML = vpList.slice(0, 5).map(p => `
        <div class="dash-item">
          <div><div class="item-name">${p.HoTen}</div><div class="item-meta">${p.MaPM} • ${p.DanhSachTL || '--'}</div></div>
          <span class="item-badge badge-quahan">Trễ ${daysDiff(p.HanTra)} ngày</span>
        </div>`).join('');
    }
  } catch (e) { console.error(e); }
}

// ═══════════════════════════════════════════════ TÀI LIỆU
async function loadTaiLieu() {
  const search = document.getElementById('tl-search').value;
  const loai = document.getElementById('tl-loai').value;
  const trangthai = document.getElementById('tl-trangthai').value;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (loai) params.set('loai', loai);
  if (trangthai) params.set('trangthai', trangthai);
  try {
    const res = await fetch(`${API}/tailieu?${params}`);
    const list = await res.json();
    const tbody = document.getElementById('tl-tbody');
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Không tìm thấy tài liệu nào</td></tr>'; return; }
    tbody.innerHTML = list.map(t => `
      <tr>
        <td><strong>${t.MaTL}</strong></td>
        <td>${t.TenTL}</td>
        <td>${t.TacGia || '--'}</td>
        <td>${t.NhaXuatBan || '--'}</td>
        <td>${t.NamXB || '--'}</td>
        <td>${t.LoaiTL || '--'}</td>
        <td><span class="badge ${badgeTL(t.TrangThai)}">${t.TrangThai}</span></td>
        <td><button class="btn-sm btn-edit" onclick='openEditTL(${JSON.stringify(t)})'>Sửa</button></td>
      </tr>`).join('');
  } catch (e) { document.getElementById('tl-tbody').innerHTML = '<tr><td colspan="8" class="loading-row">Lỗi tải dữ liệu</td></tr>'; }
}

function badgeTL(tt) {
  if (tt === 'Còn') return 'badge-con';
  if (tt === 'Đang mượn') return 'badge-muon';
  if (tt === 'Hỏng') return 'badge-hong';
  return 'badge-mat';
}

function openEditTL(t) {
  document.getElementById('edit-maTL').value = t.MaTL;
  document.getElementById('edit-tenTL').value = t.TenTL;
  document.getElementById('edit-tacGia').value = t.TacGia || '';
  document.getElementById('edit-namXB').value = t.NamXB || '';
  document.getElementById('edit-NXB').value = t.NhaXuatBan || '';
  document.getElementById('edit-loaiTL').value = t.LoaiTL || 'Sách';
  document.getElementById('edit-trangThai').value = t.TrangThai || 'Còn';
  openModal('modal-sua-tl');
}

async function suaTaiLieu() {
  const maTL = document.getElementById('edit-maTL').value;
  const body = {
    TenTL: document.getElementById('edit-tenTL').value,
    TacGia: document.getElementById('edit-tacGia').value,
    NhaXuatBan: document.getElementById('edit-NXB').value,
    NamXB: parseInt(document.getElementById('edit-namXB').value) || null,
    LoaiTL: document.getElementById('edit-loaiTL').value,
    TrangThai: document.getElementById('edit-trangThai').value,
  };
  try {
    await fetch(`${API}/tailieu/${maTL}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    closeModal('modal-sua-tl');
    showToast('Cập nhật tài liệu thành công!', 'success');
    loadTaiLieu();
  } catch (e) { showToast('Lỗi cập nhật!', 'error'); }
}

async function themTaiLieu() {
  const body = {
    MaTL: document.getElementById('new-maTL').value.trim(),
    TenTL: document.getElementById('new-tenTL').value.trim(),
    TacGia: document.getElementById('new-tacGia').value.trim(),
    NhaXuatBan: document.getElementById('new-NXB').value.trim(),
    NamXB: parseInt(document.getElementById('new-namXB').value) || null,
    LoaiTL: document.getElementById('new-loaiTL').value,
    TrangThai: 'Còn',
  };
  if (!body.MaTL || !body.TenTL) { showToast('Vui lòng nhập mã và tên tài liệu!', 'error'); return; }
  try {
    const res = await fetch(`${API}/tailieu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) { closeModal('modal-them-tl'); showToast('Thêm tài liệu thành công!', 'success'); loadTaiLieu(); }
    else { showToast(d.message || 'Lỗi!', 'error'); }
  } catch (e) { showToast('Lỗi thêm tài liệu!', 'error'); }
}

// ═══════════════════════════════════════════════ NGƯỜI DÙNG
async function loadNguoiDung() {
  const search = document.getElementById('nd-search').value;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  try {
    const res = await fetch(`${API}/nguoidung?${params}`);
    const list = await res.json();
    const tbody = document.getElementById('nd-tbody');
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Không tìm thấy người dùng</td></tr>'; return; }
    tbody.innerHTML = list.map(u => `
      <tr>
        <td><strong>${u.MaSV}</strong></td>
        <td>${u.HoTen}</td>
        <td>${u.TenDangNhap}</td>
        <td>${u.SoDT}</td>
        <td>${u.Email}</td>
        <td><span class="badge ${badgeUser(u.TrangThaiTK)}">${u.TrangThaiTK}</span></td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-sm btn-edit" onclick='openEditND(${JSON.stringify(u)})'>Sửa</button>
            ${u.TrangThaiTK === 'Hoạt động'
              ? `<button class="btn-sm btn-lock" onclick="toggleUser('${u.MaSV}', 'Bị Khoá')">Khóa</button>`
              : `<button class="btn-sm btn-unlock" onclick="toggleUser('${u.MaSV}', 'Hoạt động')">Mở khóa</button>`
            }
          </div>
        </td>
      </tr>`).join('');
  } catch (e) { document.getElementById('nd-tbody').innerHTML = '<tr><td colspan="7" class="loading-row">Lỗi tải dữ liệu</td></tr>'; }
}

function badgeUser(tt) {
  if (tt === 'Hoạt động') return 'badge-active';
  if (tt === 'Bị Khoá') return 'badge-khoa';
  return 'badge-tamkhoa';
}

async function toggleUser(maSV, trangThai) {
  try {
    await fetch(`${API}/nguoidung/${maSV}/trangthai`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trangThai }) });
    showToast(`Đã ${trangThai === 'Bị Khoá' ? 'khóa' : 'mở khóa'} tài khoản!`, 'success');
    loadNguoiDung();
  } catch (e) { showToast('Lỗi!', 'error'); }
}

function openEditND(u) {
  document.getElementById('edit-maSV-nd-hidden').value = u.MaSV;
  document.getElementById('edit-maSV-nd').value = u.MaSV;
  document.getElementById('edit-hoTen-nd').value = u.HoTen;
  document.getElementById('edit-username-nd').value = u.TenDangNhap;
  document.getElementById('edit-password-nd').value = u.MatKhau || '123456';
  document.getElementById('edit-sodt-nd').value = u.SoDT || '';
  document.getElementById('edit-email-nd').value = u.Email || '';
  document.getElementById('edit-trangThai-nd').value = u.TrangThaiTK || 'Hoạt động';
  openModal('modal-sua-nd');
}

async function themNguoiDung() {
  const body = {
    MaSV: document.getElementById('new-maSV-nd').value.trim(),
    HoTen: document.getElementById('new-hoTen-nd').value.trim(),
    TenDangNhap: document.getElementById('new-username-nd').value.trim(),
    MatKhau: document.getElementById('new-password-nd').value,
    SoDT: document.getElementById('new-sodt-nd').value.trim(),
    Email: document.getElementById('new-email-nd').value.trim(),
  };

  if (!body.MaSV || !body.HoTen || !body.TenDangNhap || !body.MatKhau) {
    showToast('Vui lòng nhập đầy đủ các thông tin bắt buộc!', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/nguoidung`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await res.json();
    if (d.success) {
      closeModal('modal-them-nd');
      showToast('Thêm người dùng thành công!', 'success');
      // Clear inputs
      document.getElementById('new-maSV-nd').value = '';
      document.getElementById('new-hoTen-nd').value = '';
      document.getElementById('new-username-nd').value = '';
      document.getElementById('new-password-nd').value = '';
      document.getElementById('new-sodt-nd').value = '';
      document.getElementById('new-email-nd').value = '';
      loadNguoiDung();
    } else {
      showToast(d.message || 'Lỗi thêm người dùng!', 'error');
    }
  } catch (e) {
    showToast('Lỗi thêm người dùng!', 'error');
  }
}

async function suaNguoiDung() {
  const maSV = document.getElementById('edit-maSV-nd-hidden').value;
  const body = {
    HoTen: document.getElementById('edit-hoTen-nd').value.trim(),
    TenDangNhap: document.getElementById('edit-username-nd').value.trim(),
    MatKhau: document.getElementById('edit-password-nd').value,
    SoDT: document.getElementById('edit-sodt-nd').value.trim(),
    Email: document.getElementById('edit-email-nd').value.trim(),
    TrangThaiTK: document.getElementById('edit-trangThai-nd').value,
  };

  if (!body.HoTen || !body.TenDangNhap || !body.MatKhau) {
    showToast('Vui lòng nhập đầy đủ các thông tin bắt buộc!', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/nguoidung/${maSV}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await res.json();
    if (d.success) {
      closeModal('modal-sua-nd');
      showToast('Cập nhật người dùng thành công!', 'success');
      loadNguoiDung();
    } else {
      showToast(d.message || 'Lỗi cập nhật người dùng!', 'error');
    }
  } catch (e) {
    showToast('Lỗi cập nhật người dùng!', 'error');
  }
}

// ═══════════════════════════════════════════════ PHIẾU MƯỢN
async function loadPhieuMuon(trangthai) {
  try {
    const res = await fetch(`${API}/phieumuon?trangthai=${trangthai}`);
    const list = await res.json();
    const tbody = document.getElementById('pm-tbody');
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="9" class="loading-row">Không có dữ liệu</td></tr>'; return; }
    tbody.innerHTML = list.map(p => {
      const isQuaHan = !p.NgayTra && new Date(p.HanTra) < new Date();
      return `<tr ${isQuaHan ? 'style="background:#fff5f5"' : ''}>
        <td><strong>${p.MaPM}</strong></td>
        <td>${p.HoTen || '--'}</td>
        <td>${p.MaSV}</td>
        <td style="max-width:160px;font-size:12px">${p.DanhSachTL || '--'}</td>
        <td>${formatDate(p.NgayMuon)}</td>
        <td>${isQuaHan ? `<span style="color:var(--red);font-weight:600">${formatDate(p.HanTra)} ⚠️</span>` : formatDate(p.HanTra)}</td>
        <td>${p.NgayTra ? formatDate(p.NgayTra) : '<span style="color:var(--text-muted)">Chưa trả</span>'}</td>
        <td>${p.SoLanGiaHan}</td>
        <td style="display:flex;gap:4px;flex-wrap:wrap">
          ${!p.NgayTra ? `
            <button class="btn-sm btn-tra" onclick="openTraModal('${p.MaPM}', '${p.DanhSachTL || ''}')">Trả</button>
            <button class="btn-sm btn-giahan" onclick="openGiaHanModal('${p.MaPM}', '${p.HanTra}')">Gia hạn</button>
          ` : '<span style="color:#059669;font-size:12px">✓ Đã trả</span>'}
        </td>
      </tr>`;
    }).join('');
  } catch (e) { document.getElementById('pm-tbody').innerHTML = '<tr><td colspan="9" class="loading-row">Lỗi tải dữ liệu</td></tr>'; }
}

async function openMuonModal() {
  // Load danh sách tài liệu còn
  const res = await fetch(`${API}/tailieu?trangthai=Còn`);
  const list = await res.json();
  document.getElementById('tl-checkboxes').innerHTML = list.length === 0
    ? '<span style="color:var(--text-muted);font-size:13px">Không có tài liệu nào còn sẵn</span>'
    : list.map(t => `
        <label class="tl-checkbox-item">
          <input type="checkbox" value="${t.MaTL}" />
          <span>[${t.MaTL}] ${t.TenTL} <span style="color:var(--text-muted)">(${t.TacGia})</span></span>
        </label>`).join('');
  openModal('modal-muon');
}

async function taoPhieuMuon() {
  const maPM = document.getElementById('new-maPM').value.trim();
  const maSV = document.getElementById('new-maSV').value.trim();
  const ngayMuon = document.getElementById('new-ngayMuon').value;
  const hanTra = document.getElementById('new-hanTra').value;
  const maNV = document.getElementById('new-maNV-pm').value.trim();
  const checked = [...document.querySelectorAll('#tl-checkboxes input:checked')].map(c => c.value);

  if (!maPM || !maSV || !ngayMuon || !hanTra || !maNV) { showToast('Vui lòng nhập đầy đủ thông tin!', 'error'); return; }
  if (checked.length === 0) { showToast('Vui lòng chọn ít nhất 1 tài liệu!', 'error'); return; }

  try {
    const res = await fetch(`${API}/phieumuon`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaPM: maPM, NgayMuon: ngayMuon, HanTra: hanTra, MaSV: maSV, MaNV: maNV, DanhSachTL: checked })
    });
    const d = await res.json();
    if (d.success) { closeModal('modal-muon'); showToast('Tạo phiếu mượn thành công!', 'success'); loadPhieuMuon(currentTab); }
    else { showToast(d.message || 'Lỗi!', 'error'); }
  } catch (e) { showToast('Lỗi tạo phiếu!', 'error'); }
}

function openTraModal(maPM, dsTL) {
  document.getElementById('tra-maPM').value = maPM;
  document.getElementById('tra-dsTL').value = dsTL;
  document.getElementById('tra-maPM-show').value = maPM;
  document.getElementById('tra-dsTL-show').value = dsTL;
  document.getElementById('tra-ngayTra').value = new Date().toISOString().split('T')[0];
  openModal('modal-tra');
}

async function traSach() {
  const maPM = document.getElementById('tra-maPM').value;
  const ngayTra = document.getElementById('tra-ngayTra').value;
  const dsTL = document.getElementById('tra-dsTL').value.split(', ').filter(Boolean);
  if (!ngayTra) { showToast('Vui lòng chọn ngày trả!', 'error'); return; }
  try {
    await fetch(`${API}/phieumuon/${maPM}/tra`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NgayTra: ngayTra, DanhSachTL: dsTL })
    });
    closeModal('modal-tra');
    showToast('Xác nhận trả sách thành công!', 'success');
    loadPhieuMuon(currentTab);
  } catch (e) { showToast('Lỗi!', 'error'); }
}

function openGiaHanModal(maPM, hanTra) {
  document.getElementById('giahan-maPM').value = maPM;
  document.getElementById('giahan-maPM-show').value = maPM;
  // Default: +30 ngày từ hạn trả hiện tại
  const newDate = new Date(hanTra);
  newDate.setDate(newDate.getDate() + 30);
  document.getElementById('giahan-hanMoi').value = newDate.toISOString().split('T')[0];
  openModal('modal-giahan');
}

async function giaHan() {
  const maPM = document.getElementById('giahan-maPM').value;
  const hanMoi = document.getElementById('giahan-hanMoi').value;
  if (!hanMoi) { showToast('Vui lòng chọn hạn trả mới!', 'error'); return; }
  try {
    const res = await fetch(`${API}/phieumuon/${maPM}/giahan`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ HanTraMoi: hanMoi })
    });
    const d = await res.json();
    if (d.success) {
      closeModal('modal-giahan');
      showToast('Gia hạn thành công!', 'success');
      loadPhieuMuon(currentTab);
    } else {
      showToast(d.message || 'Lỗi gia hạn!', 'error');
    }
  } catch (e) { showToast('Lỗi!', 'error'); }
}

// ═══════════════════════════════════════════════ THỐNG KÊ
async function loadThongKe() {
  try {
    const res = await fetch(`${API}/thongke`);
    const d = await res.json();

    // Chart lượt mượn theo tháng
    const maxLuot = Math.max(...d.luotMuonTheoThang.map(x => x.soLuot), 1);
    document.getElementById('chart-thang').innerHTML = d.luotMuonTheoThang.map(x => `
      <div class="bar-item">
        <div class="bar-label">${x.thang}</div>
        <div class="bar-track"><div class="bar-fill teal" style="width:${Math.round(x.soLuot/maxLuot*100)}%">${x.soLuot}</div></div>
      </div>`).join('');

    // Chart tài liệu hay mượn
    const maxTL = Math.max(...d.tlHayMuon.map(x => x.soLuot), 1);
    document.getElementById('chart-tl').innerHTML = d.tlHayMuon.map(x => `
      <div class="bar-item">
        <div class="bar-label" style="font-size:11px">${x.TenTL.length > 18 ? x.TenTL.substring(0,18)+'...' : x.TenTL}</div>
        <div class="bar-track"><div class="bar-fill orange" style="width:${Math.round(x.soLuot/maxTL*100)}%">${x.soLuot}</div></div>
      </div>`).join('');

    // Vi phạm
    const tbody = document.getElementById('vipham-tbody');
    if (d.viPham.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="loading-row" style="color:#059669">✓ Không có vi phạm nào</td></tr>';
    } else {
      tbody.innerHTML = d.viPham.map(v => `
        <tr>
          <td><strong>${v.MaPM}</strong></td>
          <td>${v.HoTen}</td>
          <td>${v.MaSV}</td>
          <td>${formatDate(v.HanTra)}</td>
          <td><span class="badge badge-quahan">Trễ ${v.soNgayTre} ngày</span></td>
        </tr>`).join('');
    }
  } catch (e) { console.error(e); }
}

// ═══════════════════════════════════════════════ CHATBOT
function toggleChat() {
  const box = document.getElementById('chatbot-box');
  box.classList.toggle('open');
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  const messagesEl = document.getElementById('chat-messages');
  messagesEl.innerHTML += `<div class="msg user">${msg}</div>`;
  messagesEl.innerHTML += `<div class="msg bot typing" id="typing-indicator">Đang xử lý...</div>`;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const res = await fetch(`${API}/chatbot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const d = await res.json();
    document.getElementById('typing-indicator').remove();
    messagesEl.innerHTML += `<div class="msg bot">${d.reply.replace(/\n/g, '<br>')}</div>`;
  } catch (e) {
    document.getElementById('typing-indicator').remove();
    messagesEl.innerHTML += `<div class="msg bot">Xin lỗi, không thể kết nối chatbot. Vui lòng kiểm tra API key trong file .env</div>`;
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ═══════════════════════════════════════════════ MODAL HELPERS
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOutside(e, id) { if (e.target.id === id) closeModal(id); }

// ═══════════════════════════════════════════════ TOAST
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════ UTILS
function formatDate(d) {
  if (!d) return '--';
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN');
}

function daysDiff(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  return diff > 0 ? diff : 0;
}
