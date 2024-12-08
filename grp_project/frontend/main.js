document.getElementById('hireStaffForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const p_staffno = Number(document.getElementById('staffNo').value);
    const p_fname = document.getElementById('firstName').value;
    const p_lname = document.getElementById('lastName').value;
    const p_position = document.getElementById('position').value;
    const p_sex = document.getElementById('sex').value.trim().toUpperCase();

    if (!['M', 'F'].includes(p_sex)) {
        alert("Please enter a valid sex (M or F).");
        return;
    }
    
    const p_dob = new Date(document.getElementById('dob').value).toISOString().split('T')[0];
    const p_salary = Number(document.getElementById('salary').value);
    const p_branchno = document.getElementById('branchNo').value;
    const p_telephone = document.getElementById('telephone').value;
    const p_mobile = document.getElementById('mobile').value;
    const p_email = document.getElementById('email').value;

    console.log({
        p_staffno, p_fname, p_lname, p_position, p_sex, p_dob, p_salary, p_branchno, p_telephone, p_mobile, p_email
    });

    if (!p_staffno || isNaN(p_staffno)) {
        alert("Please enter a valid staff number.");
        return;
    }
    if (!['M', 'F'].includes(p_sex)) {
        alert("Please select a valid sex (M/F).");
        return;
    }
    if (!p_dob) {
        alert("Please enter a valid date of birth.");
        return;
    }

    fetch('http://localhost:3000/hire-staff', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            p_staffno, p_fname, p_lname, p_position, p_sex, p_dob, p_salary, p_branchno, p_telephone, p_mobile, p_email
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        if (result.message) {
            alert(result.message);
        } else {
            alert('Error: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: Could not contact server.');
    });
});
