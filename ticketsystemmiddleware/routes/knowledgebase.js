var express = require('express');
var bcrypt = require('bcrypt');
const router = express.Router();
var Sequelize = require('sequelize');
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

//Add Knowledgebase
router.post('/add-knowledgebase', async (req, res) => {
    try {
        const {
            kb_title,
            kb_desc,
            kb_category,
            created_by,
        } = req.body;

        const currentTimestamp = new Date();

        const [add] = await knex('knowledgebase_master').insert({
            kb_title,
            kb_desc,
            kb_category,
            created_by,
            created_at: currentTimestamp,
            is_active: 1,
        })
            .returning('kb_id');
        const kd_id = add.kb_id || add;

        res.json(200);
        console.log('Triggered add-knowledgebase route');
    } catch (err) {
        console.error('INTERNAL ERROR :', err);
    }
})

//Get all Knowledgebase
router.get('/all-knowledgebase', async (req, res) => {
    try {
        const knowledgebase = await knex('knowledgebase_master').select('*');
        res.json(knowledgebase);
        console.log('Triggered all-knowledgebase');
    } catch (err) {
        console.error('Error fetching knowledgebase:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Update Knowledgebase
router.post('/update-knowledgebase', async (req, res) => {
    try {
        const {
            kb_id,
            kb_title,
            kb_desc,
            kb_category,
            updated_by,
        } = req.body;

        const currentTimestamp = new Date();

        await knex('knowledgebase_master').where('kb_id', kb_id).update({
            kb_title,
            kb_desc,
            kb_category,
            updated_by: updated_by,
            updated_at: currentTimestamp,
        })
        res.json(200);
        console.log('Triggered update-knowledgebase route');

    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})

//Archive  Knowledgebase
router.post('/archive-knowledgebase', async (req, res) => {
    try {
        const { kb_id, updated_by } = req.body;
        const currentTimestamp = new Date();

        await knex('knowledgebase_master').where({ kb_id: kb_id }).update({
            is_active: 0,
            updated_at: currentTimestamp,
            updated_by: updated_by,
        });

        res.json(200);
        console.log('Triggered archive-knowledgebase route');
    } catch (err) {
        console.error('Error archiving knowledgebase:', err);
    }
})

//Un-Archive Knowledgebase
router.post('/un-archive-knowledgebase', async (req, res) => {
    try {
        const { kb_id, updated_by } = req.body;
        const currentTimestamp = new Date();

        await knex('knowledgebase_master').where({ kb_id: kb_id }).update({
            is_active: 1,
            updated_at: currentTimestamp,
            updated_by: updated_by,
        });

        res.json(200);
        console.log('Triggered archive-knowledgebase route');
    } catch (err) {
        console.error('Error archiving knowledgebase:', err);
    }
})

//Delete Knowledgebase
router.post('/delete-knowledgebase', async (req, res) => {
    try {
        const { kb_id, updated_by } = req.body;

        await knex('knowledgebase_master').where('kb_id', kb_id).del();
        res.json(200);
        console.log('Triggered reactivate-knowledgebase route');
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

module.exports = router;