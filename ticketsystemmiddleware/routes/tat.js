var express = require('express');
var bcrypt = require('bcrypt');
const router = express.Router();
var Sequelize = require('sequelize');
const nodemailer = require("nodemailer");
const { date } = require('joi');
const { DataTypes } = Sequelize;
require('dotenv').config();

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


const Tat = db.define('tat_master', {
    tat_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    tat: {
        type: DataTypes.STRING,
    },
    user_id: {
        type: DataTypes.STRING,
    },
    ticket_id: {
        type: DataTypes.STRING,
    },
    user_name: {
        type: DataTypes.STRING,
    },
    category: {
        type: DataTypes.STRING,
    },
    sub_category: {
        type: DataTypes.STRING,
    },
    ticket_type: {
        type: DataTypes.STRING,
    },
    created_at: {
        type: DataTypes.STRING,
    },
    ticket_created_at: {
        type: DataTypes.STRING,
    },
    created_by: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'tat_master'
})


router.get('/get-all-tat', async (req, res) => {
    try {
        const all = await knex('tat_master').select('*');
        res.status(200).json(all);
        console.log('Triggered /get-all-tat', all);
    } catch (err) {
        console.log('Internal Error: ', errr)
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


router.get('/get-tat-by-id', async (req, res) => {
    try {
        const get = await Tat.findAll({
            where: {
                ticket_id: req.query.ticket_id
            }
        })

        const filter = get.filter((a) => a.ticket_type === 'support')
        res.json(filter)
    } catch (err) {
        console.log('INTERNALL ERROR: ' + err)
    }
})


const PMSTat = db.define('pmstat_master', {
    tat_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    tat: {
        type: DataTypes.STRING,
    },
    user_id: {
        type: DataTypes.STRING,
    },
    pmsticket_id: {
        type: DataTypes.STRING,
    },
    user_name: {
        type: DataTypes.STRING,
    },
    pms_category: {
        type: DataTypes.STRING,
    },
    ticket_type: {
        type: DataTypes.STRING,
    },
    created_at: {
        type: DataTypes.STRING,
    },
    ticket_created_at: {
        type: DataTypes.STRING,
    },
    created_by: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'pmstat_master'
})



router.get('/get-all-pms-tat', async (req, res) => {
    try {
        const all = await knex('pmstat_master').select('*');
        res.status(200).json(all);
        console.log('Triggered /get-all-pms-tat', all);
    } catch (err) {
        console.log('Internal Error: ', errr)
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


module.exports = router;