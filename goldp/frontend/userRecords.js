const API_URL = 'http://127.0.0.1:8000';
const userId = localStorage.getItem('user_id'); // Get the logged-in user's ID from localStorage

// Function to fetch user details and gold records
async function fetchLoggedInUserDetailsAndGoldRecords() {
    try {
        const token = localStorage.getItem('token'); // Fetch the token from localStorage

        if (!token || !userId) {
            throw new Error('User is not authenticated or user ID is missing.');
        }

        // Fetch user details from /users
        const usersResponse = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!usersResponse.ok) {
            throw new Error(`Error fetching user details: ${usersResponse.statusText}`);
        }

        const users = await usersResponse.json();
        const user = users.find(u => u.id === parseInt(userId)); // Get the logged-in user's details

        if (!user) {
            throw new Error('Logged-in user not found.');
        }

        // Fetch user's gold records
        const recordsResponse = await fetch(`${API_URL}/users/${userId}/gold_records`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!recordsResponse.ok) {
            throw new Error(`Error fetching gold records for user ${userId}: ${recordsResponse.statusText}`);
        }

        const goldRecords = await recordsResponse.json();
        console.log(goldRecords);

        // Display user details and gold records
        displayUserAndGoldRecords(user, goldRecords);

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// Function to display user details and their gold records
function displayUserAndGoldRecords(user, goldRecords) {
    const tableBody = document.querySelector('#goldRecordsTable tbody');
    tableBody.innerHTML = ''; // Clear any existing rows

    goldRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${record.gold_price_per_gram}</td>
            <td>${record.amount_in_currency}</td> <!-- Directly display 'amount_in_currency' from the database -->
            <td>${record.calculated_gold}</td>
        `;
        tableBody.appendChild(row);
    });
}


// Call the function on page load
window.onload = fetchLoggedInUserDetailsAndGoldRecords;
