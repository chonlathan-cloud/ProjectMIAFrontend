import { Check, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { tierFeatures } from '@/lib/plans';
import { toast } from 'sonner';

export function Settings() {
  const { user, setUser } = useStore();

  const handleUpgrade = (tier: 'starter' | 'growth' | 'enterprise') => {
    if (user) {
      setUser({ ...user, tier });
      toast.success(`อัพเกรดเป็นแพ็คเกจ ${tierFeatures[tier].name} สำเร็จ!`);
    }
  };

  const tiers = [
    {
      id: 'starter' as const,
      name: tierFeatures.starter.name,
      price: tierFeatures.starter.price,
      features: tierFeatures.starter.features,
      icon: Zap,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900',
      borderColor: 'border-gray-200 dark:border-gray-800',
    },
    {
      id: 'growth' as const,
      name: tierFeatures.growth.name,
      price: tierFeatures.growth.price,
      features: tierFeatures.growth.features,
      icon: Crown,
      color: 'text-line',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-line',
      popular: true,
    },
    {
      id: 'enterprise' as const,
      name: tierFeatures.enterprise.name,
      price: tierFeatures.enterprise.price,
      features: tierFeatures.enterprise.features,
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ตั้งค่า</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">จัดการแพ็คเกจและการตั้งค่าบัญชี</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>แพ็คเกจปัจจุบัน</CardTitle>
          <CardDescription>คุณกำลังใช้งานแพ็คเกจ {tierFeatures[user?.tier || 'starter'].name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-line rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{tierFeatures[user?.tier || 'starter'].name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ฿{tierFeatures[user?.tier || 'starter'].price.toLocaleString()}/เดือน
                </p>
              </div>
            </div>
            <Badge className="bg-line text-white">ใช้งานอยู่</Badge>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">เลือกแพ็คเกจ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentTier = user?.tier === tier.id;

            return (
              <Card
                key={tier.id}
                className={`relative ${tier.borderColor} ${
                  tier.popular ? 'border-2 shadow-lg' : ''
                } ${isCurrentTier ? 'border-2' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-line text-white">แนะนำ</Badge>
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white">แพ็คเกจปัจจุบัน</Badge>
                  </div>
                )}
                <CardHeader className={tier.bgColor}>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <Icon className={`w-8 h-8 ${tier.color}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {tier.price === 0 ? 'ฟรี' : `฿${tier.price.toLocaleString()}`}
                    </span>
                    {tier.price > 0 && <span className="text-gray-500">/เดือน</span>}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-line flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isCurrentTier}
                    className={`w-full ${
                      isCurrentTier
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-line hover:bg-line-dark'
                    }`}
                  >
                    {isCurrentTier ? 'ใช้งานอยู่' : tier.price === 0 ? 'ดาวน์เกรด' : 'อัพเกรด'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลบัญชี</CardTitle>
          <CardDescription>ข้อมูลส่วนตัวของคุณ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ชื่อ</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">อีเมล</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">แพ็คเกจ</p>
              <p className="font-medium">{tierFeatures[user?.tier || 'starter'].name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">สถานะ</p>
              <Badge className="bg-green-600 text-white">ใช้งานอยู่</Badge>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <Button variant="outline">แก้ไขข้อมูล</Button>
            <Button variant="outline">เปลี่ยนรหัสผ่าน</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>การชำระเงิน</CardTitle>
          <CardDescription>ประวัติการชำระเงินและบิล</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <p className="font-medium">วันที่ 1 พ.ย. 2025</p>
                <p className="text-sm text-gray-500">Growth Plan</p>
              </div>
              <div className="text-right">
                <p className="font-medium">฿1,990</p>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ชำระแล้ว
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <p className="font-medium">วันที่ 1 ต.ค. 2025</p>
                <p className="text-sm text-gray-500">Growth Plan</p>
              </div>
              <div className="text-right">
                <p className="font-medium">฿1,990</p>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ชำระแล้ว
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            ดูประวัติทั้งหมด
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
