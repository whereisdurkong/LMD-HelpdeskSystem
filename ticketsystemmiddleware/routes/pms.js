//This was supposed to be assets
var express = require('express');
var bcrypt = require('bcrypt');
const router = express.Router();
var Sequelize = require('sequelize');
const nodemailer = require("nodemailer");
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

const Assets = db.define('users_master', {
    pms_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    tag_id: {
        type: DataTypes.STRING
    },
    department: {
        type: DataTypes.STRING
    },
    assign_to: {
        type: DataTypes.STRING
    },
    pass_word: {
        type: DataTypes.STRING
    },
    ip_address: {
        type: DataTypes.STRING
    },
    processor: {
        type: DataTypes.STRING
    },
    memory: {
        type: DataTypes.STRING
    },
    storage: {
        type: DataTypes.STRING
    },
    model: {
        type: DataTypes.STRING
    },
    serial: {
        type: DataTypes.STRING
    },
    pms_date: {
        type: DataTypes.DATE
    },
    description: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.DATE
    },
    updated_by: {
        type: DataTypes.STRING
    },
    updated_at: {
        type: DataTypes.DATE
    },
    assigned_location: {
        type: DataTypes.STRING
    },
    pms_category: {
        type: DataTypes.STRING
    },
    is_active: {
        type: DataTypes.STRING
    },
    is_lock: {
        type: DataTypes.STRING
    },
    lock_by: {
        type: DataTypes.STRING
    },
    lock_at: {
        type: DataTypes.STRING
    },
    monitor_model: {
        type: DataTypes.STRING
    },
    monitor_serial: {
        type: DataTypes.STRING
    },

}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'pms_master'
})

