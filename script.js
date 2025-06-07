const { createClient } = supabase;
const supabase = createClient('https://lahzymgcaeuvwshdeqtc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaHp5bWdjYWV1dndzaGRlcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTY5ODgsImV4cCI6MjA2NDg3Mjk4OH0.0yIqMAo1qKCg4Xo9TTagC8U3cxgp-0M17k6pYTKy6Jk');

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const mainContent = document.getElementById('mainContent');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Navigation
    const destinationsBtn = document.getElementById('destinationsBtn');
    const rundownBtn = document.getElementById('rundownBtn');
    const dresscodeBtn = document.getElementById('dresscodeBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const financeBtn = document.getElementById('financeBtn');
    
    const destinationsSection = document.getElementById('destinationsSection');
    const rundownSection = document.getElementById('rundownSection');
    const dresscodeSection = document.getElementById('dresscodeSection');
    const gallerySection = document.getElementById('gallerySection');
    const financeSection = document.getElementById('financeSection');
    
    // Destinations
    const addDestinationBtn = document.getElementById('addDestinationBtn');
    const destinationName = document.getElementById('destinationName');
    const destinationAddress = document.getElementById('destinationAddress');
    const destinationMapsLink = document.getElementById('destinationMapsLink');
    const destinationsList = document.getElementById('destinationsList');
    
    // Rundown
    const addRundownSuggestionBtn = document.getElementById('addRundownSuggestionBtn');
    const rundownStartTime = document.getElementById('rundownStartTime');
    const rundownEndTime = document.getElementById('rundownEndTime');
    const rundownActivity = document.getElementById('rundownActivity');
    const rundownDescription = document.getElementById('rundownDescription');
    const timeline = document.getElementById('timeline');
    
    // Finance
    const addBudgetBtn = document.getElementById('addBudgetBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const financeTableBody = document.getElementById('financeTableBody');
    
    // Share
    const shareDirectionsBtn = document.getElementById('shareDirectionsBtn');
    
    let currentUser = null;

    // WhatsApp Integration
    function sendToWhatsApp(content) {
        const phoneNumber = "628994108524";
        const encodedMessage = encodeURIComponent(content);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    }

    // Authentication
    async function login(username, password) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error || !data || data.password !== password) {
            alert('Invalid credentials. Please try again.');
            return false;
        }
        
        currentUser = username;
        return true;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (await login(username, password)) {
            loginSection.classList.add('opacity-0', 'pointer-events-none');
            mainContent.classList.remove('hidden');
            loadAllData();
        }
    });

    logoutBtn.addEventListener('click', function() {
        loginSection.classList.remove('opacity-0', 'pointer-events-none');
        mainContent.classList.add('hidden');
        loginForm.reset();
        currentUser = null;
    });

    // Navigation Handlers
    destinationsBtn.addEventListener('click', () => showSection(destinationsSection));
    rundownBtn.addEventListener('click', () => showSection(rundownSection));
    dresscodeBtn.addEventListener('click', () => showSection(dresscodeSection));
    galleryBtn.addEventListener('click', () => showSection(gallerySection));
    financeBtn.addEventListener('click', () => {
        showSection(financeSection);
        renderFinanceData();
    });

    function showSection(section) {
        [destinationsSection, rundownSection, dresscodeSection, gallerySection, financeSection].forEach(s => s.classList.add('hidden'));
        section.classList.remove('hidden');
    }

    // Destinations Management
    async function loadDestinations() {
        const { data, error } = await supabase.from('destinations').select('*');
        if (error) {
            console.error('Error loading destinations:', error);
            return;
        }
        renderDestinations(data);
    }

    function renderDestinations(destinations) {
        destinationsList.innerHTML = '';
        destinations.forEach((dest, index) => {
            const div = document.createElement('div');
            div.className = 'card bg-white rounded-lg overflow-hidden';
            div.innerHTML = `
                <div class="p-4 pb-3">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-map-marker-alt text-rose-500 mr-2"></i>
                        <h4 class="font-medium text-gray-800">${dest.name}</h4>
                    </div>
                    <p class="text-gray-600 text-sm">${dest.address}</p>
                    <a href="${dest.maps_link}" target="_blank" class="text-rose-600 text-sm">View on Map</a>
                </div>
                <div class="px-4 pb-3 pt-0 flex justify-end">
                    <button class="delete-destination text-rose-600 hover:text-rose-800 text-sm" data-id="${dest.id}">
                        <i class="fas fa-trash-alt mr-1"></i> Remove
                    </button>
                </div>
            `;
            destinationsList.appendChild(div);
        });

        document.querySelectorAll('.delete-destination').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await supabase.from('destinations').delete().eq('id', id);
                loadDestinations();
            });
        });
    }

    addDestinationBtn.addEventListener('click', async () => {
        const name = destinationName.value;
        const address = destinationAddress.value;
        const mapsLink = destinationMapsLink.value;
        
        if (!name || !address || !mapsLink) {
            alert('Please fill all fields');
            return;
        }

        await supabase.from('destinations').insert({ name, address, maps_link: mapsLink });
        loadDestinations();
        destinationName.value = '';
        destinationAddress.value = '';
        destinationMapsLink.value = '';

        sendToWhatsApp(`*NEW DESTINATION*\n\n*Name:* ${name}\n*Address:* ${address}\n*Map:* ${mapsLink}\n\nFrom: ${currentUser}`);
    });

    // Rundown Management
    async function loadRundown() {
        const { data, error } = await supabase.from('rundown').select('*').order('start_time');
        if (error) {
            console.error('Error loading rundown:', error);
            return;
        }
        renderRundown(data);
    }

    function renderRundown(rundown) {
        timeline.innerHTML = '';
        rundown.forEach(item => {
            const div = document.createElement('div');
            div.className = 'timeline-item relative pb-6';
            div.innerHTML = `
                <div class="bg-rose-50 p-4 rounded-lg">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-medium text-gray-800">${item.start_time} - ${item.end_time}</h4>
                    </div>
                    <p class="text-gray-600 font-medium">${item.activity}</p>
                    <p class="text-gray-600">${item.description}</p>
                </div>
            `;
            timeline.appendChild(div);
        });
    }

    addRundownSuggestionBtn.addEventListener('click', async () => {
        const startTime = rundownStartTime.value;
        const endTime = rundownEndTime.value;
        const activity = rundownActivity.value;
        const description = rundownDescription.value;

        if (!startTime || !endTime || !activity || !description) {
            alert('Please fill all fields');
            return;
        }

        await supabase.from('rundown').insert({ start_time: startTime, end_time: endTime, activity, description });
        loadRundown();
        rundownStartTime.value = '';
        rundownEndTime.value = '';
        rundownActivity.value = '';
        rundownDescription.value = '';

        sendToWhatsApp(`*NEW RUNDOWN*\n\n*Time:* ${startTime} - ${endTime}\n*Activity:* ${activity}\n*Description:* ${description}\n\nFrom: ${currentUser}`);
    });

    // Gallery Management
    async function loadGallery() {
        const { data, error } = await supabase.from('gallery').select('*');
        if (error) {
            console.error('Error loading gallery:', error);
            return;
        }
        renderGallery(data);
    }

    function renderGallery(photos) {
        const galleryList = document.getElementById('galleryList');
        galleryList.innerHTML = '';
        photos.forEach(photo => {
            const div = document.createElement('div');
            div.className = 'relative group overflow-hidden rounded-lg h-48 bg-gray-100';
            div.innerHTML = `<img src="${photo.filename}" alt="" class="w-full h-full object-cover transition duration-200 group-hover:scale-105">`;
            galleryList.appendChild(div);
        });
    }

    // Finance Management
    async function loadFinance() {
        const { data, error } = await supabase.from('budget').select('*');
        if (error) {
            console.error('Error loading budget:', error);
            return;
        }
        return data;
    }

    function formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    }

    function parseRupiah(value) {
        return parseInt(value.replace(/\D/g, '') || '0');
    }

    async function renderFinanceData() {
        const budgets = await loadFinance();
        const totalPlanned = budgets.reduce((sum, b) => sum + (b.planned || 0), 0);
        const totalActual = budgets.reduce((sum, b) => sum + (b.actual || 0), 0);
        
        document.getElementById('plannedBudget').textContent = formatRupiah(totalPlanned);
        document.getElementById('actualSpent').textContent = formatRupiah(totalActual);
        document.getElementById('remainingBudget').textContent = formatRupiah(totalPlanned - totalActual);

        financeTableBody.innerHTML = '';
        budgets.forEach(b => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3 text-sm text-gray-700 capitalize">${b.category}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">${formatRupiah(b.planned)}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">${formatRupiah(b.actual)}</td>
                <td class="px-4 py-3 text-sm text-right ${b.difference >= 0 ? 'text-green-600' : 'text-red-600'}">${formatRupiah(b.difference)}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">${b.percent_used}%</td>
            `;
            financeTableBody.appendChild(row);
        });
    }

    addBudgetBtn.addEventListener('click', async () => {
        const category = document.getElementById('financeCategory').value;
        const planned = parseRupiah(document.getElementById('plannedAmount').value);
        
        if (planned <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const { data } = await supabase.from('budget').insert({
            category,
            planned,
            actual: 0,
            difference: planned,
            percent_used: 0
        });
        renderFinanceData();
        document.getElementById('plannedAmount').value = '';
    });

    addExpenseBtn.addEventListener('click', async () => {
        const date = document.getElementById('expenseDate').value;
        const category = document.getElementById('expenseCategory').value;
        const amount = parseRupiah(document.getElementById('expenseAmount').value);
        const description = document.getElementById('expenseDescription').value;

        if (!date || amount <= 0 || !description) {
            alert('Please fill all fields with valid values');
            return;
        }

        const { data } = await supabase.from('budget').select('*').eq('category', category).single();
        if (data) {
            const newActual = (data.actual || 0) + amount;
            const difference = data.planned - newActual;
            const percent_used = (newActual / data.planned * 100).toFixed(2);
            await supabase.from('budget').update({ actual: newActual, difference, percent_used }).eq('id', data.id);
        } else {
            await supabase.from('budget').insert({
                category,
                planned: 0,
                actual: amount,
                difference: -amount,
                percent_used: 0
            });
        }

        renderFinanceData();
        document.getElementById('expenseDate').value = '';
        document.getElementById('expenseAmount').value = '';
        document.getElementById('expenseDescription').value = '';
    });

    // Share Directions
    shareDirectionsBtn.addEventListener('click', async () => {
        let message = 'Our romantic itinerary:\n\n';
        
        const destinations = await supabase.from('destinations').select('*');
        message += 'Destinations:\n';
        destinations.data.forEach(dest => {
            message += `📍 ${dest.name}\n${dest.address}\n${dest.maps_link}\n\n`;
        });

        const rundown = await supabase.from('rundown').select('*').order('start_time');
        message += 'Schedule:\n';
        rundown.data.forEach(item => {
            message += `⏰ ${item.start_time} - ${item.end_time}\n${item.activity}\n${item.description}\n\n`;
        });

        sendToWhatsApp(message);
    });

    // Load all data on login
    async function loadAllData() {
        await Promise.all([
            loadDestinations(),
            loadRundown(),
            loadGallery(),
            renderFinanceData()
        ]);
        showSection(destinationsSection);
    }
});
