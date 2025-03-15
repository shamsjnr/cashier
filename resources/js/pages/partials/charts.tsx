import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const Chart = ({data}: {data:object[]}) => {

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                width={500}
                height={400}
                data={data}
                margin={{
                    left: 30,
                    right: 20,
                    top: 20,
                    bottom: 10,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={tick => { return tick.toLocaleString(); }} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" />
            </LineChart>
        </ResponsiveContainer>
    );
}
