// var express = require('express');
// var bcrypt = require('bcrypt');
// const router = express.Router();
// var Sequelize = require('sequelize');
// const { DataTypes } = Sequelize;
// require('dotenv').config();

// var knex = require("knex")({
//     client: 'mssql',
//     connection: {
//         user: process.env.USER,
//         password: process.env.PASSWORD,
//         server: process.env.SERVER,
//         database: process.env.DATABASE,
//         port: parseInt(process.env.APP_SERVER_PORT),
//         options: {
//             enableArithAbort: true,

//         }
//     },
// });

// var db = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
//     host: process.env.SERVER,
//     dialect: "mssql",
//     port: parseInt(process.env.APP_SERVER_PORT),
// });

// const Announcement = db.define('users_master', {
//     announcements_id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true
//     },
//     announcements: {
//         type: DataTypes.STRING
//     },
//     created_by: {
//         type: DataTypes.STRING
//     },
//     created_at: {
//         type: DataTypes.STRING
//     },
//     updated_by: {
//         type: DataTypes.STRING
//     },
//     updated_at: {
//         type: DataTypes.STRING
//     },
// }, {
//     freezeTableName: false,
//     timestamps: false,
//     createdAt: false,
//     updatedAt: false,
//     tableName: 'users_master'
// });

// //Add Announcement
// router.post('/add-anc', async (req, res) => {
//     const currentTimestamp = new Date();
//     const { announcements, created_by, announcementTitle } = req.body;

//     try {
//         const [add] = await knex('announcements_master').insert({
//             announcements,
//             created_by,
//             announcementTitle,
//             created_at: currentTimestamp
//         }).returning('announcements_id');

//         const announcement_id = add.announcements_id || add;

//         await knex('announcements_logs').insert({
//             announcements_id: announcement_id,
//             changes_made: `${created_by} has added an announcement.`,
//             created_at: currentTimestamp,
//             created_by: created_by
//         })

//         res.json(200);
//         console.log('triggered /add-anc')

//     } catch (err) {
//         console.log('INTERNAL ERROR UNABLE TO PUT ANNOUNCEMENT: ', err)
//     }

// });

// //Get All Announcements
// router.get('/get-all-anc', async (req, res) => {
//     try {
//         const fetchall = await knex('announcements_master').select('*');
//         res.json(fetchall);
//         console.log('triggered /get-all-anc')
//     } catch (err) {
//         console.log('INTERNAL ERROR UNABLE TO FETCH ALL ANC: ', err)
//     }
// })

// //Update Announcement
// router.post('/update-anc', async (req, res) => {
//     const currentTimestamp = new Date();
//     try {
//         const {
//             announcement_id,
//             announcements,
//             updated_by
//         } = req.body;

//         const oldanc = await knex('announcements_master').where({ announcements_id: announcement_id }).first();

//         await knex('announcements_master').where({ announcements_id: announcement_id }).update({
//             updated_at: currentTimestamp,
//             announcements,
//             updated_by
//         })

//         await knex('announcements_logs').insert({
//             announcements_id: announcement_id,
//             changes_made: `${updated_by} has edited announcement. OLD:${oldanc.announcements} to NEW:${announcements}`,
//             created_at: currentTimestamp,
//             created_by: updated_by
//         })

//         res.json(200);
//         console.log('triggered /update-anc')
//     } catch (err) {
//         console.log("INTERNAL ERROR UNABLE TO UPDATE: ", err)
//     }
// })

// //Reactivate Announcement
// router.post('/reactivate-anc', async (req, res) => {
//     const currentTimestamp = new Date();
//     try {
//         const {
//             announcement_id,
//             updated_by
//         } = req.body;

//         await knex('announcements_master').where({ announcements_id: announcement_id }).update({
//             updated_at: currentTimestamp,
//             is_active: 1,
//             updated_by
//         })

//         await knex('announcements_logs').insert({
//             announcements_id: announcement_id,
//             changes_made: `${updated_by} has re activated announcement.`,
//             created_at: currentTimestamp,
//             created_by: updated_by
//         })

//         res.json(200);
//         console.log('triggered /update-anc')
//     } catch (err) {
//         console.log("INTERNAL ERROR UNABLE TO UPDATE: ", err)
//     }
// })

// //De-Activate Announcement
// router.post('/delete-anc', async (req, res) => {
//     const currentTimestamp = new Date();
//     try {
//         const { announcement_id, updated_by } = req.body;

//         await knex('announcements_master').where({ announcements_id: announcement_id }).update({
//             is_active: 0,
//             updated_at: currentTimestamp,
//             updated_by: updated_by

//         })
//         await knex('announcements_logs').insert({
//             announcements_id: announcement_id,
//             changes_made: `${updated_by} has deleted announcement.`,
//             created_at: currentTimestamp,
//             created_by: updated_by
//         })
//         res.json(200);
//         console.log('triggered /delete-anc')
//     } catch (err) {
//         console.log("INTERNAL ERROR UNABLE TO DELETE: ", err)
//     }
// })

// //Delete Announcement Permanently
// router.post('/perma-delete-anc', async (req, res) => {
//     try {
//         const currentTimestamp = new Date();
//         const { announcement_id, updated_by } = req.body;

//         await knex('announcements_logs').insert({
//             announcements_id: announcement_id,
//             changes_made: `${updated_by} has permanently deleted announcement.`,
//             created_at: currentTimestamp,
//             created_by: updated_by
//         });

//         await knex('announcements_master').where({ announcements_id: announcement_id }).del();
//         res.json(200);
//         console.log('triggered /perma-delete-anc')
//     } catch (err) {
//         console.log('INTERNAL ERROR : ', err)
//     }
// })


