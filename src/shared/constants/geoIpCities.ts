export type GeoIpCity = { name: string; lat: number; lon: number; region: string }

/** GeoIP 生成用：各國城市座標池（隨機抽一筆） */
export const GEOIP_CITIES: Record<string, GeoIpCity[]> = {
  '156': [
    { name: 'Beijing', lat: 39.9042, lon: 116.4074, region: 'CN-BJ' },
    { name: 'Shanghai', lat: 31.2304, lon: 121.4737, region: 'CN-SH' },
    { name: 'Guangzhou', lat: 23.1291, lon: 113.2644, region: 'CN-GD' },
    { name: 'Shenzhen', lat: 22.5431, lon: 114.0579, region: 'CN-GD' },
    { name: 'Chengdu', lat: 30.6624, lon: 104.0633, region: 'CN-SC' },
    { name: 'Hangzhou', lat: 30.2741, lon: 120.1551, region: 'CN-ZJ' },
    { name: 'Nanjing', lat: 32.0603, lon: 118.7969, region: 'CN-JS' },
    { name: 'Wuhan', lat: 30.5928, lon: 114.3055, region: 'CN-HB' },
    { name: "Xi'an", lat: 34.3416, lon: 108.9398, region: 'CN-SN' },
    { name: 'Tianjin', lat: 39.3434, lon: 117.3616, region: 'CN-TJ' }
  ],
  '158': [
    // 直轄市
    { name: 'Taipei', lat: 25.033, lon: 121.5654, region: 'TW-TPE' },
    { name: 'New Taipei', lat: 25.0169, lon: 121.4629, region: 'TW-NTP' },
    { name: 'Taoyuan', lat: 24.9936, lon: 121.301, region: 'TW-TAO' },
    { name: 'Taichung', lat: 24.1477, lon: 120.6736, region: 'TW-TXG' },
    { name: 'Tainan', lat: 22.9993, lon: 120.2269, region: 'TW-TNN' },
    { name: 'Kaohsiung', lat: 22.6148, lon: 120.3139, region: 'TW-KHH' },
    // 省轄市
    { name: 'Keelung', lat: 25.1276, lon: 121.7395, region: 'TW-KEE' },
    { name: 'Hsinchu', lat: 24.8036, lon: 120.9686, region: 'TW-HSQ' },
    { name: 'Chiayi', lat: 23.4801, lon: 120.4491, region: 'TW-CYI' },
    // 縣
    { name: 'Hsinchu County', lat: 24.8387, lon: 121.0177, region: 'TW-HSQ' },
    { name: 'Miaoli', lat: 24.5658, lon: 120.8239, region: 'TW-MIA' },
    { name: 'Changhua', lat: 24.072, lon: 120.5418, region: 'TW-CHA' },
    { name: 'Nantou', lat: 23.9167, lon: 120.6833, region: 'TW-NAN' },
    { name: 'Yunlin', lat: 23.7078, lon: 120.4313, region: 'TW-YUN' },
    { name: 'Chiayi County', lat: 23.4518, lon: 120.255, region: 'TW-CYQ' },
    { name: 'Pingtung', lat: 22.6716, lon: 120.4882, region: 'TW-PIF' },
    { name: 'Yilan', lat: 24.7021, lon: 121.7378, region: 'TW-ILA' },
    { name: 'Hualien', lat: 23.9739, lon: 121.6014, region: 'TW-HUA' },
    { name: 'Taitung', lat: 22.7603, lon: 121.1449, region: 'TW-TTT' },
    { name: 'Penghu', lat: 23.5712, lon: 119.5794, region: 'TW-PEN' },
    { name: 'Kinmen', lat: 24.4333, lon: 118.3667, region: 'TW-KIN' },
    { name: 'Lienchiang', lat: 26.1594, lon: 119.9378, region: 'TW-LIE' }
  ],
  '840': [
    { name: 'New York', lat: 40.7128, lon: -74.006, region: 'US-NY' },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, region: 'US-CA' },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298, region: 'US-IL' },
    { name: 'Houston', lat: 29.7604, lon: -95.3698, region: 'US-TX' },
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194, region: 'US-CA' },
    { name: 'Phoenix', lat: 33.4484, lon: -112.074, region: 'US-AZ' },
    { name: 'Philadelphia', lat: 39.9526, lon: -75.1652, region: 'US-PA' },
    { name: 'San Antonio', lat: 29.4241, lon: -98.4936, region: 'US-TX' },
    { name: 'San Diego', lat: 32.7157, lon: -117.1611, region: 'US-CA' },
    { name: 'Dallas', lat: 32.7767, lon: -96.797, region: 'US-TX' }
  ],
  '392': [
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'JP-13' },
    { name: 'Osaka', lat: 34.6937, lon: 135.5023, region: 'JP-27' },
    { name: 'Yokohama', lat: 35.4437, lon: 139.638, region: 'JP-14' },
    { name: 'Kyoto', lat: 35.0116, lon: 135.7681, region: 'JP-26' },
    { name: 'Sapporo', lat: 43.0642, lon: 141.3469, region: 'JP-01' },
    { name: 'Nagoya', lat: 35.1815, lon: 136.9066, region: 'JP-23' },
    { name: 'Fukuoka', lat: 33.5904, lon: 130.4017, region: 'JP-40' },
    { name: 'Kobe', lat: 34.6901, lon: 135.1956, region: 'JP-28' },
    { name: 'Sendai', lat: 38.2682, lon: 140.8694, region: 'JP-04' },
    { name: 'Hiroshima', lat: 34.3853, lon: 132.4553, region: 'JP-34' }
  ],
  '344': [
    { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, region: 'HK' },
    { name: 'Kowloon', lat: 22.3167, lon: 114.1833, region: 'HK' },
    { name: 'New Territories', lat: 22.4, lon: 114.2, region: 'HK' },
    { name: 'Central', lat: 22.2819, lon: 114.1556, region: 'HK' },
    { name: 'Wan Chai', lat: 22.2783, lon: 114.1747, region: 'HK' }
  ],
  '410': [
    { name: 'Seoul', lat: 37.5665, lon: 126.978, region: 'KR-11' },
    { name: 'Busan', lat: 35.1796, lon: 129.0756, region: 'KR-26' },
    { name: 'Incheon', lat: 37.4563, lon: 126.7052, region: 'KR-28' },
    { name: 'Daegu', lat: 35.8714, lon: 128.6014, region: 'KR-27' },
    { name: 'Daejeon', lat: 36.3504, lon: 127.3845, region: 'KR-30' },
    { name: 'Gwangju', lat: 35.1595, lon: 126.8526, region: 'KR-29' },
    { name: 'Ulsan', lat: 35.5384, lon: 129.3114, region: 'KR-31' },
    { name: 'Suwon', lat: 37.2636, lon: 127.0286, region: 'KR-41' }
  ],
  '702': [
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, region: 'SG' },
    { name: 'Central Region', lat: 1.2966, lon: 103.8526, region: 'SG' },
    { name: 'East Region', lat: 1.3441, lon: 103.9442, region: 'SG' },
    { name: 'West Region', lat: 1.3574, lon: 103.7058, region: 'SG' }
  ],
  '116': [
    { name: 'Phnom Penh', lat: 11.5564, lon: 104.9282, region: 'KH-12' },
    { name: 'Siem Reap', lat: 13.3671, lon: 103.8448, region: 'KH-17' },
    { name: 'Battambang', lat: 13.0957, lon: 103.2022, region: 'KH-2' },
    { name: 'Sihanoukville', lat: 10.6253, lon: 103.5234, region: 'KH-18' }
  ],
  '036': [
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, region: 'AU-NSW' },
    { name: 'Melbourne', lat: -37.8136, lon: 144.9631, region: 'AU-VIC' },
    { name: 'Brisbane', lat: -27.4698, lon: 153.0251, region: 'AU-QLD' },
    { name: 'Perth', lat: -31.9505, lon: 115.8605, region: 'AU-WA' },
    { name: 'Adelaide', lat: -34.9285, lon: 138.6007, region: 'AU-SA' },
    { name: 'Gold Coast', lat: -28.0167, lon: 153.4, region: 'AU-QLD' },
    { name: 'Canberra', lat: -35.2809, lon: 149.13, region: 'AU-ACT' }
  ],
  '124': [
    { name: 'Toronto', lat: 43.6532, lon: -79.3832, region: 'CA-ON' },
    { name: 'Vancouver', lat: 49.2827, lon: -123.1207, region: 'CA-BC' },
    { name: 'Montreal', lat: 45.5017, lon: -73.5673, region: 'CA-QC' },
    { name: 'Calgary', lat: 51.0447, lon: -114.0719, region: 'CA-AB' },
    { name: 'Ottawa', lat: 45.4215, lon: -75.6972, region: 'CA-ON' },
    { name: 'Edmonton', lat: 53.5461, lon: -113.4938, region: 'CA-AB' },
    { name: 'Winnipeg', lat: 49.8951, lon: -97.1384, region: 'CA-MB' },
    { name: 'Quebec City', lat: 46.8139, lon: -71.208, region: 'CA-QC' }
  ],
  '978': [
    { name: 'Paris', lat: 48.8566, lon: 2.3522, region: 'FR-IDF' },
    { name: 'Berlin', lat: 52.52, lon: 13.405, region: 'DE-BE' },
    { name: 'Madrid', lat: 40.4168, lon: -3.7038, region: 'ES-MD' },
    { name: 'Rome', lat: 41.9028, lon: 12.4964, region: 'IT-LAZ' },
    { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, region: 'NL-NH' },
    { name: 'Brussels', lat: 50.8503, lon: 4.3517, region: 'BE-BRU' },
    { name: 'Vienna', lat: 48.2082, lon: 16.3738, region: 'AT-9' },
    { name: 'Dublin', lat: 53.3498, lon: -6.2603, region: 'IE-D' }
  ],
  '826': [
    { name: 'London', lat: 51.5074, lon: -0.1278, region: 'GB-ENG' },
    { name: 'Manchester', lat: 53.4808, lon: -2.2426, region: 'GB-ENG' },
    { name: 'Birmingham', lat: 52.4862, lon: -1.8904, region: 'GB-ENG' },
    { name: 'Glasgow', lat: 55.8642, lon: -4.2518, region: 'GB-SCT' },
    { name: 'Edinburgh', lat: 55.9533, lon: -3.1883, region: 'GB-SCT' },
    { name: 'Liverpool', lat: 53.4084, lon: -2.9916, region: 'GB-ENG' }
  ]
}

/** 依國家數字碼判斷洲名（GeoIP continent_name） */
export function continentNameForCountryCode(countryCode: string): string {
  if (['156', '158', '392', '344', '410', '702', '116'].includes(countryCode)) {
    return 'Asia'
  }
  if (['840', '124'].includes(countryCode)) {
    return 'North America'
  }
  if (countryCode === '036') {
    return 'Oceania'
  }
  if (['978', '826'].includes(countryCode)) {
    return 'Europe'
  }
  return 'Unknown'
}
