// Countries data for select dropdowns
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VA', name: 'Vatican City' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

// Populate country select elements
function populateCountrySelects() {
  const selects = document.querySelectorAll('select[name="nationality"], select[name="countryOfResidence"], select[name="taxResidency"], select[name="resCountry"], select[name="mailCountry"], select[name="docIssuingCountry"]');
  selects.forEach(select => {
    const isMultiple = select.multiple;
    const placeholder = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (placeholder) select.appendChild(placeholder);
    
    COUNTRIES.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name;
      select.appendChild(option);
    });
    
    if (isMultiple) {
      // Re-enable multiple selection
      select.multiple = true;
    }
  });
}

// Set max date for dateOfBirth (18 years ago) and docExpiry (today)
function setDateLimits() {
  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  
  const dobInput = document.getElementById('dateOfBirth');
  if (dobInput) {
    dobInput.max = eighteenYearsAgo.toISOString().split('T')[0];
  }
  
  const expiryInput = document.getElementById('docExpiry');
  if (expiryInput) {
    expiryInput.min = today.toISOString().split('T')[0];
  }
}

// Show/hide mailing address fields
function setupMailingAddressToggle() {
  const checkbox = document.getElementById('mailingSame');
  const fields = document.getElementById('mailing-address-fields');
  if (checkbox && fields) {
    checkbox.addEventListener('change', () => {
      fields.hidden = checkbox.checked;
      // Clear required attributes when hidden
      const inputs = fields.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.required = !checkbox.checked;
      });
    });
  }
}

// Show/hide PEP and sanctions details
function setupConditionalFields() {
  const pepCheckbox = document.getElementById('isPoliticallyExposed');
  const pepDetails = document.getElementById('pep-details');
  const sanctionsCheckbox = document.getElementById('hasSanctions');
  const sanctionsDetails = document.getElementById('sanctions-details');
  
  if (pepCheckbox && pepDetails) {
    pepCheckbox.addEventListener('change', () => {
      pepDetails.hidden = !pepCheckbox.checked;
      document.getElementById('pepDetails').required = pepCheckbox.checked;
    });
  }
  
  if (sanctionsCheckbox && sanctionsDetails) {
    sanctionsCheckbox.addEventListener('change', () => {
      sanctionsDetails.hidden = !sanctionsCheckbox.checked;
      document.getElementById('sanctionsDetails').required = sanctionsCheckbox.checked;
    });
  }
}

// File upload handling
function setupFileUploads() {
  const uploadZones = document.querySelectorAll('.upload-zone');
  
  uploadZones.forEach(zone => {
    const input = zone.querySelector('input[type="file"]');
    const btn = zone.querySelector('.upload-btn');
    
    if (btn && input) {
      btn.addEventListener('click', () => input.click());
    }
    
    if (input) {
      input.addEventListener('change', () => {
        if (input.files.length > 0) {
          const file = input.files[0];
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
          zone.querySelector('.upload-text').textContent = `${file.name} (${sizeMB} MB)`;
          zone.classList.add('has-file');
        }
      });
    }
    
    // Drag and drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
  });
}

// Wizard state
let currentStep = 1;
let sessionId = null;
const forms = {
  1: document.getElementById('step1-form'),
  2: document.getElementById('step2-form'),
  3: document.getElementById('step3-form'),
  4: document.getElementById('step4-form'),
  5: document.getElementById('step5-form'),
};

const stepTitles = {
  1: 'Personal Information',
  2: 'Address Information',
  3: 'Identity Verification',
  4: 'Financial Profile',
  5: 'Review & Submit',
};

const stepSubtitles = {
  1: 'Step 1 of 5 — Tell us about yourself',
  2: 'Step 2 of 5 — Where do you live?',
  3: 'Step 3 of 5 — Verify your identity',
  4: 'Step 4 of 5 — Your financial profile',
  5: 'Step 5 of 5 — Review and submit',
};

// Initialize wizard
function initWizard() {
  populateCountrySelects();
  setDateLimits();
  setupMailingAddressToggle();
  setupConditionalFields();
  setupFileUploads();
  
  // Load existing session if in URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionParam = urlParams.get('session');
  if (sessionParam) {
    sessionId = sessionParam;
    loadSession(sessionId);
  } else {
    startNewSession();
  }
  
  updateWizardUI();
}

