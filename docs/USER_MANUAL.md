# Betika Promotions Platform
## User Manual

**Version:** 1.0  
**Author:** Betika Product Team  
**Date:** February 10, 2026  
**Description:** Complete guide to managing promotions and campaigns on the Betika Promotions Platform

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [System Dashboard Overview](#system-dashboard-overview)
4. [Core Features](#core-features)
5. [Common User Tasks](#common-user-tasks)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)
8. [Support & Contact](#support--contact)

---

## 1. Introduction

### Purpose of the System

The **Betika Promotions Platform (BPP)** is a comprehensive campaign management system designed to help marketing teams create, manage, and track promotional campaigns across multiple markets and platforms.

### Who Should Use This Manual

This manual is designed for:
- **Marketing Managers** creating and managing promotions
- **Campaign Coordinators** monitoring promotion performance
- **Compliance Officers** reviewing promotion terms and conditions
- **Administrators** overseeing the entire promotion ecosystem

### What You Will Learn

By the end of this manual, you will be able to:
- Access and navigate the BPP system
- Create new promotional campaigns from scratch
- Configure qualification rules and reward structures
- Preview customer-facing promotion pages
- Monitor campaign performance and analytics
- Manage segments and target audiences

---

## 2. Getting Started

### Accessing the System

**Step 1:** Open your web browser (Chrome, Firefox, Safari, or Edge recommended)

**Step 2:** Navigate to the BPP URL:
```
https://bpp.betika.com
```
*(Replace with your organization's actual URL)*

### Logging In

![Login Page](../../../.gemini/antigravity/brain/e19fd128-8549-4ea8-abb6-ac93b8452d94/login_page_1770763599019.png)

**Step 1:** On the login page, you will see multiple sign-in options:
- **Email/Password** - Traditional login
- **Google SSO** - Sign in with your Google account
- **Microsoft SSO** - Sign in with your Microsoft account

**Step 2:** Choose your preferred login method:

**For Email/Password Login:**
1. Enter your registered email address
2. Enter your password
3. Click the **"Sign In"** button

**For SSO Login:**
1. Click the **"Sign in with Google"** or **"Sign in with Microsoft"** button
2. Follow the authentication prompts from your provider
3. Grant necessary permissions when requested

**Step 3:** After successful authentication, you will be redirected to the main dashboard

### Password Reset Process

If you've forgotten your password:

**Step 1:** Click the **"Forgot Password?"** link on the login page

**Step 2:** Enter your registered email address

**Step 3:** Check your email for a password reset link

**Step 4:** Click the link in the email (valid for 24 hours)

**Step 5:** Enter your new password twice to confirm

**Step 6:** Click **"Reset Password"**

**Step 7:** Return to the login page and sign in with your new password

### First-Time Setup

When you log in for the first time:

**Step 1:** You may be prompted to complete your profile:
- Full Name
- Department
- Role
- Contact Number

**Step 2:** Review and accept the Terms of Service

**Step 3:** Take a quick tour of the interface (optional but recommended)

**Step 4:** Set your notification preferences

---

## 3. System Dashboard Overview

![Dashboard Overview](../../../.gemini/antigravity/brain/e19fd128-8549-4ea8-abb6-ac93b8452d94/dashboard_overview_1770763323908.png)

### Main Dashboard Components

#### A. Sidebar Navigation (Left Panel)
- **Dashboard** - Main overview and analytics
- **Promotions** - Campaign management (highlighted in yellow when active)
- **Manual Award** - Direct bonus distribution
- **Compliance** - Regulatory review and approval
- **Experiments** - A/B testing and optimization
- **Reports** - Detailed analytics and exports

#### B. Command Center (Main Area)
The dashboard displays real-time metrics:

1. **Revenue Trends**
   - Visual graph showing revenue over time
   - Compare current vs. previous periods

2. **Cost Distribution**
   - Pie chart showing budget allocation
   - Breakdown by promotion type

3. **Active Campaigns**
   - Quick view of currently running promotions
   - Status indicators (Active, Paused, Scheduled)

4. **Performance Metrics**
   - Claims count
   - Conversion rates
   - Cost per acquisition

#### C. Top Navigation Bar
- **User Profile** - Access settings and logout
- **Notifications** - System alerts and updates
- **Help** - Quick access to support

### Understanding Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 **Active** | Promotion is currently live |
| 🟡 **Scheduled** | Promotion will start in the future |
| 🔴 **Paused** | Promotion temporarily stopped |
| ⚫ **Ended** | Promotion has completed |
| 🔵 **Draft** | Promotion not yet published |

---

## 4. Core Features

### Feature 1: Creating a New Promotion

![Promotions List](../../../.gemini/antigravity/brain/e19fd128-8549-4ea8-abb6-ac93b8452d94/promotions_list_1770763338144.png)

#### Accessing the Promotions Page

**Step 1:** Click **"Promotions"** in the left sidebar

**Step 2:** You will see a list of all existing promotions with:
- Promotion name and type
- Current status
- Target segment
- Performance stats (claims, cost, conversion)
- Active period

**Step 3:** Click the **"+ Create Promotion"** button (top right, yellow button)

---

#### Step 1: Basic Information

![Create Promotion - Basics](../../../.gemini/antigravity/brain/e19fd128-8549-4ea8-abb6-ac93b8452d94/create_promotion_basics_1770763356421.png)

**Fill in the following fields:**

1. **Promotion Name** (Required)
   - Enter a clear, descriptive name
   - Example: "Welcome Bonus 100%"
   - This is for internal use only

2. **Display Title** (Required)
   - The title customers will see
   - Example: "Get 100% Bonus on Your First Deposit!"
   - Keep it exciting and clear

3. **Description** (Required)
   - Brief explanation of the offer
   - Example: "New players receive a 100% match bonus up to KES 10,000"
   - 2-3 sentences recommended

4. **Promotion Type** (Required)
   - Select from dropdown:
     - Deposit Match
     - Free Bet
     - Cashback
     - Loyalty Reward
     - Custom

5. **Priority Level** (Optional)
   - High, Medium, or Low
   - Determines display order on customer-facing pages

**Step 4:** Click **"Next Step"** to continue

---

#### Step 2: Scope & Eligibility

![Create Promotion - Scope](../../../.gemini/antigravity/brain/e19fd128-8549-4ea8-abb6-ac93b8452d94/create_promotion_scope_1770763435954.png)

**Configure who can participate:**

1. **Target Markets** (Required)
   - Select one or more countries:
     - ☑ Kenya
     - ☑ Ghana
     - ☑ Tanzania
     - ☑ Nigeria
     - ☑ Mozambique
     - ☑ Ethiopia

2. **Platform** (Required)
   - Choose where the promotion applies:
     - ☑ Web
     - ☑ Mobile App (iOS)
     - ☑ Mobile App (Android)
     - ☑ USSD

3. **Player Segment** (Optional)
   - Choose a pre-defined segment or create custom rules
   - Options:
     - All Players
     - New Players Only
     - VIP Players
     - Dormant Players
     - Custom Segment

**Using Custom Segments:**

If you select "Custom Segment":

**Step 1:** Click **"Define Segment"**

**Step 2:** Add qualification rules:
- Player registration date
- Deposit history
- Betting activity
- Account status
- Geographic location

**Step 3:** Click **"Save as Segment"** to reuse in future campaigns

**Step 4:** Click **"Next Step"** to continue

---

#### Step 3: Qualification Rules

**Define the conditions players must meet:**

1. **Trigger Events**
   - What action activates the promotion?
   - Examples:
     - First deposit
     - Bet placement
     - Account registration
     - Specific game play

2. **Minimum Requirements**
   - Minimum deposit amount
   - Minimum odds
   - Number of selections
   - Bet type (single, multi, system)

3. **Exclusions**
   - Void bets
   - Cashed-out bets
   - Specific markets

**Example Configuration:**
```
Trigger: Player places a multi-bet
Minimum: 5 selections, each with odds ≥ 1.30
Exclusion: Void bets, cashed-out bets
```

**Step 4:** Click **"Next Step"** to continue

---

#### Step 4: Rewards Configuration

**Define what players receive:**

1. **Reward Type**
   - Bonus percentage
   - Fixed amount
   - Free bet
   - Cashback

2. **Reward Amount**
   - Enter the value or percentage
   - Example: 100% or KES 5,000

3. **Maximum Cap**
   - Set the maximum reward per player
   - Example: KES 10,000

4. **Wagering Requirements** (if applicable)
   - Rollover multiplier
   - Example: 5x bonus amount

5. **Validity Period**
   - How long the reward is valid
   - Example: 7 days from issuance

**Step 5:** Click **"Next Step"** to continue

---

#### Step 5: Schedule & Budget

**Set when the promotion runs:**

1. **Start Date & Time**
   - Select from calendar picker
   - Set exact time (24-hour format)

2. **End Date & Time**
   - Select from calendar picker
   - Set exact time (24-hour format)

3. **Budget Allocation**
   - Total budget for the campaign
   - Example: KES 500,000

4. **Daily Cap** (Optional)
   - Maximum spend per day
   - Example: KES 50,000

5. **Per-Player Cap** (Optional)
   - Maximum reward per individual player
   - Example: KES 10,000

**Step 6:** Click **"Next Step"** to continue

---

#### Step 6: Display & Messaging

**Configure how the promotion appears:**

1. **Banner Image**
   - Upload a promotional banner
   - Recommended size: 1200x400 pixels
   - Format: JPG, PNG, or WebP

2. **How It Works**
   - Add step-by-step instructions
   - Use clear, numbered points
   - Example:
     ```
     a. Register a new account
     b. Make your first deposit
     c. Receive 100% bonus instantly
     ```

3. **Terms & Conditions**
   - Add detailed terms
   - Include all legal requirements
   - Example:
     ```
     1. Offer valid for new players only
     2. Minimum deposit: KES 100
     3. Wagering requirement: 5x
     4. Bonus expires after 7 days
     ```

4. **Call-to-Action Button**
   - Button text (e.g., "Claim Now", "Get Bonus")
   - Button link/action

**Step 7:** Click **"Next Step"** to continue

---

#### Step 7: Review & Publish

**Final review before going live:**

1. **Review All Settings**
   - Check all configurations
   - Verify dates and amounts
   - Confirm target audience

2. **Preview Customer View**
   - Click **"Preview Customer View"** button
   - See exactly what players will see

![Customer Preview Mode](../../../.gemini/antigravity/brain/e19fd128-8549-4ea8-abb6-ac93b8452d94/customer_preview_mode_1770763475898.png)

3. **Compliance Check** (if required)
   - Click **"Compliance Scan"**
   - Wait for automated review
   - Address any flagged issues

4. **Save or Publish**
   - **Save Draft** - Save without publishing
   - **Publish Promotion** - Make it live immediately (if start date is now)
   - **Schedule Promotion** - Publish but activate on start date

**Step 8:** Click **"Publish Promotion"** to finalize

✅ **Success!** Your promotion is now created and will activate according to your schedule.

---

### Feature 2: Managing Existing Promotions

**From the Promotions List:**

#### Viewing Promotion Details

**Step 1:** Click on any promotion name

**Step 2:** View comprehensive details:
- Full configuration
- Real-time performance metrics
- Player participation data
- Cost tracking

#### Editing a Promotion

**Step 1:** Click the **⋮** (three dots) menu next to the promotion

**Step 2:** Select **"Edit Config"**

**Step 3:** Make your changes in the wizard

**Step 4:** Click **"Save Changes"**

⚠️ **Warning:** Some fields cannot be edited after the promotion goes live (e.g., reward type, qualification rules)

#### Pausing a Promotion

**Step 1:** Click the **⋮** menu

**Step 2:** Select **"Pause Promotion"**

**Step 3:** Confirm the action

**Result:** The promotion will immediately stop accepting new participants. Existing rewards remain valid.

#### Duplicating a Promotion

**Step 1:** Click the **⋮** menu

**Step 2:** Select **"Duplicate"**

**Step 3:** A copy is created with "(Copy)" appended to the name

**Step 4:** Edit the copy as needed

**Step 5:** Publish when ready

#### Deactivating a Promotion

**Step 1:** Click the **⋮** menu

**Step 2:** Select **"Deactivate"**

**Step 3:** Confirm the action

⚠️ **Warning:** This action cannot be undone. All active rewards will be voided.

---

### Feature 3: Customer Preview Mode

**What is Preview Mode?**

Preview Mode allows you to see exactly what customers will see when they view your promotion on the Betika website or app.

**How to Access Preview Mode:**

**Method 1: From Promotions List**

**Step 1:** Click the **⋮** menu next to any promotion

**Step 2:** Select **"Preview Customer View"**

**Method 2: From Creation Wizard**

**Step 1:** While creating or editing a promotion

**Step 2:** Click the **"Preview Customer View"** button in the footer

**What You'll See:**

The preview shows:
- Betika-branded header and navigation
- Promotion hero banner
- "How It Works" section with numbered steps
- Full Terms & Conditions
- Betika footer with licensing information

**Admin Controls:**

At the top of the preview:
- **"PREVIEW MODE"** badge (yellow)
- **"Back to Admin"** button
- **"This is what customers will see"** label

**Step 3:** Review the layout and content

**Step 4:** Click **"Back to Admin"** to return to editing

---

### Feature 4: Manual Award

**What is Manual Award?**

Manual Award allows authorized users to grant bonuses directly to specific players outside of automated promotions.

**When to Use Manual Award:**

- Customer service compensation
- VIP player rewards
- Goodwill gestures
- Contest prizes
- Special occasions

**How to Create a Manual Award:**

**Step 1:** Click **"Manual Award"** in the sidebar

**Step 2:** Click **"+ New Award"**

**Step 3:** Fill in the award details:

1. **Player Identification**
   - Enter player ID or phone number
   - System will verify the account exists

2. **Award Type**
   - Bonus cash
   - Free bet
   - Cashback

3. **Amount**
   - Enter the value in local currency

4. **Reason** (Required)
   - Select from dropdown or enter custom reason
   - This is for audit purposes

5. **Wagering Requirements** (Optional)
   - Set rollover multiplier if needed

6. **Validity Period**
   - How long the award is valid

7. **Notes** (Optional)
   - Internal notes for record-keeping

**Step 4:** Click **"Preview Award"** to review

**Step 5:** Click **"Issue Award"** to grant

✅ **Success!** The award is immediately credited to the player's account.

---

## 5. Common User Tasks

### Task 1: Searching for a Promotion

**Step 1:** Go to the Promotions page

**Step 2:** Use the search bar at the top

**Step 3:** Enter keywords:
- Promotion name
- Type
- Status
- Date range

**Step 4:** Press Enter or click the search icon

**Step 5:** Results are filtered in real-time

### Task 2: Filtering Promotions

**Step 1:** Click the **"Filter"** button (funnel icon)

**Step 2:** Select filter criteria:
- Status (Active, Paused, Scheduled, Ended)
- Type (Deposit Match, Free Bet, etc.)
- Market (Kenya, Ghana, etc.)
- Date range

**Step 3:** Click **"Apply Filters"**

**Step 4:** To clear filters, click **"Reset"**

### Task 3: Exporting Promotion Data

**Step 1:** Go to the Promotions page

**Step 2:** Select promotions to export (checkboxes)

**Step 3:** Click **"Export"** button

**Step 4:** Choose export format:
- CSV (for Excel)
- PDF (for reports)
- JSON (for developers)

**Step 5:** Click **"Download"**

**Step 6:** File will download to your default downloads folder

### Task 4: Updating Your Profile

**Step 1:** Click your profile icon (top right)

**Step 2:** Select **"Settings"**

**Step 3:** Navigate to **"Profile"** tab

**Step 4:** Update your information:
- Name
- Email
- Phone number
- Department
- Role

**Step 5:** Click **"Save Changes"**

### Task 5: Changing Notification Preferences

**Step 1:** Go to Settings → **"Notifications"**

**Step 2:** Toggle notifications on/off:
- Email notifications
- In-app notifications
- SMS alerts

**Step 3:** Select which events trigger notifications:
- Promotion published
- Budget threshold reached
- Compliance issues
- System updates

**Step 4:** Click **"Save Preferences"**

---

## 6. Troubleshooting

### Common Issues and Solutions

#### Issue 1: Cannot Log In

**Symptoms:**
- "Invalid credentials" error
- Account locked message

**Possible Causes:**
- Incorrect password
- Account not activated
- Too many failed login attempts

**Solutions:**

**Solution 1:** Reset your password
- Click "Forgot Password?" on login page
- Follow the email instructions

**Solution 2:** Contact your administrator
- Your account may need to be activated
- Provide your email address and employee ID

**Solution 3:** Wait 15 minutes
- After 5 failed attempts, accounts are temporarily locked
- Try again after the lockout period

---

#### Issue 2: Promotion Not Appearing on Customer Site

**Symptoms:**
- Promotion shows as "Active" in BPP
- Customers cannot see it on the website

**Possible Causes:**
- Start date is in the future
- Target market/platform mismatch
- Cache not cleared
- Approval pending

**Solutions:**

**Solution 1:** Check the schedule
- Verify start date and time
- Ensure it's in the correct timezone

**Solution 2:** Verify targeting
- Check that the correct markets are selected
- Confirm platform settings (Web, App, USSD)

**Solution 3:** Clear cache
- Ask your technical team to clear the cache
- Wait 5-10 minutes for propagation

**Solution 4:** Check approval status
- Some promotions require compliance approval
- Check the "Compliance" tab

---

#### Issue 3: Preview Mode Not Working

**Symptoms:**
- Clicking "Preview Customer View" does nothing
- Preview shows blank page

**Possible Causes:**
- Browser pop-up blocker
- Incomplete promotion data
- JavaScript disabled

**Solutions:**

**Solution 1:** Allow pop-ups
- Check your browser settings
- Allow pop-ups for the BPP domain

**Solution 2:** Complete required fields
- Ensure all mandatory fields are filled
- Save your draft before previewing

**Solution 3:** Enable JavaScript
- Check browser settings
- Ensure JavaScript is enabled

**Solution 4:** Try a different browser
- Use Chrome, Firefox, or Safari
- Update to the latest version

---

#### Issue 4: Cannot Upload Banner Image

**Symptoms:**
- "Upload failed" error
- Image doesn't appear after upload

**Possible Causes:**
- File too large
- Unsupported format
- Network issue

**Solutions:**

**Solution 1:** Resize your image
- Maximum file size: 5MB
- Recommended size: 1200x400 pixels
- Use online tools to compress

**Solution 2:** Convert format
- Supported formats: JPG, PNG, WebP
- Avoid BMP, TIFF, or GIF

**Solution 3:** Check your connection
- Ensure stable internet
- Try uploading again

---

#### Issue 5: Budget Exceeded Warning

**Symptoms:**
- Red alert on dashboard
- Promotion automatically paused

**Possible Causes:**
- More claims than expected
- Budget set too low
- Calculation error

**Solutions:**

**Solution 1:** Increase budget
- Go to promotion settings
- Update budget allocation
- Click "Save Changes"

**Solution 2:** Adjust daily cap
- Set a daily spending limit
- Prevents overspending

**Solution 3:** Review qualification rules
- May be too broad
- Tighten eligibility criteria

---

## 7. FAQ

### General Questions

**Q1: Who can access the BPP system?**

**A:** Access is restricted to authorized Betika employees. You need:
- A valid company email address
- Assigned role and permissions
- Completed onboarding training

---

**Q2: Can I create promotions for multiple markets at once?**

**A:** Yes! During the "Scope & Eligibility" step, you can select multiple countries. The same promotion will run across all selected markets.

---

**Q3: How long does it take for a promotion to go live?**

**A:** 
- **Immediate:** If published with a current start date
- **Scheduled:** Activates automatically at the specified start date/time
- **With Approval:** 1-2 business days for compliance review

---

**Q4: Can I edit a promotion after it's published?**

**A:** 
- **Yes:** Display content, images, and terms can be updated
- **No:** Core mechanics (reward type, qualification rules) cannot be changed
- **Workaround:** Pause the current promotion and create a new one

---

**Q5: What happens if I delete a promotion?**

**A:** 
- **Draft:** Permanently deleted, no impact
- **Scheduled:** Deleted, will not activate
- **Active:** Cannot delete, must pause or deactivate first
- **Ended:** Can be archived but not deleted (for audit purposes)

---

### Technical Questions

**Q6: What browsers are supported?**

**A:** 
- ✅ Google Chrome (v90+)
- ✅ Mozilla Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Microsoft Edge (v90+)
- ❌ Internet Explorer (not supported)

---

**Q7: Is there a mobile app for BPP?**

**A:** No, BPP is a web-based platform. However, it's fully responsive and works on tablets and mobile browsers.

---

**Q8: How often is data updated?**

**A:** 
- **Dashboard metrics:** Every 5 minutes
- **Promotion status:** Real-time
- **Performance reports:** Every 15 minutes
- **Financial data:** Every hour

---

**Q9: Can I export historical data?**

**A:** Yes! Go to Reports → Select date range → Click "Export". You can download data up to 2 years back.

---

**Q10: What's the maximum number of promotions I can run simultaneously?**

**A:** There's no hard limit, but for optimal performance:
- **Recommended:** 10-15 active promotions
- **Maximum:** 50 active promotions
- **Note:** Too many active promotions may confuse customers

---

### Promotion-Specific Questions

**Q11: Can players participate in multiple promotions at once?**

**A:** 
- **Default:** Yes, unless explicitly excluded
- **Best Practice:** Use segmentation to prevent overlap
- **Example:** "New Player" promotions automatically exclude existing players

---

**Q12: How do I prevent promotion abuse?**

**A:** Use these safeguards:
- Set per-player caps
- Define clear qualification rules
- Use the compliance scan feature
- Monitor unusual activity in Reports
- Enable fraud detection (contact admin)

---

**Q13: Can I target specific players by name?**

**A:** 
- **Not in automated promotions** (privacy/compliance reasons)
- **Yes in Manual Awards** (for individual rewards)
- **Alternative:** Use segments based on behavior, not identity

---

**Q14: What's the difference between "Pause" and "Deactivate"?**

**A:** 
- **Pause:** Temporary stop, can be resumed, existing rewards valid
- **Deactivate:** Permanent stop, cannot be resumed, all rewards voided

---

**Q15: How do I know if my promotion is performing well?**

**A:** Check these metrics:
- **Claim Rate:** % of eligible players who claimed (target: >15%)
- **Conversion Rate:** % of claimants who met wagering requirements (target: >30%)
- **ROI:** Revenue generated vs. cost (target: >150%)
- **Player Retention:** % still active after 30 days (target: >40%)

---

## 8. Support & Contact Information

### Getting Help

If you encounter issues not covered in this manual:

#### 1. In-App Help

**Step 1:** Click the **"?"** icon (top right)

**Step 2:** Search the knowledge base

**Step 3:** Browse common topics:
- Getting Started
- Creating Promotions
- Reports & Analytics
- Troubleshooting

#### 2. Email Support

**For Technical Issues:**
- Email: **tech-support@betika.com**
- Response time: 4 business hours
- Include: Screenshot, error message, steps to reproduce

**For Compliance Questions:**
- Email: **compliance@betika.com**
- Response time: 1 business day
- Include: Promotion details, specific question

**For General Inquiries:**
- Email: **bpp-support@betika.com**
- Response time: 24 hours

#### 3. Live Chat

**Step 1:** Click the **"Chat"** icon (bottom right)

**Step 2:** Describe your issue

**Step 3:** Connect with a support agent

**Availability:** Monday-Friday, 8:00 AM - 6:00 PM EAT

#### 4. Training Sessions

**New User Onboarding:**
- Held every Monday at 10:00 AM
- Duration: 2 hours
- Register: **training@betika.com**

**Advanced Features Workshop:**
- Held first Thursday of each month
- Duration: 1 hour
- Topics: Segmentation, A/B testing, advanced analytics

#### 5. Documentation

**Additional Resources:**
- **API Documentation:** For developers integrating with BPP
- **Video Tutorials:** Step-by-step video guides
- **Release Notes:** Latest features and updates
- **Best Practices Guide:** Tips for successful campaigns

**Access:** Settings → Documentation

---

### Emergency Contact

**For Critical Issues (System Down, Security Breach):**

📞 **Emergency Hotline:** +254-XXX-XXXX-XXX  
📧 **Emergency Email:** emergency@betika.com  
⏰ **Available:** 24/7

---

### Feedback & Suggestions

We value your input! Help us improve BPP:

**Submit Feedback:**
- Click **"Feedback"** button (bottom left)
- Describe your suggestion or issue
- Attach screenshots if helpful
- Click **"Submit"**

**Feature Requests:**
- Email: **product@betika.com**
- Include: Use case, expected benefit, priority

---

## Appendix A: Glossary

**BPP** - Betika Promotions Platform

**Claim Rate** - Percentage of eligible players who activated a promotion

**Compliance Scan** - Automated review checking for regulatory violations

**Conversion Rate** - Percentage of participants who completed wagering requirements

**Manual Award** - Direct bonus granted by admin to specific player

**ROI** - Return on Investment (revenue generated vs. cost)

**Segment** - Group of players defined by specific criteria

**SSO** - Single Sign-On (login using Google/Microsoft account)

**Wagering Requirement** - Amount that must be bet before bonus can be withdrawn

---

## Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Create new promotion |
| `Ctrl + S` | Save draft |
| `Ctrl + P` | Preview customer view |
| `Ctrl + F` | Search promotions |
| `Ctrl + E` | Export data |
| `Esc` | Close modal/dialog |
| `Tab` | Navigate between fields |
| `Ctrl + /` | Open help |

---

## Appendix C: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 10, 2026 | Initial release |

---

**End of User Manual**

For the latest version of this document, visit: **Settings → Documentation**

---

*© 2026 Betika. All rights reserved. This document is confidential and intended for authorized personnel only.*
