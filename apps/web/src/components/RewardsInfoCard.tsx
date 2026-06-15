import { Icon } from "./icons";

const rewards = [
  { action: "First vote on a case", reward: "+10 AVF, +1 trust" },
  { action: "Case resolved (per voter)", reward: "+25 AVF" },
  { action: "Majority-side bonus", reward: "+5 AVF" },
];

export function RewardsInfoCard() {
  return (
    <div className="card">
      <div className="card-header">
        <Icon name="coins" size="sm" className="text-gold" />
        <h3>AVF Rewards</h3>
      </div>
      <ul className="card-body space-y-3 text-sm">
        {rewards.map((item) => (
          <li key={item.action} className="flex justify-between gap-4">
            <span className="text-gray-800 font-semibold">{item.action}</span>
            <span className="font-semibold text-primary-dark shrink-0">{item.reward}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
