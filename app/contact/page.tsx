'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Clock, Facebook, Twitter, Linkedin, CheckCircle } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departments = ['General', 'Sales', 'Support', 'Partnerships', 'Media'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.message) {
      setError('Please fill name, email and message');
      return;
    }

    setSubmitting(true);
    setSubmitted(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setForm({ name: '', email: '', phone: '', subject: 'General', message: '' });
      } else {
        setError(data.error || 'Failed to send message. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  const company = {
    name: 'OutFyld',
    email: 'admin@outfyld.in',
    phone: '+91 7058526196',
    address: 'Walchand College of Engineering, Sangli, Maharashtra, India',
  };

  const team = [
    { id: 1, name: 'Support Team', email: 'admin@outfyld.in', phone: '+91 7058526196', hours: '9:00 AM – 6:00 PM' },
    { id: 2, name: 'Sales & Partnerships', email: 'admin@outfyld.in', phone: '+91 7058526196', hours: '10:00 AM – 6:00 PM' },
    { id: 3, name: 'Technical Support', email: 'admin@outfyld.in', phone: '+91 7058526196', hours: 'Mon–Fri 9:00 AM – 6:00 PM' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <LandingHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact OutFyld</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help — choose a department or send us a message.
          </p>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="p-6 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600 mb-6">
                      Thanks — your message was sent. We'll reply within 24 hours.
                    </p>
                    <Button onClick={() => setSubmitted(false)} className="bg-green-500 hover:bg-green-600">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9XXXXXXXXX" />
                      </div>
                      <div>
                        <Label htmlFor="subject">Department</Label>
                        <select 
                          id="subject" 
                          title="Select department"
                          className="w-full mt-1 p-2 border rounded" 
                          value={form.subject} 
                          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        >
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us what's up" rows={6} required />
                    </div>

                    {error && <div className="text-sm text-red-600 p-3 bg-red-50 rounded">{error}</div>}
                    {submitted && <div className="text-sm text-green-600 p-3 bg-green-50 rounded">Thanks — your message was sent. We'll reply within 24 hours.</div>}

                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={submitting} className="bg-green-500 hover:bg-green-600">
                        {submitting ? 'Sending...' : 'Send message'}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => { 
                          setForm({ name: '', email: '', phone: '', subject: 'General', message: '' }); 
                          setError(null); 
                          setSubmitted(false); 
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded"><Mail className="h-5 w-5 text-green-600"/></div>
                  <div>
                    <div className="font-medium">Email</div>
                    <a href={`mailto:${company.email}`} className="text-sm text-gray-600 hover:text-green-600">{company.email}</a>
                  </div>
                </div>
              </Card>

              <Card className="p-4 shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded"><Phone className="h-5 w-5 text-green-600"/></div>
                  <div>
                    <div className="font-medium">Phone</div>
                    <a href={`tel:${company.phone}`} className="text-sm text-gray-600 hover:text-green-600">{company.phone}</a>
                  </div>
                </div>
              </Card>

              <Card className="p-4 shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded"><MapPin className="h-5 w-5 text-green-600"/></div>
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-sm text-gray-600">{company.address}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded"><Clock className="h-5 w-5 text-green-600"/></div>
                  <div>
                    <div className="font-medium">Business hours</div>
                    <div className="text-sm text-gray-600">Mon – Fri: 09:00 AM – 6:00 PM<br/>Sat: 10:00 AM – 2:00 PM<br/>Sun: Closed</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Support team</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {team.map(member => (
                  <Card key={member.id} className="p-4 shadow">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.hours}</div>
                    <a href={`mailto:${member.email}`} className="text-sm text-gray-600 hover:text-green-600 mt-2 block">{member.email}</a>
                    <a href={`tel:${member.phone}`} className="text-sm text-gray-600 hover:text-green-600">{member.phone}</a>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="p-4 shadow-lg">
              <CardHeader>
                <CardTitle>Quick contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">Need urgent help? Call our helpline or email us. We aim to reply within 24 hours for general inquiries and 2 hours for urgent support.</div>
                <Separator className="my-3"/>
                <div className="text-sm"><strong>Hotline:</strong> <a href={`tel:${company.phone}`} className="text-green-600 hover:underline">{company.phone}</a></div>
                <div className="text-sm mt-1"><strong>Email:</strong> <a href={`mailto:${company.email}`} className="text-green-600 hover:underline">{company.email}</a></div>
                <div className="mt-3 flex gap-2">
                  <a href="#" aria-label="Follow on Twitter" className="p-2 rounded bg-blue-50 hover:bg-blue-100"><Twitter className="h-4 w-4 text-blue-500"/></a>
                  <a href="#" aria-label="Follow on Facebook" className="p-2 rounded bg-blue-50 hover:bg-blue-100"><Facebook className="h-4 w-4 text-blue-600"/></a>
                  <a href="#" aria-label="Follow on LinkedIn" className="p-2 rounded bg-blue-50 hover:bg-blue-100"><Linkedin className="h-4 w-4 text-blue-700"/></a>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4 shadow-lg">
              <CardHeader>
                <CardTitle>Office location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                  Map placeholder (replace with Google Maps iframe)
                </div>
                <div className="text-xs text-gray-500 mt-2">{company.address}</div>
              </CardContent>
            </Card>

            <Card className="p-4 shadow-lg">
              <CardHeader>
                <CardTitle>Press & Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">For press enquiries, reach out to <a href={`mailto:${company.email}`} className="text-green-600 hover:underline">{company.email}</a></div>
                <div className="text-sm text-gray-500 mt-2">Press kit and logos available on request.</div>
              </CardContent>
            </Card>
          </aside>
        </section>

        <div className="bg-white p-6 rounded shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Need help integrating OutFyld?</h3>
          <p className="text-sm text-gray-600 mb-4">If you run multiple turfs or a sports complex, our partnerships team can walk you through bulk onboarding and API integration.</p>
          <div className="flex gap-3">
            <Link href="/auth/register"><Button className="bg-green-500 hover:bg-green-600">Become a partner</Button></Link>
            <Button variant="outline">Contact Partnerships</Button>
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-6">Surprising fact: The first widely used artificial turf, AstroTurf, cost around $20,000 to install in 1966 — about $180k in today's dollars. 🏟️</div>
      </main>

      <Footer />
    </div>
  );
}
