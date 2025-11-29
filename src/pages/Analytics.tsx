import { Users, Send, MousePointerClick, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAnalytics } from '@/lib/mockData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const stats = [
    {
      title: 'ผู้ติดตามทั้งหมด',
      value: mockAnalytics.totalFollowers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      change: '+12.5%',
      changeType: 'increase',
    },
    {
      title: 'ข้อความที่ส่ง',
      value: mockAnalytics.messagesSent.toLocaleString(),
      icon: Send,
      color: 'text-line',
      bgColor: 'bg-green-50 dark:bg-green-950',
      change: '+8.2%',
      changeType: 'increase',
    },
    {
      title: 'อัตราการคลิก',
      value: `${mockAnalytics.clickRate}%`,
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      change: '+3.1%',
      changeType: 'increase',
    },
    {
      title: 'รายได้จาก Line',
      value: `฿${mockAnalytics.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      change: '+15.8%',
      changeType: 'increase',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">รายงานสถิติ</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">วิเคราะห์ผลการดำเนินงานของคุณ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">
                {stat.change} จากเดือนที่แล้ว
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>จำนวนผู้ติดตาม</CardTitle>
            <CardDescription>การเติบโตของผู้ติดตามในรอบ 6 เดือน</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockAnalytics.followersTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  stroke="currentColor"
                />
                <YAxis
                  className="text-xs"
                  stroke="currentColor"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#00B900"
                  strokeWidth={2}
                  dot={{ fill: '#00B900', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ข้อความตามประเภท</CardTitle>
            <CardDescription>จำนวนข้อความแยกตามประเภท</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockAnalytics.messagesByType}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis
                  dataKey="type"
                  className="text-xs"
                  stroke="currentColor"
                />
                <YAxis
                  className="text-xs"
                  stroke="currentColor"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#00B900"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engagement ตามวัน</CardTitle>
          <CardDescription>อัตราการมีส่วนร่วมของผู้ใช้แยกตามวัน</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockAnalytics.engagementByDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis
                dataKey="day"
                className="text-xs"
                stroke="currentColor"
              />
              <YAxis
                className="text-xs"
                stroke="currentColor"
                label={{ value: '%', position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>อัตราการเปิดอ่าน</CardTitle>
            <CardDescription>Open Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-line mb-2">71%</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                สูงกว่าค่าเฉลี่ย 15%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>อัตราการตอบกลับ</CardTitle>
            <CardDescription>Response Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-line mb-2">45%</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                สูงกว่าค่าเฉลี่ย 8%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เวลาตอบกลับเฉลี่ย</CardTitle>
            <CardDescription>Avg Response Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-line mb-2">2.5 ชม.</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                เร็วกว่าค่าเฉลี่ย 30%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
