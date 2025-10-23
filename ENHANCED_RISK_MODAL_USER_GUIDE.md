# Enhanced Risk Modal - User Guide

## 🎯 Quick Start

### Access the Modal
1. **Login** to ARIA5 Platform: https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev
2. Navigate to **Risk Management** section
3. Click the **"Add Risk"** or **"Create Risk"** button
4. The enhanced risk modal will open

### Test Credentials
- **Username**: `admin` or `avi_security`
- **Password**: Check your system configuration

## 📋 Step-by-Step Guide

### Step 1: Risk Identification (Blue Section)

**Required Fields:**
- **Risk Category**: Choose from 6 categories
  - 🛡️ Cybersecurity
  - ⚙️ Operational
  - 💰 Financial
  - 📋 Compliance
  - 🎯 Strategic
  - ⭐ Reputational

- **Threat Source**: Classify the origin
  - 🔴 External - Malicious (Hackers, APTs)
  - 🟡 External - Accidental (User error, vendors)
  - 🔴 Internal - Malicious (Insider threats)
  - 🟡 Internal - Accidental (Employee errors)
  - 🌪️ Natural Disaster
  - ⚠️ System Failure

- **Risk Title**: Clear, concise description
  - Example: "Unauthorized access to customer database"

- **Risk Description**: Detailed scenario
  - Describe potential causes
  - Explain attack vectors
  - Outline expected business impact

### Step 2: Affected Services (Green Section)

**🔍 Search & Filter:**
- Use the search box to find services by name
- Filter by criticality level:
  - All Levels
  - Critical Only (score ≥80)
  - High+ (score ≥60)
  - Medium+ (score ≥40)

**Service Selection:**
- Check boxes for all affected services
- Watch the selection counter update in real-time
- Review service information:
  - **Criticality Score**: 0-100 numerical value
  - **Criticality Level**: Critical/High/Medium/Low
  - **Department**: Business unit
  - **CIA Score**: Average Confidentiality/Integrity/Availability
  - **Dependencies**: Linked assets count
  - **Existing Risks**: Associated risks count

**Color Coding:**
- 🔴 **Red Border**: Critical (score ≥80)
- 🟠 **Orange Border**: High (60-79)
- 🟡 **Yellow Border**: Medium (40-59)
- 🟢 **Green Border**: Low (<40)

### Step 3: AI Intelligence Panel (Purple - Auto-Appears)

**What Triggers It:**
- Appears automatically when you select 1+ services
- Updates in real-time as you add/remove services
- Hides when all services are deselected

**What It Shows:**

1. **Confidence Badge**: 60-95% confidence score
   - Based on data completeness
   - Higher with more services and critical services

2. **Suggested Probability** (1-5 scale):
   - Calculated from:
     - Number of existing risks
     - Service dependency count
     - Number of services affected
     - Department diversity

3. **Suggested Impact** (1-5 scale):
   - Calculated from:
     - Maximum service criticality score
     - Average criticality across services
     - Business impact assessment

4. **Analysis Reasoning**:
   - Bullet points explaining each suggestion
   - Clear logic for probability and impact
   - Factors influencing the rating

**Using AI Suggestions:**
- Review the suggestions and reasoning
- Check confidence percentage
- Click **"Apply AI Suggestions"** to auto-fill probability and impact
- Or manually adjust values if you disagree

### Step 4: Risk Assessment (Red Section)

**Probability (Likelihood):**
- 1 - Very Low (0-5%)
- 2 - Low (6-25%)
- 3 - Medium (26-50%)
- 4 - High (51-75%)
- 5 - Very High (76-100%)

**Impact (Consequence Severity):**
- 1 - Minimal
- 2 - Minor
- 3 - Moderate
- 4 - Major
- 5 - Severe

**Risk Score:**
- Automatically calculated: Probability × Impact
- Color-coded based on severity:
  - 🔴 Critical (20-25)
  - 🟠 High (15-19)
  - 🟡 Medium (10-14)
  - 🟢 Low (5-9)
  - ⚪ Very Low (1-4)

### Step 5: AI Risk Analysis (Purple Section)

**Deep AI Analysis:**
1. Click **"Analyze Risk with AI"** button
2. Wait for Cloudflare AI to process (5-10 seconds)
3. Review comprehensive analysis:
   - Risk Assessment Summary
   - Key Risk Factors
   - Potential Business Impact
   - Recommended Mitigation Actions
   - Monitoring Indicators

**Auto-Fill from AI:**
- If AI provides structured data
- Click **"Fill Form with AI Data"** button
- System will automatically populate:
  - Probability score
  - Impact score
  - Treatment strategy
  - Mitigation actions

### Step 6: Risk Treatment & Controls (Yellow Section)

**Treatment Strategy:**
- **Accept**: Monitor without active controls
- **Mitigate**: Implement controls to reduce risk
- **Transfer**: Share risk with third party (insurance, vendors)
- **Avoid**: Eliminate risk entirely (stop activity)

**Risk Owner:**
- Select the person accountable for this risk
- Available options:
  - Avi Security
  - Admin User
  - Mike Chen
  - Sarah Johnson
  - System Admin

**Mitigation Actions:**
- Describe specific steps to reduce risk:
  - Control measures
  - Process improvements
  - Technical solutions
  - Training requirements

### Step 7: Submit

**Before Submitting:**
- Verify all required fields (marked with *)
- Review AI suggestions and applied values
- Check selected services are correct
- Confirm risk owner assignment

**Submit:**
- Click **"Create Risk Assessment"** button
- System will:
  - Create risk record
  - Link to selected services
  - Store probability and impact
  - Save treatment strategy
  - Assign to risk owner
  - Trigger automatic calculations

