const foodDatabase = {
    "apple": { calories: 95, protein: 0.5, fat: 0.3, carbs: 25, sugar: 19, sodium: 2 },
    "pizza slice": { calories: 285, protein: 12, fat: 10, carbs: 36, sugar: 4, sodium: 640 },
    "salad": { calories: 150, protein: 5, fat: 10, carbs: 12, sugar: 4, sodium: 150 },
    "milk (1 cup)": { calories: 149, protein: 8, fat: 8, carbs: 12, sugar: 12, sodium: 105 },
    "burger": { calories: 500, protein: 25, fat: 26, carbs: 40, sugar: 9, sodium: 1000 },
    "soda (can)": { calories: 140, protein: 0, fat: 0, carbs: 39, sugar: 39, sodium: 45 },
    "chicken breast": { calories: 165, protein: 31, fat: 3.6, carbs: 0, sugar: 0, sodium: 74 },
    "white rice (1 cup)": { calories: 205, protein: 4.3, fat: 0.4, carbs: 45, sugar: 0.1, sodium: 2 },
    "ice cream (1 scoop)": { calories: 137, protein: 2.3, fat: 7, carbs: 16, sugar: 14, sodium: 53 },
    "almonds (1 oz)": { calories: 164, protein: 6, fat: 14, carbs: 6, sugar: 1.2, sodium: 0 },
    "salmon (4 oz)": { calories: 236, protein: 22, fat: 15, carbs: 0, sugar: 0, sodium: 50 },
    "banana": { calories: 105, protein: 1.3, fat: 0.3, carbs: 27, sugar: 14, sodium: 1 },
    "french fries (med)": { calories: 365, protein: 4, fat: 17, carbs: 48, sugar: 0.5, sodium: 246 },
    "oatmeal (1 cup)": { calories: 158, protein: 6, fat: 3.2, carbs: 27, sugar: 1.1, sodium: 115 },
    "eggs (2 large)": { calories: 143, protein: 12.6, fat: 9.5, carbs: 0.7, sugar: 0.4, sodium: 142 }
};

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

const healthTips = {
    calories: "You've exceeded your daily calorie goal. Try to incorporate some light exercise like walking or stretching to help burn off excess energy.",
    protein: "High protein intake is generally fine, but ensure you're drinking plenty of water to help your kidneys process it.",
    fat: "You're over your fat limit. Focus on lean proteins and veggies for your next meals to balance it out.",
    carbs: "High carb intake can lead to energy crashes. Consider adding some fiber-rich foods to stabilize your blood sugar.",
    sugar: "⚠️ High sugar intake! This can cause inflammation and energy spikes. Drink water and avoid sweet drinks or desserts for the rest of the day.",
    sodium: "⚠️ High sodium alert! This can increase blood pressure. Drink extra water to help flush it out, and avoid salty snacks."
};

let activeAlerts = new Set();

// DOM Elements
const foodInput = document.getElementById('foodInput');
const suggestionsBox = document.getElementById('suggestionsBox');
const addBtn = document.getElementById('addBtn');
const foodList = document.getElementById('foodList');
const alertsContainer = document.getElementById('alertsContainer');

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
        suggestionsBox.classList.add('hidden');
    }
});

// Close suggestions on outside click
document.addEventListener('click', (e) => {
    if (e.target !== foodInput && e.target !== suggestionsBox) {
        suggestionsBox.classList.add('hidden');
    }
});

// Add Food logic
addBtn.addEventListener('click', addFood);
foodInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        suggestionsBox.classList.add('hidden');
        addFood();
    }
});

function addFood() {
    let foodName = foodInput.value.toLowerCase().trim();
    if (!foodName) return;

    const nutrientData = foodDatabase[foodName];
    
    if (nutrientData) {
        // Update history UI
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const li = document.createElement('li');
        li.innerHTML = `
            <span class="food-name">${foodName.charAt(0).toUpperCase() + foodName.slice(1)}</span>
            <span class="food-details">${nutrientData.calories} kcal | P: ${nutrientData.protein}g</span>
        `;
        foodList.prepend(li); // Add to top

        // Update totals
        currentIntake.calories += nutrientData.calories;
        currentIntake.protein += nutrientData.protein;
        currentIntake.fat += nutrientData.fat;
        currentIntake.carbs += nutrientData.carbs;
        currentIntake.sugar += nutrientData.sugar;
        currentIntake.sodium += nutrientData.sodium;

        updateDashboard();
        checkLimits();

        // Clear input
        foodInput.value = '';
    } else {
        // Handle unknown food
        alert("Food not found in database. Try 'apple', 'pizza slice', or 'salad'.");
    }
}

function updateDashboard() {
    updateNutrient('cal', 'calories', 'kcal');
    updateNutrient('protein', 'protein', 'g');
    updateNutrient('fat', 'fat', 'g');
    updateNutrient('carbs', 'carbs', 'g');
    updateNutrient('sugar', 'sugar', 'g');
    updateNutrient('sodium', 'sodium', 'mg');
}

function updateNutrient(prefix, key, unit) {
    const textEl = document.getElementById(`${prefix}Text`);
    const fillEl = document.getElementById(`${prefix}Fill`);
    
    const current = Math.round(currentIntake[key] * 10) / 10; // 1 decimal place
    const limit = dailyLimits[key];
    const percentage = Math.min((current / limit) * 100, 100);
    
    textEl.innerText = `${current} / ${limit}${unit}`;
    fillEl.style.width = `${percentage}%`;

    if (current > limit) {
        textEl.classList.add('text-danger');
        fillEl.classList.add('over-limit');
    }
}

function checkLimits() {
    const nutrients = Object.keys(dailyLimits);
    
    nutrients.forEach(key => {
        if (currentIntake[key] > dailyLimits[key] && !activeAlerts.has(key)) {
            activeAlerts.add(key);
            createAlert(key);
        }
    });
}

function createAlert(nutrientKey) {
    const iconMap = {
        calories: '🔥',
        protein: '🥩',
        fat: '🥑',
        carbs: '🍞',
        sugar: '🍩',
        sodium: '🧂'
    };

    const alertCard = document.createElement('div');
    alertCard.className = 'alert-card';
    alertCard.innerHTML = `
        <div class="alert-icon">${iconMap[nutrientKey]}</div>
        <div class="alert-content">
            <h3>High ${nutrientKey.charAt(0).toUpperCase() + nutrientKey.slice(1)} Alert</h3>
            <p>${healthTips[nutrientKey]}</p>
        </div>
    `;
    alertsContainer.prepend(alertCard);
}
