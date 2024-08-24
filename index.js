import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "users",
  password: "Nishant",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(bodyParser.json());

app.get("/", (req,res) =>{
    res.render("home.ejs");
})
app.get("/doctorlogin", (req,res) =>{
    res.render("doctor_login.ejs");
})

app.get("/userlogin", (req, res) => {
  res.render("user_login.ejs");
});

app.get("/userregister", (req, res) => {
  res.render("user_register.ejs");
});

app.get("/doctorregister", (req, res) => {
    res.render("doctor_register.ejs");
  });

app.get("/managerlogin", (req, res) => {
    res.render("manager_login.ejs");
});
app.get("/docPassword", (req,res) =>{
  res.render("docPassword.ejs");
})
app.get("/doctorInfo/:email", async (req, res) => {
  const email = req.params.email;

      const doctorQuery = "SELECT * FROM doctorInfo WHERE email = $1";
      const doctorResult = await db.query(doctorQuery,[email]);
      const doctor = doctorResult.rows[0];


  res.render("doctorInfo.ejs",{
    doctor: doctor,
  });
});


app.get("/homemanager",async (req,res) => {
    try {
      const doctorQuery = "SELECT * FROM doctorInfo";
      const doctorResult = await db.query(doctorQuery);
      const doctor = doctorResult.rows;

      const todayAppointmentsQuery = "SELECT * FROM patients WHERE date = CURRENT_DATE";
      const todayAppointmentsResult = await db.query(todayAppointmentsQuery);
      const pendingAppointments = todayAppointmentsResult.rowCount;
     
      const totalCasesQuery = "SELECT COUNT(*) FROM patientsdata";
      const totalCasesResult = await db.query(totalCasesQuery);
      const totalCases = totalCasesResult.rows[0].count;
  
  
      const patientsQuery = "SELECT * FROM patients WHERE date = CURRENT_DATE";
      const patientsResult = await db.query(patientsQuery);
      const patients = patientsResult.rows;
      
      const allPatientsQuery = "SELECT DISTINCT email, name FROM patientsData";
      const allPatientsresult = await db.query(allPatientsQuery)
      const allPatients = allPatientsresult.rows;

      const employeeResult = await db.query('SELECT * FROM Employees');
      const employees = employeeResult.rows;

      res.render("manager_home.ejs", {
        doctor: doctor, 
        pendingAppointments: pendingAppointments,
        totalCases: totalCases,
        patients: patients,
        allPatients: allPatients,
        employees: employees
      });
    }catch (error) {
      console.error("Error fetching patient data:", error);
      res.status(500).send("Internal Server Error");
    }
     
});

app.get("/homeuser/:email", async (req, res) => {
    const email = req.params.email;

    try {
      const prevQuery = "SELECT * FROM patientsData WHERE email = $1"; // OFFSET 0 LIMIT (SELECT COUNT(*) - 1 FROM patientsData WHERE email = $1)";
      const prevResult = await db.query(prevQuery, [email]);
      const prev = prevResult.rows;
      

      res.render("user_home.ejs",{
        email: email, prev: prev 
      });
    } catch (error) {
      console.error("Error fetching patient data:", error);
      res.status(500).send("Internal Server Error");
    }
    
  });

