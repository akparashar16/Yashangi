/**
 * Footer Component
 * Footer matching ECommerce.Web design
 */

'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <>
      <footer className="bg-dark-purple pb-0 border-0">
        <div className="footer-main nav-folderized">
          <div className="container-fluid">
            <div className="row">
              <div className="col nav">
                <h6>YASHANGI</h6>
                <ul className="list-unstyled ico_liNk">
                  <li>Your modern clothing destination.<br /><br /></li>
                  <li>
                    <ul className="Social_footer">
                      <li>
                        <a className="fb_bg" href="#" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-facebook-f"></i>
                        </a>
                      </li>
                      <li>
                        <a className="insta_bg" target="_blank" href="https://www.instagram.com/yashangi.in/" rel="noopener noreferrer">
                          <i className="fab fa-instagram"></i>
                        </a>
                      </li>
                      <li>
                        <a className="tw_bg" href="#" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-twitter"></i>
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div className="col nav">
                <h6>Company links</h6>
                <ul className="list-unstyled mb-0">
                  <li>
                    <Link title="Home" href="/">Home</Link>
                  </li>
                  <li>
                    <a title="Products" href="#">Products</a>
                  </li>
                  <li>
                    <Link title="Cart" href="/cart">Cart</Link>
                  </li>
                </ul>
              </div>
              <div className="col nav">
                <h6>Information</h6>
                <ul className="list-unstyled mb-0 ico_liNk">
                  <li>
                    <Link href="/terms">Term & Condition</Link>
                  </li>
                  <li>
                    <Link href="/privacy">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link href="/return">Return and Refund Policy</Link>
                  </li>
                  <li>
                    <Link href="/shipping">Shipping Policy</Link>
                  </li>
                </ul>
              </div>
              <div className="col nav">
                <h6>For Updates & offers</h6>
                <ul className="list-unstyled mb-0 ico_liNk">
                  <li>Subscribe to receive updates, access to exclusive deals, and more.</li>
                  <li>
                    <div className="mc4wp-form-fields">
                      <form className="signup-newsletter-form row g-0 pr oh">
                        <div className="col col_email">
                          <input
                            type="email"
                            name="contact[email]"
                            placeholder="Your email address"
                            className="tc tl_md input-text"
                            required
                          />
                        </div>
                        <div className="col-auto">
                          <button type="submit" className="btn_new_icon_false w__100 submit-btn truncate">
                            <span>
                              <div className="fa fa-paper-plane"></div>
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="copy_right">
          <div className="container">
            <div className="row d-flex align-items-center">
              <div className="col-lg-6 col-md-8">
                <p className="m-0 CoPy_P">
                  Copyright © 2022 <a href="#">yashangi.com</a> All Rights Reserved.
                </p>
                <p>
                  Designed  & Developed By Notchuptech.com
              
                </p>
              </div>
              <div className="col-lg-6 col-md-4 text-end">
                {/* Payment icons would go here */}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      {/* <section className="phono">
        <a
          href="https://api.whatsapp.com/send?phone=15551234567"
          target="_blank"
          rel="noopener noreferrer"
          className="btn_call_fix"
        >
          <i className="fa fa-whatsapp" aria-hidden="true"></i>
        </a>
      </section> */}
    </>
  );
};

export default Footer;

