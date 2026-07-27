// =============== إدارة التوكن (JWT) ===============
const TOKEN_KEY = 'souqhub_token';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function isLoggedIn() {
    return !!getToken();
}

function getAuthHeaders() {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// =============== القائمة للجوال ===============
function toggleMenu() {
    const nav = document.querySelector('nav ul');
    if (nav) nav.classList.toggle('active');
}

// =============== تحميل الإعلانات من الخادم ===============
async function loadAds(containerId, params = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const queryString = new URLSearchParams(params).toString();
        const url = 'api/get-ads' + (queryString ? '?' + queryString : '');
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.ads.length > 0) {
            container.innerHTML = data.ads.map(function(ad) { return createAdCard(ad); }).join('');
        } else {
            container.innerHTML = '<div class="loading"><i class="fas fa-box-open"></i><p>لا توجد إعلانات بعد</p><a href="post-ad.html" class="btn btn-primary" style="margin-top:15px;">كن أول من ينشر إعلان</a></div>';
        }
    } catch (error) {
        console.error('Error loading ads:', error);
        container.innerHTML = '<div class="loading"><i class="fas fa-exclamation-triangle"></i><p>حدث خطأ في تحميل الإعلانات</p></div>';
    }
}

// =============== إنشاء بطاقة إعلان ===============
function createAdCard(ad) {
    var imageHtml;
    if (ad.image) {
        imageHtml = '<img src="' + ad.image + '" alt="' + ad.title + '" loading="lazy">';
    } else {
        imageHtml = '<div class="no-image"><i class="fas fa-image"></i></div>';
    }
    
    var featuredBadge = ad.is_featured ? '<span class="featured-badge">⭐ مميز</span>' : '';
    var featuredClass = ad.is_featured ? ' featured' : '';
    var city = ad.city || 'المغرب';

    return '<a href="ad-detail.html?id=' + ad.id + '" class="ad-card' + featuredClass + '">' +
        featuredBadge +
        '<div class="ad-image">' + imageHtml + '</div>' +
        '<div class="ad-body">' +
            '<div class="ad-title">' + ad.title + '</div>' +
            '<div class="ad-price">' + ad.price + ' درهم</div>' +
            '<div class="ad-meta">' +
                '<span><i class="fas fa-map-marker-alt"></i> ' + city + '</span>' +
                '<span><i class="far fa-clock"></i> ' + timeAgo(ad.created_at) + '</span>' +
            '</div>' +
        '</div>' +
    '</a>';
}

// =============== حساب الوقت المنقضي ===============
function timeAgo(dateString) {
    var now = new Date();
    var date = new Date(dateString);
    var seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'الآن';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return 'منذ ' + minutes + ' دقيقة';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return 'منذ ' + hours + ' ساعة';
    var days = Math.floor(hours / 24);
    if (days < 30) return 'منذ ' + days + ' يوم';
    var months = Math.floor(days / 30);
    if (months < 12) return 'منذ ' + months + ' شهر';
    var years = Math.floor(months / 12);
    return 'منذ ' + years + ' سنة';
}

// =============== تحميل الصفحة الرئيسية ===============
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('latest-ads')) {
        loadAds('latest-ads', { limit: 12 });
    }
    if (document.getElementById('featured-ads')) {
        loadAds('featured-ads', { featured: true, limit: 6 });
    }
    if (document.getElementById('search-results')) {
        var urlParams = new URLSearchParams(window.location.search);
        var params = {};
        if (urlParams.get('q')) params.q = urlParams.get('q');
        if (urlParams.get('category')) params.category = urlParams.get('category');
        loadAds('search-results', params);
    }
    if (document.getElementById('ad-detail')) {
        loadAdDetail();
    }
    updateHeader();
});

// =============== تحديث القائمة حسب حالة المستخدم ===============
function updateHeader() {
    var authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    if (isLoggedIn()) {
        authButtons.innerHTML = '<a href="#" class="btn-login" onclick="handleLogout(event)">تسجيل الخروج</a><a href="dashboard.html" class="btn-register">لوحة التحكم</a>';
    } else {
        authButtons.innerHTML = '<a href="login.html" class="btn-login">تسجيل الدخول</a><a href="register.html" class="btn-register">إنشاء حساب</a>';
    }
}

// =============== تسجيل الخروج ===============
function handleLogout(event) {
    event.preventDefault();
    removeToken();
    window.location.href = 'index.html';
}

