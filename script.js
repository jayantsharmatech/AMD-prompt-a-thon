let foodDatabase = {};
let macroChart;

// Initialize Chart on load
document.addEventListener('DOMContentLoaded', () => {
    initChart();
});

// Load database from file
fetch('food_database.json')
    .then(response => response.json())
    .then(data => {
        foodDatabase = data;
    })
    .catch(err => console.error('Error loading food database:', err));

const dailyLimits = {
    calories: 2000,
    protein: 50,
    fat: 70,
    carbs: 260,
    sugar: 50,
    sodium: 2300
};

let currentIntake = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    sugar: 0,
    sodium: 0
};

// Keep track of logged items with unique IDs
let loggedFoods = [];

const healthTips = {
    calories: "Energy capacity exceeded. Initiate metabolic burn via physical activity.",
    protein: "High protein detected. Ensure adequate hydration for renal processing.",
    fat: "Lipid limit reached. Prioritize lean fuel sources for subsequent intake.",
    carbs: "Carbohydrate overload. Risk of energy crash. Stabilize with fiber.",
    sugar: "⚠️ High sucrose alert. System inflammation risk. Hydrate and avoid sweets.",
    sodium: "⚠️ High sodium alert. Blood pressure risk detected. Flush system with H2O."
};

let activeAlerts = new Set();

// DOM Elements
const foodInput = document.getElementById('foodInput');
const suggestionsBox = document.getElementById('suggestionsBox');
const addBtn = document.getElementById('addBtn');
const foodList = document.getElementById('foodList');
const alertsContainer = document.getElementById('alertsContainer');

// Modal Elements
const customFoodModal = document.getElementById('customFoodModal');
const closeModalBtn = document.getElementById('closeModal');
const saveCustomBtn = document.getElementById('saveCustomBtn');

function initChart() {
    const ctx = document.getElementById('macroChart').getContext('2d');
    
    // Gradient definitions could be added, but solid vibrant colors fit light theme well
    macroChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Protein (g)', 'Fat (g)', 'Carbs (g)'],
            datasets: [{
                data: [0, 0, 0], // Initial empty state
                backgroundColor: [
                    '#6366f1', // Indigo
                    '#f59e0b', // Amber/Orange
                    '#10b981'  // Emerald
                ],
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#0f172a',
                        font: { family: 'Inter', size: 12, weight: '500' },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#0f172a',
                    bodyColor: '#0f172a',
                    borderColor: 'rgba(14, 165, 233, 0.2)',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4,
                    usePointStyle: true
                }
            }
        }
    });
}

// Autocomplete logic
foodInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    suggestionsBox.innerHTML = '';
    
    if (!val) {
        suggestionsBox.classList.add('hidden');
        return;
    }
    
    const matches = Object.keys(foodDatabase).filter(food => food.includes(val));
    
    if (matches.length > 0) {
        suggestionsBox.classList.remove('hidden');
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <span class="suggestion-name">${match.charAt(0).toUpperCase() + match.slice(1)}</span>
                <span class="suggestion-cal">${foodDatabase[match].calories} kcal</span>
            `;
            div.addEventListener('click', () => {
                foodInput.value = match;
                suggestionsBox.classList.add('hidden');
            });
            suggestionsBox.appendChild(div);
        });
    } else {
        // Show "Add Custom Food" option
        suggestionsBox.classList.remove('hidden');
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `<span class="suggestion-name" style="color: #0ea5e9;">+ Init custom entry: "${val}"</span>`;
        div.addEventListener('click', () => {
            openCustomModal(val);
            suggestionsBox.classList.add('hidden');
        });
        suggestionsBox.appendChild(div);
    }
});

// Close suggestions on outside click
document.addEventListener('click', (e) => {
    if (e.target !== foodInput && e.target !== suggestionsBox) {
        suggestionsBox.classList.add('hidden');
    }
});

// Add Food logic
addBtn.addEventListener('click', () => {
    let foodName = foodInput.value.toLowerCase().trim();
    if (!foodName) return;

    if (foodDatabase[foodName]) {
        addFoodToLog(foodName, foodDatabase[foodName]);
        foodInput.value = '';
    } else {
        openCustomModal(foodName);
    }
});

foodInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        suggestionsBox.classList.add('hidden');
        addBtn.click();
    }
});

function addFoodToLog(name, nutrientData) {
    const id = Date.now().toString() + Math.floor(Math.random() * 1000);
    
    loggedFoods.push({
        id,
        name,
        nutrients: nutrientData
    });

    renderFoodList();
    updateTotals();
}

// Ensure function is exposed globally for onclick handlers in innerHTML
window.removeFoodFromLog = function(id) {
    loggedFoods = loggedFoods.filter(food => food.id !== id);
    renderFoodList();
    updateTotals();
}

function renderFoodList() {
    foodList.innerHTML = '';
    
    if (loggedFoods.length === 0) {
        foodList.innerHTML = '<li class="empty-state">System standing by. Awaiting food input.</li>';
        return;
    }

    // Render in reverse to show newest first
    [...loggedFoods].reverse().forEach(food => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="food-item-content">
                <span class="food-name">${food.name.charAt(0).toUpperCase() + food.name.slice(1)}</span>
                <span class="food-details">${food.nutrients.calories} kcal | P: ${food.nutrients.protein}g</span>
            </div>
            <button class="remove-btn" title="Remove Data" onclick="removeFoodFromLog('${food.id}')">&times;</button>
        `;
        foodList.appendChild(li);
    });
}

