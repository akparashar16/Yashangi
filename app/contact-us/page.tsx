/**
 * Contact Us Page
 * Allows users to contact the business with inquiries
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactUsPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Implement API call to send contact form
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logininner_main">
      <div className="container">
        <div className="row">
          <div className="col-12 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="carth2">Contact Us</h2>
              <Link href="/" className="btn btn-outline-primary">
                <i className="fa fa-arrow-left me-2"></i>Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Contact Information */}
          <div className="col-lg-4 col-md-5 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fa fa-info-circle me-2"></i>Get in Touch
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="fa fa-building me-2"></i>Business Information
                  </h6>
                  <p className="mb-2">
                    <strong>Business Name:</strong><br />
                    Yashi Fashion
                  </p>
                  <p className="mb-2">
                    <strong>GST Number:</strong><br />
                    08GBOPP4915G1Z6
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="fa fa-map-marker me-2"></i>Address
                  </h6>
                  <p className="mb-0">
                    Kalyanpura Sanganer, Jaipur<br />
                    302020 Jaipur, RJ, India
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="fa fa-phone me-2"></i>Phone
                  </h6>
                  <p className="mb-0">
                    <a href="tel:+919376633049" className="text-decoration-none">
                      +91 9376633049
                    </a>
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="fa fa-envelope me-2"></i>Email
                  </h6>
                  <p className="mb-0">
                    <a href="mailto:yashifashion23@gmail.com" className="text-decoration-none">
                      yashifashion23@gmail.com
                    </a>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <h6 className="text-primary mb-3">
                    <i className="fa fa-clock-o me-2"></i>Business Hours
                  </h6>
                  <p className="mb-1"><strong>Monday - Saturday:</strong></p>
                  <p className="mb-1">10:00 AM - 8:00 PM</p>
                  <p className="mb-0"><strong>Sunday:</strong> Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="col-lg-8 col-md-7">
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="fa fa-paper-plane me-2"></i>Send us a Message
                </h5>
              </div>
              <div className="card-body">
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="fa fa-check-circle me-2"></i>
                    <strong>Success!</strong> Your message has been sent successfully. We'll get back to you soon.
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSuccess(false)}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="fa fa-exclamation-circle me-2"></i>
                    <strong>Error!</strong> {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError('')}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="Enter your phone number"
                        pattern="[0-9]{10}"
                        maxLength={10}
                      />
                      <small className="form-text text-muted">Enter 10-digit phone number</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="subject" className="form-label">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="order">Order Related</option>
                        <option value="product">Product Information</option>
                        <option value="shipping">Shipping & Delivery</option>
                        <option value="return">Returns & Refunds</option>
                        <option value="complaint">Complaint</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="message" className="form-label">
                      Message <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Enter your message here..."
                      style={{ resize: 'vertical' }}
                    ></textarea>
                    <small className="form-text text-muted">
                      Please provide as much detail as possible
                    </small>
                  </div>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          subject: '',
                          message: '',
                        });
                        setError('');
                        setSuccess(false);
                      }}
                    >
                      <i className="fa fa-times me-2"></i>Clear
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-paper-plane me-2"></i>Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Additional Information */}
            <div className="card shadow-sm mt-4">
              <div className="card-body">
                <h6 className="text-primary mb-3">
                  <i className="fa fa-question-circle me-2"></i>Frequently Asked Questions
                </h6>
                <div className="accordion" id="faqAccordion">
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#faq1"
                      >
                        How can I track my order?
                      </button>
                    </h2>
                    <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        You can track your order by visiting the "My Orders" page after logging in. You'll receive tracking information via email once your order is shipped.
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#faq2"
                      >
                        What is your return policy?
                      </button>
                    </h2>
                    <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        We accept returns within 7 days of delivery. Items must be unused, unwashed, and in original packaging with tags attached. Please contact us for return authorization.
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#faq3"
                      >
                        How long does shipping take?
                      </button>
                    </h2>
                    <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        Standard shipping typically takes 5-7 business days. Express shipping options are available at checkout for faster delivery.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
