// Inisialisasi Supabase
const supabase = Supabase.createClient('https://lahzymgcaeuvwshdeqtc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaHp5bWdjYWV1dndzaGRlcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTY5ODgsImV4cCI6MjA2NDg3Mjk4OH0.mNV4SXgGJ3BE6GNhzsRUMB8zAT6Dx6bkWvQeNBXsY10');

let username;
let currentUser;
let rundownSuggestions = []; // Menyimpan saran rundown

function sendToWhatsApp(content) {
    const phoneNumber = "628994108524"; // Ganti dengan nomor Anda
    const encodedMessage = encodeURIComponent(content);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const mainContent = document.getElementById('mainContent');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const destinationsBtn = document.getElementById('destinationsBtn');
    const rundownBtn = document.getElementById('rundownBtn');
    const destinationsSection = document.getElementById('destinationsSection');
    const rundownSection = document.getElementById('rundownSection');
    const addDestinationBtn = document.getElementById('addDestinationBtn');
    const destinationName = document.getElementById('destinationName');
    const destinationLocation = document.getElementById('destinationLocation');
    const destinationsList = document.getElementById('destinationsList');
    
    async function renderDestinations() {
        const { data, error } = await supabase.from('destinations').select('*');
        if (error) {
            alert('Error fetching destinations: ' + error.message);
            return;
        }
        destinationsList.innerHTML = '';
        data.forEach((destination, index) => {
            const destinationElement = document.createElement('div');
            destinationElement.className = 'card bg-white rounded-lg overflow-hidden';
            destinationElement.innerHTML = `
                <div class="pointer-events-none">
                    <div class="p-4 pb-3">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-map-marker-alt text-rose-500 mr-2"></i>
                            <h4 class="font-medium text-gray-800">${destination.name}</h4>
                        </div>
                        <p class="text-gray-600 text-sm">${destination.location}</p>
                    </div>
                    <div class="px-4 pb-3 pt-0 flex justify-end">
                        <button class="delete-destination text-rose-600 hover:text-rose-800 text-sm" data-id="${destination.id}">
                            <i class="fas fa-trash-alt mr-1"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            destinationsList.appendChild(destinationElement);
        });
        
        document.querySelectorAll('.delete-destination').forEach(button => {
            button.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                await deleteDestination(id);
            });
        });
    }
    
    async function addDestination(name, location) {
        if (!name.trim() || !location.trim()) {
            alert('Please fill in both name and location');
            return;
        }
        
        const { data, error } = await supabase.from('destinations').insert([{ name, location }]);
        if (error) {
            alert('Error adding destination: ' + error.message);
            return;
        }
        destinationName.value = '';
        destinationLocation.value = '';
        renderDestinations();
    }
    
    async function deleteDestination(id) {
        const { error } = await supabase.from('destinations').delete().eq('id', id);
        if (error) {
            alert('Error deleting destination: ' + error.message);
            return;
        }
        renderDestinations();
    }
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if ((username === 'alma' && password === 'urgf') || (username === 'fandi' && password === 'urbf')) {
            loginSection.classList.add('opacity-0', 'pointer-events-none');
            mainContent.classList.remove('hidden');
            currentUser = username;
            initFinance();
            destinationsSection.classList.remove('hidden');
            rundownSection.classList.add('hidden');
            renderDestinations();
            renderTimeline();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        loginSection.classList.remove('opacity-0', 'pointer-events-none');
        mainContent.classList.add('hidden');
        loginForm.reset();
    });
    
    const dresscodeBtn = document.getElementById('dresscodeBtn');
    const dresscodeSection = document.getElementById('dresscodeSection');
    const galleryBtn = document.getElementById('galleryBtn');
    const gallerySection = document.getElementById('gallerySection');
    const financeBtn = document.getElementById('financeBtn');
    const financeSection = document.getElementById('financeSection');
    
    destinationsBtn.addEventListener('click', function() {
        destinationsSection.classList.remove('hidden');
        rundownSection.classList.add('hidden');
        dresscodeSection.classList.add('hidden');
        gallerySection.classList.add('hidden');
        financeSection.classList.add('hidden');
    });
    
    rundownBtn.addEventListener('click', function() {
        rundownSection.classList.remove('hidden');
        destinationsSection.classList.add('hidden');
        dresscodeSection.classList.add('hidden');
        gallerySection.classList.add('hidden');
        financeSection.classList.add('hidden');
        renderTimeline();
    });
    
    dresscodeBtn.addEventListener('click', function() {
        dresscodeSection.classList.remove('hidden');
        destinationsSection.classList.add('hidden');
        rundownSection.classList.add('hidden');
        gallerySection.classList.add('hidden');
        financeSection.classList.add('hidden');
    });
    
    galleryBtn.addEventListener('click', function() {
        gallerySection.classList.remove('hidden');
        destinationsSection.classList.add('hidden');
        rundownSection.classList.add('hidden');
        dresscodeSection.classList.add('hidden');
        financeSection.classList.add('hidden');
    });
    
    financeBtn.addEventListener('click', function() {
        financeSection.classList.remove('hidden');
        destinationsSection.classList.add('hidden');
        rundownSection.classList.add('hidden');
        dresscodeSection.classList.add('hidden');
        gallerySection.classList.add('hidden');
        renderFinanceData();
    });
    
    async function initFinance() {
        const { data: budgetsData, error: budgetsError } = await supabase.from('budgets').select('*').eq('user', currentUser);
        const { data: expensesData, error: expensesError } = await supabase.from('expenses').select('*').eq('user', currentUser);
        if (budgetsError || expensesError) {
            alert('Error loading finance data: ' + (budgetsError?.message || expensesError?.message));
            budgets = [];
            expenses = [];
        } else {
            budgets = budgetsData;
            expenses = expensesData;
        }
        
        document.getElementById('addBudgetBtn').addEventListener('click', async function() {
            const category = document.getElementById('financeCategory').value;
            const amountInput = document.getElementById('plannedAmount').value;
            const amount = parseRupiah(amountInput);
            
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            const { error } = await supabase.from('budgets').insert([{ category, amount, user: currentUser }]);
            if (error) {
                alert('Error adding budget: ' + error.message);
                return;
            }
            document.getElementById('plannedAmount').value = '';
            renderFinanceData();
        });
        
        document.getElementById('addExpenseBtn').addEventListener('click', async function() {
            const date = document.getElementById('expenseDate').value;
            const category = document.getElementById('expenseCategory').value;
            const amountInput = document.getElementById('expenseAmount').value;
            const amount = parseRupiah(amountInput);
            const description = document.getElementById('expenseDescription').value;
            
            if (!date || isNaN(amount) || amount <= 0 || !description) {
                alert('Please fill all fields with valid values');
                return;
            }
            
            const { error } = await supabase.from('expenses').insert([{ date, category, amount, description, user: currentUser }]);
            if (error) {
                alert('Error adding expense: ' + error.message);
                return;
            }
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expenseDescription').value = '';
            renderFinanceData();
        });
    }
    
    function formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
    
    document.querySelectorAll('input[type="text"][placeholder^="Rp"]').forEach(input => {
        input.addEventListener('keyup', function(e) {
            let value = this.value.replace(/\D/g, '');
            this.value = value ? 'Rp' + value.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
        });
    });
    
    function calculateTotals() {
        const totalBudget = budgets.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
        const remaining = totalBudget - totalExpense;
        
        document.getElementById('plannedBudget').textContent = formatRupiah(totalBudget);
        document.getElementById('actualSpent').textContent = formatRupiah(totalExpense);
        document.getElementById('remainingBudget').textContent = formatRupiah(remaining);
        
        return { totalBudget, totalExpense };
    }
    
    function parseRupiah(value) {
        if (!value) return 0;
        return parseInt(value.replace(/\D/g, '') || '0');
    }
    
    async function renderFinanceData() {
        const { data: budgetsData, error: budgetsError } = await supabase.from('budgets').select('*').eq('user', currentUser);
        const { data: expensesData, error: expensesError } = await supabase.from('expenses').select('*').eq('user', currentUser);
        if (budgetsError || expensesError) {
            alert('Error fetching finance data: ' + (budgetsError?.message || expensesError?.message));
            return;
        }
        budgets = budgetsData;
        expenses = expensesData;
        
        const { totalBudget, totalExpense } = calculateTotals();
        const tableBody = document.getElementById('financeTableBody');
        tableBody.innerHTML = '';
        
        const categories = [...new Set(budgets.map(item => item.category))];
        
        categories.forEach(category => {
            const catBudgets = budgets.filter(b => b.category === category);
            const catExpenses = expenses.filter(e => e.category === category);
            
            const catBudget = catBudgets.reduce((sum, item) => sum + item.amount, 0);
            const catExpense = catExpenses.reduce((sum, item) => sum + item.amount, 0);
            const difference = catBudget - catExpense;
            const percentage = catBudget > 0 ? (catExpense / catBudget * 100).toFixed(2) : 0;
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3 text-sm text-gray-700 capitalize">${category}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">${formatRupiah(catBudget)}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">${formatRupiah(catExpense)}</td>
                <td class="px-4 py-3 text-sm text-right ${difference >= 0 ? 'text-green-600' : 'text-red-600'}">${formatRupiah(difference)}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">${percentage}%</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    async function renderTimeline() {
        const timeline = document.querySelector('.timeline');
        if (!timeline) return;
        timeline.innerHTML = '';
        
        const { data: rundownItems, error } = await supabase.from('rundown').select('*');
        if (error) {
            alert('Error fetching rundown items: ' + error.message);
            return;
        }
        
        rundownItems.forEach(item => {
            const newItem = document.createElement('div');
            newItem.className = 'timeline-item relative pb-6';
            newItem.innerHTML = `
                <div class="bg-rose-50 p-4 rounded-lg">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-medium text-gray-800">${item.time}</h4>
                        ${item.isSuggestion ? '<span class="text-xs text-rose-500">Suggestion</span>' : ''}
                    </div>
                    <p class="text-gray-600">${item.activity}</p>
                </div>
            `;
            timeline.appendChild(newItem);
        });
    }
    
    addDestinationBtn.addEventListener('click', function() {
        const name = destinationName.value;
        const location = destinationLocation.value;
        addDestination(name, location);
        
        const message = `*NEW DESTINATION SUGGESTION*\n\n*Name:* ${name}\n*Location:* ${location}\n\nFrom: ${username}`;
        sendToWhatsApp(message);
    });
    
    const addRundownSuggestionBtn = document.getElementById('addRundownSuggestionBtn');
    const rundownTime = document.getElementById('rundownTime');
    const rundownActivity = document.getElementById('rundownActivity');
    
    addRundownSuggestionBtn.addEventListener('click', async function() {
        const time = rundownTime.value;
        const activity = rundownActivity.value;
        
        if (!time || !activity) {
            alert('Please fill both time and activity');
            return;
        }
        
        const { error } = await supabase.from('rundown').insert([{ time, activity, isSuggestion: true, user: currentUser }]);
        if (error) {
            alert('Error adding rundown suggestion: ' + error.message);
            return;
        }
        
        renderTimeline();
        
        const message = `*NEW RUNDOWN SUGGESTION*\n\n*Time:* ${time}\n*Activity:* ${activity}\n\nFrom: ${username}`;
        sendToWhatsApp(message);
        
        rundownTime.value = '';
        rundownActivity.value = '';
    });
    
    const shareDirectionsBtn = document.getElementById('shareDirectionsBtn');
    shareDirectionsBtn.addEventListener('click', async function() {
        let message = 'Our romantic itinerary:\n\n';
        
        const { data: destinationsData, error: destinationsError } = await supabase.from('destinations').select('*');
        if (destinationsError) {
            alert('Error fetching destinations: ' + destinationsError.message);
            return;
        }
        
        message += 'Destinations:\n';
        destinationsData.forEach(dest => {
            message += `📍 ${dest.name}\n${dest.location}\n\n`;
        });
        
        const { data: rundownData, error: rundownError } = await supabase.from('rundown').select('*');
        if (rundownError) {
            alert('Error fetching rundown: ' + rundownError.message);
            return;
        }
        
        message += 'Schedule:\n';
        rundownData.forEach(item => {
            message += `⏰ ${item.time}\n${item.activity}\n\n`;
        });
        
        sendToWhatsApp(message);
    });
    
    destinationLocation.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addDestination(destinationName.value, destinationLocation.value);
        }
    });
});