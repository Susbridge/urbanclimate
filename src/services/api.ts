export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export const CITIES: City[] = [
  { id: "algiers", name: "Algiers", country: "Algeria", lat: 36.7538, lng: 3.0588, timezone: "Africa/Algiers" },
  { id: "luanda", name: "Luanda", country: "Angola", lat: -8.8390, lng: 13.2894, timezone: "Africa/Luanda" },
  { id: "porto-novo", name: "Porto-Novo", country: "Benin", lat: 6.4969, lng: 2.6289, timezone: "Africa/Porto-Novo" },
  { id: "gaborone", name: "Gaborone", country: "Botswana", lat: -24.6282, lng: 25.9231, timezone: "Africa/Gaborone" },
  { id: "ouagadougou", name: "Ouagadougou", country: "Burkina Faso", lat: 12.3714, lng: -1.5197, timezone: "Africa/Ouagadougou" },
  { id: "gitega", name: "Gitega", country: "Burundi", lat: -3.4283, lng: 29.9246, timezone: "Africa/Bujumbura" },
  { id: "yaounde", name: "Yaoundé", country: "Cameroon", lat: 3.8480, lng: 11.5021, timezone: "Africa/Douala" },
  { id: "praia", name: "Praia", country: "Cape Verde", lat: 14.9315, lng: -23.5125, timezone: "Atlantic/Cape_Verde" },
  { id: "bangui", name: "Bangui", country: "Central African Republic", lat: 4.3947, lng: 18.5582, timezone: "Africa/Bangui" },
  { id: "ndjamena", name: "N'Djamena", country: "Chad", lat: 12.1348, lng: 15.0557, timezone: "Africa/Ndjamena" },
  { id: "moroni", name: "Moroni", country: "Comoros", lat: -11.7172, lng: 43.2473, timezone: "Indian/Comoro" },
  { id: "kinshasa", name: "Kinshasa", country: "DR Congo", lat: -4.4419, lng: 15.2663, timezone: "Africa/Kinshasa" },
  { id: "brazzaville", name: "Brazzaville", country: "Congo Republic", lat: -4.2634, lng: 15.2832, timezone: "Africa/Brazzaville" },
  { id: "yamoussoukro", name: "Yamoussoukro", country: "Côte d'Ivoire", lat: 6.8276, lng: -5.2893, timezone: "Africa/Abidjan" },
  { id: "djibouti", name: "Djibouti", country: "Djibouti", lat: 11.5721, lng: 43.1456, timezone: "Africa/Djibouti" },
  { id: "cairo", name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo" },
  { id: "malabo", name: "Malabo", country: "Equatorial Guinea", lat: 3.7504, lng: 8.7860, timezone: "Africa/Malabo" },
  { id: "asmara", name: "Asmara", country: "Eritrea", lat: 15.3229, lng: 38.9251, timezone: "Africa/Asmara" },
  { id: "mbabane", name: "Mbabane", country: "Eswatini", lat: -26.3054, lng: 31.1367, timezone: "Africa/Mbabane" },
  { id: "addis-ababa", name: "Addis Ababa", country: "Ethiopia", lat: 9.0320, lng: 38.7482, timezone: "Africa/Addis_Ababa" },
  { id: "libreville", name: "Libreville", country: "Gabon", lat: 0.4162, lng: 9.4673, timezone: "Africa/Libreville" },
  { id: "banjul", name: "Banjul", country: "Gambia", lat: 13.4549, lng: -16.5790, timezone: "Africa/Banjul" },
  { id: "accra", name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.1870, timezone: "Africa/Accra" },
  { id: "conakry", name: "Conakry", country: "Guinea", lat: 9.5092, lng: -13.7122, timezone: "Africa/Conakry" },
  { id: "bissau", name: "Bissau", country: "Guinea-Bissau", lat: 11.8632, lng: -15.5977, timezone: "Africa/Bissau" },
  { id: "nairobi", name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, timezone: "Africa/Nairobi" },
  { id: "maseru", name: "Maseru", country: "Lesotho", lat: -29.3151, lng: 27.4869, timezone: "Africa/Maseru" },
  { id: "monrovia", name: "Monrovia", country: "Liberia", lat: 6.3005, lng: -10.7969, timezone: "Africa/Monrovia" },
  { id: "tripoli", name: "Tripoli", country: "Libya", lat: 32.8872, lng: 13.1913, timezone: "Africa/Tripoli" },
  { id: "antananarivo", name: "Antananarivo", country: "Madagascar", lat: -18.8792, lng: 47.5079, timezone: "Indian/Antananarivo" },
  { id: "lilongwe", name: "Lilongwe", country: "Malawi", lat: -13.9626, lng: 33.7741, timezone: "Africa/Blantyre" },
  { id: "bamako", name: "Bamako", country: "Mali", lat: 12.6392, lng: -8.0029, timezone: "Africa/Bamako" },
  { id: "nouakchott", name: "Nouakchott", country: "Mauritania", lat: 18.0735, lng: -15.9582, timezone: "Africa/Nouakchott" },
  { id: "port-louis", name: "Port Louis", country: "Mauritius", lat: -20.1609, lng: 57.5012, timezone: "Indian/Mauritius" },
  { id: "rabat", name: "Rabat", country: "Morocco", lat: 34.0209, lng: -6.8416, timezone: "Africa/Casablanca" },
  { id: "maputo", name: "Maputo", country: "Mozambique", lat: -25.9692, lng: 32.5732, timezone: "Africa/Maputo" },
  { id: "windhoek", name: "Windhoek", country: "Namibia", lat: -22.5594, lng: 17.0832, timezone: "Africa/Windhoek" },
  { id: "niamey", name: "Niamey", country: "Niger", lat: 13.5116, lng: 2.1254, timezone: "Africa/Niamey" },
  { id: "abuja", name: "Abuja", country: "Nigeria", lat: 9.0765, lng: 7.3986, timezone: "Africa/Lagos" },
  { id: "kigali", name: "Kigali", country: "Rwanda", lat: -1.9441, lng: 30.0619, timezone: "Africa/Kigali" },
  { id: "sao-tome", name: "São Tomé", country: "São Tomé & Príncipe", lat: 0.3302, lng: 6.7333, timezone: "Africa/Sao_Tome" },
  { id: "dakar", name: "Dakar", country: "Senegal", lat: 14.7167, lng: -17.4677, timezone: "Africa/Dakar" },
  { id: "victoria", name: "Victoria", country: "Seychelles", lat: -4.6191, lng: 55.4513, timezone: "Indian/Mahe" },
  { id: "freetown", name: "Freetown", country: "Sierra Leone", lat: 8.4606, lng: -13.2317, timezone: "Africa/Freetown" },
  { id: "mogadishu", name: "Mogadishu", country: "Somalia", lat: 2.0469, lng: 45.3182, timezone: "Africa/Mogadishu" },
  { id: "pretoria", name: "Pretoria", country: "South Africa", lat: -25.7479, lng: 28.2293, timezone: "Africa/Johannesburg" },
  { id: "juba", name: "Juba", country: "South Sudan", lat: 4.8594, lng: 31.5713, timezone: "Africa/Juba" },
  { id: "khartoum", name: "Khartoum", country: "Sudan", lat: 15.5007, lng: 32.5599, timezone: "Africa/Khartoum" },
  { id: "dodoma", name: "Dodoma", country: "Tanzania", lat: -6.1630, lng: 35.7516, timezone: "Africa/Dar_es_Salaam" },
  { id: "lome", name: "Lomé", country: "Togo", lat: 6.1375, lng: 1.2125, timezone: "Africa/Lome" },
  { id: "tunis", name: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815, timezone: "Africa/Tunis" },
  { id: "kampala", name: "Kampala", country: "Uganda", lat: 0.3476, lng: 32.5825, timezone: "Africa/Kampala" },
  { id: "lusaka", name: "Lusaka", country: "Zambia", lat: -15.3875, lng: 28.3228, timezone: "Africa/Lusaka" },
  { id: "harare", name: "Harare", country: "Zimbabwe", lat: -17.8216, lng: 31.0492, timezone: "Africa/Harare" }
];

export interface AirQualityData {
  current: {
    time: string;
    european_aqi: number;
    pm10: number;
    pm2_5: number;
    nitrogen_dioxide: number;
    ozone: number;
    carbon_monoxide: number;
    sulphur_dioxide: number;
  };
  hourly: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
    european_aqi: number[];
  };
}

export interface EnvironmentalData {
  aqi: AirQualityData;
  weather: {
    current: {
      time: string;
      temperature_2m: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      is_day: number;
    };
  };
}

export async function fetchAirQuality(city: City): Promise<EnvironmentalData> {
  // Using Open-Meteo's free Air Quality API
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lng}&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide&hourly=pm10,pm2_5,european_aqi&timezone=${encodeURIComponent(city.timezone)}&past_days=7`;
  
  // Using Open-Meteo's free Weather API
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,is_day&timezone=${encodeURIComponent(city.timezone)}`;
  
  const [aqiResponse, weatherResponse] = await Promise.all([
    fetch(aqiUrl),
    fetch(weatherUrl)
  ]);

  if (!aqiResponse.ok || !weatherResponse.ok) {
    throw new Error("Failed to fetch environmental data");
  }
  
  const aqiData = await aqiResponse.json();
  const weatherData = await weatherResponse.json();

  return {
    aqi: aqiData,
    weather: weatherData
  };
}
