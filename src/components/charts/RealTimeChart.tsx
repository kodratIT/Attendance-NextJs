import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const RealTimeChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get('/api/attendance/real-time');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    }, 60000); // Update setiap 60 detik

    return () => clearInterval(interval);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="attendance" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RealTimeChart;
