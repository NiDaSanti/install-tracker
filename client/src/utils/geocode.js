export const geocodeAddress = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'InstallationTrackerApp/1.0'
      }
    });
    
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        success: true
      };
    } else {
      return {
        latitude: null,
        longitude: null,
        success: false,
        error: 'Address not found'
      };
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
    return {
      latitude: null,
      longitude: null,
      success: false,
      error: error.message
    };
  }
};
