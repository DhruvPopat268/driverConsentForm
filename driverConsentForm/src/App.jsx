import React, { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

const D906Form = () => {
  const signatureRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      // Section 1 - Company Details
      companyName: '',
      accountNumber: '',
      reference: '',
      taxiLicensing: '',
      yorkRoad: '',
      leeds: '',
      postcode1: '',
      existingBehalf: 'no',
      companyNameBelow: '',

      // Section 2 - Processing Information
      needCPC: false,
      needTachograph: false,

      // Section 3 - Driver Details
      surname: '',
      firstName: '',
      middleName: '',
      dateOfBirth: '',
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
      description: '',
      signatureDate: '',
      declarationDate: ''
    }
  });

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
      const prevInput = document.querySelector(`input[data-group="${groupName}"][data-index="${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      const prevInput = document.querySelector(`input[data-group="${groupName}"][data-index="${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
      }
    } else if (e.key === 'ArrowRight') {
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

  const onSubmit = async (data) => {
    try {
      // Get signature data from canvas
      const canvas = signatureRef.current;

      // Helper to detect a blank canvas
      const isCanvasBlank = (c) => {
        const ctx = c.getContext('2d');
        const { width, height } = c;
        const imageData = ctx.getImageData(0, 0, width, height);
        const imageDataArray = imageData.data;
        for (let i = 0; i < imageDataArray.length; i += 4) {
          if (imageDataArray[i + 3] !== 0 || imageDataArray[i] !== 0 || imageDataArray[i + 1] !== 0 || imageDataArray[i + 2] !== 0) {
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

      // Prepare form data for API
      const submitData = {
        ...data,
        // Sequential input data
        postcode1_combined: collectInputs('postcode1', 7),
        currentPostcode_combined: collectInputs('currentPostcode', 7),
        licencePostcode_combined: collectInputs('licencePostcode', 7),
        dob_combined: collectInputs('dob', 8),
        signatureDate_combined: collectInputs('signatureDate', 8),
        licenceNumber_combined: collectInputs('licenceNumber', 16),
        submittedBy: 'web_form',
        submissionTimestamp: new Date().toISOString()
      };

      console.log('Form data (JSON):', submitData);

      // Convert signature to PNG Blob
      const signatureBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create signature blob'));
          }
        }, 'image/png', 1.0);
      });

      if (!signatureBlob || signatureBlob.size === 0) {
        alert('Failed to process signature. Please try drawing your signature again.');
        return;
      }

      // Build multipart/form-data
      const multipart = new FormData();
      multipart.append('signature', signatureBlob, 'signature.png');
      multipart.append('payload', JSON.stringify(submitData));

      // Make POST request to backend
      const response = await fetch('https://geotab-addin-backend.onrender.com/api/DriverConsent', {
        method: 'POST',
        body: multipart
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert(`Form submitted successfully!\n\nSubmission ID: ${result.data._id}\nReference: ${result.data.reference}\nStatus: ${result.data.formStatus}`);
      console.log('Submission successful:', result);

    } catch (error) {
      console.error('Submission error:', error);
      if (error.message.includes('HTTP error')) {
        alert('Server error: Unable to submit form. Please try again later.');
      } else if (error.message.includes('signature')) {
        alert('Signature processing error: ' + error.message);
      } else {
        alert('Network error: Unable to submit form. Please check your connection and try again.');
      }
    }
  };

  const renderPostcodeInputs = (groupName, count = 7) => {
    return (
      <div className="flex flex-wrap items-center gap-1 mt-13">
        <span className="text-sm font-medium mr-2">Postcode:</span>
        <div className="flex gap-1">
          {[...Array(count)].map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              className="w-6 h-6 sm:w-8 sm:h-8 border border-gray-300 text-center text-sm"
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
      <div className="flex flex-wrap gap-1 mb-4">
        {[...Array(8)].map((_, i) => (
          <input
            key={i}
            type="text"
            maxLength="1"
            className="w-6 h-6 sm:w-8 sm:h-8 border border-gray-300 text-center text-sm"
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
      <div className="mt-4">
        <div className="flex flex-wrap gap-1">
          {[...Array(16)].map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              className="w-6 h-6 sm:w-8 sm:h-8 border border-gray-300 text-center text-sm"
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(onSubmit)();
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-white min-h-screen">
      <div className="bg-green-500 text-white p-3 sm:p-4 mb-4 sm:mb-6 rounded-t-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-center">Driver Consent Form</h1>
      </div>

      <div className="space-y-6">
        {/* Section 1: Company Details */}
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="bg-green-500 text-white p-2 mb-4 rounded">
            <h2 className="font-bold text-sm sm:text-base">
              1. Company details (to be filled in by the company making the enquiry before other fills in Sections 2 and 4)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            <div>
              <label className="block text-sm font-medium mb-1">Company name and address (the company):</label>
              <Controller
                name="companyName"
                control={control}
                rules={{ required: 'Company name is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Local Council"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                )}
              />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}

              <Controller
                name="taxiLicensing"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Taxi & Private Hire Licensing"
                    className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                  />
                )}
              />

              <Controller
                name="yorkRoad"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="335 York Road"
                    className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                  />
                )}
              />

              <Controller
                name="leeds"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Leeds"
                    className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                  />
                )}
              />

              {renderPostcodeInputs('postcode1')}
            </div>

            <div className="mt-4 lg:mt-0">
              <label className="block text-sm font-medium mb-1">Account number:</label>
              <Controller
                name="accountNumber"
                control={control}
                rules={{ required: 'Account number is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-4"
                  />
                )}
              />
              {errors.accountNumber && <p className="text-red-500 text-xs -mt-3 mb-3">{errors.accountNumber.message}</p>}

              <label className="block text-sm font-medium mb-1">Reference number:</label>
              <Controller
                name="reference"
                control={control}
                rules={{ required: 'Reference number is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-4"
                  />
                )}
              />
              {errors.reference && <p className="text-red-500 text-xs -mt-3 mb-3">{errors.reference.message}</p>}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Are you making an enquiry on behalf of another company?</label>
                <Controller
                  name="existingBehalf"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          {...field}
                          type="radio"
                          value="yes"
                          className="mr-2"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          {...field}
                          type="radio"
                          value="no"
                          className="mr-2"
                        />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  )}
                />
              </div>

              <label className="block text-sm font-medium mb-1">If yes, please give the company name below:</label>
              <Controller
                name="companyNameBelow"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Reason for processing information */}
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="bg-green-500 text-white p-2 mb-4 rounded">
            <h2 className="font-bold text-sm sm:text-base">
              2. Reason for processing information (to be filled in by the company making the enquiry before other fills in Sections 2 and 4)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="mb-4 md:mb-0">
              <label className="block text-sm font-medium mb-2">Do you need CPC information?</label>
              <Controller
                name="needCPC"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        className="mr-2"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        className="mr-2"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Do you need tachograph information?</label>
              <Controller
                name="needTachograph"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        className="mr-2"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        className="mr-2"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Driver details */}
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="bg-green-500 text-white p-2 mb-4 rounded">
            <h2 className="font-bold text-sm sm:text-base">3. Driver details (to be filled in by the driver)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Surname:</label>
              <Controller
                name="surname"
                control={control}
                rules={{ required: 'Surname is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                  />
                )}
              />
              {errors.surname && <p className="text-red-500 text-xs -mt-1 mb-2">{errors.surname.message}</p>}

              <label className="block text-sm font-medium mb-1">First name(s):</label>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                  />
                )}
              />
              {errors.firstName && <p className="text-red-500 text-xs -mt-1 mb-2">{errors.firstName.message}</p>}

              <label className="block text-sm font-medium mb-1">Date of Birth:</label>
              {renderDateInputs('dob')}

              <label className="block text-sm font-medium mb-1">Current address:</label>
              <div className="space-y-1">
                <Controller
                  name="currentAddress.line1"
                  control={control}
                  rules={{ required: 'Address line 1 is required' }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Line 1"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />
                {errors.currentAddress?.line1 && <p className="text-red-500 text-xs">{errors.currentAddress.line1.message}</p>}

                <Controller
                  name="currentAddress.line2"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Line 2"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />

                <Controller
                  name="currentAddress.line3"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Line 3"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />

                <Controller
                  name="currentAddress.postTown"
                  control={control}
                  rules={{ required: 'Post town is required' }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Post town"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />
                {errors.currentAddress?.postTown && <p className="text-red-500 text-xs">{errors.currentAddress.postTown.message}</p>}
              </div>

              {renderPostcodeInputs('currentPostcode')}
            </div>

            <div className="mt-4 lg:mt-0">
              <label className="block text-sm font-medium mb-1">Middle name(s):</label>
              <Controller
                name="middleName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-4"
                  />
                )}
              />

              <label className="block text-sm font-medium mb-1">Address on licence (if different):</label>
              <div className="space-y-1">
                <Controller
                  name="licenceAddress.line1"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Line 1"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />

                <Controller
                  name="licenceAddress.line2"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Line 2"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />

                <Controller
                  name="licenceAddress.line3"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Line 3"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />

                <Controller
                  name="licenceAddress.postTown"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Post town"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />
              </div>

              {renderPostcodeInputs('licencePostcode')}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Driver licence number:</label>
            {renderLicenseInputs('licenceNumber')}
          </div>
        </div>

        {/* Section 4: Driver information for processing declaration */}
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="bg-green-500 text-white p-2 mb-4 rounded">
            <h2 className="font-bold text-sm sm:text-base">4. Driver information for processing declaration (to be filled in by the driver)</h2>
          </div>

          <div className="mb-4">
            <p className="text-xs sm:text-sm font-medium mb-2">
              <strong>IMPORTANT:</strong> Please read the notes over the page before completing this form. Do not sign if Sections 1 and 2 are not filled in.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description:</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="w-full p-2 border border-gray-300 rounded text-sm h-20 sm:h-24 resize-y"
                  placeholder="Enter declaration text here..."
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">SIGNATURE:</label>
              <div className="border-2 border-gray-300 rounded p-2">
                <canvas
                  ref={signatureRef}
                  width={300}
                  height={120}
                  className="border border-gray-200 cursor-crosshair w-full h-24 sm:h-28 touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="mt-2 px-3 py-2 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-500 transition-colors w-full sm:w-auto"
                >
                  Clear Signature
                </button>
              </div>
            </div>

            <div className="mt-4 lg:mt-0">
              <label className="block text-sm font-medium mb-1">DATE:</label>
              {renderDateInputs('signatureDate')}

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Declaration Date:</label>
                <Controller
                  name="declarationDate"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 sm:px-8 rounded text-base sm:text-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default D906Form;