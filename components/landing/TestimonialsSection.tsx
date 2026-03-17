import { Badge } from '@/components/ui/badge';
import {
  Star, Quote, MessageSquare, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Rahul Patil',
      role: 'Cricket Enthusiast',
      content:
        'OutFyld has completely changed how we book cricket grounds. No more calling multiple places - everything is available at one click!',
      rating: 5,
      location: 'Sangli',
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      name: 'Priya Deshmukh',
      role: 'Football Player',
      content:
        'As a working professional, I love the convenience of booking turfs online. The payment system is secure and the notifications keep me updated.',
      rating: 5,
      location: 'Miraj',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      name: 'Sunil Kadam',
      role: 'Turf Owner',
      content:
        'Managing bookings was a nightmare before OutFyld. Now everything is automated and I can focus on maintaining the facility quality.',
      rating: 5,
      location: 'Sangli',
      gradient: 'from-teal-500 to-cyan-500',
    },
  ];

  // Stats for the trust bar
  const stats = [
    { value: '500+', label: 'Happy Players' },
    { value: '4.8', label: 'Avg. Rating' },
    { value: '98%', label: 'Satisfaction' },
    { value: '50+', label: 'Turfs Trust Us' },
  ];

  return (
    <section className="py-20 bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="text-center mb-14">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] mb-4">
            <MessageSquare className="h-3 w-3 mr-1" />
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            What Our Community Says
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Join hundreds of satisfied players and turf owners who have transformed
            their sports experience with OutFyld.
          </p>
        </div>

        {/* ── Testimonial Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => {
            const initials = testimonial.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('');

            return (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 flex flex-col"
              >
                {/* Quote icon + Stars */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Quote className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="pt-5 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {initials}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {testimonial.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">
                          {testimonial.role}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-[11px] text-emerald-600 flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {testimonial.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Trust Stats Bar ── */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
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