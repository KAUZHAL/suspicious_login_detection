import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LoginForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        location: '',
        failedAttempts: 0
    });

    const [logins, setLogins] = useState([]);
    const [message, setMessage] = useState('');
    const [otpEmail, setOtpEmail] = useState('');
    const [otpMessage, setOtpMessage] = useState('');

    useEffect(() => {
        fetchLoginData();
    }, []);

    const fetchLoginData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/login');
            setLogins(res.data);
        } catch (err) {
            console.error("Error fetching login history:", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Submitting form data:", formData);
            const res = await axios.post('http://localhost:5000/login', formData);
            if (res.data.suspicious) {
                setMessage("Suspicious login detected! Admin has been notified.");
            } else {
                setMessage("Login recorded successfully.");
            }
            fetchLoginData();
        } catch (err) {
            console.error("Error submitting data:", err.response || err.message);
            setMessage(err.response?.data?.message || "Error submitting data");
        }
    };

    const handleOtpChange = (e) => {
        setOtpEmail(e.target.value);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            console.log("Sending OTP to:", otpEmail);
            const res = await axios.post('http://localhost:5000/send-otp', { email: otpEmail });
            setOtpMessage(res.data.message || "OTP sent successfully.");
        } catch (err) {
            console.error("Error sending OTP:", err.response || err.message);
            setOtpMessage(err.response?.data?.message || "Error sending OTP");
        }
    };

    return (
        <div>
            <h2>Login Form</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="failedAttempts"
                    placeholder="Failed Attempts"
                    value={formData.failedAttempts}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Submit</button>
            </form>
            <p>{message}</p>

            <h3>Send OTP</h3>
            <form onSubmit={handleSendOtp}>
                <input
                    type="email"
                    placeholder="Enter email to send OTP"
                    value={otpEmail}
                    onChange={handleOtpChange}
                    required
                />
                <button type="submit">Send OTP</button>
            </form>
            <p>{otpMessage}</p>

            <h3>Login History</h3>
            <table border="1">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>IP Address</th>
                        <th>Location</th>
                        <th>Failed Attempts</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {logins.map((login, index) => (
                        <tr
                            key={index}
                            style={{
                                backgroundColor: login.status === 'suspicious' ? 'red' : 'white'
                            }}
                        >
                            <td>{login.username}</td>
                            <td>{login.ip_address}</td>
                            <td>{login.location}</td>
                            <td>{login.failedAttempts}</td>
                            <td>{login.risk_score}</td>
                            <td>{login.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LoginForm;