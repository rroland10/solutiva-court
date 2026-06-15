import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-luxury dark:bg-gradient-luxury-dark bg-fixed flex flex-col items-center justify-center px-4 text-center">
      <div className="app-layer card-featured card-body-spacious max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/15 text-gold-dark mb-5 ring-1 ring-gold/30 shadow-luxury">
          <Icon name="gavel" size="xl" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-800 text-base mb-8 leading-relaxed font-medium">
          The page you requested does not exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary inline-flex items-center justify-center gap-2">
            <Icon name="dashboard" size="sm" className="text-white" />
            Go to Dashboard
          </Link>
          <Link href="/disputes" className="btn-outline inline-flex items-center justify-center gap-2">
            <Icon name="disputes" size="sm" />
            Browse Cases
          </Link>
        </div>
      </div>
    </div>
  );
}
