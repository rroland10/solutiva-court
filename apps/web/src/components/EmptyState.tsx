import { Icon, type IconName } from "./icons";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  featured?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action, featured = false }: EmptyStateProps) {
  return (
    <div className={featured ? "card-featured card-body-spacious" : "card card-body-spacious"}>
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 ring-1 shadow-luxury ${
        featured
          ? "bg-gold/15 text-gold-dark ring-gold/30"
          : "bg-primary/10 text-primary ring-primary/20"
      }`}>
        <Icon name={icon} size="lg" />
      </div>
      <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-800 text-base max-w-md mx-auto mb-6 leading-relaxed font-medium">{description}</p>
      {action && (
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