// module.exports = router;


var express = require('express');
var bcrypt = require('bcrypt');
const router = express.Router();
var Sequelize = require('sequelize');
const { DataTypes } = Sequelize;
require('dotenv').config();
const nodemailer = require("nodemailer");

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

const Announcement = db.define('users_master', {
    announcements_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    announcements: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.STRING
    },
    updated_by: {
        type: DataTypes.STRING
    },
    updated_at: {
        type: DataTypes.STRING
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'users_master'
});

//Add Announcement
router.post('/add-anc', async (req, res) => {
    const currentTimestamp = new Date();
    const { announcements, created_by, announcementTitle, location } = req.body;

    try {
        try {
            //Send announcement to all users
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

            const allHdEmails = await knex('users_master').where('emp_tier', 'user').andWhere('emp_location', location);

            const hdEmail = allHdEmails.map(email => email.emp_email);
            const email = hdEmail;

            var content = 'Good Day, <br><br>'
                + `${announcementTitle}<br>`
                + `${announcements}<br><br>`

            var end = 'Thank you for understanding. <br><br>'
            var footer = 'Best regards,<br> Lepanto Helpdesk System<br>';
            var privacy = '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
                '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
                'or entity to which it is addressed only. This email may contain confidential information. If you are not the person ' +
                'to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly ' +
                'prohibited.</p>'

            var wholeanc = content + end + footer + privacy;


            // Email for the user who created the ticket
            const ansemail = {
                from: process.env.EMAIL,
                to: email,
                subject: `Help Desk System Notification - Announcement`,
                html: wholeanc
            }

            await transporter.sendMail(ansemail);
            console.log('ANC EMAIL SENT SUCCESSFULLY ')

        } catch (err) {
            console.log('/annoucements UNABLE TO SEND EMAIL TO ALL USERS!')
        }

        const [add] = await knex('announcements_master').insert({
            announcements,
            created_by,
            announcementTitle,
            created_at: currentTimestamp
        }).returning('announcements_id');

        const announcement_id = add.announcements_id || add;

        await knex('announcements_logs').insert({
            announcements_id: announcement_id,
            changes_made: `${created_by} has added an announcement.`,
            created_at: currentTimestamp,
            created_by: created_by
        })



        res.json(200);
        console.log('triggered /add-anc')

    } catch (err) {
        console.log('INTERNAL ERROR UNABLE TO PUT ANNOUNCEMENT: ', err)
    }

});

//Get All Announcements
router.get('/get-all-anc', async (req, res) => {
    try {
        const fetchall = await knex('announcements_master').select('*');
        res.json(fetchall);
        console.log('triggered /get-all-anc')
    } catch (err) {
        console.log('INTERNAL ERROR UNABLE TO FETCH ALL ANC: ', err)
    }
})

//Update Announcement
router.post('/update-anc', async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const {
            announcement_id,
            announcements,
            updated_by
        } = req.body;

        const oldanc = await knex('announcements_master').where({ announcements_id: announcement_id }).first();

        await knex('announcements_master').where({ announcements_id: announcement_id }).update({
            updated_at: currentTimestamp,
            announcements,
            updated_by
        })

        await knex('announcements_logs').insert({
            announcements_id: announcement_id,
            changes_made: `${updated_by} has edited announcement. OLD:${oldanc.announcements} to NEW:${announcements}`,
            created_at: currentTimestamp,
            created_by: updated_by
        })

        res.json(200);
        console.log('triggered /update-anc')
    } catch (err) {
        console.log("INTERNAL ERROR UNABLE TO UPDATE: ", err)
    }
})

//Reactivate Announcement
router.post('/reactivate-anc', async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const {
            announcement_id,
            updated_by
        } = req.body;

        await knex('announcements_master').where({ announcements_id: announcement_id }).update({
            updated_at: currentTimestamp,
            is_active: 1,
            updated_by
        })

        await knex('announcements_logs').insert({
            announcements_id: announcement_id,
            changes_made: `${updated_by} has re activated announcement.`,
            created_at: currentTimestamp,
            created_by: updated_by
        })

        res.json(200);
        console.log('triggered /update-anc')
    } catch (err) {
        console.log("INTERNAL ERROR UNABLE TO UPDATE: ", err)
    }
})

//De-Activate Announcement
router.post('/delete-anc', async (req, res) => {
    const currentTimestamp = new Date();
    try {
        const { announcement_id, updated_by } = req.body;

        await knex('announcements_master').where({ announcements_id: announcement_id }).update({
            is_active: 0,
            updated_at: currentTimestamp,
            updated_by: updated_by

        })
        await knex('announcements_logs').insert({
            announcements_id: announcement_id,
            changes_made: `${updated_by} has deleted announcement.`,
            created_at: currentTimestamp,
            created_by: updated_by
        })
        res.json(200);
        console.log('triggered /delete-anc')
    } catch (err) {
        console.log("INTERNAL ERROR UNABLE TO DELETE: ", err)
    }
})

//Delete Announcement Permanently
router.post('/perma-delete-anc', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const { announcement_id, updated_by } = req.body;

        await knex('announcements_logs').insert({
            announcements_id: announcement_id,
            changes_made: `${updated_by} has permanently deleted announcement.`,
            created_at: currentTimestamp,
            created_by: updated_by
        });

        await knex('announcements_master').where({ announcements_id: announcement_id }).del();
        res.json(200);
        console.log('triggered /perma-delete-anc')
    } catch (err) {
        console.log('INTERNAL ERROR : ', err)
    }
})


module.exports = router;