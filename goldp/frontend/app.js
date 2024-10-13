const goldPriceElement = document.getElementById('goldPrice');
const goldAmountElement = document.getElementById('goldAmount');
let goldPricePerGramINR = 0;

// Fetch Gold Price from API
async function fetchGoldPrice() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        const url = 'https://gold-price-live.p.rapidapi.com/get_metal_prices';
        const options = {
          method: 'GET',
          headers: {
            'x-rapidapi-key': '0c655e2357msh16ac8167a57962ep128406jsnc952cea07045',
            'x-rapidapi-host': 'gold-price-live.p.rapidapi.com'
          }
        };
        const response = await fetch(url, options);
        // const options = {
        //     method: 'GET',
        //     hostname: 'gold-price-live.p.rapidapi.com',
        //     port: null,
        //     path: '/get_metal_prices',
        //     headers: {
        //         'x-rapidapi-key': 'f0dd1e4280mshf542a2e1f6d38c2p13db50jsn2451cc80f808',
        //         'x-rapidapi-host': 'gold-price-live.p.rapidapi.com'
        //     }
        // };
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data.gold)
        const goldPriceINRPerOunce = data.gold
        goldPricePerGramINR = (goldPriceINRPerOunce / 31.1035)*83.96;
        goldPriceElement.innerHTML = `₹${goldPricePerGramINR} INR / gram`;
    } catch (error) {
        goldPriceElement.innerHTML = `Error fetching data: ${error.message}`;
        if (error.message === 'Not authenticated') {
            showLogin(); // Redirect to login if not authenticated
        }
    }
}

// Fetch user details from the backend
async function fetchUsers() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch('http://127.0.0.1:8000/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('usersList').innerHTML = `Error: ${error.message}`;
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = ''; // Clear the list before adding new users

    users.forEach(user => {
        const userItem = document.createElement('li');
        userItem.textContent = `ID: ${user.id}, Username: ${user.username}`;
        usersList.appendChild(userItem);
    });
}

// Call this function when the users page is loaded
if (window.location.pathname === '/users') {
    fetchUsers();
}

// Fetch price every 60 seconds only if user is logged in
function startPriceFetching() {
    if (localStorage.getItem('token')) {
        fetchGoldPrice();
        setInterval(fetchGoldPrice, 6000000); // Fetch gold price every 100 minutes
    }
}

// Call this function when the app loads or when user logs in
startPriceFetching();

async function calculateGold() {
    const amount = document.getElementById('amount').value;
    const userId = localStorage.getItem('user_id'); // Get the actual logged-in user's ID from local storage

    if (amount && goldPricePerGramINR) {
        const goldAmount = amount / goldPricePerGramINR;
        goldAmountElement.innerHTML = `You can buy ${goldAmount.toFixed(4)} grams of gold with ₹${amount}`;

        // Send request to store the calculated gold record
        try {
            const response = await fetch(`http://127.0.0.1:8000/calculate_gold/${userId}`, {
                method: 'POST',  // Ensure the method is POST
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currency: "INR",
                    gold_price_per_gram: goldPricePerGramINR,
                    amount_in_currency: parseFloat(amount),
                    calculated_gold: goldAmount
                })
            });

            if (!response.ok) {
                throw new Error('Error saving gold record');
            }

            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error:', error);
            
        }
    } else {
        goldAmountElement.innerHTML = 'Please enter a valid amount and wait for price update.';
    }
}

// Listen for the Enter key to calculate gold
document.getElementById('amount').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default form submission
        calculateGold(); // Call the calculate function
    }
});
