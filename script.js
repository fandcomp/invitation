// --- CONFIGURATION ---
const SUPABASE_URL = 'https://lahzymgcaeuvwshdeqtc.supabase.co'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaHp5bWdjYWV1dndzaGRlcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTY5ODgsImV4cCI6MjA2NDg3Mjk4OH0.0yIqMAo1qKCg4Xo9TTagC8U3cxgp-0M17k6pYTKy6Jk'; // Ganti dengan Kunci ANON Anda

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- GLOBAL STATE & DOM ELEMENTS ---
let currentUser;
const loginSection = document.getElementById('loginSection');
const mainContent = document.getElementById('mainContent');
const authError = document.getElementById('authError');

// --- UTILITY FUNCTIONS ---
function sendToWhatsApp(content) {
    const phoneNumber = "628994108524"; // Ganti dengan nomor Anda
    const encodedMessage = encodeURIComponent(content);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}

// --- AUTHENTICATION (DIUBAH) ---
const handleLogin = async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    authError.textContent = ''; // Kosongkan error sebelumnya

    // Langkah 1: Cari email pengguna berdasarkan username mereka.
    // CATATAN: Ini mengasumsikan Anda punya tabel 'users' (atau 'profiles')
    // dengan kolom 'username' dan 'email'.
    // Anda HARUS mengaktifkan RLS pada tabel ini agar bisa dibaca oleh
    // pengguna yang belum login.
    const { data: userData, error: userError } = await supabase
        .from('users') // <-- PENTING: Ganti 'users' dengan nama tabel Anda jika berbeda.
        .select('email')
        .eq('username', usernameInput)
        .single(); // .single() untuk mendapatkan satu record atau error.

    if (userError || !userData) {
        console.error('Error finding user or user not found:', userError);
        authError.textContent = 'Username atau password salah.';
        return;
    }

    // Langkah 2: Gunakan email yang didapat untuk login dengan Supabase Auth.
    const userEmail = userData.email;
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordInput,
    });

    if (signInError) {
        console.error('Sign-in Error:', signInError.message);
        authError.textContent = 'Username atau password salah.';
    } else {
        document.getElementById('loginForm').reset();
    }
};


const handleLogout = async () => {
    await supabase.auth.signOut();
};

// --- NAVIGATION ---
const allSections = ['destinationsSection', 'rundownSection', 'dresscodeSection', 'gallerySection', 'financeSection'];
function showSection(sectionId) {
    allSections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById(sectionId)?.classList.remove('hidden');
}

// --- DATA RENDERING ---

async function renderDestinations() {
    const { data, error } = await supabase.from('destinations').select('*').order('created_at', { ascending: true });
    if (error) return console.error('Error fetching destinations:', error.message);

    const list = document.getElementById('destinationsList');
    list.innerHTML = '';
    data.forEach(dest => {
        const item = document.createElement('div');
        item.className = 'card bg-white rounded-lg overflow-hidden';
        item.innerHTML = `
            <div class="p-4 pb-3">
                <div class="flex items-center mb-2">
                    <i class="fas fa-map-marker-alt text-rose-500 mr-2"></i>
                    <h4 class="font-medium text-gray-800">${dest.name}</h4>
                </div>
                <p class="text-gray-600 text-sm">${dest.location}</p>
            </div>
            <div class="px-4 pb-3 pt-0 flex justify-end">
                <button class="delete-btn text-rose-600 hover:text-rose-800 text-sm" data-id="${dest.id}" data-table="destinations">
                    <i class="fas fa-trash-alt mr-1"></i> Remove
                </button>
            </div>`;
        list.appendChild(item);
    });
}

async function renderTimeline() {
    const { data, error } = await supabase.from('rundown').select('*').order('time', { ascending: true });
    if (error) return console.error('Error fetching rundown:', error.message);

    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    data.forEach(item => {
        const newItem = document.createElement('div');
        newItem.className = 'timeline-item relative pb-6';
        newItem.innerHTML = `
            <div class="bg-rose-50 p-4 rounded-lg relative">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="font-medium text-gray-800">${item.time}</h4>
                     ${item.is_suggestion ? `<span class="text-xs text-rose-500">Suggestion by ${item.user_email}</span>` : ''}
                </div>
                <p class="text-gray-600">${item.activity}</p>
                <button class="delete-btn absolute top-2 right-2 text-rose-400 hover:text-rose-600" data-id="${item.id}" data-table="rundown">
                    <i class="fas fa-times"></i>
                </button>
            </div>`;
        timeline.appendChild(newItem);
    });
}

