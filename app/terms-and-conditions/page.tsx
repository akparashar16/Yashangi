/**
 * Terms & Conditions Page
 * Displays the terms and conditions for using the platform
 */

'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="container" style={{ padding: '90px 1px 100px 1px' }}>
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h1>Term & Condition</h1>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <Link href="/" className="btn btn-outline-primary">
            <i className="fa fa-arrow-left me-2"></i>Back to Home
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <p style={{ textAlign: 'justify', lineHeight: '1.8' }}>
            This document is an electronic record in terms of the Information Technology Act, 2000, and the rules there under as applicable, as well as the amended provisions about electronic records in various statutes as amended by the Information Technology Act, 2000. A computer system generates this electronic record and does not require any physical or digital signatures.
            <br /><br />
            This document is published by the provisions of Rule 3 (1) of the Information Technology (Intermediaries guidelines) Rules, 2011 that require publishing the rules and regulations, privacy policy, and Terms of Use for access or usage of domain name https://yashangi.com/ ('Website'), including the related mobile site and mobile application (hereinafter referred to as 'Platform').
            <br /><br />
            The Platform is owned by b, a company incorporated under the Companies Act, of 1956 with its registered office at 25, 1st Floor , Moji Vihar, Kalyanpura,Sanganer ,JAIPUR 302020
            <br /><br />
            Your use of the Platform and services and tools are governed by the following terms and conditions as applicable to the Platform including the applicable policies which are incorporated herein by way of reference. If You transact on the Platform, You shall be subject to the policies that apply to the Platform for such transactions. By mere use of the Platform, You shall contract with the Platform Owner and these terms and conditions including the policies constitute Your binding obligations, with the Platform Owner. These Terms of Use relate to your use of our website, goods (as applicable), or services (as applicable) (collectively, 'Services'). Any terms and conditions proposed by You which are in addition to or which conflict with these Terms of Use are expressly rejected by the Platform Owner and shall be of no force or effect.
            <br /><br />
            These Terms of Use can modified at any time without assigning any reason. It is your responsibility to periodically review these Terms of Use to stay informed of updates. For these Terms of Use, wherever the context so requires, Shall mean any natural or legal person who has agreed to become a user/buyer on the Platform.
            <br /><br />
            <strong>ACCESSING, BROWSING, OR OTHERWISE USING THE PLATFORM INDICATES YOUR AGREEMENT TO ALL THE TERMS AND CONDITIONS UNDER THESE TERMS OF USE, SO PLEASE READ THE TERMS OF USE CAREFULLY BEFORE PROCEEDING.</strong>
            <br /><br />
            The use of the Platform and/or availing of our Services is subject to the following Terms of Use: To access and use the Services, you agree to provide true, accurate, and complete information to us during and after registration, and you shall be responsible for all acts done through the use of our registered account on the Platform.
            <br /><br />
            Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness, or suitability of the information and materials offered on this website or through the Services, for any specific purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
            <br /><br />
            Your use of our Services and the Platform is solely and entirely at your own risk and discretion for which we shall not be liable to you in any manner. You are required to independently assess and ensure that the Services meet your requirements.
            <br /><br />
            The contents of the Platform and the Services are proprietary to us and are licensed to us. You will not have any authority to claim any intellectual property rights, title, or interest in its contents. The contents included are not limited to the design, layout, look, and graphics.
            <br /><br />
            You acknowledge that unauthorized use of the Platform and/or the Services may lead to action against you as per these Terms of Use and/or applicable laws. You agree to pay us the charges associated with availing the Services. You agree not to use the Platform and/ or Services for any purpose that is unlawful, illegal, or forbidden by these Terms, or Indian or local laws that might apply to you.
            <br /><br />
            You agree and acknowledge that the website and the Services may contain links to other third-party websites. On accessing these links, you will be governed by the terms of use, privacy policy, and other policies of such third-party websites. These links are provided for your convenience and further information. You understand that upon initiating a transaction for availing of the Services you are entering into a legally binding and enforceable contract with the Platform Owner for the Services.
            <br /><br />
            You shall indemnify and hold harmless the platform Owner, its affiliates, group companies (as applicable) and their respective officers, directors, agents, and employees, from any claim demand, or actions including reasonable attorney's fees, made by any third-party or penalty imposed due to or arising out of Your breach of this Terms of Use, Privacy Policy, and other Policies, or Your violation of any law, rules or regulations, or rights (including infringement of intellectual property rights) of a third party. Notwithstanding anything contained in these Terms of Use, the parties shall not be liable for any failure to perform an obligation under these Terms if performance is prevented or delayed by a force majeure event. These Terms and any dispute or claim relating to it, or its enforceability, shall be governed by and construed by the laws of India. All disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of India. All concerns or communications relating to these Terms must be communicated to us using the contact information provided on this website.
          </p>
        </div>
      </div>
    </div>
  );
}
