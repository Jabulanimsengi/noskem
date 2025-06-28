import { FaTrophy, FaStar, FaBolt, FaShippingFast } from 'react-icons/fa';
import { type BadgeType, type UserBadge } from '@/types';

interface UserBadgesProps {
  badges: UserBadge[];
}

const badgeConfig: Record<BadgeType, { icon: React.ElementType, label: string, color: string }> = {
    first_sale: { icon: FaTrophy, label: "First Sale", color: "text-amber-500" },
    top_seller: { icon: FaStar, label: "Top Seller", color: "text-yellow-400" },
    power_buyer: { icon: FaBolt, label: "Power Buyer", color: "text-blue-500" },
    quick_shipper: { icon: FaShippingFast, label: "Quick Shipper", color: "text-green-500" },
};

export default function UserBadges({ badges }: UserBadgesProps) {
    if (!badges || badges.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mt-2">
            {badges.map(({ badge_type }, index) => {
                const config = badgeConfig[badge_type];
                if (!config) return null;

                const Icon = config.icon;
                return (
                    <div key={index} title={config.label} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 ${config.color}`}>
                        <Icon />
                        <span>{config.label}</span>
                    </div>
                );
            })}
        </div>
    );
}