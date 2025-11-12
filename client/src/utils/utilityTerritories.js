const UTILITY_TERRITORIES = [
  {
    code: 'PAC_GRID',
    name: 'Pacific Grid Authority',
    states: ['CA', 'OR', 'WA'],
    color: '#00bff0'
  },
  {
    code: 'SOUTHWEST_POWER',
    name: 'Southwest Power Alliance',
    states: ['AZ', 'NV', 'NM'],
    color: '#ff7a45'
  },
  {
    code: 'SUNBELT_ENERGY',
    name: 'Sunbelt Energy Cooperative',
    states: ['TX', 'OK'],
    color: '#f5b739'
  },
  {
    code: 'ATLANTIC_GRID',
    name: 'Atlantic Grid Services',
    states: ['NY', 'NJ', 'MA', 'CT', 'PA', 'MD'],
    color: '#7d6cfa'
  },
  {
    code: 'MIDWEST_UTIL',
    name: 'Midwest Utility Network',
    states: ['IL', 'OH', 'MI', 'WI', 'MN'],
    color: '#3cc88f'
  }
];

const DEFAULT_TERRITORY = {
  code: 'INDEPENDENT',
  name: 'Independent Utility',
  color: '#8a9fb2'
};

function normalize(value) {
  return value ? String(value).trim().toUpperCase() : '';
}

export function resolveUtilityTerritory(installation = {}) {
  const state = normalize(installation.state);
  const city = normalize(installation.city);

  // Allow future city-based overrides.
  const cityOverride = UTILITY_TERRITORIES.find((territory) => {
    if (!territory.cities) {
      return false;
    }
    return territory.cities.includes(city);
  });

  if (cityOverride) {
    return cityOverride;
  }

  const stateMatch = UTILITY_TERRITORIES.find((territory) => territory.states.includes(state));
  if (stateMatch) {
    return stateMatch;
  }

  return DEFAULT_TERRITORY;
}

export { UTILITY_TERRITORIES, DEFAULT_TERRITORY };