app.get("/prescription/:id", async (req, res) => {
  const patientId = req.params.id;
 
  try {
    const emailQuery = "SELECT email FROM patientsdata WHERE id = $1";
    const emailResult = await db.query(emailQuery, [patientId]);
    const email = emailResult.rows[0].email;

    const prevQuery = "SELECT * FROM patientsData WHERE email = $1"//OFFSET 0 LIMIT (SELECT COUNT(*) - 1 FROM patientsData WHERE email = $1;
    const prevResult = await db.query(prevQuery, [email]);
    const prev = prevResult.rows;


    const patientQuery = "SELECT * FROM patientsData WHERE id = $1";
    const patientResult = await db.query(patientQuery, [patientId]);
    const patient = patientResult.rows[0];

    res.render("prescription.ejs", { patient: patient, prev: prev });
      
  } catch (error) {
    console.error("Error fetching patient data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/PatientRecord/:email", async(req,res) => {
  const email = req.params.email;
  try {
    const PatientRecordQuery = "SELECT * FROM patientsData where email = $1";
    const PatientRecordResult = await db.query(PatientRecordQuery,[email]);
    const PatientRecord = PatientRecordResult.rows;

    res.render("PatientRecord.ejs",{
      PatientRecord: PatientRecord,
    });
    
  } catch (error) {
    console.error("Error fetching patient data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/prevPrescription/:id", async (req, res) => {
  const patientId = req.params.id;
 
  try {
    const patientQuery = "SELECT * FROM patientsData WHERE id = $1";
    const patientResult = await db.query(patientQuery, [patientId]);
    const patient = patientResult.rows[0];
    res.render("prevPrescription.ejs", { patient: patient });
      
  } catch (error) {
    console.error("Error fetching patient data:", error);
    res.status(500).send("Internal Server Error");
  }
});


  app.get("/homedoctor", async (req, res) => {
    const doctor = req.query.doctor;
    try {
      const todayAppointmentsQuery = "SELECT * FROM patients WHERE date = CURRENT_DATE";
      const todayAppointmentsResult = await db.query(todayAppointmentsQuery);
      const pendingAppointments = todayAppointmentsResult.rowCount;
      
  
      const totalCasesQuery = "SELECT COUNT(*) FROM patientsdata";
      const totalCasesResult = await db.query(totalCasesQuery);
      const totalCases = totalCasesResult.rows[0].count;
  
  
      const patientsQuery = "SELECT * FROM patients WHERE date = CURRENT_DATE";
      const patientsResult = await db.query(patientsQuery);
      const patients = patientsResult.rows;
      
      const allPatientsQuery = "SELECT DISTINCT email, name FROM patientsData WHERE doctor = $1";
      const allPatientsresult = await db.query(allPatientsQuery,[doctor])
      const allPatients = allPatientsresult.rows;

      res.render("doctor_home.ejs", {
        doctor: doctor, 
        pendingAppointments: pendingAppointments,
        totalCases: totalCases,
        patients: patients,
        allPatients: allPatients,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Internal Server Error");
    }
});

app.get('/get-doctor-names', async (req, res) => {
  try {
      const queryResult = await db.query('SELECT name FROM docCreds');
      const doctorNames = queryResult.rows.map(row => row.name);
      res.json(doctorNames);
  } catch (error) {
      console.error('Error fetching doctor names:', error);
      res.status(500).send('Error fetching doctor names');
  }
});

app.post("/managerlogin", async (req, res) => {
  const username = req.body.username;
  const loginPassword = req.body.password;

  try {
    const result = await db.query("SELECT * FROM managers WHERE username = $1", [username]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if (loginPassword === storedPassword) {
        res.redirect('/homemanager');
      } else {
        res.render("manager_login.ejs", { errorMessage: "Incorrect password" });
      }
    } else {
      res.render("manager_login.ejs", { errorMessage: "User not found" });
    }
  } catch (err) {
    console.error("Error fetching manager data:", err);
    res.render("manager_login.ejs", { errorMessage: "Internal Server Error" });
  }
});

app.post("/userregister", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
              console.error("Error hashing password:", err);
            } else {
              await db.query(
                "INSERT INTO users (email, password) VALUES ($1, $2)",
                [email, hash]
              );
              
            }
          });
      res.redirect("/userlogin");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/userlogin", async (req, res) => {
    const email = req.body.username;
    const loginPassword = req.body.password;
  
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedPassword = user.password;
  
        bcrypt.compare(loginPassword, storedPassword, (err, result) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            res.render("user_login.ejs", { errorMessage: "Internal Server Error" });
          } else {
            if (result) {
              res.redirect(`/homeuser/${email}`);
            } else {
              res.render("user_login.ejs", { errorMessage: "Incorrect password" });
            }
          }
        });
      } else {
        res.render("user_login.ejs", { errorMessage: "User not found" });
      }
    } catch (err) {
      console.log(err);
      res.render("user_login.ejs", { errorMessage: "Internal Server Error" });
    }
  });
  
  app.post("/docPassword", async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    
    try {
      const verifyEmail = await db.query("SELECT * FROM doctorInfo where email = $1",[email]);
      const checkResult = await db.query("SELECT * FROM docCreds WHERE username = $1", [
        email,
      ]);
  
      if (checkResult.rows.length > 0 && verifyEmail.rows.length > 0) {
        res.send("Email already exists. Try logging in.");
      } else if(verifyEmail.rows.length > 0) {
          bcrypt.hash(password, saltRounds, async (err, hash) => {
              if (err) {
                console.error("Error hashing password:", err);
              } else {
                await db.query(
                  "INSERT INTO docCreds (username, password, name) VALUES ($1, $2, $3)",
                  [email, hash, name]
                );
              }
            });
        res.redirect("/doctorlogin");
      }
    } catch (err) {
      console.log(err);
    }
  });

  app.post("/doctorregister", async (req, res) => {
    const { full_name, gender, date_of_birth, phone, email, specialization, license_number, education, certifications, years_of_experience, department, roomnumber, workinghours } = req.body;
  
    try {
      const query = `INSERT INTO doctorInfo (full_name, gender, date_of_birth, phone, email, specialization, license_number, education, certifications, years_of_experience,department, roomnumber, workinghours)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11,$12,$13)`
      await db.query(query, [full_name, gender, date_of_birth, phone, email, specialization, license_number, education, certifications, years_of_experience, department, roomnumber, workinghours]);
    
      res.redirect("/homemanager");
    } catch (error) {
      console.error("Error registering doctor:", error);
      res.status(500).send("Internal Server Error");
    }
  });
    
  app.post("/doctorlogin", async (req, res) => {
      const email = req.body.username;
      const loginPassword = req.body.password;
    
      try {
        const result = await db.query("SELECT * FROM docCreds WHERE username = $1", [email]);
    
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedPassword = user.password;
          const name = user.name;
    
          bcrypt.compare(loginPassword, storedPassword, (err, result) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              res.render("doctor_login.ejs", { errorMessage: "Internal Server Error" });
            } else {
              if (result) {
                res.redirect("/homedoctor?doctor=" + encodeURIComponent(name));

              } else {
                res.render("doctor_login.ejs", { errorMessage: "Incorrect password" });
              }
            }
          });
        } else {
          res.render("doctor_login.ejs", { errorMessage: "User not found" });
        }
      } catch (err) {
        console.log(err);
        res.render("doctor_login.ejs", { errorMessage: "Internal Server Error" });
      }
    });
    

