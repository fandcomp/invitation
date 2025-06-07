javascript
// Inisialisasi Supabase
const supabase = Supabase.createClient('https://lahzymgcaeuvwshdeqtc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaHp5bWdjYWV1dndzaGRlcXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI5Njk4OCwiZXhwIjoyMDY0ODcyOTg4fQ._bMxdtM3i3c7N6JYjMb7nLd09AgOwo-0H0xf1LnNZjw');

// Variabel global untuk menyimpan state
let currentUser;

// --- UTILITY FUNCTIONS ---
function sendToWhatsApp(content) {
    const phoneNumber = "628994108524"; // Ganti dengan nomor Anda
    const encodedMessage = encodeURIComponent(content);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function parseRupiah(value) {
    if (!value) return 0;
    return parseInt(String(value).replace(/\D/g, '') || '0');
}

// --- AUTHENTICATION ---
async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // Ambil data user dari Supabase berdasarkan username
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', usernameInput)
        .single(); // .single() untuk mendapatkan satu record atau null

    if (error && error.code !== 'PGRST116') { // PGRST116 = baris tidak ditemukan, itu bukan error
        alert('Error logging in: ' + error.message);
        return;
    }

    // Cek apakah user ditemukan dan password cocok
    if (user && user.password === passwordInput) {
        currentUser = user.username;
        document.getElementById('loginSection').classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('mainContent').classList.remove('hidden');
        
        // Muat semua data setelah login berhasil
        loadAllData();
    } else {
        alert('Invalid username or password. Please try again.');
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById('loginSection').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

async function loadAllData() {
    // Render semua data dari Supabase secara bersamaan
    await Promise.all([
        renderDestinations(),
        renderTimeline(),
        renderDresscode(),
        renderGallery(),
        renderFinanceData()
    ]);
    // Tampilkan section default (misalnya, Destinations)
    showSection('destinationsSection');
}


// --- DYNAMIC CONTENT RENDERING ---

// Destinations
async function renderDestinations() {
    const { data, error } = await supabase.from('destinations').select('*').order('created_at', { ascending: true });
    if (error) return alert('Error fetching destinations: ' + error.message);

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

async function addDestination() {
    const name = document.getElementById('destinationName').value;
    const location = document.getElementById('destinationLocation').value;
    if (!name.trim() || !location.trim()) return alert('Please fill in both name and location');

    const { error } = await supabase.from('destinations').insert([{ name, location }]);
    if (error) return alert('Error adding destination: ' + error.message);
    
    document.getElementById('destinationName').value = '';
    document.getElementById('destinationLocation').value = '';
    await renderDestinations();
    sendToWhatsApp(`*NEW DESTINATION SUGGESTION*\n\n*Name:* ${name}\n*Location:* ${location}\n\nFrom: ${currentUser}`);
}

// Rundown
async function renderTimeline() {
    const { data, error } = await supabase.from('rundown').select('*').order('time', { ascending: true });
    if (error) return alert('Error fetching rundown: ' + error.message);

    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    data.forEach(item => {
        const newItem = document.createElement('div');
        newItem.className = 'timeline-item relative pb-6';
        newItem.innerHTML = `
            <div class="bg-rose-50 p-4 rounded-lg relative">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="font-medium text-gray-800">${item.time}</h4>
                    ${item.isSuggestion ? `<span class="text-xs text-rose-500">Suggestion by ${item.user}</span>` : ''}
                </div>
                <p class="text-gray-600">${item.activity}</p>
                <button class="delete-btn absolute top-2 right-2 text-rose-400 hover:text-rose-600" data-id="${item.id}" data-table="rundown">
                    <i class="fas fa-times"></i>
                </button>
            </div>`;
        timeline.appendChild(newItem);
    });
}

async function addRundownSuggestion() {
    const time = document.getElementById('rundownTime').value;
    const activity = document.getElementById('rundownActivity').value;
    if (!time || !activity) return alert('Please fill both time and activity');

    const { error } = await supabase.from('rundown').insert([{ time, activity, isSuggestion: true, user: currentUser }]);
    if (error) return alert('Error adding rundown suggestion: ' + error.message);
    
    await renderTimeline();
    sendToWhatsApp(`*NEW RUNDOWN SUGGESTION*\n\n*Time:* ${time}\n*Activity:* ${activity}\n\nFrom: ${currentUser}`);
    document.getElementById('rundownTime').value = '';
    document.getElementById('rundownActivity').value = '';
}

// Dresscode
async function renderDresscode() {
    const { data, error } = await supabase.from('dresscode_rules').select('*').order('created_at', { ascending: true });
    if (error) return alert('Error fetching dresscode: ' + error.message);
    
    const list = document.getElementById('dresscodeList');
    list.innerHTML = '';
    data.forEach(rule => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-rose-50 p-4 rounded-lg';
        item.innerHTML = `
            <p class="text-gray-700">${rule.rule}</p>
            <button class="delete-btn text-rose-500 hover:text-rose-700" data-id="${rule.id}" data-table="dresscode_rules">
                <i class="fas fa-trash-alt"></i>
            </button>`;
        list.appendChild(item);
    });
}

async function addDresscode() {
    const rule = document.getElementById('dresscodeRule').value;
    if (!rule.trim()) return alert('Please enter a dresscode rule.');
    
    const { error } = await supabase.from('dresscode_rules').insert([{ rule }]);
    if (error) return alert('Error adding dresscode: ' + error.message);
    
    document.getElementById('dresscodeRule').value = '';
    await renderDresscode();
}

// Gallery
async function renderGallery() {
    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (error) return alert('Error fetching gallery: ' + error.message);

    const container = document.getElementById('galleryContainer');
    container.innerHTML = '';
    data.forEach(image => {
        const item = document.createElement('div');
        item.className = 'relative group';
        item.innerHTML = `
            <img src="${image.image_url}" alt="Gallery image" class="w-full h-full object-cover rounded-lg shadow-md">
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="delete-btn text-white text-2xl" data-id="${image.id}" data-table="gallery">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>`;
        container.appendChild(item);
    });
}

async function addImage() {
    const imageUrl = document.getElementById('imageUrl').value;
    if (!imageUrl.trim()) return alert('Please enter an image URL.');
    
    const { error } = await supabase.from('gallery').insert([{ image_url: imageUrl }]);
    if (error) return alert('Error adding image: ' + error.message);

    document.getElementById('imageUrl').value = '';
    await renderGallery();
}

// Finance
async function renderFinanceData() {
    if (!currentUser) return;
    const { data: budgets, error: budgetsError } = await supabase.from('budgets').select('*').eq('user', currentUser);
    const { data: expenses, error: expensesError } = await supabase.from('expenses').select('*').eq('user', currentUser);

    if (budgetsError || expensesError) return alert('Error fetching finance data.');

    const totalBudget = budgets.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

    document.getElementById('plannedBudget').textContent = formatRupiah(totalBudget);
    document.getElementById('actualSpent').textContent = formatRupiah(totalExpense);
    document.getElementById('remainingBudget').textContent = formatRupiah(totalBudget - totalExpense);

    const tableBody = document.getElementById('financeTableBody');
    tableBody.innerHTML = '';
    const categories = [...new Set([...budgets.map(b => b.category), ...expenses.map(e => e.category)])];

    categories.forEach(category => {
        const catBudget = budgets.filter(b => b.category === category).reduce((s, i) => s + i.amount, 0);
        const catExpense = expenses.filter(e => e.category === category).reduce((s, i) => s + i.amount, 0);
        const difference = catBudget - catExpense;
        const percentage = catBudget > 0 ? (catExpense / catBudget * 100).toFixed(1) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-700 capitalize">${category}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-700">${formatRupiah(catBudget)}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-700">${formatRupiah(catExpense)}</td>
            <td class="px-4 py-3 text-sm text-right ${difference >= 0 ? 'text-green-600' : 'text-red-600'}">${formatRupiah(difference)}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-700">${percentage}%</td>`;
        tableBody.appendChild(row);
    });
}

async function addBudget() {
    const category = document.getElementById('financeCategory').value;
    const amount = parseRupiah(document.getElementById('plannedAmount').value);
    if (isNaN(amount) || amount <= 0) return alert('Please enter a valid amount');
    
    const { error } = await supabase.from('budgets').insert([{ category, amount, user: currentUser }]);
    if (error) return alert('Error adding budget: ' + error.message);
    
    document.getElementById('plannedAmount').value = '';
    await renderFinanceData();
}

async function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const amount = parseRupiah(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value;

    if (!date || isNaN(amount) || amount <= 0 || !description) return alert('Please fill all fields with valid values');
    
    const { error } = await supabase.from('expenses').insert([{ date, category, amount, description, user: currentUser }]);
    if (error) return alert('Error adding expense: ' + error.message);

    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDescription').value = '';
    await renderFinanceData();
}

// Generic Delete Function
async function deleteItem(id, tableName) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) return alert(`Error deleting item: ${error.message}`);
    
    // Refresh the relevant section
    switch(tableName) {
        case 'destinations': await renderDestinations(); break;
        case 'rundown': await renderTimeline(); break;
        case 'dresscode_rules': await renderDresscode(); break;
        case 'gallery': await renderGallery(); break;
    }
}

