//
//
//REMEMBER TO CHANGE YOUR PASSWORD
//REMEMBER TO CHANGE YOUR PASSWORD
//REMEMBER TO CHANGE YOUR PASSWORD
//REMEMBER TO CHANGE YOUR PASSWORD
//REMEMBER TO CHANGE YOUR PASSWORD
//REMEMBER TO CHANGE YOUR PASSWORD
//REMEMBER TO CHANGE YOUR PASSWORD
//REMEMBER TO CHANGE YOUR PASSWORD
//
//

const express = require('express');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;
const filePath = 'form_data.xlsx';

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'selfie_' + Date.now() + path.extname(file.originalname)) // Append extension
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

// Serve static files (HTML pages)
app.use(express.static('public'));

app.post('/submit_tally', (req, res) => {
    const data = req.body;

    // Load existing workbook or create a new one
    let workbook;
    if (fs.existsSync(filePath)) {
        workbook = xlsx.readFile(filePath);
    } else {
        workbook = xlsx.utils.book_new();
        // Create a new worksheet with headers
        const headers = ['Name', 'Email', 'Phone', ...Object.keys(data).filter(key => !['name', 'email', 'phone'].includes(key))];
        const worksheet = xlsx.utils.aoa_to_sheet([headers]);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
        xlsx.writeFile(workbook, filePath);
        workbook = xlsx.readFile(filePath); // Re-read to ensure it is correctly initialized
    }

    // Convert data to array format suitable for xlsx
    const row = [data.name, data.email, data.phone, ...Object.keys(data).filter(key => !['name', 'email', 'phone'].includes(key)).map(key => data[key])];

    // Get the worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Append new row
    const existingData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    existingData.push(row);
    const newWorksheet = xlsx.utils.aoa_to_sheet(existingData);
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;

    // Write to file
    xlsx.writeFile(workbook, filePath);

    res.send('Data saved to Excel file!');
});

app.post('/upload_selfie', upload.single('image'), (req, res) => {
    // File is uploaded and stored in req.file
    if (!req.file) {
        return res.status(400).send('No files were uploaded.');
    }
    res.send('Selfie saved!');
});

// Endpoint to send email with selfie attachment
app.post('/send_email_with_selfie', (req, res) => {
    const email = req.body.email;
    const image = req.body.image;

    // Create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'raghav.sharma@goodera.com', // Replace with your Gmail email address
            pass: '***********' // Replace with your Gmail password
        }
    });

    // Define email options
    const mailOptions = {
        from: 'raghav.sharma@goodera.com', // Sender address
        to: email, // List of recipients
        subject: 'Here is your selfie!', // Subject line
        html: '<p>Dear user,</p><p>Please find your selfie attached.</p>', // HTML body
        attachments: [
            {
                filename: 'selfie.png',
                content: image.split('base64,')[1],
                encoding: 'base64'
            }
        ]
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
            res.status(500).send('Failed to send email.');
        } else {
            console.log('Email sent:', info.response);
            res.send('Email sent successfully!');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