app.post("/book-appointment", async (req, res) => {
    
    const {email, name, age, gender, phone, doctor, date, message } = req.body;
    
    
    try {
        const result = await db.query("INSERT INTO patients (email, name, age, gender, phone, doctor, date, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [email, name, age, gender, phone, doctor, date, message]);
        const MaxId = await db.query("SELECT MAX(id) FROM patients");
        const id = MaxId.rows[0].max;
        console.log(id);
        
        await db.query ("INSERT INTO patientsdata (id,email, name, age, gender, phone, doctor, date, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [ id, email, name, age, gender, phone, doctor, date, message]);
        
        res.send("Appointment booked successfully!");
    } catch (error) {
        console.error("Error booking appointment:", error);
    }
});

app.post("/save-prescription", async (req, res) => {  

  
  const { id, symptoms, tests, medicines, additionalinfo } = req.body;
  console.log(id);

  
  const query = 'UPDATE patientsdata SET symptoms = $1, tests=$2, medicines=$3, additionalinfo=$4 where id = $5';
  const values = [ symptoms, tests, medicines, additionalinfo, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error saving prescription:', err);
      res.status(500).send('Error saving prescription');
    } else {
      db.query ("delete from patients where id = $1", [id]);
      console.log('Prescription saved successfully');
      res.sendStatus(200);
    }
  });
});

app.post('/addEmployee', async (req, res) => {
  const { name, date_of_joining, aadhar_number, salary_per_month, task } = req.body;
  try {
      // Insert new employee into the database
      await db.query('INSERT INTO Employees (name, date_of_joining, aadhar_number, salary_per_month, task) VALUES ($1, $2, $3, $4, $5)', [name, date_of_joining, aadhar_number, salary_per_month, task]);
      res.redirect('/employees');
  } catch (error) {
      console.error('Error adding employee:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/deleteEmployee/:id', async (req, res) => {
  const id = req.params.id;
  try {
      // Delete employee from the database
      await db.query('DELETE FROM Employees WHERE id = $1', [id]);
      res.redirect('/employees');
  } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).send('Internal Server Error');
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
