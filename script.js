// Data sodium per mie (dalam mg per bungkus) - 20 jenis
const sodiumData = {
    indomie_goreng: 1000,
    indomie_rebus: 900,
    mie_sedaap_goreng: 1100,
    mie_sedaap_soto: 950,
    sarimi_goreng: 800,
    sarimi_kari: 850,
    supermi_ayam_bawang: 1200,
    supermi_soto: 1000,
    pop_mie_ayam: 1300,
    pop_mie_kari: 1250,
    mie_gelas_abc_soto: 900,
    mie_gelas_abc_kari: 950,
    mie_sukses_ayam_bawang: 1100,
    mie_sukses_soto: 1050,
    mie_burung_dara_goreng: 800,
    mie_burung_dara_soto: 850,
    mie_gacoan_pedas: 1400,
    mie_gacoan_ayam: 1300,
    nissin_cup_noodles: 1000,
    maruchan_ramen: 1200
};

// Batas harian sodium berdasarkan umur (dalam mg)
function getDailyLimit(umur) {
    if (umur >= 6 && umur <= 12) return 1200;
    if (umur >= 13 && umur <= 18) return 1500;
    if (umur >= 19 && umur <= 59) return 2000;
    if (umur >= 60) return 1800;
    return 1000; // Default untuk <6 tahun
}

// Batas mingguan sodium berdasarkan umur (harian x 7)
function getWeeklyLimit(umur) {
    return getDailyLimit(umur) * 7;
}

// Fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
function getToday() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Fungsi untuk mendapatkan hari dalam minggu (0=Senin, 6=Minggu)
function getDayOfWeek(date) {
    const d = new Date(date);
    return (d.getDay() + 6) % 7; // Senin = 0
}

// Fungsi untuk mendapatkan awal minggu (Senin)
function getWeekStart(date) {
    const d = new Date(date);
    const day = getDayOfWeek(date);
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
}

// Fungsi untuk memuat data pengguna dari localStorage
function loadUserData(username) {
    const data = localStorage.getItem('user_' + username);
    return data ? JSON.parse(data) : { daily: {}, weeklyTotal: 0, weekStart: getWeekStart(getToday()) };
}

// Fungsi untuk menyimpan data pengguna ke localStorage
function saveUserData(username, data) {
    localStorage.setItem('user_' + username, JSON.stringify(data));
}

// Fungsi untuk reset mingguan jika minggu baru
function resetWeeklyIfNeeded(data) {
    const currentWeekStart = getWeekStart(getToday());
    if (data.weekStart !== currentWeekStart) {
        data.daily = {};
        data.weeklyTotal = 0;
        data.weekStart = currentWeekStart;
    }
    return data;
}

// Variabel global
let currentUser = null;
let chart;

// Inisialisasi grafik
function initChart(limit) {
    const ctx = document.getElementById('sodiumChart').getContext('2d');
    if (!ctx) {
        console.error('Canvas context not found');
        return;
    }
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 10 }, (_, i) => i + 1), // Bungkus 1-10
            datasets: [{
                label: 'Total Sodium (mg)',
                data: Array.from({ length: 10 }, (_, i) => sodiumData['indomie_goreng'] * (i + 1)), // Default Indomie Goreng
                borderColor: '#666', // Abu-abu gelap
                backgroundColor: 'rgba(102, 102, 102, 0.2)', // Abu-abu transparan
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Jumlah Bungkus' } },
                y: { title: { display: true, text: 'Total Sodium (mg)' }, beginAtZero: true }
            }
            // Hapus bagian annotation untuk menghindari error jika plugin tidak dimuat
            // Jika ingin annotation, tambahkan: plugins: { annotation: { annotations: { limitLine: { ... } } } }
        }
    });
}

// Event listener untuk login
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simulasi login (dalam produksi, verifikasi dari server)
    const storedPassword = localStorage.getItem('password_' + username);
    if (storedPassword && storedPassword === password) {
        currentUser = username;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainSection').style.display = 'block';
        initChart(2000); // Inisialisasi grafik default
        alert('Login berhasil!');
    } else {
        alert('Username atau password salah!');
    }
});

// Event listener untuk register
document.getElementById('registerBtn').addEventListener('click', function () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username && password) {
        localStorage.setItem('password_' + username, password);
        alert('Registrasi berhasil! Silakan login.');
    } else {
        alert('Isi username dan password!');
    }
});