// Start new registration session
async function startNewSession() {
  try {
    const csrfData = await Northstar.get('/api/auth/csrf-token');
    Northstar.setCsrfToken(csrfData.csrfToken);
    
    const response = await Northstar.post('/api/registration/start', {});
    if (response.success) {
      sessionId = response.sessionId;
      currentStep = response.currentStep || 1;
      updateWizardUI();
    }
  } catch (err) {
    showError('Failed to start registration: ' + err.message);
  }
}

// Load existing session
async function loadSession(id) {
  try {
    const csrfData = await Northstar.get('/api/auth/csrf-token');
    Northstar.setCsrfToken(csrfData.csrfToken);
    
    const response = await Northstar.get(`/api/registration/${id}`);
    if (response.success) {
      sessionId = response.session.sessionId;
      currentStep = response.session.currentStep;
      populateForm(response.session);
      updateWizardUI();
    }
  } catch (err) {
    showError('Failed to load session: ' + err.message);
    startNewSession();
  }
}

// Populate form with session data
function populateForm(session) {
  // Step 1
  if (session.personalInfo) {
    Object.keys(session.personalInfo).forEach(key => {
      const input = document.querySelector(`[name="${key}"]`);
      if (input) input.value = session.personalInfo[key];
    });
  }
  
  // Step 2
  if (session.addressInfo) {
    Object.keys(session.addressInfo.residentialAddress || {}).forEach(key => {
      const input = document.querySelector(`[name="res${key.charAt(0).toUpperCase() + key.slice(1)}"]`);
      if (input) input.value = session.addressInfo.residentialAddress[key];
    });
    
    if (session.addressInfo.mailingAddressSame !== undefined) {
      document.getElementById('mailingSame').checked = session.addressInfo.mailingAddressSame;
      document.getElementById('mailing-address-fields').hidden = session.addressInfo.mailingAddressSame;
    }
    
    Object.keys(session.addressInfo.mailingAddress || {}).forEach(key => {
      const input = document.querySelector(`[name="mail${key.charAt(0).toUpperCase() + key.slice(1)}"]`);
      if (input) input.value = session.addressInfo.mailingAddress[key];
    });
  }
  
  // Step 3
  if (session.identityInfo) {
    Object.keys(session.identityInfo).forEach(key => {
      if (key !== 'frontDocumentId' && key !== 'backDocumentId' && key !== 'selfieDocumentId') {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = session.identityInfo[key];
      }
    });
  }
  
  // Step 4
  if (session.financialInfo) {
    Object.keys(session.financialInfo).forEach(key => {
      if (key === 'expectedTransactionTypes') {
        const checkboxes = document.querySelectorAll(`[name="${key}"]`);
        checkboxes.forEach(cb => {
          cb.checked = session.financialInfo[key].includes(cb.value);
        });
      } else {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = session.financialInfo[key];
      }
    });
  }
  
  // Step 5
  if (session.complianceInfo) {
    Object.keys(session.complianceInfo).forEach(key => {
      const input = document.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = session.complianceInfo[key];
        } else {
          input.value = session.complianceInfo[key];
        }
      }
    });
    
    // Show/hide conditional fields
    if (session.complianceInfo.isPoliticallyExposed) {
      document.getElementById('pep-details').hidden = false;
    }
    if (session.complianceInfo.hasSanctions) {
      document.getElementById('sanctions-details').hidden = false;
    }
  }
  
  // Update review summary
  updateReviewSummary();
}

// Collect form data for current step
function collectStepData(step) {
  const form = forms[step];
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      if (!Array.isArray(data[key])) data[key] = [data[key]];
      data[key].push(value);
    } else {
      data[key] = value;
    }
  }
  
  // Structure data according to step
  switch (step) {
    case 1:
      return { personalInfo: data };
    case 2:
      return {
        addressInfo: {
          residentialAddress: {
            line1: data.resLine1,
            line2: data.resLine2,
            city: data.resCity,
            stateProvince: data.resState,
            postalCode: data.resPostalCode,
            country: data.resCountry,
          },
          mailingAddressSame: data.mailingSame === 'on',
          mailingAddress: {
            line1: data.mailLine1,
            line2: data.mailLine2,
            city: data.mailCity,
            stateProvince: data.mailState,
            postalCode: data.mailPostalCode,
            country: data.mailCountry,
          },
        },
      };
    case 3:
      return { identityInfo: data };
    case 4:
      return { financialInfo: data };
    case 5:
      return { complianceInfo: data };
  }
  
  return data;
}

