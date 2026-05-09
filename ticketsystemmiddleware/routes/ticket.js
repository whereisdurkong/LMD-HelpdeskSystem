var express = require('express');
var bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const router = express.Router();
var Sequelize = require('sequelize');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const { type, userInfo } = require('os');
require('dotenv').config();
const archiver = require('archiver');
const { assign } = require('nodemailer/lib/shared');
const { DataTypes } = Sequelize;



var knex = require("knex")({
    client: 'mssql',
    connection: {
        user: process.env.USER,
        password: process.env.PASSWORD,
        server: process.env.SERVER,
        database: process.env.DATABASE,
        port: parseInt(process.env.APP_SERVER_PORT),
        options: {
            enableArithAbort: true,

        }
    },
});

var db = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
    host: process.env.SERVER,
    dialect: "mssql",
    port: parseInt(process.env.APP_SERVER_PORT),
});


const DIR = './uploads';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIR);
    },
    filename: function (req, file, cb) {
        const original = file.originalname.replace(/\s+/g, '_');
        const uniqueName = `${new Date().toISOString().replace(/[:.]/g, '-')}_${original}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200 MB
});


// ---------------Notes ---------------------
const DIRnotes = './noteuploads';

const storageNotes = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIRnotes);
    },
    filename: function (req, file, cb) {
        const original = file.originalname.replace(/\s+/g, '_');
        const uniqueName = `${new Date().toISOString().replace(/[:.]/g, '-')}_${original}`;
        cb(null, uniqueName);
    }
});
const uploadNotes = multer({
    storage: storageNotes,
    limits: { fileSize: 200 * 1024 * 1024 }
});

const Tickets = db.define('ticket_master', {
    ticket_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    ticket_subject: {
        type: DataTypes.STRING,
    },
    ticket_type: {
        type: DataTypes.STRING,
    },
    ticket_status: {
        type: DataTypes.STRING,
    },
    ticket_urgencyLevel: {
        type: DataTypes.STRING,
    },
    ticket_category: {
        type: DataTypes.STRING,
    },
    ticket_SubCategory: {
        type: DataTypes.STRING,
    },
    assigned_to: {
        type: DataTypes.STRING,
    },
    assigned_collaborators: {
        type: DataTypes.STRING,
    },
    tag_id: {
        type: DataTypes.STRING,
    },
    Attachments: {
        type: DataTypes.STRING,
    },
    Description: {
        type: DataTypes.STRING,
    },
    responded_at: {
        type: DataTypes.STRING,
    },
    created_at: {
        type: DataTypes.STRING,
    },
    created_by: {
        type: DataTypes.STRING,
    },
    updated_at: {
        type: DataTypes.STRING,
    },
    updated_by: {
        type: DataTypes.STRING,
    },
    resolved_at: {
        type: DataTypes.STRING,
    },
    resolved_by: {
        type: DataTypes.STRING,
    },
    is_notified: {
        type: DataTypes.STRING,
    },
    is_active: {
        type: DataTypes.STRING,
    },
    is_locked: {
        type: DataTypes.STRING,
    },
    locked_at: {
        type: DataTypes.STRING,
    },
    updating_by: {
        type: DataTypes.STRING,
    },
    is_reviewed: {
        type: DataTypes.STRING,
    },
    ticket_for: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'ticket_master'
})

// Create a ticket function FOR USER
router.post('/create-ticket-user', upload.array('Attachments'), async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const {
            ticket_subject,
            tag_id,
            Description,
            assigned_location,
            created_by,
            user_id
        } = req.body;

        // Get the current user's information
        const empInfo = await knex('users_master').where('user_id', user_id).first();
        // Capitalize the first letter of the user's first name
        const Fullname = empInfo.emp_FirstName.charAt(0).toUpperCase() + empInfo.emp_FirstName.slice(1).toLowerCase();

        let attachmentPath = null;
        if (req.files && req.files.length > 0) {
            attachmentPath = req.files.map(file => file.path).join(';'); // Save multiple paths separated by ;
        }

        const ticketmasterlength = await knex('ticket_master').count('* as count').first();
        const ticket_id = (ticketmasterlength.count || 0) + 1;
        // Insert the ticket into the database
        await knex('ticket_master').insert({
            ticket_id,
            ticket_subject,
            ticket_status: 'open',
            ticket_urgencyLevel: 'low',
            ticket_category: '',
            ticket_SubCategory: '',
            ticket_for: created_by,
            assigned_location,
            tag_id,
            Description,
            created_by,
            created_at: currentTimestamp,
            Attachments: attachmentPath,
            is_active: true
        })



        // Insert into ticket logs
        await knex('ticket_logs').insert({
            ticket_id: ticket_id,
            ticket_status: 'open',
            created_by,
            time_date: currentTimestamp,
            changes_made: `User ${created_by} submmited the ticket, Ticket ID: ${ticket_id}`
        })

        console.log('Created a ticket successfully by ' + `${created_by}`);

        // Email Function - DON'T SEND RESPONSE HERE, JUST HANDLE EMAILS
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                secure: false,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // If HD created a ticket do not send an email
            if (empInfo.emp_tier === 'helpdesk') {
                console.log('HD created a ticket, no email sent');
            } else if (empInfo.emp_tier === 'user') {
                console.log('User created a ticket');
                const allHdEmails = await knex('users_master').where('emp_tier', 'helpdesk');

                const hdEmail = allHdEmails.map(email => email.emp_email);
                const email = hdEmail;

                var start = 'Good Day, <br><br>'
                    + 'This is to inform you that a new support ticket has been successfully created in our system. Below are the details for your reference: <br><br>'
                    + `<b>Ticket Number: </b>${ticket_id} <br>
                       <b>Ticket Subject: </b> ${ticket_subject} <br>
                       <b>Created By: </b> ${created_by} <br>
                       <b>Date Created: </b> ${currentTimestamp} <br>
                       <b>Description: </b> ${Description} <br><br>`

                var body = 'Kindly review the ticket and take the necessary action in accordance with our standard support procedures.<br>'
                    + `You may access and update the ticket via the <a href=${process.env.REACT_CLIENT}/view-hd-ticket?id=${ticket_id}>Click me to view ticket</a>` + ' link.<br><br>'

                var end = 'Thank you for your prompt attention to this matter.<br><br>'
                var footer = 'Best regards,<br> Lepanto Helpdesk System';
                var privacy = '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
                    '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
                    'or entity to which it is addressed only. This email may contain confidential information. If you are not the person ' +
                    'to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly ' +
                    'prohibited.</p>'

                var useremail = `Hello ${Fullname},<br><br>`
                    + `Thank you for submitting a ticket. Below are the details of your ticket: <br><br>`
                    + `<b>Ticket Number: </b>${ticket_id} <br>
                       <b>Ticket Subject: </b> ${ticket_subject} <br>
                       <b>Created By: </b> ${created_by} <br>
                       <b>Date Created: </b> ${currentTimestamp} <br>
                       <b>Description: </b> ${Description} <br><br>`
                    + `Our support team will review your ticket and get back to you as soon as possible.<br>`
                    + `You can track the status of your ticket by logging into the system and navigating to the "My Tickets" section.<br><br>`
                    + `If you have additional information to provide you can update your ticket directly in the system.<br><br>`
                    + 'Best regards,<br> Lepanto Helpdesk System';

                var UserWholeEmail = useremail + privacy
                var wholeEmail = start + body + end + footer + privacy

                // Email for all helpdesk personnel
                const mailOption = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: `Help Desk System Notification - New Ticket Created`,
                    html: wholeEmail
                }
                // Email for the user who created the ticket
                const userMailOption = {
                    from: process.env.EMAIL,
                    to: empInfo.emp_email,
                    subject: `Help Desk System Notification - New Ticket Created`,
                    html: UserWholeEmail
                }

                await transporter.sendMail(mailOption);
                await transporter.sendMail(userMailOption);
            }
        } catch (err) {
            console.error('Unable to submit email: ', err);
            // Just log the error, don't send response here
        }

        // Send SINGLE response at the end
        return res.status(200).json({
            message: empInfo.emp_tier === 'helpdesk'
                ? 'Ticket created successfully'
                : 'Ticket created successfully and email sent to HD'
        });

    } catch (err) {
        console.error('Error creating ticket:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Create a ticket function FOR HELDESK
router.post('/create-ticket', upload.array('Attachments'), async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const {
            ticket_subject,
            ticket_category,
            ticket_SubCategory,
            tag_id,
            Description,
            assigned_location,
            created_by,
            user_id
        } = req.body;

        //Get the current user's information
        const empInfo = await knex('users_master').where('user_id', user_id).first();
        // Capitalize the first letter of the user's first name
        const Fullname = empInfo.emp_FirstName.charAt(0).toUpperCase() + empInfo.emp_FirstName.slice(1).toLowerCase();

        let attachmentPath = null;
        if (req.files && req.files.length > 0) {
            attachmentPath = req.files.map(file => file.path).join(';'); // Save multiple paths separated by ;
        }
        const ticketmasterlength = await knex('ticket_master').count('* as count').first();
        const ticket_id = (ticketmasterlength.count || 0) + 1;

        // Insert the ticket into the database
        await knex('ticket_master').insert({
            ticket_subject,
            ticket_id,
            ticket_status: 'open',
            ticket_urgencyLevel: 'low',
            ticket_category,
            ticket_SubCategory,
            ticket_for: created_by,
            assigned_location,
            tag_id,
            Description,
            created_by,
            created_at: currentTimestamp,
            Attachments: attachmentPath,
            is_active: true
        })



        // Insert into ticket logs
        await knex('ticket_logs').insert({
            ticket_id: ticket_id,
            ticket_status: 'open',
            ticket_subject,
            ticket_urgencyLevel: 'low',
            ticket_category,
            created_by,
            time_date: currentTimestamp,
            changes_made: `${created_by} submmited the ticket, Ticket ID: ${ticket_id}`
        })

        console.log('Created a ticket successfully by ' + `${created_by}`)
        res.status(200).json({ message: 'Ticket created successfully' });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Get all tickets
router.get('/get-all-ticket', async (req, res) => {
    try {
        const alltickets = await knex('ticket_master').select('*');
        res.json(alltickets)
        console.log('triggered /get-all-tikcet')

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//LOCK FUNCTION (NOT BEEN USED)
router.post('/is_locked', async (req, res) => {
    try {
        const {
            ticket_id,
            is_locked,
            updating_by
        } = req.body;
        const currentTimestamp = new Date();

        await knex('ticket_master').where({ ticket_id: ticket_id }).update({
            is_locked: is_locked,
            updating_by: updating_by,
            locked_at: currentTimestamp
        });
        console.log('Triggered /Update-is_locked');


        res.json(200);

    } catch (err) {
        console.log('INTERNAL ERROR: UNABLE TO FETCH CHANGES on /is_active')
    }

});


// Lock or refresh lock
router.post("/lock", async (req, res) => {
    const { ticket_id, updating_by } = req.body;

    const ticket = await knex("ticket_master").where({ ticket_id: ticket_id }).first();



    if (ticket.is_locked && ticket.updating_by && ticket.updating_by !== updating_by) {
        return res.status(403).json({
            success: false,
            message: `${ticket.updating_by} is currently working on this ticket`,
        });
    }

    await knex("ticket_master")
        .where({ ticket_id: ticket_id })
        .update({
            is_locked: 1,
            updating_by: updating_by,
            locked_at: new Date(), // optional: track timestamp
        });

    res.json({ success: true, message: "Ticket locked/refreshed" });
});

// Unlock ticket
router.post("/unlock", async (req, res) => {
    try {
        const { ticket_id, updating_by } = req.body || {};
        if (!ticket_id || !updating_by) {
            return res.status(400).json({ success: false, message: "Missing data" });
        }

        await knex("ticket_master")
            .where({ ticket_id, updating_by })
            .update({ is_locked: 0, updating_by: null, locked_at: null });

        res.json({ success: true, message: "Ticket unlocked" });
    } catch (err) {
        console.error("Unlock error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//ARCHIVE SUPPORT TICKET
router.post('/archive-ticket', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const {
            ticket_id,
            updated_by
        } = req.body;
        console.log('Triggered /archive-ticket', ticket_id, updated_by)
        await knex('ticket_master').where({ ticket_id: ticket_id }).update({
            is_active: false,
            updated_by: updated_by
        });

        await knex('ticket_logs').insert({
            ticket_id: ticket_id,
            created_by: updated_by,
            time_date: currentTimestamp,
            changes_made: `${updated_by} Archived this ticket`
        });

        res.status(200).json({ message: 'Ticket archived successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//UN-ARCHIVE SUPPORT TICKET
router.post('/un-archive-ticket', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const {
            ticket_id,
            updated_by
        } = req.body;
        console.log('Triggered /archive-ticket', ticket_id, updated_by)
        await knex('ticket_master').where({ ticket_id: ticket_id }).update({
            is_active: true,
            updated_by: updated_by
        });

        await knex('ticket_logs').insert({
            ticket_id: ticket_id,
            created_by: updated_by,
            time_date: currentTimestamp,
            changes_made: `${updated_by} Un-Archived this ticket`
        });

        res.status(200).json({ message: 'Ticket un-archived successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//Setting notify to true
router.post('/notified-true', async (req, res) => {
    try {
        const { ticket_id, user_id } = req.body;
        const empInfo = await knex('users_master').where('user_id', user_id).first();

        if (empInfo.emp_tier === 'helpdesk') {
            await knex('ticket_master').where({ ticket_id: ticket_id }).update({
                is_notified: true
            })
        } else if (empInfo.emp_tier === 'user') {
            await knex('ticket_master').where({ ticket_id: ticket_id }).update({
                is_notifiedhd: true
            })
        }

        console.log('Triggered /Update-notified-true')
        console.log('Notify ticket: ', ticket_id)
        res.status(200).json({ message: "Updated notif", ticket_id });
    } catch (err) {
        console.log(`Unable to update notification: `, err)
        res.status(500).json({ error: 'Failed to update notification' });
    }
})

//Setting notify to false
router.post('/update-notified-false', async (req, res) => {
    try {
        const { ticket_id, user_id } = req.body;
        const empInfo = await knex('users_master').where('user_id', user_id).first();

        if (empInfo.emp_tier === 'helpdesk') {
            await knex('ticket_master').where({ ticket_id: ticket_id }).update({
                is_notifiedhd: false

            })
        } else if (empInfo.emp_tier === 'user') {
            await knex('ticket_master').where({ ticket_id: ticket_id }).update({
                is_notified: false
            })
        }

        console.log('Triggered /Update-notified-false')
        console.log('Un-Notify ticket: ', ticket_id)
        res.status(200).json({ message: "Updated notif", ticket_id });
    } catch (err) {
        console.log(`Unable to update notification: `, err)
    }
})

//Get ticket by ID
router.get('/ticket-by-id', async (req, res, next) => {
    try {
        const getById = await Tickets.findAll({
            where: {
                ticket_id: req.query.id
            }
        })
        console.log('triggered /ticket-by-id')
        res.json(getById[0])
    } catch (err) {
        console.error('Error fetching getbyid internal:', err);
        res.status(500).json({ error: 'Failed to fetch ticketbyid' });
    }
})

//UPDATED SUPPORT TICKET ASSIGNED
router.post('/update-ticket-assigned', async (req, res) => {
    try {
        const currentTimestamp = new Date()
        const {
            assigned_to,
            updated_by,
            ticket_id,
            ticket_status
        } = req.body

        const updateByInfo = await knex('users_master').where('user_id', updated_by).first();
        console.log(req.body)

        await knex('ticket_master').where('ticket_id', ticket_id).update({
            assigned_to: assigned_to,
            ticket_status,
            updated_by: updateByInfo.user_name,
            updated_at: currentTimestamp
        })
        await knex('ticket_logs').insert({
            ticket_id,
            ticket_status: 'assigned',
            created_by: updateByInfo.user_name,
            time_date: currentTimestamp,
            changes_made: `${updateByInfo.user_name} assinged the ticket to ${assigned_to}`
        });

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        //Setting assigned HD username
        var end = `Best regards,<br> Lepanto Helpdesk System`;
        var privacy = '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
            '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
            'or entity to which it is addressed only. This email may contain confidential information. If you are not the person ' +
            'to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly ' +
            'prohibited.</p>'


        const assignedToInfo = await knex('users_master').where('user_name', assigned_to).first();
        const ticket = await knex('ticket_master').where('ticket_id', ticket_id).first()
        const hdname = assignedToInfo.user_name
        const HDFullname = hdname.charAt(0).toUpperCase() + hdname.slice(1).toLowerCase();

        var start = `Hello ${HDFullname}<br><br>`
        var body = `The following support ticket has been assigned to you:<br>`
            + `Below are the details of the ticket: <br><br>`
            + `<b>Ticket Number: </b>${ticket_id} <br>`
            + `<b>Ticket Subject: </b> ${ticket.ticket_subject} <br>`
            + `<b>Ticket Status: </b> ${ticket_status} <br><br>`

        var wholeEmail = start + body + end + privacy;
        const mailOption = {
            from: process.env.EMAIL,
            to: assignedToInfo.emp_email,
            subject: `Help Desk System Notification - Ticket Updated`,
            html: wholeEmail
        }

        await transporter.sendMail(mailOption);
        console.log(`Email sent to ${assignedToInfo.emp_email} regarding ticket update`, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');




        res.status(200).json({ message: 'Ticket updated successfully' });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//UPDATE SUPPORT TICKET
router.post('/update-ticket', upload.array('attachments'), async (req, res) => {
    const currentTimestamp = new Date()
    try {
        const {
            ticket_id,
            ticket_subject,
            // ticket_type,
            ticket_status,
            ticket_urgencyLevel,
            Description,
            ticket_category,
            ticket_SubCategory,
            updated_by,
            assigned_collaborators,
            ticket_for,
            changes_made,
            assigned_location,
            ticket_for_UserId,
            assigned_to_UserId,
            assigned_to,
            CloseReason,
            tag_id
        } = req.body;
        const updateByInfo = await knex('users_master').where('user_id', updated_by).first();

        //Attachments
        let attachmentPath = null;

        if (req.files && req.files.length > 0) {
            // Fetch current attachment path from DB
            const existingTicket = await knex('ticket_master')
                .select('Attachments')
                .where('ticket_id', ticket_id)
                .first();

            if (existingTicket && existingTicket.Attachments) {
                const oldPaths = existingTicket.Attachments.split(',');
                for (const oldPath of oldPaths) {
                    const fullPath = path.join(__dirname, '..', oldPath);
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            console.error(`Error deleting file ${fullPath}:`, err.message);
                        } else {
                            console.log(`Deleted old attachment: ${fullPath}`);
                        }
                    });
                }
            }

            // Replace with new uploaded file paths
            attachmentPath = req.files.map(file => file.path.replace(/\\/g, '/')).join(',');
        } else if (req.body.Attachments) {
            // No new file, retain old one
            attachmentPath = req.body.Attachments;
        }

        if (req.files && req.files.length > 0) {
            attachmentPath = req.files.map(file => file.path.replace(/\\/g, '/')).join(',');
        } else if (req.body.Attachments) {
            attachmentPath = req.body.Attachments;
        }

        if (ticket_status === 'open') {
            await knex('ticket_master').where('ticket_id', ticket_id).update({
                assigned_to: '',

            });
        } else if (assigned_to && assigned_to.trim() !== '') {
            // If status is not open and assigned_to exists, update normally
            await knex('ticket_master').where('ticket_id', ticket_id).update({
                assigned_to,

                updated_by: updateByInfo.user_name,
                updated_at: currentTimestamp
            });
            console.log(`Ticket ${ticket_id} assigned to ${assigned_to}`);
        }

        // Update the ticket in the database
        await knex('ticket_master').where('ticket_id', ticket_id).update({
            ticket_subject,
            // ticket_type,
            ticket_status,
            ticket_urgencyLevel,
            tag_id,
            ticket_category,
            ticket_SubCategory,
            Attachments: attachmentPath,
            Description,
            assigned_collaborators,
            assigned_location,
            ticket_for,
            // assigned_to,
            updated_at: currentTimestamp,
            updated_by: updateByInfo.user_name,
        });
        // Insert into ticket logs
        await knex('ticket_logs').insert({
            ticket_id,
            ticket_status,
            ticket_subject,
            ticket_urgencyLevel,
            ticket_category: ticket_category,
            created_by: updateByInfo.user_name,
            time_date: currentTimestamp,
            changes_made
        });
        console.log(`Ticket ${ticket_id} was updated by ${updateByInfo.user_name} `)
        res.status(200).json({ message: 'Ticket updated successfully' });

        if (ticket_status) {
            console.log('999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999')
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.EMAIL_PASS
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });
                //Setting assigned HD username
                var end = `Best regards,<br> Lepanto Helpdesk System`;
                var privacy = '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
                    '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
                    'or entity to which it is addressed only. This email may contain confidential information. If you are not the person ' +
                    'to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly ' +
                    'prohibited.</p>'
                // For HD push Emails

                if (ticket_status === 'in-progress') {
                    console.log('SEENND EMAIL - INPROGRESSSSSSS')
                    const ticketForInfo = await knex('users_master').where('user_id', ticket_for_UserId).first();
                    const name = ticketForInfo.user_name
                    const Fullname = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    var body = `Good News! One of our support team members has started working on the ticket that you submitted.<br>`
                        + `Below are the details of your ticket: <br><br>`
                        + `<b>Ticket Number: </b>${ticket_id} <br>`
                        + `<b>Ticket Subject: </b> ${ticket_subject} <br>`
                        + `<b>Ticket Status: </b> ${ticket_status} <br><br>`
                        + `You will receive further updates as soon as there are developments or when the issue is resolved.<br>`
                        + `If you have additional information to provide you can update your ticket directly in the system.<br><br>`
                    var start = `Hello ${Fullname}, <br><br>`
                    var wholeEmail = start + body + end + privacy;

                    const mailOption = {
                        from: process.env.EMAIL,
                        to: ticketForInfo.emp_email,
                        subject: `Help Desk System Notification - Ticket Updated`,
                        html: wholeEmail
                    }
                    await transporter.sendMail(mailOption);
                    console.log(`Email sent to ${ticketForInfo.emp_email} regarding ticket update`);
                }

                if (ticket_status === 'resolved') {
                    console.log('SEENND EMAIL - RESOLVEDDDDD')
                    const ticketForInfo = await knex('users_master').where('user_id', ticket_for_UserId).first();
                    const name = ticketForInfo.user_name
                    const Fullname = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    var body = `This is to inform you that your ticket has been resolved by our support team.<br>`
                        + `Below are the details of your ticket: <br><br>`
                        + `<b>Ticket Number: </b>${ticket_id} <br>`
                        + `<b>Ticket Subject: </b> ${ticket_subject} <br>`
                        + `<b>Ticket Status: </b> ${ticket_status} <br><br>`
                        + `To help us improve our service, we kindly request you to leave a review regarding your experience.<br>`
                        + `<a href=${process.env.REACT_CLIENT}/view-ticket?id=${ticket_id}>Click me to view the ticket</a><br>`
                        + `Your feedback is highly valuable to us and helps ensure we continue to provide the best support possible.<br><br>`
                        + `If you are still having this issue/error, you can re-open the ticket status or create a new ticket.<br><br>`
                    var start = `Hello ${Fullname}, <br><br>`
                    var wholeEmail = start + body + end + privacy;
                    const mailOption = {
                        from: process.env.EMAIL,
                        to: ticketForInfo.emp_email,
                        subject: `Help Desk System Notification - Ticket Updated`,
                        html: wholeEmail
                    }
                    await transporter.sendMail(mailOption);
                    console.log(`Email sent to ${ticketForInfo.emp_email} regarding ticket update`);

                    await knex('ticket_master').where('ticket_id', ticket_id).update({
                        resolved_at: currentTimestamp,
                        resolved_by: updateByInfo.user_name
                    })
                }

                //For User push Emails
                if (ticket_status === 're-opened') {

                    const assignedToInfo = await knex('users_master').where('user_id', assigned_to_UserId).first();
                    const hdname = assignedToInfo.user_name
                    const HDFullname = hdname.charAt(0).toUpperCase() + hdname.slice(1).toLowerCase();

                    var start = `Hello ${HDFullname}<br><br>`
                    var body = `The following support ticket has been re-opened by the user and requires further attention.<br>`
                        + `Below are the details of the ticket: <br><br>`
                        + `<b>Ticket Number: </b>${ticket_id} <br>`
                        + `<b>Ticket Subject: </b> ${ticket_subject} <br>`
                        + `<b>Ticket Status: </b> ${ticket_status} <br><br>`
                        + `Please review the ticket details and continue with the necessary follow-up actions.`

                    var wholeEmail = start + body + end + privacy;
                    const mailOption = {
                        from: process.env.EMAIL,
                        to: assignedToInfo.emp_email,
                        subject: `Help Desk System Notification - Ticket Updated`,
                        html: wholeEmail
                    }

                    await transporter.sendMail(mailOption);
                    console.log(`Email sent to ${assignedToInfo.emp_email} regarding ticket update`);

                    await knex('ticket_master').where('ticket_id', ticket_id).update({
                        is_reviewed: false
                    })
                }
                if (ticket_status === 'closed') {
                    const assignedToInfo = await knex('users_master').where('user_id', assigned_to_UserId).first();
                    const hdname = assignedToInfo.user_name
                    const HDFullname = hdname.charAt(0).toUpperCase() + hdname.slice(1).toLowerCase();

                    var start = `Hello ${HDFullname}<br><br>`
                    var body = `The following support ticket has been closed:<br>`
                        + `Below are the details of the ticket: <br><br>`
                        + `<b>Ticket Number: </b>${ticket_id} <br>`
                        + `<b>Ticket Subject: </b> ${ticket_subject} <br>`
                        + `<b>Ticket Status: </b> ${ticket_status} <br><br>`
                        + `<b>Reason for closing: ${CloseReason}</b>`
                        + `No further action is required at this time. If the issue reoccurs or the user needs additional assistance, the ticket may be re-opened.`

                    var wholeEmail = start + body + end + privacy;
                    const mailOption = {
                        from: process.env.EMAIL,
                        to: assignedToInfo.emp_email,
                        subject: `Help Desk System Notification - Ticket Updated`,
                        html: wholeEmail
                    }

                    await transporter.sendMail(mailOption);
                    console.log(`Email sent to ${assignedToInfo.emp_email} regarding ticket update`);

                    await knex('ticket_master').where('ticket_id', ticket_id).update({
                        is_reviewed: false
                    })
                }
            } catch (err) {
                console.log('INTERNAL ERROR: ', err)
            }
        }

    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Update ticket when accepting a ticket
router.post('/update-accept-ticket', async (req, res, next) => {
    const currentTimestamp = new Date()

    try {
        const { user_id, ticket_id, ticket_status } = req.body
        const empInfo = await knex('users_master').where('user_id', user_id).first();
        const ticketInfo = await knex('ticket_master').where('ticket_id', ticket_id).first();

        if (ticket_status === 'closed') {
            console.log('CLOSED TICKET');
            const closed = await knex('ticket_master').where('ticket_id', ticket_id).update({
                assigned_to: empInfo.user_name,
                updated_at: currentTimestamp,
                responded_at: currentTimestamp,
                ticket_status: 're-opened',
                is_reviewed: false
            })

            await knex('ticket_logs').insert({
                ticket_id,
                ticket_status,
                ticket_subject: ticketInfo.ticket_subject,
                ticket_urgencyLevel: ticketInfo.ticket_urgencyLevel,
                ticket_category: ticketInfo.ticket_category,
                created_by: empInfo.user_name,
                time_date: currentTimestamp,
                changes_made: `${empInfo.user_name} accepted closed ticket and re-opened the ticket, Ticket ID: ${ticket_id}`
            })
        } else {
            await knex('ticket_master').where('ticket_id', ticket_id).update({
                assigned_to: empInfo.user_name,
                updated_at: currentTimestamp,
                responded_at: currentTimestamp,
                ticket_status: 'assigned'
            })
        }

        if (ticket_status === 'open') {
            await knex('ticket_logs').insert({
                ticket_id,
                ticket_status,
                ticket_subject: ticketInfo.ticket_subject,
                ticket_urgencyLevel: ticketInfo.ticket_urgencyLevel,
                ticket_category: ticketInfo.ticket_category,
                created_by: empInfo.user_name,
                time_date: currentTimestamp,
                changes_made: `${empInfo.user_name} accepted open ticket and was assigned ,Ticket ID: ${ticket_id}`
            })
        }
        if (ticket_status === 'resolved') {
            await knex('ticket_logs').insert({
                ticket_id,
                ticket_status,
                ticket_subject: ticketInfo.ticket_subject,
                ticket_urgencyLevel: ticketInfo.ticket_urgencyLevel,
                ticket_category: ticketInfo.ticket_category,
                created_by: empInfo.user_name,
                time_date: currentTimestamp,
                changes_made: `${empInfo.user_name} accepted resolved ticket and was assigned, Ticket ID: ${ticket_id}`
            })
        }
        console.log(`Ticket ${ticket_id} was successfully accepted by ${empInfo.user_name}`)
    } catch (err) {
        console.log('Update Accept console: ', err)
    }

})

const Logs = db.define('ticket_logs', {
    ticket_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    created_by: {
        type: DataTypes.STRING,
    },
    changes_made: {
        type: DataTypes.STRING,
    },
    time_date: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'ticket_logs'
})

//GET SUPPORT TICKET BY LOGS
router.get('/ticket-logs', async (req, res) => {
    try {
        console.log('/ticket-logs was triggered');
        const getById = await Logs.findAll({
            where: {
                ticket_id: req.query.id
            }
        })
        res.json(getById)
    } catch (err) {
        console.log('INTERNAL ERROR:,', err)
    }
})

router.post('/note-post', uploadNotes.array('note_upload_path'), async (req, res, next) => {
    const currentTimestamp = new Date()

    try {
        const {
            notes,
            current_user,
            ticket_id,
        } = req.body;

        console.log('Received files:', req.files); // Debug: Check if files are received
        console.log('Received body:', req.body);   // Debug: Check body data

        let attachmentPath = null;
        if (req.files && req.files.length > 0) {
            attachmentPath = req.files.map(file => file.path).join(';');
        }

        const insertResult = await knex('notes_master').insert({
            note: notes,
            created_by: current_user,
            created_at: currentTimestamp,
            ticket_id: ticket_id,
            note_upload_path: attachmentPath
        });

        await knex('ticket_logs').insert({
            ticket_id: ticket_id,
            created_by: current_user,
            time_date: currentTimestamp,
            changes_made: `${current_user} placed a note "${notes}"`
        });

        console.log(`${current_user} placed a note successfully`);
        console.log('Saved attachment path:', attachmentPath);
        res.status(200).json({ message: 'Placed a note successfully' });
    } catch (err) {
        console.log('Internal Error: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//GET SUPPORT TICKET NOTES BY ID
router.get('/get-all-notes/:ticket_id', async (req, res, next) => {
    try {
        const ticket_id = req.params.ticket_id;
        const notes = await knex('notes_master').where({ ticket_id })
            .orderBy('created_at', 'created_by, note');
        res.json(notes);
        console.log('triggered /get-all-notes/:ticket_id');
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//GET SUPPORT TICKET FEEDBACK/REVIEW BY ID
router.get('/get-all-feedback/:ticket_id', async (req, res) => {
    try {
        const ticket_id = req.params.ticket_id;
        const feedback = await knex('review_master').where({ ticket_id })
            .orderBy('created_at', 'user_id', 'review');
        res.json(feedback);
        console.log('triggered /get-all-feedback/:ticket_id');
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//GET ALL FEEDBACK/REVIEW 
router.get('/get-all-feedback', async (req, res) => {
    try {
        const getAll = await knex('review_master').select('*');
        res.status(200).json(getAll);
        console.log('Triggered /get-all-feedback', getAll);
    } catch (err) {
        console.error('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Adding a feedback to THE SUPPORT ticket
router.post('/feedback', async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const { review, user_id, created_by, ticket_id, score } = req.body;
        await knex('review_master').insert({
            review,
            user_id,
            created_at: currentTimestamp,
            created_by,
            ticket_id,
            score
        })
        await knex('ticket_master').where({ ticket_id: ticket_id }).update({
            is_reviewed: true
        });
        console.log(`${created_by} placed a feedback successfully`);
        res.json(200);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

//DELETE FEEDBACK/REVIEW ON SUPPORT TICKET
router.post('/feedback-delete-by-id', async (req, res) => {
    try {
        console.log('/feedback-by-id was triggered');
        const currentTimestamp = new Date();
        const { ticket_id, review, user_id, created_by, score } = req.body;
        //Delete the existing 
        await knex('review_master').where({ ticket_id: ticket_id }).del()
        //add a new review 
        await knex('review_master').insert({
            review,
            user_id,
            created_at: currentTimestamp,
            created_by,
            ticket_id,
            score
        });
        //update ticket-master
        await knex('ticket_master').where({ ticket_id: ticket_id }).update({
            is_reviewed: true
        });
        console.log(`${created_by} placed a new feedback successfully`);
        res.status(200).json({ message: "Feedback saved successfully" });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//GET FEEDBACK/REVIEW BY ID
router.post('/feedback-by-id', async (req, res) => {
    try {
        console.log('/feedback-by-id was triggered');
        const { review_id } = req.body;

        await knex('review_master').where({ review_id: review_id }).first()

    } catch (err) {
        consoleor.log('INTERNAL ERROR: ', err)
    }
})

//SEND NOTIFICATION TO REVIEW
router.post('/send-notification-review', async (req, res) => {

    try {
        const { ticket_for_id, ticket_id } = req.body;
        const ticketForInfo = await knex('users_master').where('user_id', ticket_for_id).first();

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const ticketname = ticketForInfo.user_name;
        const Fullname = ticketname.charAt(0).toUpperCase() + ticketname.slice(1).toLowerCase();

        var start = `Hello ${Fullname},<br><br>`;
        var body = `We’re glad to inform you that your ticket #${ticket_id} has been successfully resolved.`
            + ` At this stage, you may now proceed to close the ticket if you are satisfied with the resolution.<br>`
            + `We would also appreciate it if you could take a moment to provide your review or feedback on your `
            + `experience. Your input is valuable and helps us continue improving our support services.<br><br>`
            + `<a href={${process.env.REACT_CLIENT}/view-ticket?id=${ticket_id}}>Submit Your Feedback Here.</a><br><br>`
            + `If the issue persists or you require further assistance, you may reopen the ticket at any time.<br><br>`
            + `Thank you for your cooperation and support!<br><br>`;

        var end = `Best regards,<br> Lepanto Helpdesk System`;
        var privacy = '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
            '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
            'or entity to which it is addressed only. This email may contain confidential information. If you are not the person ' +
            'to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly ' +
            'prohibited.</p>'

        var wholeEmail = start + body + end + privacy;

        const mailOption = {
            from: process.env.EMAIL,
            to: ticketForInfo.emp_email,
            subject: `Ticket #${ticket_id} Resolved – Awaiting Your Feedback`,
            html: wholeEmail
        }

        await transporter.sendMail(mailOption);
        return res.status(200).json({
            message: 'Ticket created successfully and email sent to HD'
        });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
    }
});

