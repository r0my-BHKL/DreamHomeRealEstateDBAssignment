const express = require('express');
const oracledb = require('oracledb');
const app = express();
const port = 3000;

const cors = require('cors');
app.use(cors());
app.use(express.json());

async function initOracleDb() {
    try {
        await oracledb.createPool({
            user: "COMP214_F24_er_12",
            password: "password", 
            connectString: "199.212.26.208:1521/SQLD"
        });
        console.log('Oracle Database connection established');
    } catch (err) {
        console.error('Error establishing Oracle DB connection', err);
    }
}

app.post('/hire-staff', async (req, res) => {
    const { p_staffno, p_fname, p_lname, p_position, p_sex, p_dob, p_salary, p_branchno, p_telephone, p_mobile, p_email } = req.body;

    if (!p_staffno || isNaN(p_staffno)) {
        return res.status(400).send({ message: "Please enter a valid staff number." });
    }
    if (!['M', 'F'].includes(p_sex)) {
        return res.status(400).send({ message: "Please select a valid sex (M/F)." });
    }
    if (!p_dob) {
        return res.status(400).send({ message: "Please enter a valid date of birth." });
    }
    if (!p_fname || !p_lname || !p_position || !p_salary || !p_branchno || !p_telephone || !p_mobile || !p_email) {
        return res.status(400).send({ message: "Please fill in all the required fields." });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const branchCheck = await connection.execute(
            `SELECT COUNT(*) AS branch_count FROM dh_branch WHERE branchno = :branchno`,
            { branchno: p_branchno }
        );

        if (branchCheck.rows[0][0] === 0) {
            const branchInsert = await connection.execute(
                `INSERT INTO dh_branch (branchno) VALUES (:branchno)`,
                { branchno: p_branchno },
                { autoCommit: true }
            );
            console.log(`Branch with branchno ${p_branchno} inserted.`);
        } else {
            console.log(`Branch with branchno ${p_branchno} already exists.`);
        }

        const result = await connection.execute(
            `BEGIN
                staff_hire_sp (
                    :p_staffno, :p_fname, :p_lname, :p_position, :p_sex, :p_dob, :p_salary, 
                    :p_branchno, :p_telephone, :p_mobile, :p_email
                );
            END;`,
            {
                p_staffno: { val: parseInt(p_staffno), type: oracledb.NUMBER },
                p_fname: { val: p_fname, type: oracledb.STRING },
                p_lname: { val: p_lname, type: oracledb.STRING },
                p_position: { val: p_position, type: oracledb.STRING },
                p_sex: { val: p_sex, type: oracledb.STRING },
                p_dob: { val: new Date(p_dob), type: oracledb.DATE },
                p_salary: { val: parseFloat(p_salary), type: oracledb.NUMBER },
                p_branchno: { val: p_branchno, type: oracledb.STRING },
                p_telephone: { val: p_telephone, type: oracledb.STRING },
                p_mobile: { val: p_mobile, type: oracledb.STRING },
                p_email: { val: p_email, type: oracledb.STRING }
            },
            { autoCommit: true }
        );

        res.send({ message: 'Staff hired successfully', data: result });

    } catch (error) {
        console.error('Error hiring staff:', error);
        res.status(500).send({ message: 'Error hiring staff', error: error.message, stack: error.stack });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
});
app.post('/register-client', async (req, res) => {
    const { clientno, fname, lname, telno, street, city, email, preftype, maxrent } = req.body;

    if (!clientno || !fname || !lname || !telno || !street || !city || !email || !preftype || !maxrent) {
        return res.status(400).send({ message: "All fields are required." });
    }

    const connection = await oracledb.getConnection();

    try {
        const result = await connection.execute(
            `BEGIN
                client_register_sp(:clientno, :fname, :lname, :telno, :street, :city, :email, :preftype, :maxrent);
            END;`,
            { clientno, fname, lname, telno, street, city, email, preftype, maxrent },
            { autoCommit: true }
        );

        res.send({ message: 'Client registered successfully', data: result });

    } catch (error) {
        console.error('Error registering client:', error);
        res.status(500).send({ message: 'Error registering client', error: error.message, stack: error.stack });
    } finally {
        await connection.close();
    }
});

app.post('/delete-client', async (req, res) => {
    const { clientno } = req.body;

    if (!clientno) {
        return res.status(400).send({ message: "Client number is required." });
    }

    const connection = await oracledb.getConnection();

    try {
        const result = await connection.execute(
            `BEGIN
                delete_client_sp(:clientno);
            END;`,
            { clientno },
            { autoCommit: true }
        );

        res.send({ message: 'Client deleted successfully', data: result });

    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).send({ message: 'Error deleting client', error: error.message, stack: error.stack });
    } finally {
        await connection.close();
    }
});

