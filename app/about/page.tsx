'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Users, Star, Clock, Activity } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

// About Page - OutFyld
// Single-file React component (Next.js app router compatible)
// Uses the same UI primitives as your dashboards (Card, Button, Badge)
// Replace dummy text/images with real content as needed.

export default function AboutPage() {
  const stats = [
    { id: 1, label: 'Turfs listed', value: '142' },
    { id: 2, label: 'Bookings/month', value: '4.1k' },
    { id: 3, label: 'Avg. rating', value: '4.6 ⭐' },
    { id: 4, label: 'Cities', value: '12' }
  ];

  const features = [
    { id: 1, title: 'Easy Booking', desc: 'Find and reserve turf slots in seconds with smart availability and instant confirmation.' },
    { id: 2, title: 'Owner Dashboard', desc: 'Owners can manage turfs, view bookings, verify payments and export reports.' },
    { id: 3, title: 'Secure Payments', desc: 'Integrated payment gateways and optional manual proof upload for local transfers.' },
    { id: 4, title: 'Smart Pricing', desc: 'Set dynamic pricing, add buffers and manage peak-hour rates.' }
  ];

  const team = [
    { id: 1, name: 'Ankan Jagtap', role: 'Founder & CTO', bio: 'Full‑stack developer focused on reliable backend systems and simple UX.' },
    { id: 2, name: 'Madhuri Jagtap', role: 'Head of Operations', bio: 'Operations & partnerships — keeps turfs happy and schedules sane.' },
    { id: 3, name: 'Sahil Patil', role: 'Product Designer', bio: 'Designs pixel-perfect admin and player experiences.' }
  ];

  const faqs = [
    { q: 'How do I list my turf?', a: 'Owners can sign up, go to the Owner Dashboard → Add Turf, fill details and set availability. Photos and bank details can be added in Settings.' },
    { q: 'What payment methods are supported?', a: 'We support Razorpay and Stripe. For local transfers, players can upload payment screenshots which owners verify manually.' },
    { q: 'How does cancellation work?', a: 'Cancellation policy is set per turf. Refunds are processed via the payment gateway or manually by owner request.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <LandingHeader />
      

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-10">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-3">We make playing together easy.</h2>
            <p className="text-gray-600 mb-6">OutFyld helps players discover local turfs, book reliable slots, and lets turf owners manage availability and earnings with confidence.</p>

            <div className="flex gap-3 mb-6">
              <Button className="inline-flex items-center" size="lg">Get Started</Button>
              <Button variant="outline" className="inline-flex items-center" size="lg">Contact Sales</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(s => (
                <Card key={s.id} className="p-4">
                  <CardContent>
                    <div className="text-sm text-gray-500">{s.label}</div>
                    <div className="text-2xl font-semibold mt-1">{s.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
              <CardDescription>Make local sports accessible and easy to organize.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">We believe in creating a simple platform where players find great places to play, and owners can grow their business without the headache of manual bookings and calls.</p>
              <Separator className="my-4" />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-indigo-600"/> Community-first approach</div>
                <div className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-indigo-600"/> Fast & dependable booking</div>
                <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-indigo-600"/> 24/7 support for owners</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">What we offer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(f => (
              <Card key={f.id} className="p-4">
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">{f.title.split(' ').map(w => w[0]).slice(0,2).join('')}</div>
                    <div>
                      <div className="font-medium">{f.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{f.desc}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Team & Testimonials */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold mb-4">Meet the team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {team.map(member => (
                <Card key={member.id} className="p-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto flex items-center justify-center text-xl font-semibold text-gray-700">{member.name.split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                  <div className="mt-3 font-medium">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.role}</div>
                  <p className="text-sm text-gray-600 mt-2">{member.bio}</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">What users say</h3>
            <Card className="p-4">
              <CardContent>
                <div className="text-sm text-gray-700">"Found my regular spot in 2 minutes — booking is so simple and the owners respond fast. Highly recommend!"</div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm font-medium">— S. Kulkarni</div>
                  <div className="flex items-center gap-2 text-sm text-yellow-500"><Star className="h-4 w-4"/>4.8</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4 mt-4">
              <CardContent>
                <div className="text-sm text-gray-700">"Managing multiple turfs used to be a nightmare. The owner dashboard saved us time and doubled our repeat bookings."</div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm font-medium">— R. Desai (Owner)</div>
                  <div className="flex items-center gap-2 text-sm text-yellow-500"><Star className="h-4 w-4"/>4.6</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ & Contact */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-4">Frequently asked</h3>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <Card key={i} className="p-4">
                  <CardContent>
                    <div className="font-medium">{f.q}</div>
                    <div className="text-sm text-gray-600 mt-1">{f.a}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Contact us</h3>
            <Card className="p-4">
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded"><Mail className="h-5 w-5 text-indigo-600"/></div>
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-gray-600">admin@outfyld.in</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded"><Phone className="h-5 w-5 text-indigo-600"/></div>
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-sm text-gray-600">+91 7058526196</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded"><MapPin className="h-5 w-5 text-indigo-600"/></div>
                  <div>
                    <div className="font-medium">Office</div>
                    <div className="text-sm text-gray-600">Walchand College of Engineering, Sangli</div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button className="w-full">Get in touch</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-white p-6 rounded shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-lg">Ready to host or play?</h4>
              <p className="text-sm text-gray-600">Create an owner account to list your turf or browse available slots in your city.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/owner/register"><Button>Become an owner</Button></Link>
              <Link href="/browse"><Button variant="outline">Browse turfs</Button></Link>
            </div>
          </div>
        </section>

        <div className="text-xs text-gray-400 mt-6">Surprising fact: The first widely used synthetic turf (AstroTurf) was installed in 1966 in the Houston Astrodome. 🏟️</div>
      </main>
      
      <Footer />
    </div>
  );
}
