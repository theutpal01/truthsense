// Transform posture analysis data to match backend schema
export const transformPostureDataForBackend = (analysisData: unknown) => {
  // Default values for required fields
  const defaultPostureFeatures = {
    headPosition: {
      x: 0,
      y: 0,
      z: 0
    },
    shoulderAlignment: {
      leftShoulder: { x: 0, y: 0 },
      rightShoulder: { x: 0, y: 0 }
    },
    spineAlignment: 0,
    eyeContact: {
      percentage: 0,
      avgDuration: 0
    },
    gestures: {
      handMovements: 0,
      facialExpressions: 0
    },
    confidence: 0
  };

  try {
    // Parse the analysis data if it's a string
    const data = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
    
    // Extract confidence score from eyeContact if available
    let confidence = 0;
    if (data.eyeContact && typeof data.eyeContact.Confidencescore === 'number') {
      confidence = Math.max(0, Math.min(1, data.eyeContact.Confidencescore));
    }

    // Extract shoulder alignment info
    let shoulderScore = 0;
    if (data.shoulderAlignment) {
      // Convert shoulder alignment descriptions to numeric values
      Object.entries(data.shoulderAlignment).forEach(([key, value]) => {
        if (typeof value === 'number' && key.toLowerCase().includes('aligned')) {
          shoulderScore = Math.max(shoulderScore, value);
        }
      });
    }

    // Extract eye contact percentage
    let eyeContactPercentage = confidence * 100; // Use confidence as base
    const eyeContactDuration = 1; // Default duration
    if (data.eyeContact) {
      // Count positive eye contact indicators
      let positiveCount = 0;
      let totalCount = 0;
      Object.entries(data.eyeContact).forEach(([key, value]) => {
        if (typeof value === 'number' && key !== 'Confidencescore') {
          totalCount += value;
          if (key.toLowerCase().includes('maintained') || key.toLowerCase().includes('centered')) {
            positiveCount += value;
          }
        }
      });
      if (totalCount > 0) {
        eyeContactPercentage = (positiveCount / totalCount) * 100;
      }
    }

    // Extract gesture information
    let handMovements = 0;
    if (data.handGestures) {
      Object.entries(data.handGestures).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (key.toLowerCase().includes('detected')) {
            handMovements = value;
          }
        }
      });
    }

    // Extract head position info (simplified)
    let headTilt = 0;
    if (data.headBodyAlignment) {
      Object.entries(data.headBodyAlignment).forEach(([key, value]) => {
        if (typeof value === 'number' && key.toLowerCase().includes('tilted')) {
          headTilt = value;
        }
      });
    }

    // Create the transformed data matching backend schema
    const transformedData = {
      headPosition: {
        x: headTilt, // Use tilt as x-axis movement
        y: 0, // Default
        z: 0  // Default
      },
      shoulderAlignment: {
        leftShoulder: { x: shoulderScore, y: 0 },
        rightShoulder: { x: shoulderScore, y: 0 }
      },
      spineAlignment: shoulderScore, // Use shoulder alignment as spine indicator
      eyeContact: {
        percentage: Math.max(0, Math.min(100, eyeContactPercentage)),
        avgDuration: eyeContactDuration
      },
      gestures: {
        handMovements: handMovements,
        facialExpressions: 1 // Default value
      },
      confidence: confidence
    };

    console.log('🔄 Transformed posture data:', transformedData);
    return transformedData;
    
  } catch (error) {
    console.error('❌ Error transforming posture data:', error);
    console.log('📝 Original data:', analysisData);
    
    // Return default structure if transformation fails
    return defaultPostureFeatures;
  }
};