// Validate current step
function validateStep(step) {
  const form = forms[step];
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }
  
  // Custom validations
  switch (step) {
    case 1:
      const dob = new Date(document.getElementById('dateOfBirth').value);
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      if (dob > eighteenYearsAgo) {
        showError('You must be at least 18 years old');
        return false;
      }
      break;
    case 3:
      const expiry = new Date(document.getElementById('docExpiry').value);
      if (expiry <= new Date()) {
        showError('Document must not be expired');
        return false;
      }
      break;
    case 4:
      const transactionTypes = document.querySelectorAll('[name="expectedTransactionTypes"]:checked');
      if (transactionTypes.length === 0) {
        showError('Please select at least one transaction type');
        return false;
      }
      break;
    case 5:
      if (!document.getElementById('termsAccepted').checked || !document.getElementById('privacyAccepted').checked) {
        showError('You must accept the Terms & Conditions and Privacy Policy');
        return false;
      }
      break;
  }
  
  return true;
}

// Save current step
async function saveStep(step) {
  if (!validateStep(step)) return false;
  
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  const btn = step === 5 ? submitBtn : nextBtn;
  const label = step === 5 ? document.getElementById('submit-btn-label') : nextBtn;
  
  btn.disabled = true;
  if (label) label.innerHTML = '<span class="spinner"></span>';
  
  try {
    const csrfData = await Northstar.get('/api/auth/csrf-token');
    Northstar.setCsrfToken(csrfData.csrfToken);
    
    const stepData = collectStepData(step);
    const response = await Northstar.put(`/api/registration/${sessionId}/step/${step}`, stepData);
    
    if (response.success) {
      currentStep = response.session.currentStep;
      updateWizardUI();
      return true;
    }
  } catch (err) {
    showError(err.message || 'Failed to save step');
  } finally {
    btn.disabled = false;
    if (label) {
      if (step === 5) label.textContent = 'Submit for Review';
      else label.textContent = 'Continue';
    }
  }
  
  return false;
}

// Submit registration
async function submitRegistration() {
  if (!validateStep(5)) return;
  
  const submitBtn = document.getElementById('submit-btn');
  const label = document.getElementById('submit-btn-label');
  
  submitBtn.disabled = true;
  label.innerHTML = '<span class="spinner"></span>';
  
  try {
    const csrfData = await Northstar.get('/api/auth/csrf-token');
    Northstar.setCsrfToken(csrfData.csrfToken);
    
    const response = await Northstar.post(`/api/registration/${sessionId}/submit`, {});
    
    if (response.success) {
      showSuccess('Registration submitted successfully! You will receive an email confirmation shortly.');
      setTimeout(() => {
        window.location.href = 'login.html?registered=true';
      }, 3000);
    }
  } catch (err) {
    showError(err.message || 'Failed to submit registration');
  } finally {
    submitBtn.disabled = false;
    label.textContent = 'Submit for Review';
  }
}