function updateTotals() {
    // Reset totals
    currentIntake = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        sugar: 0,
        sodium: 0
    };

    // Recalculate
    loggedFoods.forEach(food => {
        currentIntake.calories += food.nutrients.calories;
        currentIntake.protein += food.nutrients.protein;
        currentIntake.fat += food.nutrients.fat;
        currentIntake.carbs += food.nutrients.carbs;
        currentIntake.sugar += food.nutrients.sugar;
        currentIntake.sodium += food.nutrients.sodium;
    });

    updateDashboard();
    checkLimits();
}

function updateDashboard() {
    updateNutrient('cal', 'calories', 'kcal');
    updateNutrient('protein', 'protein', 'g');
    updateNutrient('fat', 'fat', 'g');
    updateNutrient('carbs', 'carbs', 'g');
    updateNutrient('sugar', 'sugar', 'g');
    updateNutrient('sodium', 'sodium', 'mg');
    
    // Update Chart
    if (macroChart) {
        // Only update chart if there are actual macros logged, otherwise show 0
        const totalMacros = currentIntake.protein + currentIntake.fat + currentIntake.carbs;
        if (totalMacros > 0) {
            macroChart.data.datasets[0].data = [currentIntake.protein, currentIntake.fat, currentIntake.carbs];
        } else {
            macroChart.data.datasets[0].data = [0, 0, 0];
        }
        macroChart.update();
    }
}

function updateNutrient(prefix, key, unit) {
    const textEl = document.getElementById(`${prefix}Text`);
    const fillEl = document.getElementById(`${prefix}Fill`);
    
    const current = Math.round(currentIntake[key] * 10) / 10;
    const limit = dailyLimits[key];
    const percentage = Math.min((current / limit) * 100, 100);
    
    textEl.innerText = `${current} / ${limit}${unit}`;
    fillEl.style.width = `${percentage}%`;

    if (current > limit) {
        textEl.classList.add('text-danger');
        fillEl.classList.add('over-limit');
    } else {
        textEl.classList.remove('text-danger');
        fillEl.classList.remove('over-limit');
    }
}

function checkLimits() {
    alertsContainer.innerHTML = ''; // clear all and rebuild
    activeAlerts.clear();

    const nutrients = Object.keys(dailyLimits);
    
    nutrients.forEach(key => {
        if (currentIntake[key] > dailyLimits[key]) {
            activeAlerts.add(key);
            createAlert(key);
        }
    });
}

function createAlert(nutrientKey) {
    const iconMap = {
        calories: '⚡',
        protein: '🧬',
        fat: '🟡',
        carbs: '🔷',
        sugar: '⚠️',
        sodium: '🔴'
    };

    const alertCard = document.createElement('div');
    alertCard.className = 'alert-card';
    alertCard.innerHTML = `
        <div class="alert-icon">${iconMap[nutrientKey]}</div>
        <div class="alert-content">
            <h3>CRITICAL: High ${nutrientKey.toUpperCase()}</h3>
            <p>${healthTips[nutrientKey]}</p>
        </div>
    `;
    alertsContainer.appendChild(alertCard);
}

// Custom Modal Logic
function openCustomModal(prefillName = "") {
    document.getElementById('customName').value = prefillName.charAt(0).toUpperCase() + prefillName.slice(1);
    document.getElementById('customCal').value = 0;
    document.getElementById('customProtein').value = 0;
    document.getElementById('customFat').value = 0;
    document.getElementById('customCarbs').value = 0;
    document.getElementById('customSugar').value = 0;
    document.getElementById('customSodium').value = 0;
    
    customFoodModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
    customFoodModal.classList.add('hidden');
});

saveCustomBtn.addEventListener('click', () => {
    const name = document.getElementById('customName').value.toLowerCase().trim();
    if (!name) return;

    const nutrientData = {
        calories: parseFloat(document.getElementById('customCal').value) || 0,
        protein: parseFloat(document.getElementById('customProtein').value) || 0,
        fat: parseFloat(document.getElementById('customFat').value) || 0,
        carbs: parseFloat(document.getElementById('customCarbs').value) || 0,
        sugar: parseFloat(document.getElementById('customSugar').value) || 0,
        sodium: parseFloat(document.getElementById('customSodium').value) || 0
    };

    // Save to our local memory database so it can be searched again in this session
    foodDatabase[name] = nutrientData;
    
    addFoodToLog(name, nutrientData);
    
    customFoodModal.classList.add('hidden');
    foodInput.value = '';
});
