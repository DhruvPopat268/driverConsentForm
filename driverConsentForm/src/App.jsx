import React, { useState, useRef } from 'react';
import { Calendar } from 'lucide-react';

const D906Form = () => {
  const signatureRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState({
    // Section 1 - Company Details
    companyName: '',
    accountNumber: '',
    reference: '',
    taxiLicensing: '',
    yorkRoad: '',
    leeds: '',
    postcode: '',
    existingBehalf: '',
    companyNameBelow: '',

    // Section 2 - Processing Information
    cpcInfo: '',
    needCPC: false,
    tachographInfo: '',
    needTachograph: false,

    // Section 3 - Driver Details
    surname: '',
    firstName: '',
    dateOfBirth: '',
    middleName: '',
    currentAddress: {
      line1: '',
      line2: '',
      line3: '',
      postTown: '',
      postcode: ''
    },
    licenceAddress: {
      line1: '',
      line2: '',
      line3: '',
      postTown: '',
      postcode: ''
    },
    driverLicenceNumber: '',

    // Section 4 - Declaration
    signatureDate: '',
    declarationDate: ''
  });

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Auto-focus functionality for sequential inputs
  const handleSequentialInput = (e, groupName, index, maxLength = 1) => {
    const value = e.target.value;

    // Only allow alphanumeric characters
    if (!/^[a-zA-Z0-9]*$/.test(value)) {
      e.target.value = e.target.value.slice(0, -1);
      return;
    }

    if (value.length === maxLength) {
      // Move to next input
      const nextInput = document.querySelector(`input[data-group="${groupName}"][data-index="${index + 1}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleSequentialKeyDown = (e, groupName, index) => {
    if (e.key === 'Backspace' && e.target.value === '') {
      // Move to previous input on backspace if current is empty
      const prevInput = document.querySelector(`input[data-group="${groupName}"][data-index="${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      // Move to previous input on left arrow
      const prevInput = document.querySelector(`input[data-group="${groupName}"][data-index="${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
      }
    } else if (e.key === 'ArrowRight') {
      // Move to next input on right arrow
      const nextInput = document.querySelector(`input[data-group="${groupName}"][data-index="${index + 1}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Signature pad functionality
  const getEventPos = (e) => {
    const canvas = signatureRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getEventPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getEventPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Show loading state
      const submitBtn = document.querySelector('.submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      // Get signature data from canvas
      const canvas = signatureRef.current;

      // Helper to detect a blank canvas
      const isCanvasBlank = (c) => {
        const ctx = c.getContext('2d');
        const { width, height } = c;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // If any pixel has a non-zero alpha or any non-zero color, it's not blank
          if (data[i + 3] !== 0 || data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
            return false;
          }
        }
        return true;
      };

      // Check if signature exists before proceeding
      if (!canvas || isCanvasBlank(canvas)) {
        alert('Please provide your signature before submitting.');
        return;
      }

      // Collect sequential input data
      const collectInputs = (groupName, count) => {
        const inputs = [];
        for (let i = 0; i < count; i++) {
          const input = document.querySelector(`input[data-group="${groupName}"][data-index="${i}"]`);
          if (input && input.value) {
            inputs.push(input.value);
          }
        }
        return inputs.join('');
      };

      // Prepare form data for API (excluding signature image)
      const submitData = {
        // Section 1 - Company Details
        companyName: formData.companyName,
        accountNumber: formData.accountNumber,
        reference: formData.reference,
        taxiLicensing: formData.taxiLicensing,
        yorkRoad: formData.yorkRoad,
        leeds: formData.leeds,
        existingBehalf: formData.existingBehalf,
        companyNameBelow: formData.companyNameBelow,

        // Section 2 - Processing Information
        needCPC: formData.needCPC,
        needTachograph: formData.needTachograph,

        // Section 3 - Driver Details
        surname: formData.surname,
        firstName: formData.firstName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth,
        currentAddress: formData.currentAddress,
        licenceAddress: formData.licenceAddress,
        driverLicenceNumber: formData.driverLicenceNumber,

        // Section 4 - Declaration
        description: document.querySelector('.textarea-input').value,
        signatureDate: formData.signatureDate,
        declarationDate: formData.declarationDate,

        // Sequential input data (for backend processing)
        postcode1_0: collectInputs('postcode1', 7).charAt(0) || '',
        postcode1_1: collectInputs('postcode1', 7).charAt(1) || '',
        postcode1_2: collectInputs('postcode1', 7).charAt(2) || '',
        postcode1_3: collectInputs('postcode1', 7).charAt(3) || '',
        postcode1_4: collectInputs('postcode1', 7).charAt(4) || '',
        postcode1_5: collectInputs('postcode1', 7).charAt(5) || '',
        postcode1_6: collectInputs('postcode1', 7).charAt(6) || '',

        currentPostcode_0: collectInputs('currentPostcode', 7).charAt(0) || '',
        currentPostcode_1: collectInputs('currentPostcode', 7).charAt(1) || '',
        currentPostcode_2: collectInputs('currentPostcode', 7).charAt(2) || '',
        currentPostcode_3: collectInputs('currentPostcode', 7).charAt(3) || '',
        currentPostcode_4: collectInputs('currentPostcode', 7).charAt(4) || '',
        currentPostcode_5: collectInputs('currentPostcode', 7).charAt(5) || '',
        currentPostcode_6: collectInputs('currentPostcode', 7).charAt(6) || '',

        licencePostcode_0: collectInputs('licencePostcode', 7).charAt(0) || '',
        licencePostcode_1: collectInputs('licencePostcode', 7).charAt(1) || '',
        licencePostcode_2: collectInputs('licencePostcode', 7).charAt(2) || '',
        licencePostcode_3: collectInputs('licencePostcode', 7).charAt(3) || '',
        licencePostcode_4: collectInputs('licencePostcode', 7).charAt(4) || '',
        licencePostcode_5: collectInputs('licencePostcode', 7).charAt(5) || '',
        licencePostcode_6: collectInputs('licencePostcode', 7).charAt(6) || '',

        dob_0: collectInputs('dob', 8).charAt(0) || '',
        dob_1: collectInputs('dob', 8).charAt(1) || '',
        dob_2: collectInputs('dob', 8).charAt(2) || '',
        dob_3: collectInputs('dob', 8).charAt(3) || '',
        dob_4: collectInputs('dob', 8).charAt(4) || '',
        dob_5: collectInputs('dob', 8).charAt(5) || '',
        dob_6: collectInputs('dob', 8).charAt(6) || '',
        dob_7: collectInputs('dob', 8).charAt(7) || '',

        signatureDate_0: collectInputs('signatureDate', 8).charAt(0) || '',
        signatureDate_1: collectInputs('signatureDate', 8).charAt(1) || '',
        signatureDate_2: collectInputs('signatureDate', 8).charAt(2) || '',
        signatureDate_3: collectInputs('signatureDate', 8).charAt(3) || '',
        signatureDate_4: collectInputs('signatureDate', 8).charAt(4) || '',
        signatureDate_5: collectInputs('signatureDate', 8).charAt(5) || '',
        signatureDate_6: collectInputs('signatureDate', 8).charAt(6) || '',
        signatureDate_7: collectInputs('signatureDate', 8).charAt(7) || '',

        licenceNumber_0: collectInputs('licenceNumber', 16).charAt(0) || '',
        licenceNumber_1: collectInputs('licenceNumber', 16).charAt(1) || '',
        licenceNumber_2: collectInputs('licenceNumber', 16).charAt(2) || '',
        licenceNumber_3: collectInputs('licenceNumber', 16).charAt(3) || '',
        licenceNumber_4: collectInputs('licenceNumber', 16).charAt(4) || '',
        licenceNumber_5: collectInputs('licenceNumber', 16).charAt(5) || '',
        licenceNumber_6: collectInputs('licenceNumber', 16).charAt(6) || '',
        licenceNumber_7: collectInputs('licenceNumber', 16).charAt(7) || '',
        licenceNumber_8: collectInputs('licenceNumber', 16).charAt(8) || '',
        licenceNumber_9: collectInputs('licenceNumber', 16).charAt(9) || '',
        licenceNumber_10: collectInputs('licenceNumber', 16).charAt(10) || '',
        licenceNumber_11: collectInputs('licenceNumber', 16).charAt(11) || '',
        licenceNumber_12: collectInputs('licenceNumber', 16).charAt(12) || '',
        licenceNumber_13: collectInputs('licenceNumber', 16).charAt(13) || '',
        licenceNumber_14: collectInputs('licenceNumber', 16).charAt(14) || '',
        licenceNumber_15: collectInputs('licenceNumber', 16).charAt(15) || '',

        // Additional metadata
        submittedBy: 'web_form',
        submissionTimestamp: new Date().toISOString()
      };

      // Validate required fields before submitting
      const requiredFields = [
        { field: submitData.companyName, name: 'Company Name' },
        { field: submitData.accountNumber, name: 'Account Number' },
        { field: submitData.reference, name: 'Reference Number' },
        { field: submitData.surname, name: 'Surname' },
        { field: submitData.firstName, name: 'First Name' },
        { field: submitData.currentAddress.line1, name: 'Current Address Line 1' },
        { field: submitData.currentAddress.postTown, name: 'Current Address Post Town' }
      ];

      const missingFields = requiredFields.filter(({ field }) => !field).map(({ name }) => name);

      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields:\n${missingFields.join('\n')}`);
        return;
      }

      console.log('Form data (JSON):', submitData);

      // Convert signature to PNG Blob with better error handling
      const signatureBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create signature blob'));
          }
        }, 'image/png', 1.0); // High quality PNG
      });

      console.log('Signature PNG blob:', signatureBlob);
      console.log('Signature blob size:', signatureBlob.size, 'bytes');
      console.log('Signature blob type:', signatureBlob.type);

      // Ensure we have a valid blob
      if (!signatureBlob || signatureBlob.size === 0) {
        alert('Failed to process signature. Please try drawing your signature again.');
        return;
      }

      // Build multipart/form-data with PNG file and JSON payload
      const multipart = new FormData();

      // Make sure the field name matches what the backend expects
      multipart.append('signature', signatureBlob, 'signature.png');
      multipart.append('payload', JSON.stringify(submitData));

      // Debug: Log what's in the FormData
      console.log('FormData contents:');
      for (let [key, value] of multipart.entries()) {
        if (key === 'signature') {
          console.log(`${key}:`, value, '(PNG file, size:', value.size, 'bytes)');
        } else {
          console.log(`${key}:`, value);
        }
      }

      // Make POST request to backend
      const response = await fetch('https://geotab-addin-backend.onrender.com/api/DriverConsent', {
        method: 'POST',
        body: multipart
        // Don't set Content-Type header - let the browser set it with the boundary
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Success
      alert(`Form submitted successfully!\n\nSubmission ID: ${result.data._id}\nReference: ${result.data.reference}\nStatus: ${result.data.formStatus}`);

      console.log('Submission successful:', result);

      // Optional: Clear form data or redirect
      // window.location.reload();

    } catch (error) {
      console.error('Submission error:', error);

      if (error.message.includes('HTTP error')) {
        alert('Server error: Unable to submit form. Please try again later.');
      } else if (error.message.includes('signature')) {
        alert('Signature processing error: ' + error.message);
      } else {
        alert('Network error: Unable to submit form. Please check your connection and try again.');
      }
    } finally {
      // Reset button state
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.textContent = 'Submit Form';
        submitBtn.disabled = false;
      }
    }
  };

  const renderPostcodeInputs = (groupName, count = 7) => {
    return (
      <div className="postcode-container">
        <span className="radio-label">Postcode:</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[...Array(count)].map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              className="postcode-input"
              data-group={groupName}
              data-index={i}
              onChange={(e) => handleSequentialInput(e, groupName, i)}
              onKeyDown={(e) => handleSequentialKeyDown(e, groupName, i)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderDateInputs = (groupName) => {
    return (
      <div className="date-input-container">
        {[...Array(8)].map((_, i) => (
          <input
            key={i}
            type="text"
            maxLength="1"
            className="date-input"
            data-group={groupName}
            data-index={i}
            onChange={(e) => handleSequentialInput(e, groupName, i)}
            onKeyDown={(e) => handleSequentialKeyDown(e, groupName, i)}
          />
        ))}
      </div>
    );
  };

  const renderLicenseInputs = (groupName) => {
    return (
      <div className="license-input-container">
        <div className="license-input-row">
          {[...Array(16)].map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              className="license-input"
              data-group={groupName}
              data-index={i}
              onChange={(e) => handleSequentialInput(e, groupName, i)}
              onKeyDown={(e) => handleSequentialKeyDown(e, groupName, i)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        /* D906 Form Styles */

        * {
            box-sizing: border-box;
          }
          
          .form-container {
            max-width: 1024px;
            margin: 0 auto;
            padding: 12px;
            background-color: white;
            min-height: 100vh;
          }
          
          @media (min-width: 640px) {
            .form-container {
              padding: 24px;
            }
          }
          
          .form-header {
            background-color: #22c55e;
            color: white;
            padding: 12px;
            margin-bottom: 16px;
            border-radius: 8px 8px 0 0;
          }
          
          @media (min-width: 640px) {
            .form-header {
              padding: 16px;
              margin-bottom: 24px;
            }
          }
          
          .form-title {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
          }
          
          @media (min-width: 640px) {
            .form-title {
              font-size: 24px;
            }
          }
          
          .form-sections {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          
          .form-section {
            background-color: #dcfce7;
            padding: 12px;
            border-radius: 8px;
          }
          
          @media (min-width: 640px) {
            .form-section {
              padding: 16px;
            }
          }
          
          .section-header {
            background-color: #22c55e;
            color: white;
            padding: 8px;
            margin-bottom: 16px;
            border-radius: 4px;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 14px;
          }
          
          @media (min-width: 640px) {
            .section-title {
              font-size: 16px;
            }
          }
          
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          @media (min-width: 1024px) {
            .grid-2 {
              grid-template-columns: 1fr 1fr;
            }
          }
          
          .grid-2-md {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          @media (min-width: 768px) {
            .grid-2-md {
              grid-template-columns: 1fr 1fr;
              gap: 32px;
            }
          }
          
          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .form-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
          }
          
          .form-input-spaced {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            margin-top: 4px;
            font-size: 14px;
            box-sizing: border-box;
          }
          
          .form-input-mb {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 14px;
            box-sizing: border-box;
          }
          
          .form-input-mb-lg {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 14px;
            box-sizing: border-box;
          }
          
          .postcode-container {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 8px;
            align-items: center;
            width: 100%;
          }
          
          .postcode-input {
            width: 24px;
            height: 24px;
            border: 1px solid #d1d5db;
            text-align: center;
            font-size: 14px;
            box-sizing: border-box;
            flex-shrink: 0;
          }
          
          @media (min-width: 640px) {
            .postcode-input {
              width: 32px;
              height: 32px;
            }
          }
          
          .radio-group {
            display: flex;
            gap: 16px;
          }
          
          .radio-item {
            display: flex;
            align-items: center;
          }
          
          .radio-input {
            margin-right: 8px;
          }
          
          .radio-label {
            font-size: 14px;
          }
          
          .section-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          @media (min-width: 640px) {
            .section-grid {
              gap: 24px;
            }
          }
          
          @media (min-width: 1024px) {
            .section-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
          
          .address-inputs > .form-input-spaced:first-child {
            margin-top: 0;
          }
          
          .date-input-container {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 16px;
            width: 100%;
          }
          
          .date-input {
            width: 24px;
            height: 24px;
            border: 1px solid #d1d5db;
            text-align: center;
            font-size: 14px;
            box-sizing: border-box;
            flex-shrink: 0;
          }
          
          @media (min-width: 640px) {
            .date-input {
              width: 32px;
              height: 32px;
            }
          }
          
          .info-box {
            background-color: #dbeafe;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
          }
          
          .info-text {
            font-size: 12px;
            color: #1e40af;
          }
          
          @media (min-width: 640px) {
            .info-text {
              font-size: 14px;
            }
          }
          
          .license-input-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 16px;
            width: 100%;
          }
          
          .license-input-row {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            width: 100%;
          }
          
          .license-input {
            width: 24px;
            height: 24px;
            border: 1px solid #d1d5db;
            text-align: center;
            font-size: 14px;
            box-sizing: border-box;
            flex-shrink: 0;
          }
          
          @media (min-width: 640px) {
            .license-input {
              width: 32px;
              height: 32px;
            }
          }
          
          .textarea-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            height: 80px;
            font-size: 14px;
            resize: vertical;
            box-sizing: border-box;
          }
          
          @media (min-width: 640px) {
            .textarea-input {
              height: 96px;
            }
          }
          
          .signature-container {
            border: 2px solid #d1d5db;
            border-radius: 4px;
            padding: 8px;
          }
          
          .signature-canvas {
            border: 1px solid #e5e7eb;
            cursor: crosshair;
            width: 100%;
            max-width: 100%;
            height: 96px;
            touch-action: none;
          }
          
          @media (min-width: 640px) {
            .signature-canvas {
              height: 112px;
            }
          }
          
          .clear-signature-btn {
            margin-top: 8px;
            padding: 8px 12px;
            background-color: #6b7280;
            color: white;
            border-radius: 4px;
            font-size: 12px;
            border: none;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
          }
          
          .clear-signature-btn:hover {
            background-color: #4b5563;
          }
          
          @media (min-width: 640px) {
            .clear-signature-btn {
              font-size: 14px;
              width: auto;
            }
          }
          
          .submit-container {
            text-align: center;
            margin-top: 24px;
          }
          
          .submit-btn {
            background-color: #22c55e;
            color: white;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 16px;
            width: 100%;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .submit-btn:hover {
            background-color: #16a34a;
          }
          
          @media (min-width: 640px) {
            .submit-btn {
              padding: 12px 32px;
              font-size: 18px;
              width: auto;
            }
          }
          
          .important-text {
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          @media (min-width: 640px) {
            .important-text {
              font-size: 14px;
            }
          }
          
          .mt-lg-0 {
            margin-top: 16px;
          }
          
          @media (min-width: 1024px) {
            .mt-lg-0 {
              margin-top: 0;
            }
          }
          
          .mb-md-0 {
            margin-bottom: 16px;
          }
          
          @media (min-width: 768px) {
            .mb-md-0 {
              margin-bottom: 0;
            }
          }
      `}</style>

      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">Driver Consent Form</h1>
        </div>

        <div className="form-sections">
          {/* Section 1: Company Details */}
          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">1. Company details (to be filled in by the company making the enquiry before other fills in Sections 2 and 4)</h2>
            </div>

            <div className="grid-2">
              <div>
                <label className="form-label">Company name and address (the company):</label>
                <input
                  type="text"
                  placeholder="Local Council"
                  className="form-input"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange(null, 'companyName', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Taxi & Private Hire Licensing"
                  className="form-input-spaced"
                  value={formData.taxiLicensing}
                  onChange={(e) => handleInputChange(null, 'taxiLicensing', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="335 York Road"
                  className="form-input-spaced"
                  value={formData.yorkRoad}
                  onChange={(e) => handleInputChange(null, 'yorkRoad', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Leeds"
                  className="form-input-spaced"
                  value={formData.leeds}
                  onChange={(e) => handleInputChange(null, 'leeds', e.target.value)}
                />
                {renderPostcodeInputs('postcode1')}
              </div>

              <div className="mt-lg-0">
                <label className="form-label">Account number:</label>
                <input
                  type="text"
                  className="form-input-mb-lg"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange(null, 'accountNumber', e.target.value)}
                />

                <label className="form-label">Reference number:</label>
                <input
                  type="text"
                  className="form-input-mb-lg"
                  value={formData.reference}
                  onChange={(e) => handleInputChange(null, 'reference', e.target.value)}
                />

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Are you making an enquiry on behalf of another company?</label>
                  <div className="radio-group">
                    <label className="radio-item">
                      <input type="radio" name="behalf" className="radio-input" />
                      <span className="radio-label">Yes</span>
                    </label>
                    <label className="radio-item">
                      <input type="radio" name="behalf" className="radio-input" defaultChecked />
                      <span className="radio-label">No</span>
                    </label>
                  </div>
                </div>

                <label className="form-label">If yes, please give the company name below:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.companyNameBelow}
                  onChange={(e) => handleInputChange(null, 'companyNameBelow', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Reason for processing information */}
          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">2. Reason for processing information (to be filled in by the company making the enquiry before other fills in Sections 2 and 4)</h2>
            </div>

            <div className="grid-2-md">
              <div className="mb-md-0">
                <label className="form-label" style={{ marginBottom: '8px' }}>Do you need CPC information?</label>
                <div className="radio-group">
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="cpc"
                      className="radio-input"
                      onChange={() => handleInputChange(null, 'needCPC', true)}
                    />
                    <span className="radio-label">Yes</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="cpc"
                      className="radio-input"
                      defaultChecked
                      onChange={() => handleInputChange(null, 'needCPC', false)}
                    />
                    <span className="radio-label">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>Do you need tachograph information?</label>
                <div className="radio-group">
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="tachograph"
                      className="radio-input"
                      onChange={() => handleInputChange(null, 'needTachograph', true)}
                    />
                    <span className="radio-label">Yes</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="tachograph"
                      className="radio-input"
                      defaultChecked
                      onChange={() => handleInputChange(null, 'needTachograph', false)}
                    />
                    <span className="radio-label">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Driver details */}
          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">3. Driver details (to be filled in by the driver)</h2>
            </div>

            <div className="section-grid">
              <div>
                <label className="form-label">Surname:</label>
                <input
                  type="text"
                  className="form-input-mb"
                  value={formData.surname}
                  onChange={(e) => handleInputChange(null, 'surname', e.target.value)}
                />

                <label className="form-label">First name(s):</label>
                <input
                  type="text"
                  className="form-input-mb"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange(null, 'firstName', e.target.value)}
                />

                <label className="form-label">Date of Birth:</label>
                {renderDateInputs('dob')}

                <label className="form-label">Current address:</label>
                <div className="address-inputs">
                  <input
                    type="text"
                    placeholder="Line 1"
                    className="form-input-spaced"
                    value={formData.currentAddress.line1}
                    onChange={(e) => handleInputChange('currentAddress', 'line1', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Line 2"
                    className="form-input-spaced"
                    value={formData.currentAddress.line2}
                    onChange={(e) => handleInputChange('currentAddress', 'line2', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Line 3"
                    className="form-input-spaced"
                    value={formData.currentAddress.line3}
                    onChange={(e) => handleInputChange('currentAddress', 'line3', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Post town"
                    className="form-input-spaced"
                    value={formData.currentAddress.postTown}
                    onChange={(e) => handleInputChange('currentAddress', 'postTown', e.target.value)}
                  />
                </div>

                {renderPostcodeInputs('currentPostcode')}
              </div>

              <div className="mt-lg-0">
                <label className="form-label">Middle name(s):</label>
                <input
                  type="text"
                  className="form-input-mb-lg"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange(null, 'middleName', e.target.value)}
                />

                <label className="form-label">Address on licence (if different):</label>
                <div className="address-inputs">
                  <input
                    type="text"
                    placeholder="Line 1"
                    className="form-input-spaced"
                    value={formData.licenceAddress.line1}
                    onChange={(e) => handleInputChange('licenceAddress', 'line1', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Line 2"
                    className="form-input-spaced"
                    value={formData.licenceAddress.line2}
                    onChange={(e) => handleInputChange('licenceAddress', 'line2', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Line 3"
                    className="form-input-spaced"
                    value={formData.licenceAddress.line3}
                    onChange={(e) => handleInputChange('licenceAddress', 'line3', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Post town"
                    className="form-input-spaced"
                    value={formData.licenceAddress.postTown}
                    onChange={(e) => handleInputChange('licenceAddress', 'postTown', e.target.value)}
                  />
                </div>

                {renderPostcodeInputs('licencePostcode')}
              </div>
            </div>
            <label className="form-label">Driver licence number:</label>
            {renderLicenseInputs('licenceNumber')}
          </div>

          {/* Section 4: Driver information for processing declaration */}
          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">4. Driver information for processing declaration (to be filled in by the driver)</h2>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p className="important-text">
                <strong>IMPORTANT:</strong> Please read the notes over the page before completing this form. Do not sign if Sections 1 and 2 are not filled in.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Description:</label>
              <textarea
                className="textarea-input"
                placeholder="Enter declaration text here..."
              ></textarea>
            </div>

            <div className="section-grid">
              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>SIGNATURE:</label>
                <div className="signature-container">
                  <canvas
                    ref={signatureRef}
                    width={300}
                    height={120}
                    className="signature-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  ></canvas>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="clear-signature-btn"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>

              <div className="mt-lg-0">
                <label className="form-label">DATE:</label>
                {renderDateInputs('signatureDate')}

                <div style={{ marginTop: '16px' }}>
                  <label className="form-label">Declaration Date:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.declarationDate}
                    onChange={(e) => handleInputChange(null, 'declarationDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-container">
            <button
              type="button"
              onClick={handleSubmit}
              className="submit-btn"
            >
              Submit Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default D906Form;