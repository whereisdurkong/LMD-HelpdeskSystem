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

const DIR = './uploads';

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

const PMSTickets = db.define('pmsticket_master', {
    pmsticket_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    tag_id: {
        type: DataTypes.STRING,
    },
    assigned_to: {
        type: DataTypes.STRING,
    },
    returned_at: {
        type: DataTypes.STRING,
    },
    is_notified: {
        type: DataTypes.STRING,
    },
    is_notifiedhd: {
        type: DataTypes.STRING,
    },
    is_active: {
        type: DataTypes.STRING,
    },
    is_reviewed: {
        type: DataTypes.STRING,
    },
    is_locked: {
        type: DataTypes.STRING,
    },
    locked_at: {
        type: DataTypes.STRING,
    },
    locked_by: {
        type: DataTypes.STRING,
    },
    pms_status: {
        type: DataTypes.STRING,
    },
    description: {
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

    pmsticket_for: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'pmsticket_master'
})

//Create a ticket function
router.post('/create-ticket-user', async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const {
            tag_id,
            Description,
            assigned_location,
            created_by,
            user_id
        } = req.body;

        // //Get the current user's information
        const empInfo = await knex('users_master').where('user_id', user_id).first();
        // // Capitalize the first letter of the user's first name
        const Fullname = empInfo.emp_FirstName.charAt(0).toUpperCase() + empInfo.emp_FirstName.slice(1).toLowerCase();


        // // Insert the ticket into the database
        const [createPMSTicket] = await knex('pmsticket_master').insert({
            pms_status: 'open',
            pmsticket_for: created_by,
            assigned_location,
            tag_id,
            description: Description,
            created_by,
            created_at: currentTimestamp,
            is_active: true
        }).returning('pmsticket_id')

        const pmsticket_id = createPMSTicket.ticket_id || createPMSTicket;

        // Insert into ticket logs
        await knex('pmsticket_logs').insert({
            pmsticket_id: pmsticket_id,
            tag_id,
            created_by,
            created_at: currentTimestamp,
            changes_made: `User ${created_by} submmited the ticket, Ticket ID: ${pmsticket_id}`
        })

        console.log('Created a ticket successfully by ' + `${created_by}`)
        res.status(200).json({ message: 'Ticket created successfully' });

        // //Email Function
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
                    + 'This is to inform you that a new PMS ticket has been successfully created in our system. Below are the details for your reference: <br><br>'
                    + `<b>PMS Ticket Number: </b>${pmsticket_id} <br>
                       <b>TagID: </b> ${tag_id} <br>
                       <b>Created By: </b> ${created_by} <br>
                       <b>Date Created: </b> ${currentTimestamp} <br>
                       <b>Description: </b> ${Description} <br><br>`

                var body = 'Kindly review the PMS ticket and take the necessary action in accordance with our standard support procedures.<br>'
                    + `You may access and update the ticket via the <a href=192.168.4.251:3007/ticketsystem/view-pms-hd-ticket?id=${pmsticket_id}>Click me to view PMS ticket</a>` + ' link.<br><br>'

                var end = 'Thank you for your prompt attention to this matter.<br><br>'
                var footer = 'Best regards,<br> Lepanto Helpdesk System';
                var privacy = '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
                    '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
                    'or entity to which it is addressed only. This email may contain confidential information. If you are not the person ' +
                    'to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly ' +
                    'prohibited.</p>'

                var useremail = `Hello ${Fullname},<br><br>`
                    + `Thank you for submitting a ticket. Below are the details of your PMS ticket: <br><br>`
                    + `<b>PMS Ticket Number: </b>${pmsticket_id} <br>
                       <b>Tag ID: </b> ${tag_id} <br>
                       <b>Created By: </b> ${created_by} <br>
                       <b>Date Created: </b> ${currentTimestamp} <br>
                       <b>Description: </b> ${Description} <br><br>`
                    + `Our support team will review your PMS ticket and get back to you as soon as possible.<br>`
                    + `You can track the status of your ticket by logging into the system and navigating to the "My Tickets" section.<br><br>`
                    + `If you have additional information to provide you can update your PMS ticket directly in the system.<br><br>`
                    + 'Best regards,<br> Lepanto Helpdesk System';

                var UserWholeEmail = useremail + privacy

                var wholeEmail = start + body + end + footer + privacy
                //Email for all helpdesk personnel
                const mailOption = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: `Help Desk System Notification - New PMS Ticket Created`,
                    html: wholeEmail
                }
                //Email for the user who created the ticket
                const userMailOption = {
                    from: process.env.EMAIL,
                    to: empInfo.emp_email,
                    subject: `Help Desk System Notification - New PMS Ticket Created`,
                    html: UserWholeEmail
                }

                await transporter.sendMail(mailOption);
                await transporter.sendMail(userMailOption);
                return res.status(200).json({
                    message: 'PMS Ticket created successfully and email sent to HD'
                });
            }
        } catch (err) {
            console.log('Unable to submit email: ', err);
        }


    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//GET PMS TICKET BY ID