## 🎓 Best Practices

### For Accurate Risk Assessment

1. **Select All Relevant Services**:
   - Don't miss indirect dependencies
   - Consider both primary and secondary impacts
   - Include supporting services

2. **Review AI Suggestions Carefully**:
   - AI provides guidance, not mandates
   - Use your expertise to adjust
   - Consider organizational context

3. **Leverage Service Criticality**:
   - Trust the service criticality scores
   - Critical services drive higher impact ratings
   - Multiple services increase probability

4. **Provide Detailed Descriptions**:
   - More detail = better AI analysis
   - Include specific scenarios
   - Mention relevant threat actors or vulnerabilities

5. **Use AI Analysis for Complex Risks**:
   - Click "Analyze Risk with AI" for:
     - Novel or unusual risks
     - Cross-functional impacts
     - Regulatory/compliance risks
     - Strategic business risks

### For Efficient Workflow

1. **Use Search & Filters**:
   - Type service names quickly
   - Filter by criticality for focused selection
   - Clear search to see all services

2. **Watch the Intelligence Panel**:
   - Let it guide your initial assessment
   - Note confidence percentage
   - Read reasoning bullets for insights

3. **Apply AI Suggestions First**:
   - Start with AI-suggested values
   - Adjust manually if needed
   - Saves time on straightforward risks

4. **Save AI Analysis**:
   - Copy AI-generated text for documentation
   - Reference in mitigation planning
   - Share with stakeholders

## 🔄 Dynamic Recalculation

### How It Works

**Automatic Updates:**
- When a service's criticality changes
- Database triggers fire automatically
- All linked risks are marked for review
- `updated_at` timestamp refreshes

**Monitoring Changes:**
1. Navigate to Risk Management
2. Sort by "Last Updated"
3. Review recently updated risks
4. Check if criticality changes warrant rating adjustments

**Manual Recalculation:**
1. Open risk in edit mode
2. Review current service selections
3. Check AI intelligence panel
4. Apply new suggestions if appropriate
5. Update and save

## 🎨 Visual Indicators Guide

### Border Colors
- 🔴 **Red**: Critical - Immediate attention required
- 🟠 **Orange**: High - Significant concern
- 🟡 **Yellow**: Medium - Standard monitoring
- 🟢 **Green**: Low - Routine tracking

### Badges
- **Criticality Badge**: Service importance level
- **CIA Score**: Confidentiality/Integrity/Availability rating
- **Confidence Badge**: AI suggestion reliability

### Icons
- 🛡️ Cybersecurity category
- ⚙️ Operational category
- 💰 Financial category
- 📋 Compliance category
- 🎯 Strategic category
- ⭐ Reputational category
- 🏢 Business department
- 🔗 Asset dependencies
- ⚠️ Existing risks
- 🧠 AI intelligence
- 🤖 AI analysis
- ✨ AI suggestions

## ❓ FAQ

### Q: What if no services are available?
**A**: Click the link "Add services first" in the services section to create services in Operations Center.

### Q: Can I override AI suggestions?
**A**: Yes, AI provides guidance only. You have full control to set probability and impact manually.

### Q: How accurate are AI suggestions?
**A**: Accuracy depends on:
- Service criticality data quality
- Number of services selected
- Historical risk data
- Shown in confidence percentage (60-95%)

### Q: What happens if I don't select any services?
**A**: Risk can still be created, but:
- No AI intelligence panel
- No dynamic rating suggestions
- Manual assessment required
- Weaker RMF hierarchy tracking

### Q: Can I select services from different departments?
**A**: Yes! Cross-departmental selection is encouraged. The AI will note this in reasoning and may increase probability/impact due to broader organizational impact.

### Q: How often should I recalculate risks?
**A**: Recalculate when:
- Service criticality changes
- New services are linked
- Business context shifts
- Quarterly risk reviews
- Major incidents occur

### Q: What if AI analysis fails?
**A**: 
- Check internet connectivity
- Verify Cloudflare AI binding
- Use manual assessment
- Contact administrator if persistent

## 🆘 Troubleshooting

### AI Intelligence Panel Not Showing
**Solution**:
1. Select at least one service
2. Check JavaScript console for errors
3. Verify services have valid criticality scores
4. Refresh page and try again

### Service List Empty
**Solution**:
1. Navigate to `/operations/services`
2. Create at least one service
3. Ensure service status is "Active"
4. Return to risk modal

### Risk Score Not Calculating
**Solution**:
1. Verify both probability and impact are selected
2. Check browser console for HTMX errors
3. Ensure backend is running
4. Try manual refresh

### Apply AI Suggestions Button Not Working
**Solution**:
1. Select services first
2. Wait for intelligence panel to appear
3. Check confidence is >60%
4. Review browser console for errors

## 📞 Support

**For Technical Issues**:
- Check browser console (F12)
- Review server logs: `pm2 logs aria51a`
- Test service health: `curl http://localhost:3000`

**For Business Questions**:
- Consult Risk Management documentation
- Review RMF hierarchy guidelines
- Contact your risk management team

## 🎉 Summary

The enhanced risk modal provides:
- ✅ AI-powered intelligence for better decisions
- ✅ Dynamic service-based risk rating
- ✅ Real-time confidence metrics
- ✅ Comprehensive visual indicators
- ✅ Automated recalculation on changes
- ✅ Professional, intuitive interface

**Result**: Faster, more accurate, and better-informed risk assessments!

---

**Access URL**: https://3000-idmf47b821gs003xe0l0a-6532622b.e2b.dev

**Last Updated**: 2025-10-23

**Version**: 1.0.0
