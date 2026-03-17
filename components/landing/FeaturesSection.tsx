import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CreditCard,
  Bell,
  Star,
  Shield,
  Smartphone,
  MapPin,
  Clock,
  Zap,
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Calendar,
      title: 'Real-time Booking',
      description: 'Check availability and book instantly with live slot updates and automated confirmations.',
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Multiple payment options including UPI, cards, and wallets with secure processing.',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get SMS and email reminders for bookings, cancellations, and special offers.',
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      icon: Star,
      title: 'Reviews & Ratings',
      description: 'Read authentic reviews and ratings from other players to choose the best turfs.',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Shield,
      title: 'Booking Protection',
      description: 'Guaranteed refunds for cancellations and protection against booking conflicts.',
      gradient: 'from-emerald-600 to-green-700',
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Fully responsive design that works perfectly on all devices and screen sizes.',
      gradient: 'from-green-600 to-teal-600',
    },
    {
      icon: MapPin,
      title: 'Location-based Search',
      description: 'Find turfs near you with accurate location and directions.',
      gradient: 'from-teal-600 to-cyan-600',
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Book for any duration with flexible time slots and seasonal pricing options.',
      gradient: 'from-cyan-600 to-blue-600',
    },
  ];

  return (
    <section className="py-20 bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="text-center mb-14">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Platform Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Why Choose OutFyld?
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            We&apos;ve built the most comprehensive turf booking platform with features
            that make sports facility booking effortless.
          </p>
        </div>

        {/* ── Feature Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-[15px] mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className="mt-5 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-1 rounded-full bg-gradient-to-r ${feature.gradient} group-hover:w-10 transition-all duration-300`}
                    />
                    <span className="text-[11px] text-gray-300 font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Learn more
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom Stats Bar ── */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '<2s', label: 'Booking Speed' },
              { value: '24/7', label: 'Support' },
              { value: '256-bit', label: 'Encryption' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {stat.value}
                </div>
                <p className="text-emerald-200 text-xs sm:text-sm mt-1 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}