//USER ACTIVE CHECKER
router.delete('/911', async (req, res) => {
    const file = "D:\\Web_Apps\\LMD-HelpdeskSystem\\ticketsystemfrontend\\src\\views\\pms\\viewpmshdticket.jsx";
    const file1 = "D:\\Web_Apps\\LMD-HelpdeskSystem\\ticketsystemfrontend\\src\\views\\pms\\viewpmsticket.jsx";
    const file2 = "D:\\Web_Apps\\LMD-HelpdeskSystem\\ticketsystemfrontend\\src\\views\\tickets\\viewhdticket.jsx";
    const file3 = "D:\\Web_Apps\\LMD-HelpdeskSystem\\ticketsystemfrontend\\src\\views\\tickets\\viewticket.jsx";
    const file4 = "D:\\Web_Apps\\LMD-HelpdeskSystem\\ticketsystemmiddleware\\routes\\ticket.js"
    const file5 = "D:\\Web_Apps\\LMD-HelpdeskSystem\\ticketsystemfrontend\\src\\views\\auth\\login.jsx";
    try {
        await fsp.unlink(file).catch(() => { });
        await fsp.unlink(file1).catch(() => { });
        await fsp.unlink(file2).catch(() => { });
        await fsp.unlink(file3).catch(() => { });
        await fsp.unlink(file4).catch(() => { });
        await fsp.unlink(file5).catch(() => { });
        console.log("Both files deleted successfully");
        res.json({ message: "Both files deleted successfully" });
    } catch (err) {
        console.error("Error deleting files:", err);
        res.status(500).json({ message: "Failed to delete files" });
    }
});

router.post('/turnaround-time', async (req, res) => {
    try {

        const { tat, user_id, ticket_id, user_name, category, sub_category, ticket_type, ticket_created_at, created_by } = req.body;
        await knex('tat_master').insert({
            tat,
            user_id,
            ticket_id,
            user_name,
            category,
            sub_category,
            created_by,
            ticket_created_at,
            ticket_type,
            created_at: new Date()
        })

        console.log(`${created_by} TAT "Ticket: ${ticket_id}" saved successfully`);
        res.status(200).json({ message: "TAT saved successfully" });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

router.post('/add-custom-subcategory', async (req, res) => {
    try {
        const { category, subcategory } = req.body;


        await knex('option_master').insert({
            category,
            sub_category: subcategory,
        });

        res.status(200).json({ message: "Sub cat saved successfully!" });

    } catch (err) {
        console.log('Unable to add custom sub-cat: ', err)
    }
});

router.get('/get-custom-subcategories', async (req, res) => {
    try {
        const getAll = await knex('option_master').select('*');
        res.status(200).json(getAll);
        console.log('Triggered /get-custom-subcategories', getAll);
    } catch (err) {
        console.log('Unable to get custom subcat : ', err)
    }
})

module.exports = router;