// =============== تحميل تفاصيل الإعلان ===============
async function loadAdDetail() {
    var container = document.getElementById('ad-detail');
    var urlParams = new URLSearchParams(window.location.search);
    var adId = urlParams.get('id');

    if (!adId) {
        container.innerHTML = '<div class="loading">⚠️ الإعلان غير موجود</div>';
        return;
    }

    try {
        var response = await fetch('api/get-ad?id=' + adId);
        var data = await response.json();

        if (data.success) {
            var ad = data.ad;
            var phoneClean = ad.phone ? ad.phone.replace(/[^0-9]/g, '') : '';
            var imageHtml = ad.image 
                ? '<img src="' + ad.image + '" alt="' + ad.title + '">'
                : '<div class="no-image" style="height:400px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image fa-5x" style="color:#ccc;"></i></div>';
            
            container.innerHTML = '<div class="detail-grid">' +
                '<div class="detail-image">' + imageHtml + '</div>' +
                '<div class="detail-info">' +
                    '<h1>' + ad.title + '</h1>' +
                    '<div class="detail-price">' + ad.price + ' درهم</div>' +
                    '<div class="detail-meta">' +
                        '<span><i class="fas fa-tag"></i> ' + getCategoryName(ad.category) + '</span>' +
                        '<span><i class="fas fa-map-marker-alt"></i> ' + (ad.city || 'المغرب') + '</span>' +
                        '<span><i class="far fa-clock"></i> ' + timeAgo(ad.created_at) + '</span>' +
                        '<span><i class="far fa-eye"></i> ' + (ad.views || 0) + ' مشاهدة</span>' +
                    '</div>' +
                    '<div class="detail-description"><h3>الوصف</h3><p>' + ad.description + '</p></div>' +
                    '<div class="contact-info">' +
                        '<h3>📞 معلومات الاتصال</h3>' +
                        '<p><i class="fas fa-user"></i> ' + (ad.username || 'مستخدم') + '</p>' +
                        '<p><i class="fas fa-phone"></i> <a href="tel:' + ad.phone + '">' + ad.phone + '</a></p>' +
                        '<p><i class="fas fa-envelope"></i> ' + ad.email + '</p>' +
                    '</div>' +
                    '<a href="https://wa.me/' + phoneClean + '?text=' + encodeURIComponent('مرحباً، أنا مهتم بإعلانك: ' + ad.title) + '" target="_blank" class="whatsapp-btn">' +
                        '<i class="fab fa-whatsapp"></i> تواصل عبر واتساب' +
                    '</a>' +
                '</div>' +
            '</div>';
        } else {
            container.innerHTML = '<div class="loading">⚠️ الإعلان غير موجود</div>';
        }
    } catch (error) {
        container.innerHTML = '<div class="loading">⚠️ حدث خطأ في تحميل الإعلان</div>';
    }
}

// =============== الحصول على اسم الفئة ===============
function getCategoryName(category) {
    var categories = {
        'cars': '🚗 السيارات',
        'real-estate': '🏠 العقارات',
        'electronics': '📱 الإلكترونيات',
        'jobs': '💼 الوظائف',
        'services': '🔧 الخدمات',
        'fashion': '👕 الموضة',
        'kids': '👶 مستلزمات الأطفال',
        'animals': '🐾 الحيوانات'
    };
    return categories[category] || category || 'أخرى';
}

// =============== معاينة الصورة قبل الرفع ===============
function previewImage(event) {
    var preview = document.getElementById('image-preview');
    var file = event.target.files[0];
    
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" alt="معاينة" style="max-width:200px;border-radius:8px;">';
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// =============== تأكيد حذف إعلان ===============
function confirmDelete(adId) {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        window.location.href = 'api/delete-ad?id=' + adId;
    }
}

// =============== تسجيل الدخول ===============
async function handleLogin(event) {
    event.preventDefault();
    var form = event.target;
    var messageDiv = document.getElementById('login-message');
    
    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) { data[key] = value; });
    
    try {
        var response = await fetch('api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        var result = await response.json();
        
        if (result.success) {
            setToken(result.token);
            window.location.href = 'dashboard.html';
        } else {
            messageDiv.innerHTML = '<div class="alert alert-error">' + result.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="alert alert-error">حدث خطأ في الاتصال</div>';
    }
    
    return false;
}

// =============== إنشاء حساب ===============
async function handleRegister(event) {
    event.preventDefault();
    var form = event.target;
    var messageDiv = document.getElementById('register-message');
    
    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) { data[key] = value; });
    
    try {
        var response = await fetch('api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        var result = await response.json();
        
        if (result.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">' + result.message + '</div>';
            setTimeout(function() {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div class="alert alert-error">' + result.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="alert alert-error">حدث خطأ في الاتصال</div>';
    }
    
    return false;
}

// =============== نشر إعلان جديد ===============
async function handlePostAd(event) {
    event.preventDefault();
    var form = event.target;
    var messageDiv = document.getElementById('post-message');
    var submitBtn = form.querySelector('button[type="submit"]');
    
    if (!isLoggedIn()) {
        messageDiv.innerHTML = '<div class="alert alert-error">يجب تسجيل الدخول أولاً</div>';
        return false;
    }
    
    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) { data[key] = value; });
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ جاري النشر...';
    
    try {
        var response = await fetch('api/post-ad', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        var result = await response.json();
        
        if (result.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">' + result.message + '</div>';
            form.reset();
            var preview = document.getElementById('image-preview');
            if (preview) preview.style.display = 'none';
            setTimeout(function() {
                window.location.href = 'ad-detail.html?id=' + result.ad_id;
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div class="alert alert-error">' + result.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="alert alert-error">حدث خطأ في الاتصال</div>';
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = '📨 نشر الإعلان';
    
    return false;
}