// Event listener untuk logout
document.getElementById('logoutBtn').addEventListener('click', function () {
    currentUser = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainSection').style.display = 'none';
    if (chart) chart.destroy();
    document.getElementById('result').style.display = 'none';
});

// Event listener untuk form sodium
document.getElementById('sodiumForm').addEventListener('submit', function (e) {
    e.preventDefault();

    if (!currentUser) {
        alert('Harap login terlebih dahulu!');
        return;
    }

    const mie = document.getElementById('mie').value;
    const jumlah = parseInt(document.getElementById('jumlah').value);
    const umur = parseInt(document.getElementById('umur').value);

    if (!mie || !jumlah || !umur) {
        alert('Harap isi semua field!');
        return;
    }

    const sodiumPerBungkus = sodiumData[mie];
    const totalSodiumBaru = sodiumPerBungkus * jumlah;
    const weeklyLimit = getWeeklyLimit(umur);

    // Muat dan reset data jika perlu
    let userData = loadUserData(currentUser);
    userData = resetWeeklyIfNeeded(userData);

    // Tambahkan ke konsumsi harian
    const today = getToday();
    userData.daily[today] = (userData.daily[today] || 0) + totalSodiumBaru;
    const totalHarian = userData.daily[today];

    // Hitung total mingguan
    userData.weeklyTotal = Object.values(userData.daily).reduce((sum, val) => sum + val, 0);

    // Simpan data
    saveUserData(currentUser, userData);

    // Tentukan status dan warna berdasarkan batas mingguan
    let status, className;
    if (userData.weeklyTotal <= weeklyLimit * 0.8) {
        status = 'Aman';
        className = 'safe';
    } else if (userData.weeklyTotal <= weeklyLimit) {
        status = 'Mendekati Limit';
        className = 'warning';
    } else {
        status = 'Over Sodium';
        className = 'danger';
    }

    // Pesan khusus dengan total konsumsi mingguan
    const mieName = document.getElementById('mie').options[document.getElementById('mie').selectedIndex].text.split(' (')[0];
    let pesanKhusus = `Total sodium mingguan Anda sudah ${userData.weeklyTotal} mg. Batas mingguan untuk umur ${umur} tahun: ${weeklyLimit} mg. Jangan kebanyakan makan mie instan, perhatikan kesehatan Anda!`;
    if (userData.weeklyTotal > weeklyLimit) {
        pesanKhusus += ' Anda sudah melebihi batas mingguan. Kurangi konsumsi mie minggu ini!';
    }

    const maxBungkusMingguan = Math.floor((weeklyLimit - userData.weeklyTotal) / sodiumPerBungkus);
    const edukasi = 'Sodium berlebihan bisa menyebabkan retensi air dan tekanan darah tinggi. Pilih mie instan rendah sodium atau alternatif seperti sayuran segar.';
    const alternatif = 'Makanan rendah sodium: Buah-buahan, sayuran, daging tanpa garam, atau mie buatan sendiri.';

    const resultDiv = document.getElementById('result');
    resultDiv.className = className;
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h3>Hasil:</h3>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Total Sodium Hari Ini:</strong> ${totalHarian} mg</p>
        <p><strong>Total Sodium Mingguan:</strong> ${userData.weeklyTotal} mg</p>
        <p><strong>Batas Mingguan untuk Umur ${umur} Tahun:</strong> ${weeklyLimit} mg</p>
        <p><strong>Jumlah Maksimal Bungkus yang Boleh Dimakan Minggu Ini:</strong> ${maxBungkusMingguan > 0 ? maxBungkusMingguan : 0} bungkus</p>
        <p><strong>Pesan:</strong> ${pesanKhusus}</p>
        <p><strong>Edukasi:</strong> ${edukasi}</p>
        <p><strong>Alternatif:</strong> ${alternatif}</p>
    `;

    // Update grafik
    if (chart) chart.destroy();
    initChart(weeklyLimit);  // Gunakan batas mingguan untuk grafik
    updateChart(mie, jumlah);
});

// Fungsi update grafik
function updateChart(mie, jumlah) {
    if (!chart) return;
    const sodiumPerBungkus = sodiumData[mie];
    chart.data.datasets[0].data = Array.from({ length: 10 }, (_, i) => sodiumPerBungkus * (i + 1));
    chart.update();
}

// Update grafik saat jumlah berubah
document.getElementById('jumlah').addEventListener('input', function () {
    const mie = document.getElementById('mie').value;
    const jumlah = parseInt(this.value) || 1;
    if (mie && chart) updateChart(mie, jumlah);
});