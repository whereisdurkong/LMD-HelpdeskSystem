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

const { DataTypes } = Sequelize;

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
    asset_number: {
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

//Create a ticket function
router.post('/create-ticket-user', upload.array('Attachments'), async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const {
            ticket_subject,
            asset_number,
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

        // Insert the ticket into the database
        const [createTicket] = await knex('ticket_master').insert({
            ticket_subject,
            ticket_type: '',
            ticket_status: 'open',
            ticket_urgencyLevel: '',
            ticket_category: '',
            ticket_SubCategory: '',
            ticket_for: created_by,
            assigned_location,
            asset_number,
            Description,
            created_by,
            created_at: currentTimestamp,
            Attachments: attachmentPath,
            is_active: true
        }).returning('ticket_id')

        const ticket_id = createTicket.ticket_id || createTicket;

        // Insert into ticket logs
        await knex('ticket_logs').insert({
            ticket_id: ticket_id,
            ticket_status: 'open',
            created_by,
            time_date: currentTimestamp,
            changes_made: `User ${created_by} submmited the ticket, Ticket ID: ${ticket_id}`
        })

        //Email Function
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
            let email = [];

            //If HD created a ticket do not send an email
            if (empInfo.emp_tier === 'helpdesk') {
                console.log('HD created a ticket, no email sent');
            } else if (empInfo.emp_tier === 'user') {
                console.log('User created a ticket');
                const allHdEmails = await knex('users_master').select('*').whereIn('emp_tier', 'helpdesk');

                const hdEmail = allHdEmails.map(email => email.emp_email);
                email = hdEmail;

                var start = 'Good Day, <br><br>'
                    + 'This is to inform you that a new support ticket has been successfully created in our system. Below are the details for your reference: <br><br>'
                    + `<b>Ticket Number: </b>${ticket_id} <br>
                       <b>Ticket Subject: </b> ${ticket_subject} <br>
                       <b>Created By: </b> ${created_by} <br>
                       <b>Date Created: </b> ${currentTimestamp} <br>
                       <b>Description: </b> ${Description} <br><br>`

                var body = 'Kindly review the ticket and take the necessary action in accordance with our standard support procedures.<br>'
                    + `You may access and update the ticket via the <a href=192.168.4.251:3007/ticketsystem/view-hd-ticket?id=${ticket_id}>Click me to view ticket</a>` + ' link.<br><br>'

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
                //Email for all helpdesk personnel
                const mailOption = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: `Help Desk System Notification - New Ticket Created`,
                    html: wholeEmail
                }
                //Email for the user who created the ticket
                const userMailOption = {
                    from: process.env.EMAIL,
                    to: empInfo.emp_email,
                    subject: `Help Desk System Notification - New Ticket Created`,
                    html: UserWholeEmail
                }

                await transporter.sendMail(mailOption);
                await transporter.sendMail(userMailOption);
                return res.status(200).json({
                    message: 'Ticket created successfully and email sent to HD'
                });
            }
        } catch (err) {
            console.log('Unable to submit email: ', err);
        }

        console.log('Created a ticket successfully by ' + `${created_by}`)
        res.status(200).json({ message: 'Ticket created successfully' });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Create a ticket function
router.post('/create-ticket', upload.array('Attachments'), async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const {
            ticket_subject,
            ticket_type,
            ticket_status,
            ticket_urgencyLevel,
            ticket_category,
            ticket_SubCategory,
            asset_number,
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

        // Insert the ticket into the database
        const [createTicket] = await knex('ticket_master').insert({
            ticket_subject,
            ticket_type,
            ticket_status: 'open',
            ticket_urgencyLevel,
            ticket_category,
            ticket_SubCategory,
            ticket_for: created_by,
            assigned_location,
            asset_number,
            Description,
            created_by,
            created_at: currentTimestamp,
            Attachments: attachmentPath,
            is_active: true
        }).returning('ticket_id')

        const ticket_id = createTicket.ticket_id || createTicket;

        // Insert into ticket logs
        await knex('ticket_logs').insert({
            ticket_id: ticket_id,
            ticket_status: 'open',
            ticket_subject,
            ticket_urgencyLevel,
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


router.post('/archive-ticket', async (req, res) => {
    try {
        const {
            ticket_id,
            updated_by
        } = req.body;
        console.log('Triggered /archive-ticket', ticket_id, updated_by)
        await knex('ticket_master').where({ ticket_id: ticket_id }).update({
            is_active: false,
            updated_by: updated_by
        });

        res.status(200).json({ message: 'Ticket archived successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

router.post('/un-archive-ticket', async (req, res) => {
    try {
        const {
            ticket_id,
            updated_by
        } = req.body;
        console.log('Triggered /archive-ticket', ticket_id, updated_by)
        await knex('ticket_master').where({ ticket_id: ticket_id }).update({
            is_active: true,
            updated_by: updated_by
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

router.post('/update-ticket-assigned', async (req, res) => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
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

        console.log('1111111111111111HHHHHHHHHHHHHHHAAAAAAAAAAAAAAATTTTTDDDOOOOGGG')
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
        res.status(200).json({ message: 'Ticket updated successfully' });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

router.post('/update-ticket', upload.array('attachments'), async (req, res) => {
    const currentTimestamp = new Date()
    try {
        const {
            ticket_id,
            ticket_subject,
            ticket_type,
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
            asset_number
        } = req.body;
        const updateByInfo = await knex('users_master').where('user_id', updated_by).first();

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

        const updateByInfo1 = await knex('ticket_master').where('ticket_id', ticket_id).first();


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


        if (ticket_status) {
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
                if (ticket_status === 'escalate2' || ticket_status === 'escalate3') {
                    const ticketForInfo = await knex('users_master').where('user_id', ticket_for_UserId).first();
                    const name = ticketForInfo.user_name
                    const Fullname = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    var body = `This is to inform you that your ticket has been escalated to the next level of support.<br>`
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
                    const ticketForInfo = await knex('users_master').where('user_id', ticket_for_UserId).first();
                    const name = ticketForInfo.user_name
                    const Fullname = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    var body = `This is to inform you that your ticket has been resolved by our support team.<br>`
                        + `Below are the details of your ticket: <br><br>`
                        + `<b>Ticket Number: </b>${ticket_id} <br>`
                        + `<b>Ticket Subject: </b> ${ticket_subject} <br>`
                        + `<b>Ticket Status: </b> ${ticket_status} <br><br>`
                        + `To help us improve our service, we kindly request you to leave a review regarding your experience.<br>`
                        + `<a href=192.168.4.251:3007/ticketsystem/view-hd-ticket?id=${ticket_id}>Click me to view the ticket</a><br>`
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

        // Update the ticket in the database
        await knex('ticket_master').where('ticket_id', ticket_id).update({
            ticket_subject,
            ticket_type,
            ticket_status,
            ticket_urgencyLevel,
            asset_number,
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
            const notclosed = await knex('ticket_master').where('ticket_id', ticket_id).update({
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
        if (ticket_status === 'escalate2') {
            await knex('ticket_logs').insert({
                ticket_id,
                ticket_status,
                ticket_subject: ticketInfo.ticket_subject,
                ticket_urgencyLevel: ticketInfo.ticket_urgencyLevel,
                ticket_category: ticketInfo.ticket_category,
                created_by: empInfo.user_name,
                time_date: currentTimestamp,
                changes_made: `${empInfo.user_name} accepted escalate2 ticket and was assigned, Ticket ID: ${ticket_id}`
            })
        }
        if (ticket_status === 'escalate3') {
            await knex('ticket_logs').insert({
                ticket_id,
                ticket_status,
                ticket_subject: ticketInfo.ticket_subject,
                ticket_urgencyLevel: ticketInfo.ticket_urgencyLevel,
                ticket_category: ticketInfo.ticket_category,
                created_by: empInfo.user_name,
                time_date: currentTimestamp,
                changes_made: `${empInfo.user_name} accepted escalate3 ticket and was assigned, Ticket ID: ${ticket_id}`
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
//Adding a note to a ticket
router.post('/note-post', async (req, res, next) => {
    const currentTimestamp = new Date()

    try {
        const {
            notes,
            current_user,
            ticket_id
        } = req.body;
        await knex('notes_master').insert({
            note: notes,
            created_by: current_user,
            created_at: currentTimestamp,
            ticket_id: ticket_id
        })
        console.log(`${current_user} placed a note successfully`)
        res.status(200).json({ message: 'PLaced a note successfully' });
    } catch (err) {
        console.log('Internal Error: ', err)
    }
})

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

router.get('/get-all-feedback', async (req, res) => {
    try {
        const getAll = await knex('review_master').select('*');
        res.json(getAll);
        console.log('Triggered /get-all-feedback');
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
    }
})
//Adding a feedback to a ticket
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
})


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
            + `<a href={192.168.4.251:3007/ticketsystem/view-ticket?id=${ticket_id}}>Submit Your Feedback Here.</a><br><br>`
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


module.exports = router;