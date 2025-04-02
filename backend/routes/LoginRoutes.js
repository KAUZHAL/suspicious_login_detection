// const express = require('express');
// const Login = require('../models/Login');
// const router = express.Router();

// // Function to detect suspicious activity
// const detectSuspiciousLogin = async (username, ip_address, device, risk_score) => {
//     const previousLogins = await Login.find({ username }).sort({ timestamp: -1 }).limit(5);

//     let isSuspicious = false;

//     if (previousLogins.length > 0) {
//         const lastLogin = previousLogins[0];

//         // Check if IP has changed
//         if (lastLogin.ip_address !== ip_address) {
//             console.log(`🚨 Suspicious: IP changed from ${lastLogin.ip_address} to ${ip_address}`);
//             isSuspicious = true;
//         }

//         // Check if device has changed
//         if (lastLogin.device !== device) {
//             console.log(`🚨 Suspicious: Device changed from ${lastLogin.device} to ${device}`);
//             isSuspicious = true;
//         }
//     }

//     // Check if risk score is high (above 0.7)
//     if (risk_score >= 0.7) {
//         console.log(`🚨 Suspicious: High risk score of ${risk_score}`);
//         isSuspicious = true;
//     }

//     return isSuspicious ? 'suspicious' : 'safe';
// };

// // API to save login attempt
// router.post('/', async (req, res) => {
//     try {
//         const { username, ip_address, location, device, risk_score } = req.body;

//         if (!username || !ip_address || !location || !device) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         const status = await detectSuspiciousLogin(username, ip_address, device, risk_score);

//         const newLogin = new Login({
//             username,
//             ip_address,
//             location,
//             device,
//             risk_score: risk_score || 0.5,
//             status
//         });

//         await newLogin.save();
//         res.status(201).json({ message: `Login recorded. Status: ${status}`, status });
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error });
//     }
// });

// // API to fetch login history
// router.get('/', async (req, res) => {
//     try {
//         const logins = await Login.find().sort({ timestamp: -1 });
//         res.json(logins);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error });
//     }
// });

// module.exports = router;




const express = require('express');
const Login = require('../models/Login');
const router = express.Router();

const calculateRiskScore = async (username, ip_address, device, location) => {
    const previousLogins = await Login.find({ username }).sort({ timestamp: -1 }).limit(5);

    let riskScore = 0;

    if (previousLogins.length > 0) {
        const lastLogin = previousLogins[0];

       
        if (lastLogin.ip_address !== ip_address) {
            console.log(` Risk: IP changed from ${lastLogin.ip_address} to ${ip_address}`);
            riskScore += 0.3; 
        }

        if (lastLogin.device !== device) {
            console.log(` Risk: Device changed from ${lastLogin.device} to ${device}`);
            riskScore += 0.3; 
        }

        if (lastLogin.location !== location) {
            console.log(` Risk: Location changed from ${lastLogin.location} to ${location}`);
            riskScore += 0.2; 
        }
        const currentHour = new Date().getHours();
        if (currentHour < 6 || currentHour > 22) {
            console.log(` Risk: Unusual login time at ${currentHour} hours`);
            riskScore += 0.2; 
        }
    }

    const recentLogins = await Login.find({ username, timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } });
    if (recentLogins.length > 3) {
        console.log(` Risk: Multiple login attempts in a short period`);
        riskScore += 0.2; 
    }

    return riskScore;
};

const detectSuspiciousLogin = async (username, ip_address, device, location) => {
    const riskScore = await calculateRiskScore(username, ip_address, device, location);
    return riskScore >= 0.7 ? 'suspicious' : 'safe';
};

router.post('/', async (req, res) => {
    try {
        const { username, ip_address, location, device } = req.body;

        if (!username || !ip_address || !location || !device) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const status = await detectSuspiciousLogin(username, ip_address, device, location);
        const riskScore = await calculateRiskScore(username, ip_address, device, location);

        const newLogin = new Login({
            username,
            ip_address,
            location,
            device,
            risk_score: riskScore,
            status
        });

        await newLogin.save();
        res.status(201).json({ message: `Login recorded. Status: ${status}`, status });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.get('/', async (req, res) => {
    try {
        const logins = await Login.find().sort({ timestamp: -1 });
        res.json(logins);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;