//Get All PMS/Assets
router.get('/get-all-pms', async (req, res) => {
    try {
        const fetch = await knex('pms_master').select('*');
        res.json(fetch);
        console.log('Triggered /get-all-pms')
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Archive PMS/Assets
router.post('/archive-device', async (req, res) => {
    try {
        const { pms_id, updated_by } = req.body;

        await knex('pms_master').where({ pms_id: pms_id }).update({
            is_active: 0,
            updated_by: updated_by
        })
        res.status(200).json({ message: 'successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})
//Un-Archive PMS/Assets
router.post('/un-archive-device', async (req, res) => {
    try {
        const { pms_id, updated_by } = req.body;

        await knex('pms_master').where({ pms_id: pms_id }).update({
            is_active: 1,
            updated_by: updated_by
        })
        res.status(200).json({ message: 'successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const Logs = db.define('pms_logs', {
    log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    pms_id: {
        type: DataTypes.STRING,
    },
    tag_id: {
        type: DataTypes.STRING,
    },
    created_by: {
        type: DataTypes.STRING,
    },
    created_at: {
        type: DataTypes.STRING,
    },
    changes_made: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'pms_logs'
})

//Get PMS/Assets Logs by ID
router.get('/get-logs', async (req, res) => {
    try {
        console.log('/get-logs for pms was triggred');
        const result = await Logs.findAll({
            where: {
                pms_id: req.query.id
            }
        })
        res.json(result)
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

//Add Computer /Desktop
router.post('/add-computer', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const {
            tag_id,
            department,
            assign_to,
            pass_word,
            ip_address,
            processor,
            memory,
            storage,
            monitor_model,
            monitor_serial,
            pms_date,
            description,
            created_by,
            assigned_location
        } = req.body;

        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', req.body)

        const [add] = await knex('pms_master').insert({
            tag_id: tag_id,
            department: department,
            assign_to: assign_to,
            pass_word: pass_word,
            ip_address: ip_address,
            processor: processor,
            memory: memory,
            storage: storage,
            monitor_model: monitor_model,
            monitor_serial: monitor_serial,
            pms_date: pms_date,
            description: description,
            created_by: created_by,
            created_at: currentTimestamp,
            assigned_location: assigned_location,
            pms_category: 'desktop',
            is_active: 1
        }).returning('pms_id');

        const pms_id = add.pms_id || add;

        await knex('pms_logs').insert({
            tag_id: tag_id,
            changes_made: `New Computer added by ${created_by}`,
            created_by: created_by,
            created_at: currentTimestamp,
            pms_id: pms_id
        })

        res.json(200);
        console.log('triggered /add-anc')
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
    }

})

//Get All Computer/Desktop
router.get('/get-computers', async (req, res) => {
    try {
        const all = await knex('pms_master').select('*').where('pms_category', 'desktop');
        res.status(200).json(all);
        console.log('Triggered /get-computers', all);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Get Computer/Desktop by ID
router.get('/get-computer-by-id', async (req, res) => {
    try {
        console.log('Triggered /get-computer-by-id');

        const get = await Assets.findAll({
            where: {
                pms_id: req.query.pms_id
            }
        })
        res.json(get[0])
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Update Computer/Desktop
router.post('/update-computer', async (req, res) => {
    try {
        const currentTimestamp = new Date()
        const {
            pms_id,
            tag_id,
            department,
            assign_to,
            pass_word,
            ip_address,
            processor,
            memory,
            storage,
            monitor_model,
            monitor_serial,
            pms_date,
            description,
            assigned_location,
            updated_by,
            changes_made
        } = req.body

        await knex('pms_master').where('pms_id', pms_id).update({
            tag_id: tag_id,
            department: department,
            assign_to: assign_to,
            pass_word: pass_word,
            ip_address: ip_address,
            processor: processor,
            memory: memory,
            storage: storage,
            monitor_model: monitor_model,
            monitor_serial: monitor_serial,
            pms_date: pms_date,
            description: description,
            assigned_location: assigned_location,
            updated_by: updated_by,
            updated_at: currentTimestamp
        });

        await knex('pms_logs').insert({
            pms_id: pms_id,
            tag_id: tag_id,
            created_by: updated_by,
            created_at: currentTimestamp,
            changes_made: changes_made
        })

        res.status(200).json({ message: 'PLaced a note successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Delete a Computer/Desktop
router.post('/delete-computer', async (req, res) => {

    const { pms_id, tag_id, created_by } = req.body
    try {
        await knex('pms_logs').insert({
            pms_id: pms_id,
            tag_id: tag_id,
            created_by: created_by,
            created_at: new Date(),
            changes_made: `Desktop ${tag_id} deleted by ${created_by} `

        })
        await knex('pms_master').where({ pms_id: pms_id }).del();

        console.log(`${created_by} deleted asset ${tag_id} successfully`);
        res.status(200).json({ message: "Deleted asset successfully " });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Add a Laptop
router.post('/add-laptop', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const {
            tag_id,
            department,
            assign_to,
            pass_word,
            ip_address,
            model,
            serial,
            processor,
            memory,
            storage,
            pms_date,
            description,
            created_by,
            assigned_location
        } = req.body;

        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', req.body)

        const [add] = await knex('pms_master').insert({
            tag_id: tag_id,
            department: department,
            assign_to: assign_to,
            pass_word: pass_word,
            ip_address: ip_address,
            model: model,
            serial: serial,
            processor: processor,
            memory: memory,
            storage: storage,
            pms_date: pms_date,
            description: description,
            created_by: created_by,
            created_at: currentTimestamp,
            assigned_location: assigned_location,
            pms_category: 'laptop',
            is_active: 1
        }).returning('pms_id');

        const pms_id = add.pms_id || add;

        await knex('pms_logs').insert({
            tag_id: tag_id,
            changes_made: `New Laptop added by ${created_by}`,
            created_by: created_by,
            created_at: currentTimestamp,
            pms_id: pms_id
        })

        res.json(200);
        console.log('triggered /add-laptop')
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
    }

});

//Get all Laptop
router.get('/get-laptop', async (req, res) => {
    try {
        const all = await knex('pms_master').select('*').where('pms_category', 'laptop');
        res.status(200).json(all);
        console.log('Triggered /get-laptop', all);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Get all Laptop by ID
router.get('/get-laptop-by-id', async (req, res) => {
    try {
        console.log('Triggered /get-laptop-by-id');

        const get = await Assets.findAll({
            where: {
                pms_id: req.query.pms_id
            }
        })
        res.json(get[0])
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Update Laptop 
router.post('/update-laptop', async (req, res) => {
    try {
        const currentTimestamp = new Date()
        const {
            pms_id,
            tag_id,
            department,
            assign_to,
            pass_word,
            ip_address,
            model,
            serial,
            processor,
            memory,
            storage,
            pms_date,
            description,
            assigned_location,
            updated_by,
            changes_made,
        } = req.body

        await knex('pms_master').where('pms_id', pms_id).update({
            tag_id: tag_id,
            department: department,
            assign_to: assign_to,
            pass_word: pass_word,
            ip_address: ip_address,
            model: model,
            serial: serial,
            processor: processor,
            memory: memory,
            storage: storage,
            pms_date: pms_date,
            description: description,
            assigned_location: assigned_location,
            updated_by: updated_by,
            updated_at: currentTimestamp
        });
        await knex('pms_logs').insert({
            pms_id: pms_id,
            tag_id: tag_id,
            created_by: updated_by,
            created_at: currentTimestamp,
            changes_made: changes_made
        })
        res.status(200).json({ message: 'PLaced a note successfully' });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Add a Printer
router.post('/add-printer', async (req, res) => {
    try {
        const currentTimestamp = new Date();
        const {
            tag_id,
            department,
            assign_to,
            ip_address,
            model,
            serial,
            pms_date,
            description,
            created_by,
            assigned_location
        } = req.body;

        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', req.body)

        const [add] = await knex('pms_master').insert({
            tag_id: tag_id,
            department: department,
            assign_to: assign_to,
            ip_address: ip_address,
            model: model,
            serial: serial,
            pms_date: pms_date,
            description: description,
            created_by: created_by,
            created_at: currentTimestamp,
            assigned_location: assigned_location,
            pms_category: 'printer',
            is_active: 1
        }).returning('pms_id');

        const pms_id = add.pms_id || add;

        await knex('pms_logs').insert({
            tag_id: tag_id,
            changes_made: `New Printer added by ${created_by}`,
            created_by: created_by,
            created_at: currentTimestamp,
            pms_id: pms_id
        })

        res.json(200);
        console.log('triggered /add-printer')
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
    }

});

//Get all Printer
router.get('/get-printer', async (req, res) => {
    try {
        const all = await knex('pms_master').select('*').where('pms_category', 'printer');
        res.status(200).json(all);
        console.log('Triggered /get-printer', all);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Get Printer by ID
router.get('/get-printer-by-id', async (req, res) => {
    try {
        console.log('Triggered /get-printer-by-id');
        const get = await Assets.findAll({
            where: {
                pms_id: req.query.pms_id
            }
        })
        res.json(get[0])
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Update Printer
router.post('/update-printer', async (req, res) => {
    try {
        const currentTimestamp = new Date()
        const {
            pms_id,
            tag_id,
            department,
            assign_to,
            ip_address,
            model,
            serial,
            pms_date,
            description,
            assigned_location,
            updated_by,
            changes_made,
        } = req.body;

        await knex('pms_master').where('pms_id', pms_id).update({
            tag_id: tag_id,
            department: department,
            assign_to: assign_to,
            ip_address: ip_address,
            model: model,
            serial: serial,
            pms_date: pms_date,
            description: description,
            assigned_location: assigned_location,
            updated_by: updated_by,
            updated_at: currentTimestamp
        });
        await knex('pms_logs').insert({
            pms_id: pms_id,
            tag_id: tag_id,
            created_by: updated_by,
            created_at: currentTimestamp,
            changes_made: changes_made
        });

        res.status(200).json({ message: 'PLaced a note successfully' });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//PMS LOCK FUNCTION
router.post("/lock", async (req, res) => {
    try {
        const { pms_id, lock_by } = req.body;
        const asset = await knex('pms_master').where({ pms_id }).first();

        if (asset.is_lock && asset.lock_by && asset.lock_by !== lock_by) {
            return res.status(403).json({
                success: false,
                message: `${asset.lock_by} is currently reviewing this asset.`
            });
        }

        await knex('pms_master')
            .where({ pms_id })
            .update({
                is_lock: 1,
                lock_by,
                lock_at: new Date()
            });

        res.json({ success: true, message: lock_by + 'is currently reviewing this asset' });
    } catch (err) {
        console.error('LOCK ERROR:', err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//PMS UNLOCK FUNCTION
router.post("/unlock", async (req, res) => {
    try {
        const { pms_id, lock_by } = req.body;
        if (!pms_id || !lock_by) {
            return res.status(400).json({ success: false, message: 'Missing data' });
        }

        const asset = await knex('pms_master').where({ pms_id }).first();
        // only unlock if it's locked by the same user
        if (asset.lock_by !== lock_by) {
            return res.json({ success: false, message: "Not your lock" });
        }

        await knex('pms_master')
            .where({ pms_id })
            .update({ is_lock: 0, lock_by: null, lock_at: null });

        res.json({ success: true, message: "Asset unlocked" });
    } catch (err) {
        console.error('UNLOCK ERROR:', err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;