app.get('/list-staff', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        console.log("Fetching staff list...");
        const result = await connection.execute(
            `SELECT staffno, fname, lname, position, sex, dob, salary, branchno, telephone, mobile, email FROM dh_staff`
        );

        console.log("Staff list retrieved:", result.rows);
        res.send(result.rows.map(row => ({
            staffno: row[0],
            fname: row[1],
            lname: row[2],
            position: row[3],
            sex: row[4],
            dob: row[5],
            salary: row[6],
            branchno: row[7],
            telephone: row[8],  
            mobile: row[9],  
            email: row[10]
        })));

    } catch (error) {
        console.error("Error fetching staff list:", error);
        res.status(500).send({ message: "Error fetching staff list.", error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
});

app.post('/update-staff', async (req, res) => {
    const { staffno, salary, telephone, email } = req.body;

    // Validate inputs
    if (!staffno) {
        return res.status(400).send({ message: "Staff number is required." });
    }

    // Ensure salary is a valid number
    if (salary && isNaN(salary)) {
        return res.status(400).send({ message: "Invalid salary input." });
    }

    // Ensure telephone is a valid number
    if (telephone && isNaN(telephone)) {
        return res.status(400).send({ message: "Invalid telephone number." });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // Update query
        const result = await connection.execute(
            `UPDATE DH_STAFF 
             SET SALARY = NVL(:salary, SALARY), 
                 TELEPHONE = NVL(:telephone, TELEPHONE), 
                 EMAIL = NVL(:email, EMAIL)
             WHERE STAFFNO = :staffno`,
            { salary, telephone, email, staffno },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).send({ message: "Staff record not found." });
        }

        res.send({ success: true, message: "Staff record updated successfully." });
    } catch (error) {
        console.error("Error updating staff:", error);
        res.status(500).send({ message: "Error updating staff record.", error: error.message, stack: error.stack });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
});
// Get Branch Address
app.get('/get-branch-address/:branchno', async (req, res) => {
    const { branchno } = req.params;

    if (!branchno) {
        return res.status(400).send({ message: "Branch number is required." });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT street || ', ' || city AS address FROM dh_branch WHERE branchno = :branchno`,
            { branchno }
        );

        if (result.rows.length === 0) {
            return res.status(404).send({ message: "Branch not found." });
        }

        res.send({ address: result.rows[0][0] });
    } catch (error) {
        console.error("Error fetching branch address:", error);
        res.status(500).send({ message: "Error fetching branch address.", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// Update Branch Details
app.post('/update-branch', async (req, res) => {
    const { branchno, street, city } = req.body;

    if (!branchno || !street || !city) {
        return res.status(400).send({ message: "Branch number, street, and city are required." });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `UPDATE dh_branch SET street = :street, city = :city WHERE branchno = :branchno`,
            { branchno, street, city },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).send({ message: "Branch not found." });
        }

        res.send({ message: "Branch updated successfully." });
    } catch (error) {
        console.error("Error updating branch:", error);
        res.status(500).send({ message: "Error updating branch.", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// Create New Branch
app.post('/create-branch', async (req, res) => {
    const { branchno, street, city, postcode } = req.body;

    if (!branchno || !street || !city || !postcode) {
        return res.status(400).send({ message: "All fields are required." });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `BEGIN
                new_branch(:branchno, :street, :city, :postcode);
             END;`,
            { branchno, street, city, postcode },
            { autoCommit: true }
        );

        res.send({ message: "Branch created successfully." });
    } catch (error) {
        console.error("Error creating branch:", error);
        res.status(500).send({ message: "Error creating branch.", error: error.message });
    } finally {
        if (connection) await connection.close();
    }
});



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

initOracleDb();
