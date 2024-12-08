<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Management</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table, th, td {
            border: 1px solid black;
        }
        th, td {
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        input[type="text"] {
            width: 100%;
            box-sizing: border-box;
        }
        .update-button {
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Staff Management</h1>
    <table id="staffTable">
        <thead>
            <tr>
                <th>Staff No</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Position</th>
                <th>Sex</th>
                <th>Date of Birth</th>
                <th>Salary</th>
                <th>Branch No</th>
                <th>Telephone</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <!-- Staff records will be dynamically inserted here -->
        </tbody>
    </table>
    <button class="update-button" onclick="updateStaff()">Update Staff</button>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            fetch('http://localhost:3000/list-staff')
                .then(response => response.json())
                .then(staffList => {
                    const staffTableBody = document.getElementById('staffTable').querySelector('tbody');
                    staffList.forEach(staff => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${staff.staffno}</td>
                            <td>${staff.fname}</td>
                            <td>${staff.lname}</td>
                            <td>${staff.position}</td>
                            <td>${staff.sex}</td>
                            <td>${new Date(staff.dob).toISOString().split('T')[0]}</td>
                            <td><input type="text" value="${staff.salary}" data-staffno="${staff.staffno}" data-field="salary"></td>
                            <td>${staff.branchno}</td>
                            <td><input type="text" value="${staff.phone}" data-staffno="${staff.staffno}" data-field="phone"></td>
                            <td><input type="text" value="${staff.mobile}" data-staffno="${staff.staffno}" data-field="mobile"></td>
                            <td><input type="text" value="${staff.email}" data-staffno="${staff.staffno}" data-field="email"></td>
                            <td><button onclick="saveStaff(${staff.staffno})">Save</button></td>
                        `;
                        staffTableBody.appendChild(row);
                    });
                })
                .catch(error => console.error('Error fetching staff list:', error));
        });

        function saveStaff(staffno) {
            const salaryInput = document.querySelector(`input[data-staffno="${staffno}"][data-field="salary"]`).value;
            const phoneInput = document.querySelector(`input[data-staffno="${staffno}"][data-field="phone"]`).value;
            const emailInput = document.querySelector(`input[data-staffno="${staffno}"][data-field="email"]`).value;

            fetch('http://localhost:3000/update-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    staffno,
                    salary: salaryInput,
                    phone: phoneInput,
                    email: emailInput
                })
            })
            .then(response => response.json())
            .then(result => {
                alert(result.message);
                console.log(result);
            })
            .catch(error => console.error('Error updating staff:', error));
        }
    </script>
</body>
</html>