// --- NAVIGATION ---
const allSections = ['destinationsSection', 'rundownSection', 'dresscodeSection', 'gallerySection', 'financeSection'];
function showSection(sectionId) {
    allSections.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function() {
    // Auth
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Main Navigation
    document.getElementById('destinationsBtn').addEventListener('click', () => showSection('destinationsSection'));
    document.getElementById('rundownBtn').addEventListener('click', () => showSection('rundownSection'));
    document.getElementById('dresscodeBtn').addEventListener('click', () => showSection('dresscodeSection'));
    document.getElementById('galleryBtn').addEventListener('click', () => showSection('gallerySection'));
    document.getElementById('financeBtn').addEventListener('click', () => showSection('financeSection'));
    
    // Add Buttons
    document.getElementById('addDestinationBtn').addEventListener('click', addDestination);
    document.getElementById('addRundownSuggestionBtn').addEventListener('click', addRundownSuggestion);
    document.getElementById('addDresscodeBtn').addEventListener('click', addDresscode);
    document.getElementById('addImageBtn').addEventListener('click', addImage);
    document.getElementById('addBudgetBtn').addEventListener('click', addBudget);
    document.getElementById('addExpenseBtn').addEventListener('click', addExpense);

    // Share Button
    document.getElementById('shareDirectionsBtn').addEventListener('click', async function() {
        let message = 'Our romantic itinerary:\n\n';
        const { data: destinations } = await supabase.from('destinations').select('*');
        const { data: rundown } = await supabase.from('rundown').select('*');
        
        message += 'Destinations:\n';
        destinations.forEach(d => message += `📍 ${d.name}\n${d.location}\n\n`);
        
        message += 'Schedule:\n';
        rundown.forEach(r => message += `⏰ ${r.time}\n${r.activity}\n\n`);
        
        sendToWhatsApp(message);
    });

    // Event delegation for delete buttons
    document.body.addEventListener('click', function(e) {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const id = deleteButton.getAttribute('data-id');
            const table = deleteButton.getAttribute('data-table');
            if (confirm('Are you sure you want to delete this item?')) {
                deleteItem(id, table);
            }
        }
    });

    // Format Rupiah inputs
    document.querySelectorAll('input[placeholder^="Rp"]').forEach(input => {
        input.addEventListener('keyup', function(e) {
            let value = this.value.replace(/\D/g, '');
            this.value = value ? 'Rp' + new Intl.NumberFormat('id-ID').format(value) : '';
        });
    });
});