// ... Sisa fungsi (renderDresscode, renderGallery, dll.) tetap sama ...
// ... Salin sisa fungsi dari perbaikan sebelumnya ke sini ...

// --- DATA MANIPULATION ---
async function addDestination(e) {
    e.preventDefault();
    const name = document.getElementById('destinationName').value;
    const location = document.getElementById('destinationLocation').value;

    const { error } = await supabase.from('destinations').insert([{ name, location, user_id: currentUser.id }]);
    if (error) return console.error('Error adding destination:', error.message);
    
    e.target.reset();
    await renderDestinations();
    sendToWhatsApp(`*NEW DESTINATION SUGGESTION*\n\n*Name:* ${name}\n*Location:* ${location}\n\nFrom: ${currentUser.email}`);
}

async function addRundownSuggestion(e) {
    e.preventDefault();
    const time = document.getElementById('rundownTime').value;
    const activity = document.getElementById('rundownActivity').value;
    
    const { error } = await supabase.from('rundown').insert([{ time, activity, is_suggestion: true, user_id: currentUser.id, user_email: currentUser.email }]);
    if (error) return console.error('Error adding rundown suggestion:', error.message);
    
    e.target.reset();
    await renderTimeline();
    sendToWhatsApp(`*NEW RUNDOWN SUGGESTION*\n\n*Time:* ${time}\n*Activity:* ${activity}\n\nFrom: ${currentUser.email}`);
}

async function addDresscode(e) {
    e.preventDefault();
    const rule = document.getElementById('dresscodeRule').value;
    
    const { error } = await supabase.from('dresscode_rules').insert([{ rule, user_id: currentUser.id }]);
    if (error) return console.error('Error adding dresscode:', error.message);
    
    e.target.reset();
    await renderDresscode();
}

async function addImage(e) {
    e.preventDefault();
    const imageUrl = document.getElementById('imageUrl').value;
    
    const { error } = await supabase.from('gallery').insert([{ image_url: imageUrl, user_id: currentUser.id }]);
    if (error) return console.error('Error adding image:', error.message);

    e.target.reset();
    await renderGallery();
}


async function deleteItem(id, tableName) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) return console.error(`Error deleting item from ${tableName}:`, error.message);
    
    switch(tableName) {
        case 'destinations': await renderDestinations(); break;
        case 'rundown': await renderTimeline(); break;
        case 'dresscode_rules': await renderDresscode(); break;
        case 'gallery': await renderGallery(); break;
    }
}


// --- EVENT LISTENERS ---
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Main Navigation
    document.getElementById('destinationsBtn').addEventListener('click', () => showSection('destinationsSection'));
    document.getElementById('rundownBtn').addEventListener('click', () => showSection('rundownSection'));
    document.getElementById('dresscodeBtn').addEventListener('click', () => showSection('dresscodeSection'));
    document.getElementById('galleryBtn').addEventListener('click', () => showSection('gallerySection'));
    document.getElementById('financeBtn').addEventListener('click', () => showSection('financeSection'));
    
    // Add Forms
    document.getElementById('addDestinationForm').addEventListener('submit', addDestination);
    document.getElementById('addRundownForm').addEventListener('submit', addRundownSuggestion);
    document.getElementById('addDresscodeForm').addEventListener('submit', addDresscode);
    document.getElementById('addImageForm').addEventListener('submit', addImage);

    // Share Button
    document.getElementById('shareDirectionsBtn').addEventListener('click', async () => {
        let message = 'Our romantic itinerary:\n\n';
        const { data: destinations } = await supabase.from('destinations').select('*');
        const { data: rundown } = await supabase.from('rundown').select('*');
        
        message += 'Destinations:\n';
        destinations.forEach(d => message += `📍 ${d.name}\n${d.location}\n\n`);
        
        message += 'Schedule:\n';
        rundown.forEach(r => message += `⏰ ${r.time} - ${r.activity}\n`);
        
        sendToWhatsApp(message);
    });

    // Event delegation for delete buttons
    document.body.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const table = deleteButton.dataset.table;
            deleteItem(id, table);
        }
    });
}

// --- INITIALIZATION ---
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        currentUser = session.user;
        loginSection.classList.add('opacity-0', 'pointer-events-none');
        mainContent.classList.remove('hidden');
        
        await Promise.all([
            renderDestinations(),
            renderTimeline(),
            renderDresscode(),
            renderGallery(),
        ]);
        showSection('destinationsSection');
    } else {
        currentUser = null;
        loginSection.classList.remove('opacity-0', 'pointer-events-none');
        mainContent.classList.add('hidden');
        authError.textContent = '';
    }
});

document.addEventListener('DOMContentLoaded', setupEventListeners);