router.get('/pmsticket-by-id', async (req, res, next) => {
    try {
        const getById = await PMSTickets.findAll({
            where: {
                pmsticket_id: req.query.id
            }
        })
        console.log('triggered /ticket-by-id')
        res.json(getById[0])
    } catch (err) {
        console.error('Error fetching getbyid internal:', err);
        res.status(500).json({ error: 'Failed to fetch ticketbyid' });
    }
})

//WHEN ACCEPTING A PMS TICKET
router.post('/update-accept-pmsticket', async (req, res) => {
    const currentTimestamp = new Date()

    try {
        const { user_id, pmsticket_id, pms_status, tag_id } = req.body;
        const empInfo = await knex('users_master').where('user_id', user_id).first();
        const ticketInfo = await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).first();
        console.log(req.body)
        if (pms_status === 'closed') {
            console.log('CLOSED PMS TICKET');
            const close = await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
                assigned_to: empInfo.user_name,
                updated_at: currentTimestamp,
                updated_by: empInfo.user_name,
                pms_status: 're-opened',
                is_reviewed: false
            });

            await knex('pmsticket_logs').insert({
                tag_id: tag_id,
                created_at: currentTimestamp,
                created_by: empInfo.user_name,
                pmsticket_id: pmsticket_id,
                changes_made: `${empInfo.user_name} accepted closed ticket and re-opened the ticket.`
            })
        } else {
            await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({

                assigned_to: empInfo.user_name,
                updated_at: currentTimestamp,
                updated_by: empInfo.user_name,
                pms_status: 'assigned',
                is_reviewed: false
            })
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        }

        if (pms_status === 'open') {
            await knex('ticket_logs').insert({
                pmsticket_id,
                tag_id: ticketInfo.tag_id,
                created_by: empInfo.user_name,
                created_at: currentTimestamp,
                changes_made: `${empInfo.user_name} accepted open ticket and was assigned ,Ticket ID: ${pmsticket_id}`
            })
        }
        if (pms_status === 'resolved') {
            await knex('ticket_logs').insert({
                pmsticket_id,
                tag_id: ticketInfo.tag_id,
                created_by: empInfo.user_name,
                created_at: currentTimestamp,
                changes_made: `${empInfo.user_name} accepted resolved ticket and was assigned, Ticket ID: ${pmsticket_id}`
            })
        }
        console.log(`Ticket ${pmsticket_id} was successfully accepted by ${empInfo.user_name}`)

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//UPDATE PMS TICKET
router.post('/update-pmsticket', async (req, res) => {
    console.log('WOORRRRRRRRRRRRRRRRRRRRKKKKKKKKINGGGGGGGGGGG')
    const currentTimestamp = new Date()
    try {
        const {
            pmsticket_id,
            pms_status,
            description,
            updated_by,
            pmsticket_for,
            changes_made,
            assigned_location,
            ticket_for_UserId,
            assigned_to_UserId,
            assigned_to,
            CloseReason,
            tag_id
        } = req.body;
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', req.body);

        const updateByInfo = await knex('users_master').where('user_id', updated_by).first();

        if (pms_status === 'open') {
            await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
                assigned_to: '',

            });
        } else if (assigned_to && assigned_to.trim() !== '') {
            // If status is not open and assigned_to exists, update normally
            await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
                assigned_to,

                updated_by: updateByInfo.user_name,
                updated_at: currentTimestamp
            });
            console.log(`Ticket ${pmsticket_id} assigned to ${assigned_to}`);
        }

        // // Update the ticket in the database
        await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
            pms_status,
            tag_id,
            description,
            assigned_location,
            pmsticket_for,

            updated_at: currentTimestamp,
            updated_by: updateByInfo.user_name,
        });
        // Insert into ticket logs
        await knex('pmsticket_logs').insert({
            pmsticket_id,
            tag_id,
            created_by: updateByInfo.user_name,
            created_at: currentTimestamp,
            changes_made
        });

        console.log(`PMS Ticket ${pmsticket_id} was updated by ${updateByInfo.user_name} `)
        res.status(200).json({ message: 'PMS Ticket updated successfully' });

        //Email
        if (pms_status) {
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

                if (pms_status === 'in-progress') {
                    const ticketForInfo = await knex('users_master').where('user_id', ticket_for_UserId).first();
                    const name = ticketForInfo.user_name
                    const Fullname = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    var body = `Good News! One of our support team members has started working on the PMS ticket that you submitted.<br>`
                        + `Below are the details of your ticket: <br><br>`
                        + `<b>PMS Ticket Number: </b>${pmsticket_id} <br>`
                        + `<b>Tag ID: </b> ${tag_id} <br>`
                        + `<b>PMS Ticket Status: </b> ${pms_status} <br><br>`
                        + `You will receive further updates as soon as there are developments or when the its resolved.<br>`
                        + `If you have additional information to provide you can update your ticket directly in the system.<br><br>`
                    var start = `Hello ${Fullname}, <br><br>`
                    var wholeEmail = start + body + end + privacy;

                    const mailOption = {
                        from: process.env.EMAIL,
                        to: ticketForInfo.emp_email,
                        subject: `Help Desk System Notification - PMS Ticket Update`,
                        html: wholeEmail
                    }
                    await transporter.sendMail(mailOption);
                    console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!Email sent to ${ticketForInfo.emp_email} regarding ticket update`);
                }

                if (pms_status === 'resolved') {
                    const ticketForInfo = await knex('users_master').where('user_id', ticket_for_UserId).first();
                    const name = ticketForInfo.user_name
                    const Fullname = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    var body = `This is to inform you that your PMS ticket has been resolved by our support team.<br>`
                        + `Below are the details of your ticket: <br><br>`
                        + `<b>PMS Ticket Number: </b>${pmsticket_id} <br>`
                        + `<b>Tag ID: </b> ${tag_id} <br>`
                        + `<b>PMS Ticket Status: </b> ${pms_status} <br><br>`
                        + `To help us improve our service, we kindly request you to leave a review regarding your experience.<br>`
                        + `<a href=192.168.4.251:3007/ticketsystem/view-pms-user-ticket?id=${pmsticket_id}>Click me to view the PMS ticket</a><br>`
                        + `Your feedback is highly valuable to us and helps ensure we continue to provide the best support possible.<br><br>`
                        + `If you have encountered any issues/problem after your PMS, you can open a support ticket for us to assist you further.<br><br>`
                    var start = `Hello ${Fullname}, <br><br>`
                    var wholeEmail = start + body + end + privacy;
                    const mailOption = {
                        from: process.env.EMAIL,
                        to: ticketForInfo.emp_email,
                        subject: `Help Desk System Notification - PMS Ticket Updated`,
                        html: wholeEmail
                    }
                    await transporter.sendMail(mailOption);
                    console.log(`Email sent to ${ticketForInfo.emp_email} regarding ticket update`);

                    await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
                        resolved_at: currentTimestamp,
                    })
                }

                //For User push Emails
                if (pms_status === 're-opened') {
                    console.log('REEEEEE___OOOPPPPEEEEENNNNNNNNEEEDDDDD')
                    const assignedToInfo = await knex('users_master').where('user_id', assigned_to_UserId).first();
                    const hdname = assignedToInfo.user_name
                    const HDFullname = hdname.charAt(0).toUpperCase() + hdname.slice(1).toLowerCase();

                    var start = `Hello ${HDFullname}<br><br>`
                    var body = `The following PMS ticket has been re-opened by the user and requires further attention.<br>`
                        + `Below are the details of the ticket: <br><br>`
                        + `<b>PMS Ticket Number: </b>${pmsticket_id} <br>`
                        + `<b>Tag_id: </b> ${tag_id} <br>`
                        + `<b>PMS Ticket Status: </b> ${pms_status} <br><br>`
                        + `Please review the PMS ticket details and continue with the necessary follow-up actions.`

                    var wholeEmail = start + body + end + privacy;
                    const mailOption = {
                        from: process.env.EMAIL,
                        to: assignedToInfo.emp_email,
                        subject: `Help Desk System Notification - PMS Ticket Updated`,
                        html: wholeEmail
                    }

                    await transporter.sendMail(mailOption);
                    console.log(`Email sent to ${assignedToInfo.emp_email} regarding pms ticket update`);

                    await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
                        is_reviewed: false
                    })
                }
                if (pms_status === 'closed') {
                    const assignedToInfo = await knex('users_master').where('user_id', assigned_to_UserId).first();
                    const hdname = assignedToInfo.user_name
                    const HDFullname = hdname.charAt(0).toUpperCase() + hdname.slice(1).toLowerCase();

                    var start = `Hello ${HDFullname}<br><br>`
                    var body = `The following PMS ticket has been closed:<br>`
                        + `Below are the details of the PMS ticket: <br><br>`
                        + `<b>PMS Ticket Number: </b>${pmsticket_id} <br>`
                        + `<b>Tag_id: </b> ${tag_id} <br>`
                        + `<b>PMS Ticket Status: </b> ${pms_status} <br><br>`
                        + `<b>Reason for closing: ${CloseReason}</b>`
                        + `No further action is required at this time. If the issue reoccurs or the user needs additional assistance, the PMS ticket may be re-opened.`

                    var wholeEmail = start + body + end + privacy;
                    const mailOption = {
                        from: process.env.EMAIL,
                        to: assignedToInfo.emp_email,
                        subject: `Help Desk System Notification - PMS Ticket Updated`,
                        html: wholeEmail
                    }

                    await transporter.sendMail(mailOption);
                    console.log(`Email sent to ${assignedToInfo.emp_email} regarding ticket update`);

                    await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
                        is_reviewed: false
                    })
                }
            } catch (err) {
                console.log('Unable to send email /updateticket: ', err)
            }
        }

    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//GET ALL PMS TICKET
router.get('/get-all-pmsticket', async (req, res) => {
    try {
        const alltickets = await knex('pmsticket_master').select('*');
        res.json(alltickets)
        console.log('triggered /get-all-pmstikcet')

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//RE-ASSIGNING THE TICKET 
router.post('/update-ticket-assigned', async (req, res) => {

    try {
        const currentTimestamp = new Date()
        const {
            assigned_to,
            updated_by,
            pmsticket_id,
            tag_id,
            pms_status
        } = req.body

        const updateByInfo = await knex('users_master').where('user_id', updated_by).first();
        console.log(req.body)

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

        await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).update({
            assigned_to: assigned_to,
            pms_status,
            updated_by: updateByInfo.user_name,
            updated_at: currentTimestamp
        })
        await knex('pmsticket_logs').insert({
            pmsticket_id,
            tag_id,
            created_by: updateByInfo.user_name,
            created_at: currentTimestamp,
            changes_made: `${updateByInfo.user_name} assinged the ticket to ${assigned_to}`
        });

        res.status(200).json({ message: 'Ticket updated successfully' });
        //Setting assigned HD username
        var end = `Best regards,<br> Lepanto Helpdesk System`;
        var privacy = '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
            '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
            'or entity to which it is addressed only. This email may contain confidential information. If you are not the person ' +
            'to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly ' +
            'prohibited.</p>'


        const assignedToInfo = await knex('users_master').where('user_name', assigned_to).first();
        const ticket = await knex('pmsticket_master').where('pmsticket_id', pmsticket_id).first()
        const hdname = assignedToInfo.user_name
        const HDFullname = hdname.charAt(0).toUpperCase() + hdname.slice(1).toLowerCase();

        var start = `Hello ${HDFullname}<br><br>`
        var body = `The following PMS ticket has been assigned to you:<br>`
            + `Below are the details of the ticket: <br><br>`
            + `<b>PMS Ticket Number: </b>${pmsticket_id} <br>`
            + `<b>Tag ID: </b> ${ticket.tag_id} <br>`
            + `<b>pms Status: </b> ${pms_status} <br><br>`

        var wholeEmail = start + body + end + privacy;
        const mailOption = {
            from: process.env.EMAIL,
            to: assignedToInfo.emp_email,
            subject: `Help Desk System Notification - PMS Ticket Updated`,
            html: wholeEmail
        }

        await transporter.sendMail(mailOption);
        console.log(`Email sent to ${assignedToInfo.emp_email} regarding ticket update`, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');






    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//GET ALL NOTES BY PM TICKET ID
router.get('/get-all-notes/:pmsticket_id', async (req, res, next) => {
    try {
        const pmsticket_id = req.params.pmsticket_id;
        const notes = await knex('pmsnotes_master').where({ pmsticket_id })
            .orderBy('created_at', 'created_by', 'note');
        res.json(notes);
        console.log('triggered /get-all-notes/:ticket_id');
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//Adding a note to a ticket
router.post('/note-post', async (req, res, next) => {
    const currentTimestamp = new Date()

    try {
        const {
            notes,
            current_user,
            pmsticket_id
        } = req.body;
        await knex('pmsnotes_master').insert({
            note: notes,
            created_by: current_user,
            created_at: currentTimestamp,
            pmsticket_id: pmsticket_id
        })

        await knex('pmsticket_logs').insert({
            pmsticket_id: pmsticket_id,
            tag_id: '',
            created_by: current_user,
            created_at: currentTimestamp,
            changes_made: `${current_user} placed a note "${notes}"`
        })


        console.log(`${current_user} placed a note successfully`)
        res.status(200).json({ message: 'PLaced a note successfully' });
    } catch (err) {
        console.log('Internal Error: ', err)
    }
})

//Setting notify to true
router.post('/notified-true', async (req, res) => {
    try {
        const { pmsticket_id, user_id } = req.body;
        const empInfo = await knex('users_master').where('user_id', user_id).first();

        if (empInfo.emp_tier === 'helpdesk') {
            await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
                is_notified: true
            })
        } else if (empInfo.emp_tier === 'user') {
            await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
                is_notifiedhd: true
            })
        }

        console.log('Triggered /Update-pms-notified-true')
        console.log('Notify ticket: ', pmsticket_id)
        res.status(200).json({ message: "Updated notif", pmsticket_id });
    } catch (err) {
        console.log(`Unable to update notification: `, err)
        res.status(500).json({ error: 'Failed to update notification' });
    }
})

//Setting notify to false
router.post('/update-notified-false', async (req, res) => {
    try {
        const { pmsticket_id, user_id } = req.body;
        const empInfo = await knex('users_master').where('user_id', user_id).first();

        if (empInfo.emp_tier === 'helpdesk') {
            await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
                is_notifiedhd: false

            })
        } else if (empInfo.emp_tier === 'user') {
            await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
                is_notified: false
            })
        }

        console.log('Triggered /Update-notified-false')
        console.log('Un-Notify ticket: ', pmsticket_id)
        res.status(200).json({ message: "Updated notif", pmsticket_id });
    } catch (err) {
        console.log(`Unable to update notification: `, err)
    }
})

//GET ALL FEEDBACK/REVIEW
router.get('/get-all-feedback/:pmsticket_id', async (req, res) => {
    try {
        const pmsticket_id = req.params.pmsticket_id;
        const feedback = await knex('pmsreview_master').where({ pmsticket_id })
            .orderBy('created_at', 'user_id', 'review');
        res.json(feedback);
        console.log('triggered /get-all-feedback/:ticket_id');
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

//GET ALL FEEDBACK
router.get('/get-all-feedback', async (req, res) => {
    try {
        const getAll = await knex('pmsreview_master').select('*');
        res.status(200).json(getAll);
        console.log('Triggered /get-all-feedback', getAll);
    } catch (err) {
        console.error('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Adding a feedback to a ticket
router.post('/feedback', async (req, res) => {
    console.log('????????????????????????????????????????????????????????????')
    const currentTimestamp = new Date();
    try {
        const { review, user_id, created_by, pmsticket_id, score } = req.body;
        await knex('pmsreview_master').insert({
            review,
            user_id,
            created_at: currentTimestamp,
            created_by,
            pmsticket_id,
            score
        })
        await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
            is_reviewed: true
        });
        console.log(`${created_by} placed a feedback successfully`);
        res.json(200);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

//DELETE FEEDBACK/REVIEW IF IT WILL BE RE-FEEDBACK/REVIEW
router.post('/feedback-delete-by-id', async (req, res) => {
    try {
        console.log('/feedback-by-id was triggered');
        const currentTimestamp = new Date();
        const { pmsticket_id, review, user_id, created_by, score } = req.body;
        //Delete the existing 
        await knex('pmsreview_master').where({ pmsticket_id: pmsticket_id }).del()
        //add a new review 
        await knex('review_master').insert({
            review,
            user_id,
            created_at: currentTimestamp,
            created_by,
            pmsticket_id,
            score
        });
        //update ticket-master
        await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
            is_reviewed: true
        });
        console.log(`${created_by} placed a new feedback successfully`);
        res.status(200).json({ message: "Feedback saved successfully" });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//ARCHIVE PMS-TICKET
router.post('/archive-ticket', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const {
            pmsticket_id,
            updated_by
        } = req.body;
        console.log('Triggered /archive-ticket', pmsticket_id, updated_by)
        await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
            is_active: false,
            updated_by: updated_by
        });

        await knex('pmsticket_logs').insert({
            pmsticket_id: pmsticket_id,
            created_by: updated_by,
            created_at: currentTimestamp,
            changes_made: `${updated_by} Archived this ticket`
        });

        res.status(200).json({ message: 'Ticket archived successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//UN-ARCHIVE PMS TICKET
router.post('/un-archive-ticket', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const {
            pmsticket_id,
            updated_by
        } = req.body;
        console.log('Triggered /archive-ticket', pmsticket_id, updated_by)
        await knex('pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
            is_active: true,
            updated_by: updated_by
        });

        await knex('pmsticket_logs').insert({
            pmsticket_id: pmsticket_id,
            created_by: updated_by,
            created_at: currentTimestamp,
            changes_made: `${updated_by} Un-Archived this ticket`
        });

        res.status(200).json({ message: 'Ticket un-archived successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

//GET ALL PMS TICKET
router.get('/get-all-ticket', async (req, res) => {
    try {
        const alltickets = await knex('pmsticket_master').select('*');
        res.json(alltickets)
        console.log('triggered /get-all-tikcet')

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

// Lock or refresh lock
router.post("/lock", async (req, res) => {
    const { pmsticket_id, locked_by } = req.body;

    const ticket = await knex("pmsticket_master").where({ pmsticket_id: pmsticket_id }).first();



    if (ticket.is_locked && ticket.locked_by && ticket.locked_by !== locked_by) {
        return res.status(403).json({
            success: false,
            message: `${ticket.locked_by} is currently working on this ticket`,
        });
    }

    await knex("pmsticket_master")
        .where({ pmsticket_id: pmsticket_id })
        .update({
            is_locked: true,
            locked_by: locked_by,
            locked_at: new Date(), // optional: track timestamp
        });

    res.json({ success: true, message: "Ticket locked/refreshed" });
});

// Unlock ticket
router.post("/unlock", async (req, res) => {
    try {
        const { pmsticket_id, locked_by } = req.body || {};
        if (!pmsticket_id || !locked_by) {
            return res.status(400).json({ success: false, message: "Missing data" });
        }

        await knex("pmsticket_master")
            .where({ pmsticket_id, locked_by })
            .update({ is_locked: 0, locked_by: null, locked_at: null });

        res.json({ success: true, message: "Ticket unlocked" });
    } catch (err) {
        console.error("Unlock error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//SEND A NOTIFICATION TO REVIEW
router.post('/send-notification-review', async (req, res) => {

    try {
        const { ticket_for_id, pmsticket_id } = req.body;
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
        var body = `We’re glad to inform you that your PMS ticket ID: ${pmsticket_id} has been successfully resolved.`
            + ` At this stage, you may now proceed to close the pms ticket if you are satisfied with the resolution.<br>`
            + `We would also appreciate it if you could take a moment to provide your review or feedback on your `
            + `experience. Your input is valuable and helps us continue improving our support services.<br><br>`
            + `<a href={192.168.4.251:3007/ticketsystem/view-pms-user-ticket?id=${pmsticket_id}}>Submit Your Feedback Here.</a><br><br>`
            + `If you have encountered issue/problem after your PMS, you may open a support ticket for us to assist you further.<br><br>`
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
            subject: `PMS Ticket #${pmsticket_id} Resolved – Awaiting Your Feedback`,
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

// router.post('/archive-ticket', async (req, res) => {
//     try {
//         const currentTimestamp = new Date();
//         const {
//             pmsticket_id,
//             updated_by
//         } = req.body;
//         console.log('Triggered /archive-ticket', pmsticket_id, updated_by)
//         await knex(' pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
//             is_active: false,
//             updated_by: updated_by
//         });

//         await knex(' pmsticket_logs').insert({
//             pmsticket_id: pmsticket_id,
//             created_by: updated_by,
//             created_at: currentTimestamp,
//             changes_made: `${updated_by} Archived this ticket`
//         });

//         res.status(200).json({ message: 'Ticket archived successfully' });
//     } catch (err) {
//         console.log('INTERNAL ERROR: ', err)
//     }
// })

// router.post('/un-archive-ticket', async (req, res) => {
//     try {
//         const currentTimestamp = new Date();
//         const {
//             pmsticket_id,
//             updated_by
//         } = req.body;
//         console.log('Triggered /archive-ticket', pmsticket_id, updated_by);

//         await knex(' pmsticket_master').where({ pmsticket_id: pmsticket_id }).update({
//             is_active: true,
//             updated_by: updated_by
//         });

//         await knex(' pmsticket_logs').insert({
//             pmsticket_id: pmsticket_id,
//             created_by: updated_by,
//             created_at: currentTimestamp,
//             changes_made: `${updated_by} Un-Archived this ticket`
//         });

//         res.status(200).json({ message: 'Ticket un-archived successfully' });
//     } catch (err) {
//         console.log('INTERNAL ERROR: ', err)
//     }
// })

const Logs = db.define('pmsticket_logs', {
    pmsticket_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    created_by: {
        type: DataTypes.STRING,
    },
    changes_made: {
        type: DataTypes.STRING,
    },
    tag_id: {
        type: DataTypes.STRING,
    },
    created_at: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'pmsticket_logs'
})

//GET PMS TICKET LOGS BY ID
router.get('/pmsticket-logs', async (req, res) => {
    try {
        console.log('/ticket-logs was triggered');
        const getById = await Logs.findAll({
            where: {
                pmsticket_id: req.query.id
            }
        })

        res.json(getById)
    } catch (err) {
        console.log('INTERNAL ERROR:,', err)
    }
})

module.exports = router;
