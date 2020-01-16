require('dotenv').config();
require('colors');
const fetch = require('node-fetch');
const format = require('date-fns/format');

const siteMap = new Map();

// Config
const sites = [
    ...Object.keys(process.env)
        .filter(k => k.startsWith('PING_SITE_'))
        .map(k => ({ url: process.env[k], name: k.replace('PING_SITE_', '') }))
];

const MINUTES = process.env.INTERVAL_TIME_MINUTES || 5;
const INTERVAL_TIME = 60000 * MINUTES;
const REQUEST_TIMEOUT = 30000;
const DATE_FORMAT = 'MM/DD/YYYY - h:mm A';

//////////////
const STATUS = {
    OK: 'OK'.green,
    DOWN: 'DOWN'.red,
    PENDING: 'PENDING'.yellow,
    ERROR: 'ERROR'.red
};

const processUpdates = () => {
    updateStatus();
}

const updateStatus = () => {
    [...siteMap.keys()].forEach(key => {
        updateState(key, STATUS.PENDING);
        fetch(siteMap.get(key).url, {
            timeout: REQUEST_TIMEOUT
        })
            .then((res) => {
                if (res.status === 200) {
                    updateState(key, STATUS.OK);
                } else {
                    updateState(key, STATUS.DOWN);
                }
            })
            .catch((err) => {
                console.log(err);
                updateState(key, STATUS.ERROR);
            });
    });
}

const updateState = (key, status) => {
    siteMap.set(key, {
        url: siteMap.get(key).url,
        status: status,
        lastPing: new Date()
    });
    printResults();
}

const printResults = () => {
    console.clear();
    console.log(`Interval set to ${MINUTES} minutes.\n`);
    console.log(`Address\nStatus\tLastPing\n`);
    [...siteMap.keys()].forEach(function (key) {
        const state = siteMap.get(key);
        console.log(`${key.replace(/[_]/g, ' ')}\n${state.url}\n${state.status}\t${format(state.lastPing, DATE_FORMAT)}\n`);
    });
}

sites.forEach(site => siteMap.set(site.name, { url: site.url }));

if (sites.length > 0) {
    processUpdates();
    const interval = setInterval(processUpdates, INTERVAL_TIME);
} else {
    console.warn('No sites to ping!'.yellow);
    console.error('Missing .env PING_SITE_ entries.'.red);
}