// Update wizard UI
function updateWizardUI() {
  // Update stepper
  document.querySelectorAll('.wizard-step').forEach(stepEl => {
    const step = parseInt(stepEl.dataset.step, 10);
    stepEl.classList.remove('active', 'completed');
    if (step < currentStep) stepEl.classList.add('completed');
    if (step === currentStep) stepEl.classList.add('active');
  });
  
  // Show/hide forms
  Object.keys(forms).forEach(step => {
    const form = forms[step];
    if (parseInt(step, 10) === currentStep) {
      form.hidden = false;
    } else {
      form.hidden = true;
    }
  });
  
  // Update title and subtitle
  document.getElementById('wizard-title').textContent = stepTitles[currentStep];
  document.getElementById('wizard-subtitle').textContent = stepSubtitles[currentStep];
  
  // Update navigation
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  
  prevBtn.hidden = currentStep === 1;
  nextBtn.hidden = currentStep === 5;
  submitBtn.hidden = currentStep !== 5;
  
  // Update review summary on step 5
  if (currentStep === 5) {
    updateReviewSummary();
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// Update review summary
function updateReviewSummary() {
  const container = document.getElementById('review-summary');
  if (!container) return;
  
  // Collect all form data
  const allData = {};
  Object.keys(forms).forEach(step => {
    const data = collectStepData(parseInt(step, 10));
    Object.assign(allData, data);
  });
  
  let html = '<div class="review-grid">';
  
  // Personal
  if (allData.personalInfo) {
    html += `
      <div class="review-section">
        <h4>Personal Information</h4>
        <dl>
          <dt>Name</dt><dd>${allData.personalInfo.firstName} ${allData.personalInfo.lastName}</dd>
          <dt>Date of Birth</dt><dd>${new Date(allData.personalInfo.dateOfBirth).toLocaleDateString()}</dd>
          <dt>Nationality</dt><dd>${getCountryName(allData.personalInfo.nationality)}</dd>
          <dt>Country of Residence</dt><dd>${getCountryName(allData.personalInfo.countryOfResidence)}</dd>
          <dt>Phone</dt><dd>${allData.personalInfo.phoneNumber}</dd>
          <dt>Email</dt><dd>${allData.personalInfo.email}</dd>
        </dl>
      </div>
    `;
  }
  
  // Address
  if (allData.addressInfo) {
    const addr = allData.addressInfo.residentialAddress;
    html += `
      <div class="review-section">
        <h4>Residential Address</h4>
        <dl>
          <dt>Address</dt><dd>${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}</dd>
          <dt>City</dt><dd>${addr.city}</dd>
          <dt>State/Province</dt><dd>${addr.stateProvince}</dd>
          <dt>Postal Code</dt><dd>${addr.postalCode}</dd>
          <dt>Country</dt><dd>${getCountryName(addr.country)}</dd>
        </dl>
      </div>
    `;
  }
  
  // Identity
  if (allData.identityInfo) {
    html += `
      <div class="review-section">
        <h4>Identity Document</h4>
        <dl>
          <dt>Type</dt><dd>${allData.identityInfo.docType}</dd>
          <dt>Number</dt><dd>${allData.identityInfo.docNumber}</dd>
          <dt>Expiry</dt><dd>${new Date(allData.identityInfo.docExpiry).toLocaleDateString()}</dd>
          <dt>Issuing Country</dt><dd>${getCountryName(allData.identityInfo.docIssuingCountry)}</dd>
        </dl>
      </div>
    `;
  }
  
  // Financial
  if (allData.financialInfo) {
    html += `
      <div class="review-section">
        <h4>Financial Profile</h4>
        <dl>
          <dt>Employment</dt><dd>${allData.financialInfo.employmentStatus}${allData.financialInfo.employerName ? ' - ' + allData.financialInfo.employerName : ''}</dd>
          <dt>Occupation</dt><dd>${allData.financialInfo.occupation || 'Not specified'}</dd>
          <dt>Annual Income</dt><dd>${allData.financialInfo.annualIncome}</dd>
          <dt>Source of Funds</dt><dd>${allData.financialInfo.sourceOfFunds}</dd>
          <dt>Monthly Volume</dt><dd>${allData.financialInfo.expectedMonthlyVolume}</dd>
          <dt>Transaction Types</dt><dd>${(allData.financialInfo.expectedTransactionTypes || []).join(', ')}</dd>
        </dl>
      </div>
    `;
  }
  
  // Compliance
  if (allData.complianceInfo) {
    html += `
      <div class="review-section">
        <h4>Compliance</h4>
        <dl>
          <dt>PEP Status</dt><dd>${allData.complianceInfo.isPoliticallyExposed ? 'Yes' : 'No'}</dd>
          <dt>Sanctions</dt><dd>${allData.complianceInfo.hasSanctions ? 'Yes' : 'No'}</dd>
          <dt>FATCA</dt><dd>${allData.complianceInfo.fatcaStatus}</dd>
          <dt>CRS</dt><dd>${allData.complianceInfo.crsStatus}</dd>
        </dl>
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

// Helper to get country name from code
function getCountryName(code) {
  const country = COUNTRIES.find(c => c.code === code);
  return country ? country.name : code;
}

// Navigation handlers
document.getElementById('next-btn').addEventListener('click', () => {
  saveStep(currentStep).then(saved => {
    if (saved && currentStep < 5) {
      currentStep++;
      updateWizardUI();
    }
  });
});

document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep--;
    updateWizardUI();
  }
});

document.getElementById('submit-btn').addEventListener('click', submitRegistration);

// Error/success display
function showError(message) {
  const errorBox = document.getElementById('wizard-error');
  errorBox.textContent = message;
  errorBox.classList.add('show');
}

function showSuccess(message) {
  const errorBox = document.getElementById('wizard-error');
  errorBox.textContent = message;
  errorBox.classList.remove('show');
  errorBox.style.background = 'var(--green-50)';
  errorBox.style.borderColor = 'var(--green-300)';
  errorBox.style.color = 'var(--green-800)';
  errorBox.classList.add('show');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initWizard);

// Export for potential module use
window.RegistrationWizard = { initWizard };