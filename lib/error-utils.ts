/**
 * Comprehensive error handling utility for API responses
 * Ensures detailed validation errors are extracted and displayed properly
 */

/**
 * Extract detailed error message from API response
 * Handles validation errors, business errors, and generic errors
 */
export async function extractErrorMessage(response: Response): Promise<string> {
  // Clone the response so it can be consumed multiple times if needed
  const responseClone = response.clone();
  
  try {
    const errorData = await responseClone.json();
    console.log('🔍 Error response data:', errorData);
    
    if (errorData.message) {
      // If there are validation errors in the errors object, combine them with the main message
      if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
        const validationErrors = Object.values(errorData.errors).join(', ');
        const fullMessage = `${errorData.message}: ${validationErrors}`;
        console.log('✅ Returning detailed validation error:', fullMessage);
        return fullMessage;
      }
      console.log('✅ Returning message only:', errorData.message);
      return errorData.message;
    } else if (errorData.errors) {
      // Handle validation errors - backend returns errors as object/map
      if (typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
        const errorMessages = Object.values(errorData.errors).join(', ');
        console.log('✅ Returning errors only:', errorMessages);
        return errorMessages;
      } else if (Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map((err: any) => err.defaultMessage || err.message || err).join(', ');
        console.log('✅ Returning array errors:', errorMessages);
        return errorMessages;
      }
    } else if (errorData.error) {
      console.log('✅ Returning error field:', errorData.error);
      return errorData.error;
    } else {
      const errorText = JSON.stringify(errorData);
      if (errorText && errorText !== '{}') {
        console.log('✅ Returning JSON error:', errorText);
        return `Server error: ${errorText}`;
      }
    }
  } catch (parseError) {
    console.log('❌ Failed to parse JSON, trying text:', parseError);
    // If we can't parse the error response, try to get text content
    try {
      const errorText = await response.text();
      if (errorText && errorText.trim()) {
        console.log('✅ Returning text error:', errorText);
        return `Server error: ${errorText}`;
      }
    } catch (textError) {
      console.log('❌ Failed to get text:', textError);
      // Ignore text parsing errors
    }
  }
  
  // Fallback to generic status message
  const fallbackMessage = `Request failed with status ${response.status}`;
  console.log('⚠️ Using fallback message:', fallbackMessage);
  return fallbackMessage;
}

/**
 * Handle API response errors consistently
 * Throws an error with detailed message extracted from the response
 */
export async function handleApiError(response: Response): Promise<never> {
  const errorMessage = await extractErrorMessage(response);
  throw new Error(errorMessage);
}

/**
 * Check if response is ok, if not handle the error
 */
export async function checkResponse(response: Response): Promise<void> {
  if (!response.ok) {
    await handleApiError(response);
  }
}
